'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating SEO metadata for a real estate website.
 *
 * - generateSeo - A function that generates SEO title, description, and keywords.
 * - GenerateSeoInput - The input type for the generateSeo function.
 * - GenerateSeoOutput - The return type for the generateSeo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSeoInputSchema = z.object({
  siteName: z.string().describe('The name of the real estate website.'),
  focus: z.string().describe('The main focus or specialty of the website (e.g., "imóveis de luxo", "lançamentos", "imóveis em São Paulo").'),
});

export type GenerateSeoInput = z.infer<typeof GenerateSeoInputSchema>;

const GenerateSeoOutputSchema = z.object({
  title: z.string().describe('The generated SEO meta title (max 60 characters).'),
  description: z.string().describe('The generated SEO meta description (max 160 characters).'),
  keywords: z.string().describe('A comma-separated string of the 10 most relevant keywords.'),
});

export type GenerateSeoOutput = z.infer<typeof GenerateSeoOutputSchema>;

export async function generateSeo(input: GenerateSeoInput): Promise<GenerateSeoOutput> {
  return generateSeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSeoPrompt',
  input: {schema: GenerateSeoInputSchema},
  output: {schema: GenerateSeoOutputSchema},
  prompt: `Você é um especialista em SEO para o mercado imobiliário no Brasil. Sua tarefa é criar metadados otimizados para um site chamado "{{siteName}}" com foco em "{{focus}}".

Siga rigorosamente as seguintes diretrizes do Google:
1.  **Título (Meta Title):** Crie um título extremamente persuasivo e direto, com no máximo 60 caracteres. Ele deve incluir o nome do site e as palavras-chave mais importantes. Exemplo: "Imóveis à Venda em São Paulo - Apartamentos e Casas | {{siteName}}".
2.  **Descrição (Meta Description):** Escreva uma descrição convincente com no máximo 160 caracteres. Use uma chamada para ação (CTA) forte e inclua palavras-chave secundárias. A descrição deve despertar o interesse do usuário a clicar.
3.  **Palavras-chave (Keywords):** Liste as 10 palavras-chave mais relevantes que alguém usaria no Google para encontrar imóveis, com base no foco "{{focus}}". Separe-as por vírgula. Inclua variações como "comprar apartamento", "imobiliária em [cidade]", "lançamentos imobiliários", etc.

Gere o conteúdo para o site "{{siteName}}".`,
});

const generateSeoFlow = ai.defineFlow(
  {
    name: 'generateSeoFlow',
    inputSchema: GenerateSeoInputSchema,
    outputSchema: GenerateSeoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
