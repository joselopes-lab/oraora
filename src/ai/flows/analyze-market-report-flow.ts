'use server';

/**
 * @fileOverview Fluxo de IA para interpretar relatórios imobiliários (FipeZAP).
 * 
 * - analyzeMarketReport: Extrai dados numéricos e gera insights de venda a partir de uma imagem.
 */

import { ai, AnalyzeMarketReportInputSchema, AnalyzeMarketReportOutputSchema } from '@/ai/genkit';
import { z } from 'genkit';

export async function analyzeMarketReport(input: z.infer<typeof AnalyzeMarketReportInputSchema>) {
  return analyzeMarketReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMarketReportPrompt',
  input: { schema: AnalyzeMarketReportInputSchema },
  output: { schema: AnalyzeMarketReportOutputSchema },
  prompt: `Você é um analista sênior de inteligência de mercado imobiliário e especialista em copy de vendas para corretores de alta performance.

Sua tarefa é analisar a imagem do relatório fornecida e extrair os dados fundamentais para o mês de {{{monthYear}}}.

INSTRUÇÕES DE EXTRAÇÃO (IMPORTANTE):
1. PREÇO MÉDIO: Localize o valor em R$/m2.
2. VARIAÇÕES: Capture a variação mensal, acumulada no ano e em 12 meses.
3. DADOS DEMOGRÁFICOS E SOCIOECONÔMICOS: 
   - Localize "População residente", "Quantidade de domicílios" e "Quantidade de apartamentos".
   - ATENÇÃO: Se o valor estiver acompanhado de "mil", multiplique por 1.000 para obter o número real. (Ex: "296 mil" vira 296000).
   - Localize também a "Renda média domiciliar".
4. RANKING DE BAIRROS: Identifique os bairros listados, seus preços e variações.

INSTRUÇÕES DE INSIGHTS (ESTRUTURA PARA UI):
Gere o texto em Markdown rico, garantindo o uso de quebras de linha duplas (\\n\\n) entre seções e entre CADA parágrafo para uma renderização limpa.

REGRAS DE FORMATAÇÃO CRÍTICAS:
- NÃO use negrito (**texto**) em nenhuma parte da resposta.
- NÃO use CAIXA ALTA (MAIÚSCULAS) para ênfase ou títulos; use escrita normal e fluida.
- Use Português do Brasil.
- É OBRIGATÓRIO separar as ideias em parágrafos curtos.
- GARANTA que não haja texto colado; use \\n\\n generosamente entre cabeçalhos e parágrafos.

Use a seguinte estrutura obrigatória:

### Resumo do momento
Escreva de 2 a 3 parágrafos analíticos e fluidos sobre o estado atual do mercado baseado nos dados extraídos. Cada parágrafo deve tratar de um ponto diferente (ex: valorização, demografia).

### Oportunidades estratégicas
Use uma lista com marcadores (-) para listar de 3 a 5 pontos focais curtos e diretos para o corretor.

### Pitch de vendas irresistível
Para cada script sugerido, use o formato de bloco de citação (>). 
Inicie cada bloco com o título do script entre colchetes.
Separe os blocos com uma linha em branco.

Exemplo de formato esperado:
> [Título do Script]: "Texto do script..."

IMAGEM DO RELATÓRIO:
{{media url=photoDataUri}}`,
});

const analyzeMarketReportFlow = ai.defineFlow(
  {
    name: 'analyzeMarketReportFlow',
    inputSchema: AnalyzeMarketReportInputSchema,
    outputSchema: AnalyzeMarketReportOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error("Falha ao analisar o relatório imobiliário.");
      return output;
    } catch (error: any) {
      console.error("Erro no analyzeMarketReportFlow:", error);
      console.error("Message:", error.message);
      console.error("Status:", error.status);
      console.error("Code:", error.code);
      console.error("Details:", error.details);
      console.error("Stack:", error.stack);
      throw error;
    }
  }
);
