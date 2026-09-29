'use server';

import { ai } from '@/ai/genkit';
import { adminAuth, adminDb } from '@/firebase/index.server';
import { 
  GeneratePropertyDescriptionInputSchema, 
  GeneratePropertyDescriptionOutputSchema, 
  type GeneratePropertyDescriptionInput, 
  type GeneratePropertyDescriptionOutput 
} from './property-description-types';

async function verifyServerAuth(idToken?: string) {
  if (!idToken) {
    throw new Error('Usuário não autenticado no servidor.');
  }
  
  let requesterUid: string | null = null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    requesterUid = decoded.uid;
  } catch (e) {
    throw new Error('Token de autenticação inválido ou expirado.');
  }

  if (!requesterUid) {
    throw new Error('Usuário não autenticado no servidor.');
  }

  const userDoc = await adminDb.collection('users').doc(requesterUid).get();
  if (!userDoc.exists) {
    throw new Error('Perfil de usuário não encontrado.');
  }
  return { uid: requesterUid, userType: userDoc.data()?.userType };
}

function sanitizeHtmlOutput(html: string): string {
  if (!html) return '';
  // Remove markdown symbols if any escaped through
  let cleaned = html
    .replace(/\*\*/g, '')
    .replace(/\\/g, '')
    .replace(/#/g, '');

  // If output is plain text without tags, wrap paragraphs in <p>
  if (!cleaned.includes('<p>') && !cleaned.includes('<strong>')) {
    const paragraphs = cleaned.split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length <= 1) {
      return `<p>${cleaned}</p>`;
    }
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  }

  // Whitelist sanitization for allowed tags: <p>, <strong>, <b>, <br>, <em>, <i>
  cleaned = cleaned
    .replace(/<\/?(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, '')
    .replace(/<([a-z]+)\s+[^>]*>/gi, '<$1>'); // remove attributes

  return cleaned;
}

export async function generatePropertyDescription(input: GeneratePropertyDescriptionInput, idToken?: string): Promise<GeneratePropertyDescriptionOutput> {
  // 1. Authenticate server-side via provided Firebase ID token
  await verifyServerAuth(idToken);

  // 2. Validate minimum requirements: tipo + at least 2 relevant fields
  const tipo = input.tipo?.trim();
  if (!tipo) {
    throw new Error('O tipo do imóvel é obrigatório para gerar a descrição.');
  }

  const relevantFieldsCount = [
    input.cidade?.trim(),
    input.bairro?.trim(),
    input.tamanho?.trim(),
    input.banheiros?.trim(),
    input.vagas?.trim(),
    input.nome?.trim(),
    (input.quartos && input.quartos.length > 0) ? true : undefined,
    (input.suites && input.suites.length > 0) ? true : undefined,
    (input.caracteristicas && input.caracteristicas.length > 0) ? true : undefined,
    (input.areascomuns && input.areascomuns.length > 0) ? true : undefined,
    (input.salePrice !== undefined && input.salePrice !== null && input.salePrice > 0) ? true : undefined,
    (input.rentPrice !== undefined && input.rentPrice !== null && input.rentPrice > 0) ? true : undefined,
  ].filter(Boolean).length;

  if (relevantFieldsCount < 2) {
    throw new Error('Informações insuficientes. Preencha pelo menos o tipo e mais 2 características ou dados de localização do imóvel.');
  }

  // 3. Sanitize and clean payload (remove undefined, null, "", empty arrays)
  const sanitizedInput: GeneratePropertyDescriptionInput = {
    tipo,
  };

  if (input.nome?.trim()) sanitizedInput.nome = input.nome.trim();
  if (input.status?.trim()) sanitizedInput.status = input.status.trim();
  if (input.cidade?.trim()) sanitizedInput.cidade = input.cidade.trim();
  if (input.bairro?.trim()) sanitizedInput.bairro = input.bairro.trim();
  if (input.estado?.trim()) sanitizedInput.estado = input.estado.trim();
  if (input.tamanho?.trim()) sanitizedInput.tamanho = input.tamanho.trim();
  if (input.vagas?.trim()) sanitizedInput.vagas = input.vagas.trim();
  if (input.banheiros?.trim()) sanitizedInput.banheiros = input.banheiros.trim();

  if (input.salePrice !== undefined && input.salePrice !== null && !isNaN(input.salePrice)) {
    sanitizedInput.salePrice = input.salePrice;
  }
  if (input.rentPrice !== undefined && input.rentPrice !== null && !isNaN(input.rentPrice)) {
    sanitizedInput.rentPrice = input.rentPrice;
  }

  if (Array.isArray(input.quartos) && input.quartos.length > 0) {
    sanitizedInput.quartos = input.quartos.filter(Boolean);
  }
  if (Array.isArray(input.suites) && input.suites.length > 0) {
    sanitizedInput.suites = input.suites.filter(Boolean);
  }
  if (Array.isArray(input.caracteristicas) && input.caracteristicas.length > 0) {
    sanitizedInput.caracteristicas = input.caracteristicas.filter(Boolean);
  }
  if (Array.isArray(input.areascomuns) && input.areascomuns.length > 0) {
    sanitizedInput.areascomuns = input.areascomuns.filter(Boolean);
  }
  if (input.existingDescription?.trim()) {
    sanitizedInput.existingDescription = input.existingDescription.trim();
  }

  const rawOutput = await generatePropertyDescriptionFlow(sanitizedInput);
  return {
    description: sanitizeHtmlOutput(rawOutput.description)
  };
}

const prompt = ai.definePrompt({
  name: 'generatePropertyDescriptionPrompt',
  input: { schema: GeneratePropertyDescriptionInputSchema },
  output: { schema: GeneratePropertyDescriptionOutputSchema },
  prompt: `Você é um redator imobiliário profissional. Sua tarefa é criar uma descrição comercial para um imóvel em HTML simples compatível com editor rico, utilizando EXCLUSIVAMENTE os dados factuais informados abaixo.

DADOS FACTUAIS FORNECIDOS DO IMÓVEL:
{{#if tipo}}- Tipo: {{{tipo}}}{{/if}}
{{#if nome}}- Nome: {{{nome}}}{{/if}}
{{#if status}}- Status: {{{status}}}{{/if}}
{{#if cidade}}- Cidade: {{{cidade}}}{{/if}}
{{#if estado}}- Estado: {{{estado}}}{{/if}}
{{#if bairro}}- Bairro: {{{bairro}}}{{/if}}
{{#if tamanho}}- Área útil: {{{tamanho}}} m²{{/if}}
{{#if quartos}}- Quartos: {{{quartos}}}{{/if}}
{{#if suites}}- Suítes: {{{suites}}}{{/if}}
{{#if banheiros}}- Banheiros: {{{banheiros}}}{{/if}}
{{#if vagas}}- Vagas: {{{vagas}}}{{/if}}
{{#if caracteristicas}}- Características internas: {{{caracteristicas}}}{{/if}}
{{#if areascomuns}}- Áreas comuns / Lazer: {{{areascomuns}}}{{/if}}
{{#if salePrice}}- Preço de venda: R$ {{{salePrice}}}{{/if}}
{{#if rentPrice}}- Preço de aluguel: R$ {{{rentPrice}}}{{/if}}
{{#if existingDescription}}
- Descrição atual para revisão e aprimoramento de redação: {{{existingDescription}}}
{{/if}}

REGRAS DE OURO ABSOLUTAS (OBRIGATÓRIO SEGUIR RIGOROSAMENTE):
1. NUNCA invente, presuma ou deduza características que não estejam explicitamente listadas acima.
2. É ESTRITAMENTE PROIBIDO mencionar ou inventar:
   - Vista, posição solar, proximidade, praia, acabamento de luxo, portaria 24h, valorização, rentabilidade, etc.
3. A ausência de um dado significa que ele é DESCONHECIDO. NUNCA transforme dado ausente em negativa.
4. FORMATO E HTML (MUITO IMPORTANTE):
   - Retorne o texto estruturado usando APENAS as tags HTML simples: <p>, <strong>, <br>.
   - PROIBIDO usar sintaxe Markdown (** ou * ou # ou \\ ou - para listas). Use estritamente tags HTML.
   - Estrutura esperada em parágrafos (<p>):
     1. Abertura/título comercial em destaque (ex: <p><strong>Um novo jeito de morar no Aeroclube</strong></p>).
     2. Parágrafo de apresentação do imóvel e contexto.
     3. Parágrafo de características e planta em narrativa fluida (ex: "Com <strong>20 m²</strong> de área útil, o imóvel conta com <strong>1 quarto</strong>, <strong>1 suíte</strong>, <strong>1 banheiro</strong> e <strong>1 vaga</strong> de estacionamento."), usando negrito (<strong>) seletivamente apenas em métricas e diferenciais principais.
     4. Parágrafo de diferenciais internos, quando houver.
     5. Parágrafo de áreas comuns / lazer, quando houver.
     6. Frase comercial final em destaque (ex: <p><strong>Um apartamento novo para quem valoriza praticidade.</strong></p>).
     7. Parágrafo de CTA (ex: <p>Entre em contato e conheça mais detalhes.</p>).`,
});

const generatePropertyDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePropertyDescriptionFlow',
    inputSchema: GeneratePropertyDescriptionInputSchema,
    outputSchema: GeneratePropertyDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
