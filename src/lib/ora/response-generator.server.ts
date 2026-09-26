import { GoogleGenAI } from '@google/genai';
import { PropertySearchIntent, PublicProperty } from './types';
import { SearchIntentField, OraConversationMessage, TurnType } from './intent-extractor.server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GenerateOraResponseInput {
  intent: PropertySearchIntent;
  searchReady: boolean;
  missingFields: SearchIntentField[];
  properties: PublicProperty[];
  totalReturned: number;
  conversation?: OraConversationMessage[];
  turnType: TurnType;
  resolvedLocation?: { neighborhood?: string; city?: string };
}

export interface GenerateOraResponseResult {
  text: string;
  sources?: Array<{ title: string; url: string; domain: string }>;
}

export async function generateOraResponse(input: GenerateOraResponseInput): Promise<GenerateOraResponseResult> {
  const model = 'gemini-2.5-flash';
  const turnType = input.turnType || 'property_search';

  if (turnType === 'clarification') {
    return {
      text: "Para que eu possa te ajudar melhor, por favor especifique qual bairro ou empreendimento você gostaria de explorar."
    };
  }

  if (turnType === 'location_intelligence' || turnType === 'market_intelligence') {
    const locName = input.resolvedLocation?.neighborhood || input.intent.neighborhoods?.[0] || input.intent.city || 'João Pessoa';
    const focusQuery = turnType === 'market_intelligence' 
      ? `mercado imobiliário preço metro quadrado valorização investimento em ${locName}` 
      : `bairro ${locName} João Pessoa infraestrutura morar praia`;

    const prompt = `
Você é a ORA, assistente imobiliária. Responda de forma natural, objetiva e em texto limpo (SEM usar asteriscos de Markdown como ** ou ##) sobre: ${focusQuery}.
Não inclua saudações como "Olá" ou "Sou a ORA". Forneça uma análise útil baseada em dados atuais.
`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
        },
      });

      const text = (response.text || `Informações sobre ${locName} indisponíveis no momento.`).replace(/\*\*|\#\#|\*/g, '');
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const rawChunks = groundingMetadata?.groundingChunks || [];
      const sources: Array<{ title: string; url: string; domain: string }> = [];

      for (const chunk of rawChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          try {
            const urlObj = new URL(chunk.web.uri);
            if (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') {
              sources.push({
                title: chunk.web.title,
                url: chunk.web.uri,
                domain: urlObj.hostname.replace(/^www\./, ''),
              });
            }
          } catch (e) {
            // ignore invalid URL
          }
        }
      }

      return { text, sources: sources.slice(0, 3) };
    } catch (err) {
      return { text: `Informações sobre ${locName} indisponíveis no momento.` };
    }
  }

  if (!input.searchReady) {
    return { text: `Por favor, informe a cidade ou bairro desejado para começarmos a busca.` };
  }

  if (input.properties.length === 0) {
    return { text: `Não encontrei opções com esses critérios. Podemos ajustar a região ou o valor.` };
  }

  try {
    const sampleProps = input.properties.slice(0, 5).map(p => ({
      title: p.title,
      price: p.price,
      neighborhood: p.neighborhood,
      bedrooms: p.bedrooms,
      area: p.usableArea,
    }));

    const prompt = `
Aja como a ORA. O usuário buscou imóveis e encontrei ${input.totalReturned} opções. 
Resuma brevemente as principais opções de forma natural e limpa (SEM usar markdown como ** ou ##):
${JSON.stringify(sampleProps, null, 2)}
Não use saudações como "Olá" ou "Sou a ORA". Vá direto ao ponto.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const text = (response.text || `Encontrei ${input.totalReturned} opções para você:`).replace(/\*\*|\#\#|\*/g, '');
    return { text };
  } catch (err) {
    return { text: `Encontrei ${input.totalReturned} opções para você:` };
  }
}
