'use server';

import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';

interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  propertyInterest?: string;
  message?: string;
  brokerId: string;
  source?: string;
  origin?: 'whatsapp' | 'form';
  propertyId?: string;
  propertyName?: string;
  pageType?: string;
  pageUrl?: string;
  campaignData?: Record<string, string>;
}

export interface PublicBrokerContact {
  brokerId: string;
  name: string;
  displayName: string;
  logoUrl?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  hasWhatsApp: boolean;
  instagram?: string | null;
  siteUrl?: string | null;
  isVerified?: boolean;
  propertyName?: string;
}

/**
 * Valida e normaliza número brasileiro para o padrão internacional do WhatsApp (55 + DDD + Número).
 * Suporta formatos com ou sem 55, máscaras diversas e links wa.me.
 */
function normalizeBrazilianPhone(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  // Remove caracteres invisíveis/unicode de cópia (LTR, RTL, zero-width)
  const cleaned = raw.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E\u00A0]/g, '').trim();
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return null;

  // Se já inicia com 55 e possui 12 ou 13 dígitos
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Padrão nacional com DDD (10 dígitos para fixo ou 11 para celular)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return null;
}

/**
 * Resolução autoritativa do corretor ou construtora a partir do imóvel ou brokerId no servidor.
 * Consulta tanto a coleção 'brokers' quanto 'users' ou 'constructors' para assegurar dados confiáveis.
 */
export async function resolvePropertyContact(propertyId?: string, brokerIdFallback?: string): Promise<PublicBrokerContact | null> {
  let resolvedBrokerId = brokerIdFallback || '';
  let resolvedBuilderId = '';
  let propertyName = '';

  if (propertyId) {
    let propDoc = await adminDb.collection('properties').doc(propertyId).get();
    if (!propDoc.exists) {
      propDoc = await adminDb.collection('brokerProperties').doc(propertyId).get();
    }
    if (!propDoc.exists) {
      const q1 = await adminDb.collection('properties').where('informacoesbasicas.slug', '==', propertyId).limit(1).get();
      if (!q1.empty) propDoc = q1.docs[0];
    }
    if (!propDoc.exists) {
      const q2 = await adminDb.collection('brokerProperties').where('informacoesbasicas.slug', '==', propertyId).limit(1).get();
      if (!q2.empty) propDoc = q2.docs[0];
    }

    if (propDoc.exists) {
      const propData = propDoc.data();
      propertyName = propData?.informacoesbasicas?.nome || '';
      resolvedBrokerId = propData?.brokerId || propData?.userId || propData?.ownerId || resolvedBrokerId;
      resolvedBuilderId = propData?.builderId || '';
    }
  }

  // 1. Tentar resolver corretor pela coleção 'brokers' e 'users'
  if (resolvedBrokerId) {
    const [bSnap, uSnap] = await Promise.all([
      adminDb.collection('brokers').doc(resolvedBrokerId).get(),
      adminDb.collection('users').doc(resolvedBrokerId).get(),
    ]);

    const bData = bSnap.exists ? bSnap.data() : null;
    const uData = uSnap.exists ? uSnap.data() : null;

    if (bData || uData) {
      // Prioridade das fontes de WhatsApp explícito
      const rawWa =
        bData?.whatsappUrl ||
        bData?.whatsapp ||
        uData?.whatsapp ||
        bData?.footerContactPhone; // No Meu Site, este campo é rotulado "Telefone / WhatsApp"

      const normalizedWa = normalizeBrazilianPhone(rawWa);

      // Telefone profissional
      const professionalPhone =
        bData?.phone ||
        bData?.contactPhone ||
        bData?.footerContactPhone ||
        uData?.phone ||
        uData?.mobilePhone ||
        (normalizedWa ? normalizedWa.replace(/^55/, '') : null);

      const name =
        uData?.username ||
        bData?.displayName ||
        bData?.name ||
        bData?.urbanPadraoSobre?.brokerName ||
        bData?.siteTitle ||
        'Corretor';

      const logoUrl = bData?.logoUrl || bData?.brandUrl || bData?.footerLogoUrl || null;
      const instagram = bData?.instagramUrl || bData?.instagram || uData?.instagram || null;
      const siteUrl = bData?.siteUrl || (bData?.domain ? `https://${bData.domain}` : null) || (bData?.subdomain ? `https://${bData.subdomain}.oraora.com.br` : null);

      return {
        brokerId: resolvedBrokerId,
        name,
        displayName: name,
        logoUrl,
        phone: professionalPhone || null,
        whatsappNumber: normalizedWa,
        hasWhatsApp: Boolean(normalizedWa),
        instagram,
        siteUrl,
        isVerified: Boolean(bData?.isVerified || uData?.isVerified),
        propertyName,
      };
    }
  }

  // 2. Se for imóvel de construtora (builderId)
  const targetConstructorId = resolvedBuilderId || resolvedBrokerId;
  if (targetConstructorId) {
    let cSnap = await adminDb.collection('constructors').doc(targetConstructorId).get();
    if (!cSnap.exists) {
      const q = await adminDb.collection('constructors').where('ownerId', '==', targetConstructorId).limit(1).get();
      if (!q.empty) cSnap = q.docs[0];
    }

    if (cSnap.exists) {
      const cData = cSnap.data();
      const rawWa = cData?.whatsapp || cData?.whatsappUrl;
      const normalizedWa = normalizeBrazilianPhone(rawWa);
      const phone = cData?.phone || cData?.contactPhone || (normalizedWa ? normalizedWa.replace(/^55/, '') : null);
      const name = cData?.name || 'Construtora';

      return {
        brokerId: cSnap.id,
        name,
        displayName: name,
        logoUrl: cData?.logoUrl || cData?.brandUrl || null,
        phone: phone || null,
        whatsappNumber: normalizedWa,
        hasWhatsApp: Boolean(normalizedWa),
        instagram: cData?.instagram || null,
        siteUrl: cData?.siteUrl || null,
        isVerified: Boolean(cData?.isVerified),
        propertyName,
      };
    }
  }

  return null;
}

/**
 * Server Action pública para obter informações seguras de contato do corretor.
 */
export async function getPublicBrokerContact(propertyId?: string, brokerIdFallback?: string): Promise<PublicBrokerContact | null> {
  try {
    return await resolvePropertyContact(propertyId, brokerIdFallback);
  } catch (error) {
    console.error('Erro ao resolver contato público do corretor:', error);
    return null;
  }
}

/**
 * Server Action para criar leads utilizando o Firebase Admin SDK.
 * Evita conflitos com o SDK de cliente e garante permissões de escrita no servidor.
 */
export async function createLead(data: LeadFormData) {
  try {
    const leadsCollection = adminDb.collection('leads');
    
    let finalBrokerId = data.brokerId;
    let finalPropertyId = data.propertyId;
    let finalPropertyName = data.propertyName;

    // Resolução segura do imóvel e do corretor no servidor
    if (data.propertyId) {
      let propDoc = await adminDb.collection('properties').doc(data.propertyId).get();
      if (!propDoc.exists) {
        propDoc = await adminDb.collection('brokerProperties').doc(data.propertyId).get();
      }
      if (!propDoc.exists) {
        const q1 = await adminDb.collection('properties').where('informacoesbasicas.slug', '==', data.propertyId).limit(1).get();
        if (!q1.empty) propDoc = q1.docs[0];
      }
      if (!propDoc.exists) {
        const q2 = await adminDb.collection('brokerProperties').where('informacoesbasicas.slug', '==', data.propertyId).limit(1).get();
        if (!q2.empty) propDoc = q2.docs[0];
      }

      if (propDoc.exists) {
        const propData = propDoc.data();
        finalPropertyId = propDoc.id;
        finalBrokerId = propData?.brokerId || propData?.builderId || propData?.userId || propData?.ownerId || data.brokerId;
        finalPropertyName = propData?.informacoesbasicas?.nome || data.propertyName;
      }
    }

    if (!finalBrokerId) {
      throw new Error('Broker ID is required for lead creation.');
    }

    // Resolver o contato do corretor no servidor para obter número oficial de WhatsApp
    const contact = await resolvePropertyContact(finalPropertyId, finalBrokerId);

    // Cálculo básico de score para o lead
    let score = 20; 
    if (data.source === 'WhatsApp' || data.origin === 'whatsapp' || data.source === 'property_whatsapp') {
      score += 20;
    }
    if (data.message && data.message.length > 80) {
      score += 20;
    }
    if (data.propertyInterest || finalPropertyName) {
      score += 20;
    }
    if (data.name && data.email && data.phone) {
        score += 20;
    }

    let qualification: 'Quente' | 'Morno' | 'Frio' = 'Frio';
    if (score >= 70) {
      qualification = 'Quente';
    } else if (score >= 40) {
      qualification = 'Morno';
    }

    const leadData: any = {
      brokerId: finalBrokerId,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      propertyInterest: data.propertyInterest || finalPropertyName || '',
      message: data.message || '',
      status: 'new',
      source: data.source || 'Site Público',
      origin: data.origin || 'form',
      propertyId: finalPropertyId || '',
      propertyName: finalPropertyName || '',
      pageType: data.pageType || '',
      pageUrl: data.pageUrl || '',
      createdAt: FieldValue.serverTimestamp(),
      leadScore: score,
      leadQualification: qualification,
    };

    if (data.campaignData) {
      leadData.campaignData = data.campaignData;
    }

    const leadRef = await leadsCollection.add(leadData);

    // Notificação Interna para o Corretor (Não bloqueante)
    try {
      const { triggerNewLeadNotification } = await import('@/lib/notifications/lead-events.server');
      await triggerNewLeadNotification({
        leadId: leadRef.id,
        brokerId: finalBrokerId,
        name: leadData.name,
        source: leadData.source,
        propertyName: leadData.propertyName,
      });
    } catch (notifError) {
      console.warn('[CreateLead Action] Falha ao registrar notificação interna:', notifError);
    }

    // Incrementa o contador de leads nas métricas do corretor
    await adminDb.collection('corretorMetrics').doc(finalBrokerId).set({
        totalLeads: FieldValue.increment(1)
    }, { merge: true });

    // Gera o link do WhatsApp se o corretor possuir WhatsApp cadastrado
    let whatsappUrl: string | null = null;
    if (contact?.hasWhatsApp && contact.whatsappNumber) {
      const propertyTitle = finalPropertyName || '';
      const waMsg = propertyTitle
        ? `Olá!\n\nMeu nome é ${data.name}.\n\nTenho interesse em saber mais sobre o imóvel "${propertyTitle}".\n\nPoderia me passar mais informações?`
        : `Olá! Meu nome é ${data.name} e gostaria de mais informações sobre seus imóveis.`;

      whatsappUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
    }

    return {
      success: true,
      whatsappAvailable: Boolean(whatsappUrl),
      whatsappUrl,
      message: whatsappUrl
        ? 'Contato registrado! Redirecionando para o WhatsApp...'
        : 'Seu interesse foi registrado com sucesso! O corretor responsável entrará em contato em breve.',
    };
  } catch (error) {
    console.error('Erro ao criar lead no servidor:', error);
    return {
      success: false,
      whatsappAvailable: false,
      whatsappUrl: null,
      message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
    };
  }
}

/**
 * Incrementa contadores de acessos (hits) via servidor.
 */
export async function incrementMetric(brokerId: string, field: 'siteHits' | 'oralinkHits') {
    if (!brokerId) return;
    try {
        await adminDb.collection('corretorMetrics').doc(brokerId).set({
            [field]: FieldValue.increment(1)
        }, { merge: true });
    } catch (error) {
        console.error(`Erro ao incrementar ${field}:`, error);
    }
}
