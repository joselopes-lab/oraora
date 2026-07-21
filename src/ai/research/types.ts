/**
 * @fileOverview Definições de tipos para o Oraora AI Research Engine.
 */

import { z } from 'genkit';

export const ResearchSourceSchema = z.object({
  name: z.string().describe('Nome da instituição ou portal (ex: IBGE, FipeZAP)'),
  url: z.string().url().describe('URL da fonte original'),
  category: z.enum(['official_gov', 'builder', 'market_authority', 'public_institution', 'other']),
  reliability: z.number().min(0).max(100).describe('Score de confiabilidade da fonte (0-100)'),
});

export const ResearchReportSchema = z.object({
  topic: z.string().describe('Tema da pesquisa (ex: Valorização Bairro Altiplano)'),
  date: z.string().describe('Data da pesquisa'),
  sources: z.array(ResearchSourceSchema),
  summary: z.string().describe('Resumo executivo dos achados'),
  foundData: z.record(z.any()).describe('Dados factuais extraídos e validados'),
  conflictingData: z.array(z.string()).describe('Lista de informações divergentes entre fontes'),
  missingData: z.array(z.string()).describe('Informações necessárias que não foram localizadas'),
  researchScore: z.number().min(1).max(5).describe('Nota da pesquisa (1-5 estrelas)'),
  confidenceScore: z.number().min(0).max(100).describe('Nível de certeza global do relatório (0-100)'),
});

export type ResearchSource = z.infer<typeof ResearchSourceSchema>;
export type ResearchReport = z.infer<typeof ResearchReportSchema>;
