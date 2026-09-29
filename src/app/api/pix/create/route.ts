import { NextRequest, NextResponse } from 'next/server';
import { getSecret } from '@/lib/secrets';
import { getAdminDb, getAdminAuth } from '@/firebase/index.server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Não autorizado. Faça login para continuar.' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';
    const userName = decodedToken.name || '';

    const body = await req.json();
    const planId = body?.planId;

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json({ success: false, error: 'Plano inválido ou não especificado.' }, { status: 400 });
    }

    const db = getAdminDb();
    const planRef = db.collection('plans').doc(planId);
    const planSnap = await planRef.get();

    if (!planSnap.exists) {
      return NextResponse.json({ success: false, error: 'Plano não encontrado.' }, { status: 404 });
    }

    const planData = planSnap.data() as any;
    if (planData.isActive === false) {
      return NextResponse.json({ success: false, error: 'Este plano não está ativo no momento.' }, { status: 400 });
    }

    // Authoritative pricing in cents
    const priceToUse = planData.promoPrice && planData.promoPrice > 0 ? planData.promoPrice : planData.price;
    const amountCents = Math.round(Number(priceToUse) * 100);
    const durationDays = Number(planData.durationDays || 30);
    const planName = planData.name || 'Plano OraOra';

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json({ success: false, error: 'Preço do plano inválido.' }, { status: 400 });
    }

    const abacateToken = process.env.ABACATE_PAY_TOKEN || await getSecret('ABACATE_PAY_TOKEN');

    if (!abacateToken) {
      console.warn('[AbacatePay Pix Create] ABACATE_PAY_TOKEN não configurado. Modo demonstração.');
      const mockCheckoutId = `pix_mock_${Date.now()}`;
      const now = Date.now();

      await db.collection('payments').add({
        provider: 'abacatepay',
        providerCheckoutId: mockCheckoutId,
        externalId: mockCheckoutId,
        userId,
        userEmail,
        planId,
        planNameSnapshot: planName,
        amount: amountCents,
        durationDaysSnapshot: durationDays,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: mockCheckoutId,
          amount: amountCents,
          status: 'PENDING',
          brCode: '00020101021226950014br.gov.bcb.pix.0135www.abacatepay.com.br/qr/v2/mock1234567890',
          brCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
        },
        isFallback: true
      });
    }

    // Step 1: Create customer in AbacatePay
    const custResp = await fetch('https://api.abacatepay.com/v2/customers/create', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${abacateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail, name: userName }),
    });

    const custData = await custResp.json().catch(() => ({}));
    const customerId = custData?.data?.id;

    // Step 2: Create Transparent PIX
    const transparentPayload = {
      method: 'PIX',
      data: {
        amount: amountCents,
        expiresIn: 3600,
        description: `Assinatura ${planName} - OraOra`,
        customerId: customerId || undefined,
        customer: {
          name: userName || 'Cliente OraOra',
          email: userEmail,
        },
      },
    };

    const response = await fetch('https://api.abacatepay.com/v2/transparents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(transparentPayload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success) {
      return NextResponse.json({
        success: false,
        error: data?.error || 'Erro ao gerar cobrança Pix na AbacatePay.'
      }, { status: 400 });
    }

    const providerCheckoutId = data?.data?.id || `pix_${Date.now()}`;
    const now = Date.now();

    // Persist Payment Pending
    await db.collection('payments').add({
      provider: 'abacatepay',
      providerCheckoutId,
      externalId: providerCheckoutId,
      userId,
      userEmail,
      planId,
      planNameSnapshot: planName,
      amount: amountCents,
      durationDaysSnapshot: durationDays,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      data: data.data
    });
  } catch (error: any) {
    console.error('[API Pix Create Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno ao criar pagamento.' }, { status: 500 });
  }
}
