import { createNotification } from './service.server';

interface LeadNotificationData {
  leadId: string;
  brokerId: string;
  name?: string;
  source?: string;
  propertyName?: string;
}

/**
 * Dispara uma notificação interna para o corretor quando um novo lead é recebido.
 * Utiliza o serviço central de notificações com idempotência.
 */
export async function triggerNewLeadNotification(data: LeadNotificationData): Promise<void> {
  const { leadId, brokerId, name, source, propertyName } = data;

  const originText = source ? ` via ${source}` : '';
  const propertyText = propertyName ? ` para o imóvel "${propertyName}"` : '';
  const leadNameText = name ? ` de ${name}` : '';

  await createNotification({
    userId: brokerId,
    type: 'new_lead',
    title: 'Você recebeu um novo lead',
    message: `Um novo contato${leadNameText} chegou ao seu CRM${originText}${propertyText}.`,
    link: '/dashboard/leads',
    eventId: `new_lead_${leadId}`,
    sourceId: leadId,
    sourceType: 'lead',
  });
}
