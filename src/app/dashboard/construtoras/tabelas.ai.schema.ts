import { z } from 'genkit';

export const ParsePriceTablePdfInputSchema = z.object({
  tableId: z.string(),
  idToken: z.string(),
});

export const ParsePriceTablePdfOutputSchema = z.object({
  success: z.boolean(),
  columnsFound: z.array(z.string()).describe("Colunas textuais encontradas no documento PDF."),
  mapping: z.object({
    unidade: z.string().describe("Nome da coluna identificada como Unidade ou N/A"),
    area: z.string().describe("Nome da coluna identificada como Área ou N/A"),
    price: z.string().describe("Nome da coluna identificada como Preço/Valor ou N/A"),
    status: z.string().describe("Nome da coluna identificada como Status ou N/A"),
    torre: z.string().optional(),
    bloco: z.string().optional(),
    andar: z.string().optional(),
  }),
  previewRows: z.array(z.object({
    unidade: z.string(),
    area: z.number(),
    price: z.number(),
    status: z.string(),
    torre: z.string().optional(),
    bloco: z.string().optional(),
    andar: z.string().optional(),
  })).describe("Lista prévia estruturada extraída do documento."),
  confidence: z.enum(['Alta', 'Média', 'Baixa']),
  message: z.string().optional(),
});
