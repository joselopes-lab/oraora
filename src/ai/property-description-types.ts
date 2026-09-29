import { z } from 'zod';

export const GeneratePropertyDescriptionInputSchema = z.object({
  tipo: z.string().optional(),
  nome: z.string().max(150, "Nome muito longo").optional(),
  status: z.string().optional(),
  salePrice: z.number().optional(),
  rentPrice: z.number().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  estado: z.string().optional(),
  tamanho: z.string().optional(),
  vagas: z.string().optional(),
  banheiros: z.string().optional(),
  quartos: z.array(z.string()).optional(),
  suites: z.array(z.string()).optional(),
  caracteristicas: z.array(z.string()).optional(),
  areascomuns: z.array(z.string()).optional(),
  existingDescription: z.string().max(2000, "Descrição muito longa").optional(),
});

export type GeneratePropertyDescriptionInput = z.infer<typeof GeneratePropertyDescriptionInputSchema>;

export const GeneratePropertyDescriptionOutputSchema = z.object({
  description: z.string(),
});

export type GeneratePropertyDescriptionOutput = z.infer<typeof GeneratePropertyDescriptionOutputSchema>;
