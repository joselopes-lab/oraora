'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating SEO metadata for a single property page.
 *
 * - generatePropertySeo - A function that generates SEO title, description, and keywords based on property details.
 * - GeneratePropertySeoInput - The input type for the generatePropertySeo function.
 * - GeneratePropertySeoOutput - The return type for the generatePropertySeo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePropertySeoInputSchema = z.object({
  nome: z.string().describe('The name of the property (e.g., "Residencial Vista do Mar").'),
  tipo: z.string().describe('The type of the property (e.g., "Apartamento", "Casa em Condomínio").'),
  cidade: z.string().describe('The city where the property is located.'),
  estado: z.string().describe('The state (UF) where the property is located.'),
  quartos: z.string().describe('A description of the available bedrooms (e.g., "2 e 3 quartos", "4 suítes").'),
  descricao: z.string().describe('A brief description of the property.'),
});

export type GeneratePropertySeoInput = z.infer<typeof GeneratePropertySeoInputSchema>;

const GeneratePropertySeoOutputSchema = z.object({
  title: z.string().describe('The generated SEO meta title (max 60 characters).'),
  description: z.string().describe('The generated SEO meta description (max 160 characters).'),
  keywords: z.string().describe('A comma-separated string of the 10 most relevant keywords.'),
});

export type GeneratePropertySeoOutput = z.infer<typeof GeneratePropertySeoOutputSchema>;

export async function generatePropertySeo(input: GeneratePropertySeoInput): Promise<GeneratePropertySeoOutput> {
  return generatePropertySeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePropertySeoPrompt',
  input: {schema: GeneratePropertySeoInputSchema},
  output: {schema: GeneratePropertySeoOutputSchema},
  prompt: `Você é um especialista em SEO para o mercado imobiliário no Brasil, com foco em criar textos que vendem. Sua tarefa é criar metadados otimizados para a página de um imóvel específico.

Dados do Imóvel:
- Nome: "{{nome}}"
- Tipo: "{{tipo}}"
- Localização: "{{cidade}} - {{estado}}"
- Quartos: "{{quartos}}"
- Descrição: "{{descricao}}"

Siga rigorosamente as seguintes diretrizes do Google e foque na conversão:
1.  **Título (Meta Title):** Crie um título extremamente atrativo e vendedor com no máximo 60 caracteres. Deve incluir o nome do imóvel, tipo, e a cidade. Use uma chamada para ação implícita. Exemplo: "{{nome}} | {{tipo}} à Venda em {{cidade}}".
2.  **Descrição (Meta Description):** Escreva uma descrição convincente e única com no máximo 160 caracteres. Destaque os melhores atributos do imóvel (baseado na descrição e quartos) e inclua uma chamada para ação (CTA) forte como "Saiba mais!" ou "Agende uma visita!". O objetivo é fazer o usuário clicar.
3.  **Palavras-chave (Keywords):** Liste as 10 palavras-chave mais relevantes que um comprador usaria no Google para encontrar este imóvel específico. Inclua o nome do empreendimento, variações como "comprar {{tipo}} em {{cidade}}", "{{tipo}} de {{quartos}} em {{cidade}}", e o nome do bairro se puder inferir da descrição. Separe-as por vírgula.

Gere o conteúdo para o imóvel "{{nome}}".`,
});

const generatePropertySeoFlow = ai.defineFlow(
  {
    name: 'generatePropertySeoFlow',
    inputSchema: GeneratePropertySeoInputSchema,
    outputSchema: GeneratePropertySeoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
