
'use server';
/**
 * @fileOverview Flow to generate comprehensive website content for a real estate broker based on onboarding data.
 */

import { ai, OnboardingDataSchema, GenerateSiteContentOutputSchema } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateSiteContent(input: z.infer<typeof OnboardingDataSchema>) {
  return generateSiteContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSiteContentPrompt',
  input: { schema: OnboardingDataSchema },
  output: { schema: GenerateSiteContentOutputSchema },
  prompt: `Você é um copywriter sênior especializado no mercado imobiliário de luxo e alta performance.
Sua tarefa é gerar todo o conteúdo textual para o site de um corretor de imóveis baseado nos dados de onboarding fornecidos.

O conteúdo deve ter uma forte conotação comercial, focado em vendas, autoridade e conversão. Não use clichês genéricos. Crie textos consistentes que reflitam a personalidade e os pontos fortes do corretor.

DADOS DE ONBOARDING:
- Nome: {{{name}}}
- Anos de Experiência: {{{yearsExperience}}}
- Localização: {{#each locations}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Tipos de Imóvel: {{#each propertyTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Público-Alvo: {{#each audiences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Diferencial: {{{differential}}}
- Proposta de Valor: {{{valueProposition}}}
- Serviços: {{#each services}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Processo: {{{process}}}
- Pós-venda: {{{postSales}}}
- Volume de Vendas: {{{salesVolume}}}
- Certificações: {{{certifications}}}
- Posicionamento desejado: {{{marketPosition}}}
- Maior ponto forte: {{{professionalStrength}}}
- CRECI: {{{creci}}}

INSTRUÇÕES POR SEÇÃO:
1. HOMEPAGE: O Hero Title deve ser impactante. Use <span> para destacar palavras-chave (ex: "Viva o <span class='text-primary'>Luxo</span>"). Os stats devem ser numéricos curtos (ex: "+500", "15 anos").
2. SOBRE: A bio deve ser uma narrativa envolvente de autoridade. Os "values" (pilares) devem ser baseados no Diferencial e Proposta de Valor.
3. SERVIÇOS: Transforme os itens da lista de serviços em descrições vendedoras. O processo deve ser claro e profissional.
4. CONTATO: Textos que convidem ao diálogo e passem confiança.

Gere o conteúdo em Português do Brasil.`,
});

const generateSiteContentFlow = ai.defineFlow(
  {
    name: 'generateSiteContentFlow',
    inputSchema: OnboardingDataSchema,
    outputSchema: GenerateSiteContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("Falha ao gerar conteúdo do site.");
    return output;
  }
);
