
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
}

/**
 * Server Action para criar leads utilizando o Firebase Admin SDK.
 * Evita conflitos com o SDK de cliente e garante permissões de escrita no servidor.
 */
export async function createLead(data: LeadFormData) {
  try {
    // No servidor, usamos diretamente o adminDb da nossa configuração server-side
    const leadsCollection = adminDb.collection('leads');

    // Cálculo básico de score para o lead
    let score = 20; 
    if (data.source === 'WhatsApp') {
      score += 20;
    }
    if (data.message && data.message.length > 80) {
      score += 20;
    }
    if (data.propertyInterest) {
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

    // Sintaxe correta do Firebase Admin SDK para adicionar documentos
    const leadRef = await leadsCollection.add({
      brokerId: data.brokerId,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      propertyInterest: data.propertyInterest || '',
      message: data.message || '',
      status: 'new',
      source: data.source || 'Site Público',
      createdAt: FieldValue.serverTimestamp(),
      leadScore: score,
      leadQualification: qualification,
    });

    // Incrementa o contador de leads nas métricas do corretor
    await adminDb.collection('corretorMetrics').doc(data.brokerId).set({
        totalLeads: FieldValue.increment(1)
    }, { merge: true });

    return {
      success: true,
      message: 'Sua mensagem foi enviada com sucesso!',
    };
  } catch (error) {
    console.error('Erro ao criar lead no servidor:', error);
    return {
      success: false,
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
