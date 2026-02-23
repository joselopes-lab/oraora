import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

// From seo-generator.ts
export const GenerateSeoInputSchema = z.object({
  nome: z.string().describe('The name of the property.'),
  descricao: z.string().optional().describe('A detailed description of the property.'),
  tipo: z.string().optional().describe('The type of property (e.g., "Apartamento", "Casa").'),
  bairro: z.string().optional().describe('The neighborhood where the property is located.'),
  cidade: z.string().describe('The city where the property is located.'),
  estado: z.string().describe('The state (UF code) where the property is located.'),
});
export type GenerateSeoInput = z.infer<typeof GenerateSeoInputSchema>;

export const GenerateSeoOutputSchema = z.object({
  seoTitle: z.string().describe('A concise and attractive SEO title (max 60 characters).'),
  seoDescription: z.string().describe('A compelling meta description (max 160 characters).'),
  seoKeywords: z.string().describe('A comma-separated list of relevant keywords.'),
});
export type GenerateSeoOutput = z.infer<typeof GenerateSeoOutputSchema>;


// From ai-property-recommendations.ts
export const PropertyRecommendationsInputSchema = z.object({
  clientPreferences: z
    .string()
    .describe('Uma descrição detalhada das preferências de imóvel do cliente, incluindo localização, faixa de preço, tipo de imóvel, tamanho e comodidades desejadas.'),
});
export type PropertyRecommendationsInput = z.infer<typeof PropertyRecommendationsInputSchema>;

export const PropertyRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('Uma lista de imóveis recomendados, incluindo endereço, preço e uma breve descrição destacando por que eles correspondem às preferências do cliente.'),
});
export type PropertyRecommendationsOutput = z.infer<typeof PropertyRecommendationsOutputSchema>;
