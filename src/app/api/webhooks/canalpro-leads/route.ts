import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { notifyNewLead } from '@/services/notifications/lead-notifier.service';

/**
 * Endpoint de Webhook para recepção de leads do Canal Pro / Grupo ZAP.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // 1. Validar Autenticação do Webhook (Priorizando Headers seguros e removendo query string para evitar vazamento em logs)
    const authHeader = request.headers.get('authorization');
    const secretHeader = request.headers.get('x-webhook-secret') || request.headers.get('x-canalpro-secret');
    
    const configuredSecret = process.env.CANALPRO_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

    if (!configuredSecret) {
      console.error('[Webhook CanalPro] Webhook desativado: nenhum secret configurado no servidor.');
      return NextResponse.json({ error: 'Webhook temporarily unavailable' }, { status: 503 });
    }

    let isAuthenticated = false;

    if (secretHeader && secretHeader === configuredSecret) {
      isAuthenticated = true;
    } else if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === configuredSecret) {
          isAuthenticated = true;
        }
      } else if (authHeader.startsWith('Basic ')) {
        try {
          const base64Credentials = authHeader.substring(6);
          const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
          const [username, password] = credentials.split(':');
          if (password === configuredSecret) {
            isAuthenticated = true;
          }
        } catch {
          // Invalid base64
        }
      }
    }

    if (!isAuthenticated) {
      console.warn('[Webhook CanalPro] Falha de autenticação: requisição rejeitada.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    
    // 2. Extração e Mapeamento de Campos
    const originLeadId = payload.originLeadId || payload.id || payload.externalId || null;
    const originListingId = payload.originListingId || payload.listingId || payload.id || null;
    const clientListingId = payload.clientListingId || payload.originListingId || payload.listingId || payload.id || null;
    const name = payload.name || payload.leadName || 'Cliente Canal Pro';
    const email = payload.email || payload.leadEmail || '';
    const ddd = payload.ddd || '';
    const rawPhone = payload.phone || payload.leadPhone || '';
    const message = payload.message || '';
    const temperature = payload.temperature || 'Morno';
    const transactionType = payload.transactionType || 'venda';
    const leadOrigin = payload.leadOrigin || 'Canal Pro';
    const timestamp = payload.timestamp || new Date().toISOString();
    const extraData = payload.extraData || {};

    const isMcmv = leadOrigin === 'MCMV_OLX';

    if (!isMcmv && !clientListingId) {
      console.warn('[Webhook CanalPro] Payload inválido: clientListingId ausente para lead do Grupo OLX.');
      return NextResponse.json({ error: 'clientListingId obrigatório' }, { status: 400 });
    }

    if (isMcmv && !originListingId && !clientListingId) {
      console.warn('[Webhook CanalPro] Payload inválido para MCMV: listingId / originListingId ausente.');
      return NextResponse.json({ error: 'listingId não fornecido' }, { status: 400 });
    }

    // 3. Normalização do Telefone
    let phone = rawPhone;
    if (ddd && rawPhone) {
      const cleanPhone = String(rawPhone).replace(/\D/g, '');
      const cleanDdd = String(ddd).replace(/\D/g, '');
      if (!cleanPhone.startsWith(cleanDdd)) {
        phone = `(${cleanDdd}) ${cleanPhone}`;
      } else {
        phone = cleanPhone;
      }
    }

    // 4. Identificação do Imóvel (Fonte da verdade: brokerProperties para imóveis avulsos)
    let propertySnap: any = null;
    let propertyData: any = null;

    if (!isMcmv) {
      // 1. Tentar buscar diretamente por ID do documento brokerProperties usando clientListingId
      propertySnap = await adminDb.collection('brokerProperties').doc(clientListingId).get();
      if (propertySnap.exists) {
        propertyData = propertySnap.data();
      } else {
        // 2. Fallback de busca por campo clientListingId
        const querySnap = await adminDb.collection('brokerProperties')
          .where('clientListingId', '==', clientListingId)
          .limit(1)
          .get();
        if (!querySnap.empty) {
          propertySnap = querySnap.docs[0];
          propertyData = propertySnap.data();
        }
      }
      // 3. Fallback legado com originListingId se necessário
      if (!propertySnap?.exists && originListingId) {
        const origSnap = await adminDb.collection('brokerProperties').doc(originListingId).get();
        if (origSnap.exists) {
          propertySnap = origSnap;
          propertyData = origSnap.data();
        }
      }
    } else {
      // Comportamento preservado para MCMV_OLX
      const targetId = originListingId || clientListingId;
      if (targetId) {
        propertySnap = await adminDb.collection('brokerProperties').doc(targetId).get();
        if (propertySnap.exists) {
          propertyData = propertySnap.data();
        } else {
          const querySnap = await adminDb.collection('brokerProperties')
            .where('clientListingId', '==', targetId)
            .limit(1)
            .get();
          if (!querySnap.empty) {
            propertySnap = querySnap.docs[0];
            propertyData = querySnap.docs[0].data();
          }
        }
      }
    }

    // Fallback secundário na coleção properties (caso seja imóvel geral)
    if (!propertySnap?.exists && (clientListingId || originListingId)) {
      const generalId = clientListingId || originListingId;
      const propGeneralSnap = await adminDb.collection('properties').doc(generalId).get();
      if (propGeneralSnap.exists) {
        propertySnap = propGeneralSnap;
        propertyData = propGeneralSnap.data();
      }
    }

    if (!propertySnap?.exists || !propertyData) {
      console.error(`[Webhook CanalPro] Imóvel não encontrado para ID externo/interno.`);
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    // 5. Identificação e Validação do Corretor Responsável
    const brokerId = propertyData.brokerId;
    if (!brokerId) {
      console.error(`[Webhook CanalPro] Imóvel sem corretor vinculado.`);
      return NextResponse.json({ error: 'Integridade do imóvel inválida' }, { status: 500 });
    }

    // Validação anti-construtora (imóveis de construtoras não vão para o fluxo avulso do Canal Pro)
    if (propertyData.builderId && propertyData.builderId !== brokerId) {
      console.warn(`[Webhook CanalPro] Tentativa de lead em imóvel de construtora rejeitada.`);
      return NextResponse.json({ error: 'Imóvel não elegível para este canal' }, { status: 400 });
    }

    // 6. Verificação de Idempotência Atômica contra Condições de Corrida
    // Utiliza ID determinístico baseado no brokerId e originLeadId para garantir exclusividade e reenvio seguro
    const leadDocId = originLeadId ? `canalpro_${brokerId}_${String(originLeadId).replace(/[^a-zA-Z0-9_-]/g, '_')}` : null;

    if (leadDocId) {
      const existingDocSnap = await adminDb.collection('leads').doc(leadDocId).get();
      if (existingDocSnap.exists) {
        console.log(`[Webhook CanalPro] Evento duplicado ignorado (idempotência por docId determinístico).`);
        return NextResponse.json({ message: 'Lead já processado anteriormente' }, { status: 200 });
      }
    }

    // 7. Cálculo de Score e Qualificação
    let score = 30;
    if (message.length > 50) score += 20;
    if (email && phone) score += 30;
    if (temperature === 'Quente' || temperature === 'hot') score += 20;

    let qualification: 'Quente' | 'Morno' | 'Frio' = 'Morno';
    if (score >= 70) qualification = 'Quente';
    else if (score < 40) qualification = 'Frio';

    const propertyName = propertyData.informacoesbasicas?.nome || propertyData.titulo || propertyData.name || 'Imóvel Anunciado';
    const propertyId = propertySnap.id;

    // 8. Criação do Lead (Integrado com o Funil de Vendas existente via status: 'new')
    const newLead = {
      brokerId: brokerId,
      propertyId: propertyId,
      propertyName: propertyName,
      name: name,
      email: email,
      phone: phone,
      message: message,
      status: 'new', // Coloca automaticamente na coluna inicial do Funil de Vendas ("Novos Leads")
      dealStatus: 'open',
      source: 'Canal Pro',
      origin: 'portal',
      externalSource: 'Canal Pro',
      externalLeadId: originLeadId || null,
      transactionType: transactionType,
      temperature: temperature,
      leadScore: score,
      leadQualification: qualification,
      originalTimestamp: timestamp,
      receivedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      extraData: extraData,
    };

    let leadRef;
    if (leadDocId) {
      const docRef = adminDb.collection('leads').doc(leadDocId);
      try {
        // Operação atômica create() para prevenir duplicidade em concorrência simultânea
        await docRef.create(newLead);
        leadRef = docRef;
      } catch (err: any) {
        // Se o documento já foi criado por requisição simultânea (código 6 / ALREADY_EXISTS), tratamos como idempotente com sucesso
        if (err.code === 6 || err.message?.includes('already exists') || err.message?.includes('ALREADY_EXISTS')) {
          console.log(`[Webhook CanalPro] Concorrência detectada: lead já criado por requisição paralela.`);
          return NextResponse.json({ message: 'Lead já processado anteriormente' }, { status: 200 });
        }
        throw err;
      }
    } else {
      leadRef = await adminDb.collection('leads').add(newLead);
    }

    console.log(`[Webhook CanalPro] Lead criado com sucesso para o corretor.`);

    // 9. Incremento de métricas do corretor
    try {
      await adminDb.collection('corretorMetrics').doc(brokerId).set({
        totalLeads: FieldValue.increment(1)
      }, { merge: true });
    } catch (metricErr) {
      console.warn('[Webhook CanalPro] Falha ao atualizar métricas:', metricErr);
    }

    // 10. Notificação Interna para o Corretor (Não bloqueante)
    try {
      await adminDb.collection('notifications').add({
        userId: brokerId,
        title: 'Novo Lead do Canal Pro!',
        message: `Você recebeu um novo contato de ${name} para o imóvel "${propertyName}".`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (notifErr) {
      console.warn('[Webhook CanalPro] Falha ao registrar notificação interna:', notifErr);
    }

    // 11. Notificação por E-mail Transacional via Resend (Não bloqueante)
    try {
      await notifyNewLead({
        leadId: leadRef.id,
        brokerId: brokerId,
        propertyId: propertyId,
      });
    } catch (emailErr) {
      console.warn('[Webhook CanalPro] Falha ao disparar notificação por e-mail:', emailErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead recebido e processado com sucesso',
      leadId: leadRef.id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook CanalPro Error]:', error?.message || error);
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 });
  }
}

