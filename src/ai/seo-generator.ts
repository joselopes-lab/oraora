'use server';
/**
 * @fileOverview Generates SEO metadata for a property using AI.
 *
 * - generateSeoForProperty - A function that takes property details and returns SEO recommendations.
 * - GenerateSeoInput - The input type for the generateSeoForProperty function.
 * - GenerateSeoOutput - The return type for the generateSeoForProperty function.
 */

import {ai} from '@/ai/genkit';
import { GenerateSeoInputSchema, GenerateSeoOutputSchema, type GenerateSeoInput, type GenerateSeoOutput } from '@/ai/genkit';


export async function generateSeoForProperty(input: GenerateSeoInput): Promise<GenerateSeoOutput> {
  return generateSeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSeoPrompt',
  input: {schema: GenerateSeoInputSchema},
  output: {schema: GenerateSeoOutputSchema},
  prompt: `Você é um especialista em SEO para o mercado imobiliário. Sua tarefa é gerar um título de SEO, uma meta-descrição e palavras-chave para um anúncio de imóvel.

Use as seguintes informações do imóvel:
- Nome: {{{nome}}}
- Descrição: {{{descricao}}}
- Tipo: {{{tipo}}}
- Localização: {{{bairro}}}, {{{cidade}}} - {{{estado}}}

Regras:
- O título de SEO deve ser conciso, atrativo e ter no máximo 60 caracteres.
- A meta-descrição deve ser convincente, chamar a atenção para o clique e ter no máximo 160 caracteres.
- As palavras-chave devem ser uma lista separada por vírgulas, incluindo termos de cauda longa.

Gere o conteúdo de SEO otimizado.`,
});

const generateSeoFlow = ai.defineFlow(
  {
    name: 'generateSeoFlow',
    inputSchema: GenerateSeoInputSchema,
    outputSchema: GenerateSeoOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
