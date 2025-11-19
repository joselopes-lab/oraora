
'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting property data from a given URL.
 *
 * - extractPropertyData - A function that takes a URL and returns structured property data.
 * - ExtractPropertyDataInput - The input type for the extractPropertyData function.
 * - ExtractPropertyDataOutput - The return type for the extractPropertyData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractPropertyDataInputSchema = z.object({
  url: z.string().url().describe('A URL para a página de um imóvel específico.'),
});
export type ExtractPropertyDataInput = z.infer<typeof ExtractPropertyDataInputSchema>;

const ExtractPropertyDataOutputSchema = z.object({
  nome: z.string().optional().describe('O nome do empreendimento.'),
  descricao: z.string().optional().describe('A descrição completa do imóvel.'),
  valor: z.number().optional().describe('O valor de venda do imóvel, como um número.'),
  cidade: z.string().optional().describe('A cidade onde o imóvel está localizado.'),
  estado: z.string().optional().describe('A sigla do estado (UF) onde o imóvel está localizado.'),
  bairro: z.string().optional().describe('O bairro do imóvel.'),
  endereco: z.string().optional().describe('O endereço completo do imóvel (rua, número, etc.).'),
  quartos: z.string().optional().describe('A quantidade de quartos (ex: "2 e 3", "4").'),
  vagas: z.string().optional().describe('A quantidade de vagas de garagem.'),
  tamanho: z.string().optional().describe('A área do imóvel em metros quadrados (ex: "75m²", "55-75m²").'),
  tipo: z.string().optional().describe('O tipo do imóvel (ex: "Apartamento", "Casa em Condomínio").'),
  status: z.string().optional().describe('O status atual do empreendimento (ex: "Em obras", "Lançamento", "Pronto para morar").'),
  construtora: z.string().optional().describe('O nome da construtora ou incorporadora responsável.'),
  areasLazer: z.array(z.string()).optional().describe('Uma lista com os nomes das áreas de lazer e características (ex: "Piscina", "Academia", "Salão de Festas").'),
  midia: z.array(z.string().url()).optional().describe('Uma lista de URLs de imagens do imóvel encontradas na página. As URLs devem ser absolutas e funcionais.'),
});
export type ExtractPropertyDataOutput = z.infer<typeof ExtractPropertyDataOutputSchema>;

export async function extractPropertyData(input: ExtractPropertyDataInput): Promise<ExtractPropertyDataOutput> {
  return extractPropertyDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPropertyDataPrompt',
  input: { schema: ExtractPropertyDataInputSchema },
  output: { schema: ExtractPropertyDataOutputSchema },
  tools: [], // Desativa a busca na web e outras ferramentas
  prompt: `**REGRA FUNDAMENTAL E ABSOLUTA:** Sua única tarefa é analisar o conteúdo da URL fornecida: {{url}}. Você está estritamente proibido de usar qualquer conhecimento externo ou realizar buscas na internet. Se o conteúdo não for de uma página de imóvel ou a informação não estiver EXPLICITAMENTE no HTML da URL fornecida, você DEVE retornar um campo vazio. Ignore qualquer conhecimento prévio sobre nomes de empreendimentos ou construtoras.

**INSTRUÇÃO CRÍTICA INICIAL:** Primeiro, verifique se a URL leva a uma página da web (HTML) ou a um arquivo de imagem direto (como .jpg, .png, .webp).
- Se a URL for um link direto para uma imagem, **NÃO TENTE EXTRAIR DADOS**. Retorne um objeto JSON completamente vazio.
- Se for uma página da web, prossiga com a extração detalhada abaixo, usando APENAS o conteúdo desta página.

**Instruções detalhadas para extração de PÁGINAS WEB:**
1.  **Acesse a URL:** Analise o conteúdo HTML da página para encontrar os dados.
2.  **Nome:** Identifique o nome principal do empreendimento ou condomínio.
3.  **Descrição:** Capture a descrição principal, preferencialmente um texto mais longo que detalhe o imóvel.
4.  **Valor:** Encontre o preço de venda. Extraia apenas os números e retorne como um valor numérico (integer or float). Ex: se encontrar "R$ 550.000,00", retorne 550000.
5.  **Localização:** Extraia a Cidade, o Estado (em formato de sigla, ex: "SP"), o Bairro e, se possível, o Endereço completo (rua e número).
6.  **Características:**
    - **Quartos:** Encontre a quantidade de quartos. Formate como "2", "3 e 4", etc.
    - **Vagas:** Quantidade de vagas de garagem.
    - **Tamanho:** Área em metros quadrados. Mantenha o formato encontrado (ex: "75m²" ou "55 a 75m²").
    - **Tipo:** Identifique o tipo do imóvel (Apartamento, Casa, etc).
7.  **Status:** Encontre o estágio da obra (Lançamento, Em Obras, Pronto para morar).
8.  **Construtora:** Identifique o nome da construtora ou incorporadora responsável.
9.  **Áreas de Lazer:** Encontre e liste todas as características e áreas de lazer mencionadas (ex: "Piscina com deck", "Academia equipada", "Salão de festas", "Espaço gourmet").
10. **Mídia (linksImagens):** 
    - **CRÍTICO: Extraia de 5 a 10 URLs de imagens de ALTA QUALIDADE e RELEVANTES do empreendimento.** 
    - **VALIDAÇÃO OBRIGATÓRIA:** As URLs devem ser **ABSOLUTAS** (começando com http ou https) e **FUNCIONAIS**. Antes de incluir uma URL na lista, você deve verificar se ela leva diretamente a um arquivo de imagem (JPG, PNG, WEBP).
    - **EXCLUA TERMINANTEMENTE:** logotipos, ícones, banners de publicidade, imagens de perfil, miniaturas que não abrem em tamanho real ou qualquer imagem que não seja uma foto do imóvel ou de suas áreas.
    - **PRIORIZE:** Imagens encontradas dentro de galerias, slideshows ou carrosséis (elementos com classes como "gallery", "carousel", "property-images").

Se uma informação não for encontrada, deixe o campo correspondente vazio. Foco total na precisão e na qualidade dos dados extraídos, exclusivamente da URL fornecida.`,
});

const extractPropertyDataFlow = ai.defineFlow(
  {
    name: 'extractPropertyDataFlow',
    inputSchema: ExtractPropertyDataInputSchema,
    outputSchema: ExtractPropertyDataOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
