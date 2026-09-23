import { adminAuth, adminDb } from '@/firebase/index.server';
import { sendTransactionalEmail, EmailResult } from './email.service';
import { generateNewLeadEmailHtml } from './templates/new-lead-email';

export interface NotifyNewLeadParams {
  leadId: string;
  brokerId: string;
  propertyId?: string;
}

/**
 * Serviço responsável por orquestrar a notificação de novo lead por e-mail de forma isolada e não-bloqueante.
 */
export async function notifyNewLead(params: NotifyNewLeadParams): Promise<EmailResult> {
  const { leadId, brokerId, propertyId } = params;

  try {
    if (!leadId || !brokerId) {
      console.warn('[LeadNotifier] Parâmetros insuficientes para notificação:', { leadId: !!leadId, brokerId: !!brokerId });
      return { success: false, status: 'skipped', reason: 'missing_required_params' };
    }

    // 1. Resolver e-mail do corretor/destinatário de forma confiável no servidor
    let recipientEmail: string | null = null;
    
    try {
      const userDoc = await adminDb.collection('users').doc(brokerId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.email && typeof userData.email === 'string') {
          recipientEmail = userData.email;
        }
      }
    } catch (e) {
      console.warn('[LeadNotifier] Erro ao buscar usuário no Firestore, tentando Firebase Auth:', e);
    }

    if (!recipientEmail) {
      try {
        const authUser = await adminAuth.getUser(brokerId);
        if (authUser?.email) {
          recipientEmail = authUser.email;
        }
      } catch (e) {
        console.warn('[LeadNotifier] Erro ao buscar usuário no Firebase Auth:', e);
      }
    }

    if (!recipientEmail) {
      console.warn('[LeadNotifier] E-mail do corretor não encontrado para brokerId:', brokerId);
      return { success: false, status: 'skipped', reason: 'broker_email_not_found' };
    }

    // 2. Buscar dados do lead na collection leads
    let leadData: any = null;
    try {
      const leadDoc = await adminDb.collection('leads').doc(leadId).get();
      if (leadDoc.exists) {
        leadData = leadDoc.data();
      }
    } catch (e) {
      console.error('[LeadNotifier] Erro ao buscar documento do lead:', leadId, e);
    }

    if (!leadData) {
      console.warn('[LeadNotifier] Lead não encontrado:', leadId);
      return { success: false, status: 'skipped', reason: 'lead_not_found' };
    }

    // 3. Resolver imóvel ou empreendimento relacionado, se houver
    let resolvedPropertyName = leadData.propertyName || 'Imóvel de Interesse';
    let publicPropertyUrl: string | undefined = undefined;
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://oraora.com.br';

    const targetPropertyId = propertyId || leadData.propertyId;
    if (targetPropertyId) {
      try {
        // Tenta buscar em brokerProperties
        let propDoc = await adminDb.collection('brokerProperties').doc(targetPropertyId).get();
        let propData: any = null;
        let isProject = false;

        if (propDoc.exists) {
          propData = propDoc.data();
        } else {
          // Tenta buscar em properties
          propDoc = await adminDb.collection('properties').doc(targetPropertyId).get();
          if (propDoc.exists) {
            propData = propDoc.data();
          } else {
            // Tenta buscar em projects (empreendimentos)
            const projDoc = await adminDb.collection('projects').doc(targetPropertyId).get();
            if (projDoc.exists) {
              propData = projDoc.data();
              isProject = true;
            }
          }
        }

        if (propData) {
          if (isProject) {
            resolvedPropertyName = propData.tituloComercial || propData.name || resolvedPropertyName;
            publicPropertyUrl = `${baseUrl}/empreendimento/${targetPropertyId}`;
          } else {
            resolvedPropertyName = propData.informacoesbasicas?.nome || propData.name || resolvedPropertyName;
            publicPropertyUrl = `${baseUrl}/imoveis/${targetPropertyId}`;
          }
        }
      } catch (e) {
        console.warn('[LeadNotifier] Erro ao resolver detalhes do imóvel/empreendimento:', e);
      }
    }

    // 4. Construir URLs internas do CRM
    const crmUrl = `${baseUrl}/dashboard/leads`;

    // 5. Formatar data/hora de recebimento
    let receivedAtFormatted = '';
    try {
      const createdAt = leadData.createdAt;
      let dateObj = new Date();
      if (createdAt?.toDate) {
        dateObj = createdAt.toDate();
      } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
        dateObj = new Date(createdAt);
      }
      receivedAtFormatted = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(dateObj);
    } catch {
      receivedAtFormatted = new Date().toLocaleString('pt-BR');
    }

    // 6. Gerar Template HTML
    const { subject, html } = generateNewLeadEmailHtml({
      leadName: leadData.name || 'Cliente Interessado',
      leadEmail: leadData.email,
      leadPhone: leadData.phone,
      leadMessage: leadData.message,
      source: leadData.source || leadData.origin,
      propertyName: resolvedPropertyName,
      receivedAt: receivedAtFormatted,
      crmUrl,
      publicPropertyUrl,
    });

    // 7. Enviar e-mail com idempotência estável
    const idempotencyKey = `new-lead/${leadId}/${brokerId}`;
    const emailResult = await sendTransactionalEmail({
      to: recipientEmail,
      subject,
      html,
      idempotencyKey,
    });

    console.info('[LeadNotifier] Notificação processada para lead:', { leadId, brokerId, status: emailResult.status });
    return emailResult;

  } catch (error: any) {
    console.error('[LeadNotifier] Erro crítico não tratado no notifyNewLead:', error?.message || error);
    return {
      success: false,
      status: 'failed',
      reason: 'unhandled_exception',
    };
  }
}
