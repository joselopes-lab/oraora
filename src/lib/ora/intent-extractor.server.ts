import { getAiClient } from '@/services/aiService';
import { PropertySearchIntent } from './types';
import { Type, Schema } from '@google/genai';
import { normalizeSearchText } from './text-normalizer';

export type SearchIntentField = keyof PropertySearchIntent;

export interface OraConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractIntentInput {
  message: string;
  previousIntent?: PropertySearchIntent;
  conversation?: OraConversationMessage[];
}

export type TurnType = 
  | 'property_search' 
  | 'location_intelligence' 
  | 'market_intelligence' 
  | 'property_detail' 
  | 'clarification' 
  | 'general_conversation';

export interface ExtractIntentResult {
  intent: PropertySearchIntent;
  searchReady: boolean;
  missingFields: SearchIntentField[];
  turnType: TurnType;
  resolvedLocation?: { neighborhood?: string; city?: string };
}

const ALLOWED_INTENT_KEYS: (keyof PropertySearchIntent)[] = [
  'purpose',
  'city',
  'neighborhoods',
  'propertyTypes',
  'minPrice',
  'maxPrice',
  'minBedrooms',
  'minSuites',
  'minBathrooms',
  'minParkingSpaces',
  'minArea',
  'maxArea',
  'requiredFeatures',
  'preferredFeatures',
  'freePreferences',
];

const PROPERTY_TYPE_KEYWORDS = ['apartamento', 'apartamentos', 'casa', 'flat', 'terreno', 'studio', 'studios', 'cobertura', 'coberturas'];

export async function extractPropertySearchIntent(
  input: ExtractIntentInput
): Promise<ExtractIntentResult> {
  const client = getAiClient();

  const systemInstruction = `
Você é o extrator e classificador conversacional autoritativo da ORA (Assistente Imobiliária).
Analise a mensagem atual, o previousIntent e o histórico da conversa.

CLASSIFICAÇÃO DO TURNO (turnType):
- 'property_search': Se o usuário quer buscar, filtrar, ver, listar ou comparar imóveis, ou refinar critérios (quartos, preço, tipo, bairro para busca).
- 'location_intelligence': Se o usuário pergunta sobre a região, bairro, infraestrutura, praias, estilo de vida, mobilidade (ex: "me fale sobre o bairro", "como é morar lá?", "o que tem por perto?", "como é Tambaú?").
- 'market_intelligence': Se o usuário pergunta sobre preço por metro quadrado, valorização, tendências de mercado ou investimento (ex: "quanto está o m²?", "esse bairro valorizou?").
- 'property_detail': Se o usuário pergunta sobre um imóvel ou empreendimento específico já apresentado (ex: "me fale mais sobre esse imóvel").
- 'clarification': Se a mensagem for ambígua ou faltar referência indispensável (ex: "me fale sobre o bairro" sem nenhum bairro conhecido anterior, ou "fale sobre o Soho" sem saber o que é).
- 'general_conversation': Saudação ou conversa puramente imobiliária geral sem ação específica.

RESOLUÇÃO DE REFERÊNCIAS CONTEXTUAIS (resolvedLocation):
Se o usuário usar pronomes ou referências como "o bairro", "esse bairro", "essa região", "lá", "por lá", resolva para o bairro/cidade ativo no previousIntent.
Se houver dúvida ou ambiguidade sem contexto, retorne turnType = 'clarification'.

REGRAS DE DELTA (SET, ADD, REMOVE):
Retorne também um objeto JSON contendo 'set', 'add' e 'remove' para atualizar o previousIntent quando turnType for 'property_search'.
NUNCA duplique o tipo de imóvel em requiredFeatures ou preferredFeatures.
`;

  const conversationHistory = input.conversation
    ? input.conversation.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
    : '';

  const prompt = `
INTENÇÃO ANTERIOR (previousIntent):
${input.previousIntent ? JSON.stringify(input.previousIntent, null, 2) : 'Nenhuma'}

HISTÓRICO DA CONVERSA:
${conversationHistory || 'Nenhum'}

MENSAGEM ATUAL DO USUÁRIO:
"${input.message}"

Retorne um JSON estrito contendo:
- "turnType": um de ['property_search', 'location_intelligence', 'market_intelligence', 'property_detail', 'clarification', 'general_conversation']
- "resolvedLocation": { "neighborhood": "...", "city": "..." } ou null
- "set": { ... }
- "add": { ... }
- "remove": [ ... ]
`;

  let parsed: any = { turnType: 'property_search', set: {}, add: {}, remove: [] };

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error('Erro ao parsear JSON da IA no intent-extractor:', rawText);
    }
  } catch (error: any) {
    console.error('Erro na extração de intenção ORA:', error);
    parsed = { turnType: 'property_search', set: {}, add: {}, remove: [] };
  }

  const turnType: TurnType = [
    'property_search', 
    'location_intelligence', 
    'market_intelligence', 
    'property_detail', 
    'clarification', 
    'general_conversation'
  ].includes(parsed.turnType) ? parsed.turnType : 'property_search';

  const resolvedLocation = parsed.resolvedLocation && typeof parsed.resolvedLocation === 'object' 
    ? {
        neighborhood: typeof parsed.resolvedLocation.neighborhood === 'string' ? parsed.resolvedLocation.neighborhood.trim() : undefined,
        city: typeof parsed.resolvedLocation.city === 'string' ? parsed.resolvedLocation.city.trim() : undefined,
      }
    : (input.previousIntent?.neighborhoods?.[0] ? { neighborhood: input.previousIntent.neighborhoods[0], city: input.previousIntent.city } : undefined);

  // Merge determinístico
  const nextIntent: PropertySearchIntent = input.previousIntent ? JSON.parse(JSON.stringify(input.previousIntent)) : {};

  const setObj = parsed.set || {};
  for (const key of ALLOWED_INTENT_KEYS) {
    if (setObj[key] !== undefined && setObj[key] !== null) {
      const val = setObj[key];
      if (typeof val === 'string' && val.trim() !== '') {
        (nextIntent as any)[key] = val.trim();
      } else if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val) && val >= 0) {
        (nextIntent as any)[key] = val;
      } else if (Array.isArray(val) && val.length > 0) {
        const cleaned = val.filter((i: any) => typeof i === 'string' && i.trim() !== '').map((i: string) => i.trim());
        if (cleaned.length > 0) {
          (nextIntent as any)[key] = cleaned;
        }
      }
    }
  }

  const addObj = parsed.add || {};
  for (const key of ['neighborhoods', 'propertyTypes', 'requiredFeatures', 'preferredFeatures', 'freePreferences']) {
    if (Array.isArray(addObj[key]) && addObj[key].length > 0) {
      const existing = (nextIntent as any)[key] || [];
      const incoming = addObj[key].filter((i: any) => typeof i === 'string' && i.trim() !== '').map((i: string) => i.trim());
      const combined = [...existing];
      for (const inc of incoming) {
        if (!combined.some(item => normalizeSearchText(item) === normalizeSearchText(inc))) {
          combined.push(inc);
        }
      }
      (nextIntent as any)[key] = combined;
    }
  }

  const removeArr = parsed.remove;
  if (Array.isArray(removeArr)) {
    for (const rem of removeArr) {
      if (typeof rem === 'string') {
        const cleanRem = rem.trim();
        if (ALLOWED_INTENT_KEYS.includes(cleanRem as any)) {
          delete (nextIntent as any)[cleanRem];
        } else {
          // Remover feature ou bairro específico
          if (nextIntent.neighborhoods) {
            nextIntent.neighborhoods = nextIntent.neighborhoods.filter(n => normalizeSearchText(n) !== normalizeSearchText(cleanRem));
            if (nextIntent.neighborhoods.length === 0) delete nextIntent.neighborhoods;
          }
          if (nextIntent.requiredFeatures) {
            nextIntent.requiredFeatures = nextIntent.requiredFeatures.filter(f => normalizeSearchText(f) !== normalizeSearchText(cleanRem));
            if (nextIntent.requiredFeatures.length === 0) delete nextIntent.requiredFeatures;
          }
          if (nextIntent.preferredFeatures) {
            nextIntent.preferredFeatures = nextIntent.preferredFeatures.filter(f => normalizeSearchText(f) !== normalizeSearchText(cleanRem));
            if (nextIntent.preferredFeatures.length === 0) delete nextIntent.preferredFeatures;
          }
        }
      }
    }
  }

  // Proteção contra duplicação de property type em features
  const propTypes = nextIntent.propertyTypes?.map(t => normalizeSearchText(t)) || [];
  if (nextIntent.requiredFeatures) {
    nextIntent.requiredFeatures = nextIntent.requiredFeatures.filter(f => !propTypes.includes(normalizeSearchText(f)));
    if (nextIntent.requiredFeatures.length === 0) delete nextIntent.requiredFeatures;
  }
  if (nextIntent.preferredFeatures) {
    nextIntent.preferredFeatures = nextIntent.preferredFeatures.filter(f => !propTypes.includes(normalizeSearchText(f)));
    if (nextIntent.preferredFeatures.length === 0) delete nextIntent.preferredFeatures;
  }

  const searchReady = Boolean(
    nextIntent.city ||
    (nextIntent.neighborhoods && nextIntent.neighborhoods.length > 0) ||
    (nextIntent.propertyTypes && nextIntent.propertyTypes.length > 0) ||
    nextIntent.purpose ||
    nextIntent.minPrice !== undefined ||
    nextIntent.maxPrice !== undefined ||
    nextIntent.minBedrooms !== undefined ||
    (nextIntent.requiredFeatures && nextIntent.requiredFeatures.length > 0)
  );

  const missingFields: SearchIntentField[] = [];
  if (!searchReady && turnType === 'property_search') {
    missingFields.push('city', 'propertyTypes', 'purpose');
  }

  return {
    intent: nextIntent,
    searchReady,
    missingFields,
    turnType,
    resolvedLocation,
  };
}
