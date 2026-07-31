
'use server';

/**
 * @fileOverview ORAORA CITY CONTENT ENGINE
 * 
 * Gerador de conteúdo de autoridade para cidades.
 * Integra Research Engine, Knowledge Engine e Editorial Engine.
 */

import { ai, CityContentOutputSchema, CityContentOutput } from '@/ai/genkit';
import { z } from 'zod';
import { researchPropertyContext } from '@/ai/research/engine';
import { ORAORA_EDITORIAL_RULES, ORAORA_TONE_OF_VOICE, EDITORIAL_TEMPLATES } from '@/ai/editorial';

interface CityContentInput {
  cityName: string;
  stateUf: string;
  brokerContext: any; // Dados vindos do KnowledgeService
}

export async function generateCityContent(input: CityContentInput): Promise<CityContentOutput> {
  return cityContentFlow(input);
}

const cityContentFlow = ai.defineFlow(
  {
    name: 'cityContentFlow',
    inputSchema: z.object({
      cityName: z.string(),
      stateUf: z.string(),
      brokerContext: z.any(),
    }),
    outputSchema: CityContentOutputSchema,
  },
  async (input) => {
    // 1. Fase de Pesquisa Analítica
    const research = await researchPropertyContext({
      topic: `Perfil de mercado e infraestrutura de ${input.cityName} - ${input.stateUf}`,
      context: { type: 'city_authority_page' }
    });

    // 2. Montagem do Prompt com Governança Editorial
    const prompt = `Você é o ORAORA CONTENT ENGINE. Sua tarefa é gerar uma página de autoridade sobre a cidade de ${input.cityName}.

    REGRAS EDITORIAIS (OBRIGATÓRIO):
    - Tom de voz: ${ORAORA_TONE_OF_VOICE.personality}.
    - Guidelines: ${ORAORA_TONE_OF_VOICE.guidelines.join(', ')}.
    - Protocolo: Utilize APENAS os dados do Research Report fornecido abaixo.
    - Personalização: Este conteúdo é para o corretor "${input.brokerContext.brokerId}". 
      Incorpore sutilmente as especialidades (${input.brokerContext.specialties.join(', ')}) e a autoridade do corretor na região.

    ESTRUTURA DO TEMPLATE:
    ${JSON.stringify(EDITORIAL_TEMPLATES.cidade.structure)}

    DADOS DE PESQUISA (RESEARCH REPORT):
    ${JSON.stringify(research.foundData)}
    Resumo: ${research.summary}

    Gere o JSON completo seguindo o CityContentOutputSchema.`;

    try {
      const response = await ai.generate({
        prompt,
        output: { schema: CityContentOutputSchema }
      });

      if (!response.output) {
        throw new Error('[CityContentEngine] Falha ao gerar conteúdo.');
      }

      return response.output;
    } catch (error: any) {
      console.error("Erro no cityContentFlow:", error);
      console.error("Message:", error.message);
      console.error("Status:", error.status);
      console.error("Code:", error.code);
      console.error("Details:", error.details);
      console.error("Stack:", error.stack);
      throw error;
    }
  }
);
