import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeCanalProLead } from '@/lib/feeds/canalpro-lead-normalizer';

/**
 * Endpoint de Webhook para recepção de leads do Grupo ZAP/OLX.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const normalizedData = normalizeCanalProLead(payload);

    if (!normalizedData.listingId) {
      return NextResponse.json({ error: 'listingId não fornecido' }, { status: 400 });
    }

    // 1. Identificação do imóvel (Fonte da verdade: Firestore)
    let propertySnap = await adminDb.collection('properties').doc(normalizedData.listingId).get();
    let propertyData = propertySnap.data();

    if (!propertySnap.exists) {
      propertySnap = await adminDb.collection('brokerProperties').doc(normalizedData.listingId).get();
      propertyData = propertySnap.data();
    }

    if (!propertySnap.exists || !propertyData) {
      console.error(`Webhook CanalPro: Imóvel ${normalizedData.listingId} não encontrado.`);
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    // 2. Determinação do Broker (Fonte da verdade: Imóvel)
    const brokerId = propertyData.brokerId;
    if (!brokerId) {
      console.error(`Webhook CanalPro: Imóvel ${normalizedData.listingId} sem brokerId.`);
      return NextResponse.json({ error: 'Integridade do imóvel inválida' }, { status: 500 });
    }

    // 3. Verificação de Idempotência (Preparada para ID oficial)
    if (normalizedData.externalId) {
      const existingLeadSnap = await adminDb
        .collection('leads')
        .where('originLeadId', '==', normalizedData.externalId)
        .limit(1)
        .get();

      if (!existingLeadSnap.empty) {
        return NextResponse.json({ message: 'Lead já processado' }, { status: 200 });
      }
    }

    // 4. Criação do Lead (Formato compatível com o CRM existente)
    const newLead = {
      brokerId: brokerId,
      propertyId: normalizedData.listingId,
      propertyName: propertyData.informacoesbasicas?.nome || propertyData.titulo || 'Imóvel',
      name: normalizedData.name,
      email: normalizedData.email,
      phone: normalizedData.phone,
      message: normalizedData.message,
      status: 'new', // Status que coloca automaticamente no Funil
      source: 'Canal Pro - Grupo ZAP', // Compatível com filtros existentes
      origin: 'portal',
      createdAt: FieldValue.serverTimestamp(),
      originLeadId: normalizedData.externalId,
      leadScore: 0,
      leadQualification: 'Novo'
    };

    await adminDb.collection('leads').add(newLead);

    return NextResponse.json({ message: 'Lead processado com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook CanalPro Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
