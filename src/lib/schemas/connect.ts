
import { z } from 'zod';

/**
 * @fileOverview Schemas para o módulo OraOra Connect.
 * Define a estrutura de dados para notificações e parcerias.
 */

export const SuggestionStatusSchema = z.enum(['pending', 'accepted', 'rejected']);
export const PartnershipStatusSchema = z.enum(['negotiation', 'closed_won', 'closed_lost']);

export const BrokerPartnershipSchema = z.object({
  originatorBrokerId: z.string().describe('Corretor com o cliente'),
  partnerBrokerId: z.string().describe('Corretor com o imóvel'),
  propertyId: z.string(),
  status: PartnershipStatusSchema.default('negotiation'),
  commissionSplit: z.number().default(50).describe('Porcentagem combinada para o parceiro'),
  notes: z.string().optional(),
  createdAt: z.any().describe('Timestamp do Firestore'),
  updatedAt: z.any().optional(),
});

export const PartnershipNotificationSchema = z.object({
  recipientBrokerId: z.string(),
  senderBrokerId: z.string(),
  type: z.enum(['new_suggestion', 'suggestion_accepted', 'new_match', 'message']),
  title: z.string(),
  content: z.string(),
  relatedId: z.string().optional().describe('ID relacionado (ex: propertyId)'),
  read: z.boolean().default(false),
  createdAt: z.any(),
});

export type BrokerPartnership = z.infer<typeof BrokerPartnershipSchema>;
export type PartnershipNotification = z.infer<typeof PartnershipNotificationSchema>;
