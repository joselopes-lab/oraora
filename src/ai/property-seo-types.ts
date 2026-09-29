import { z } from 'zod';

export const GeneratePropertySeoInputSchema = z.object({
  tipo: z.string().optional(),
  finalidade: z.string().optional(),
  status: z.string().optional(),
  nome: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  estado: z.string().optional(),
  tamanho: z.string().optional(),
  quartos: z.array(z.string()).optional(),
  suites: z.array(z.string()).optional(),
  banheiros: z.string().optional(),
  vagas: z.string().optional(),
  salePrice: z.number().optional(),
  rentPrice: z.number().optional(),
  caracteristicas: z.array(z.string()).optional(),
  areascomuns: z.array(z.string()).optional(),
  existingDescription: z.string().optional(),
});

export type GeneratePropertySeoInput = z.infer<typeof GeneratePropertySeoInputSchema>;

export const GeneratePropertySeoOutputSchema = z.object({
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.string(),
});

export type GeneratePropertySeoOutput = z.infer<typeof GeneratePropertySeoOutputSchema>;
