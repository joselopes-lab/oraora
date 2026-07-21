
'use server';

/**
 * @fileOverview Fluxo de IA para gerar análise estruturada de investimento imobiliário.
 * 
 * - generatePropertyInvestmentAnalysis - Função que processa os dados e retorna o dossiê.
 */

import { ai, PropertyInvestmentAnalysisInputSchema, PropertyInvestmentAnalysisOutputSchema, type PropertyInvestmentAnalysisInput, type PropertyInvestmentAnalysisOutput } from '@/ai/genkit';

export async function generatePropertyInvestmentAnalysis(input: PropertyInvestmentAnalysisInput): Promise<PropertyInvestmentAnalysisOutput> {
  return propertyInvestmentAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyInvestmentAnalysisPrompt',
  input: { schema: PropertyInvestmentAnalysisInputSchema },
  output: { schema: PropertyInvestmentAnalysisOutputSchema },
  prompt: `Você é um analista sênior de investimentos imobiliários. Sua tarefa é gerar um dossiê técnico e matemático comparando o empreendimento "{{{propertyName}}}" no bairro "{{{neighborhoodName}}}" com outros indicadores do mercado financeiro nacional.

DADOS DE ENTRADA:
- Preço do m² do empreendimento: R$ {{{propertyPricePerM2}}}
- Preço médio do m² no bairro: R$ {{{neighborhoodAvgPricePerM2}}}
- Valorização histórica do bairro (últimos 12 meses): {{{neighborhoodYearlyVariation}}}%

REGRAS DE CÁLCULO E ANÁLISE (OBRIGATÓRIO):

1. CRITICAL ANALYSIS: 
   - Calcule a diferença percentual entre o m² do empreendimento e a média do bairro.
   - Se a diferença for superior a 40% (para cima ou para baixo), defina "isAnomaly" como true.
   - No "analysisText", explique matematicamente por que o valor é premium, justo ou um erro/oportunidade em relação à média de R$ {{{neighborhoodAvgPricePerM2}}}/m².

2. PROJECTIONS (Crescimento Composto):
   - Calcule a projeção de valorização do capital baseado na taxa histórica de {{{neighborhoodYearlyVariation}}}% ao ano.
   - Retorne os valores percentuais acumulados para 6 meses, 1 ano e 2 anos.

3. BENCHMARK (Comparativo de Ativos):
   - Você DEVE preencher os campos numéricos com valores de 0 a 100 (ex: 11.5 para 11.5%). NÃO use decimais de 0 a 1.
   - Use exatamente estes valores para os indicadores financeiros:
     * cdi: 11.0
     * ibovespa: 11.5
   - O campo "appreciation" do imóvel deve ser igual à variação do bairro: {{{neighborhoodYearlyVariation}}}.
   - O campo "yield" (aluguel) deve ser 4.8 (que representa o acumulado de 0.4% ao mês x 12 meses).
   - O campo "propertyReturn" deve ser a soma aritmética exata de "appreciation" + "yield".

4. VERDICT:
   - Status: "Compra", "Venda", "Aguardar" ou "Condicional".
   - Justifique com base na proteção do capital e no ganho real comparado ao CDI (11.0%).

Retorne os dados estritamente no formato JSON solicitado. Use linguagem técnica de mercado financeiro brasileiro.`,
});

const propertyInvestmentAnalysisFlow = ai.defineFlow(
  {
    name: 'propertyInvestmentAnalysisFlow',
    inputSchema: PropertyInvestmentAnalysisInputSchema,
    outputSchema: PropertyInvestmentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("Falha ao gerar análise de investimento.");
    return output;
  }
);
