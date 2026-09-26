import { NextRequest, NextResponse } from 'next/server';
import { processOraSearch } from '@/lib/ora/search-orchestrator.server';
import { generateOraResponse } from '@/lib/ora/response-generator.server';

export async function POST(req: NextRequest) {
  try {
    const { adminDb } = await import('@/firebase/index.server');
    const siteDoc = await adminDb.collection('brokers').doc('oraora-main-site').get();
    const siteData = siteDoc.data();
    if (siteData?.oraPublicAssistantEnabled === false) {
      return NextResponse.json(
        { error: 'A assistente ORA está temporariamente desativada no portal público.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { message, previousIntent, conversation } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem inválida ou vazia.' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Mensagem muito longa.' },
        { status: 400 }
      );
    }

    const searchResult = await processOraSearch({
      message: message.trim(),
      previousIntent,
      conversation: Array.isArray(conversation) ? conversation.slice(-10) : [],
    });

    const assistantResult = await generateOraResponse({
      intent: searchResult.intent,
      searchReady: searchResult.searchReady,
      missingFields: searchResult.missingFields,
      properties: searchResult.properties,
      totalReturned: searchResult.totalReturned,
      conversation,
      turnType: searchResult.turnType,
      userMessage: message.trim(),
    });

    const sanitizedProperties = searchResult.properties.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      purpose: p.purpose,
      price: p.price,
      city: p.city,
      neighborhood: p.neighborhood,
      state: p.state,
      bedrooms: p.bedrooms,
      suites: p.suites,
      bathrooms: p.bathrooms,
      parkingSpaces: p.parkingSpaces,
      usableArea: p.usableArea,
      features: p.features,
      images: p.images,
      status: p.status,
      publicUrl: p.publicUrl,
    }));

    return NextResponse.json({
      message: assistantResult.text,
      sources: assistantResult.sources,
      intent: searchResult.intent,
      searchReady: searchResult.searchReady,
      missingFields: searchResult.missingFields,
      properties: sanitizedProperties,
      totalReturned: searchResult.totalReturned,
    });
  } catch (err: any) {
    console.error('Error in /api/ora/chat:', err);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar sua busca. Tente novamente.' },
      { status: 500 }
    );
  }
}
