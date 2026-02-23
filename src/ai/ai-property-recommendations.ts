'use server';

/**
 * @fileOverview Fornece recomendações de imóveis com tecnologia de IA com base nas preferências do cliente.
 *
 * - getPropertyRecommendations - Uma função que recebe as preferências do cliente e retorna recomendações de imóveis.
 * - PropertyRecommendationsInput - O tipo de entrada para a função getPropertyRecommendations.
 * - PropertyRecommendationsOutput - O tipo de retorno para a função getPropertyRecommendations.
 */

import {ai} from '@/ai/genkit';
import { 
  PropertyRecommendationsInputSchema, 
  PropertyRecommendationsOutputSchema, 
  type PropertyRecommendationsInput, 
  type PropertyRecommendationsOutput 
} from '@/ai/genkit';


export async function getPropertyRecommendations(input: PropertyRecommendationsInput): Promise<PropertyRecommendationsOutput> {
  return propertyRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyRecommendationsPrompt',
  input: {schema: PropertyRecommendationsInputSchema},
  output: {schema: PropertyRecommendationsOutputSchema},
  prompt: `Você é um assistente de IA para corretores de imóveis. Sua tarefa é fornecer recomendações de imóveis com base nas preferências do cliente.

Preferências do Cliente: {{{clientPreferences}}}

Com base nessas preferências, forneça uma lista de imóveis recomendados, incluindo endereço, preço e uma breve descrição do motivo pelo qual eles atendem às necessidades do cliente.`,
});

const propertyRecommendationsFlow = ai.defineFlow(
  {
    name: 'propertyRecommendationsFlow',
    inputSchema: PropertyRecommendationsInputSchema,
    outputSchema: PropertyRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
