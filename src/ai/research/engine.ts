/**
 * @fileOverview ORAORA AI RESEARCH ENGINE - Motor de Validação Factual.
 */

import { ai } from '@/ai/genkit';
import { ResearchReportSchema, ResearchReport } from './types';

/**
 * Protocolo de Pesquisa:
 * 1. Recebe um tema de pesquisa.
 * 2. Simula ou executa busca em fontes de alta autoridade.
 * 3. Identifica conflitos e lacunas.
 * 4. Gera o Research Report estruturado.
 */

export const researchPropertyContext = ai.defineFlow(
  {
    name: 'researchPropertyContext',
    inputSchema: ai.z.object({
      topic: ai.z.string(),
      context: ai.z.any().optional(),
    }),
    outputSchema: ResearchReportSchema,
  },
  async (input) => {
    const prompt = `Você é o ORAORA RESEARCH AGENT. Sua função é pesquisar e validar dados factuais.
    
    TEMA: ${input.topic}
    CONTEXTO ATUAL: ${JSON.stringify(input.context || {})}

    REGRAS CRÍTICAS:
    - Priorize IBGE, Prefeituras, Gov.br, Banco Central, FipeZap, SECOVI e Construtoras Oficiais.
    - Se encontrar dados conflitantes, registre no campo 'conflictingData'. NÃO tente adivinhar o correto.
    - Avalie a confiabilidade de cada fonte.
    - Atribua um Confidence Score de 0 a 100 baseado na qualidade dos dados encontrados.
    - Nunca use blogs de opinião ou fontes sem origem clara.

    Gere o relatório completo seguindo estritamente o schema definido.`;

    const response = await ai.generate({
      prompt,
      output: { schema: ResearchReportSchema }
    });

    if (!response.output) {
      throw new Error('[ResearchEngine] Falha ao gerar relatório de pesquisa.');
    }

    return response.output;
  }
);
