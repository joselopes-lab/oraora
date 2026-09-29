'use server';

import { ai } from '@/ai/genkit';
import { adminAuth, adminDb } from '@/firebase/index.server';
import { 
  GeneratePropertySeoInputSchema, 
  GeneratePropertySeoOutputSchema, 
  type GeneratePropertySeoInput, 
  type GeneratePropertySeoOutput 
} from './property-seo-types';

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

export async function generatePropertySeo(input: GeneratePropertySeoInput, idToken?: string): Promise<GeneratePropertySeoOutput> {
  // 1. Authenticate server-side via provided Firebase ID token
  await verifyServerAuth(idToken);

  // 2. Validate minimum requirements: tipo + at least 2 relevant fields
  const tipo = input.tipo?.trim();
  if (!tipo) {
    throw new Error('O tipo do imóvel é obrigatório para gerar o SEO.');
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
    throw new Error('Informações insuficientes para SEO. Preencha pelo menos o tipo e mais 2 características ou dados de localização do imóvel.');
  }

  // 3. Sanitize and clean payload
  const sanitizedInput: GeneratePropertySeoInput = {
    tipo,
  };

  if (input.nome?.trim()) sanitizedInput.nome = input.nome.trim();
  if (input.finalidade?.trim()) sanitizedInput.finalidade = input.finalidade.trim();
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

  const { output } = await prompt(sanitizedInput);
  return {
    seoTitle: (output?.seoTitle || '').replace(/[*#`_\\]/g, '').trim(),
    seoDescription: (output?.seoDescription || '').replace(/[*#`_\\]/g, '').trim(),
    seoKeywords: (output?.seoKeywords || '').replace(/[*#`_\\]/g, '').trim(),
  };
}

const prompt = ai.definePrompt({
  name: 'generatePropertySeoPrompt',
  input: { schema: GeneratePropertySeoInputSchema },
  output: { schema: GeneratePropertySeoOutputSchema },
  prompt: `Você é um especialista em SEO imobiliário. Sua tarefa é criar um Meta Title e uma Meta Description otimizados para motores de busca (Google), além de palavras-chave relevantes, utilizando EXCLUSIVAMENTE os dados factuais informados abaixo.

DADOS FACTUAIS FORNECIDOS DO IMÓVEL:
{{#if tipo}}- Tipo: {{{tipo}}}{{/if}}
{{#if finalidade}}- Finalidade: {{{finalidade}}}{{/if}}
{{#if status}}- Status: {{{status}}}{{/if}}
{{#if nome}}- Nome: {{{nome}}}{{/if}}
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
- Descrição comercial do imóvel: {{{existingDescription}}}
{{/if}}

REGRAS DE OURO ABSOLUTAS PARA SEO (OBRIGATÓRIO SEGUIR):
1. NUNCA invente, presuma ou deduza características que não estejam explicitamente listadas acima (proibido inventar vista mar, proximidade de praia, acabamento de luxo, portaria 24h, valorização, rentabilidade, exclusividade, etc.).
2. SEO Title:
   - Orientado à intenção de busca (ex: [Tipo] [à venda / para alugar] [Atributo relevante] no [Bairro] em [Cidade]).
   - Tamanho ideal: aproximadamente 50 a 60 caracteres. Sem truncar palavras artificialmente.
   - Texto puro, sem Markdown (** ou #), sem emojis.
3. Meta Description:
   - Descritiva, factual, atraente e orientada à busca.
   - Tamanho ideal: aproximadamente 140 a 160 caracteres.
   - Texto puro, sem Markdown (** ou #), sem emojis.
4. Palavras-chave (seoKeywords):
   - Termos separados por vírgula relevantes para busca (ex: apartamento no bessa, apartamento 1 quarto joão pessoa).
   - Apenas com base nos dados reais fornecidos.`,
});
