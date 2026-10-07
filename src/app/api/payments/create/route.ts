import { NextRequest, NextResponse } from 'next/server';
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
    const provider = body?.provider || 'credit_card';
    const amount = Number(body?.amount || 0);

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plano não especificado.' }, { status: 400 });
    }

    const db = getAdminDb();
    const planRef = db.collection('plans').doc(planId);
    const planSnap = await planRef.get();
    const planData = planSnap.exists ? (planSnap.data() as any) : {};
    const planName = planData.name || 'Plano OraOra';

    const paymentId = `${provider === 'pix' ? 'pix' : 'cc'}_${Date.now()}`;
    const now = Date.now();

    await db.collection('payments').add({
      provider,
      providerCheckoutId: paymentId,
      externalId: paymentId,
      userId,
      userEmail,
      userName,
      planId,
      planNameSnapshot: planName,
      amount,
      status: provider === 'credit_card' ? 'paid' : 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      data: { id: paymentId, status: provider === 'credit_card' ? 'PAID' : 'PENDING' }
    });
  } catch (error: any) {
    console.error('[API Payments Create Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno ao registrar pagamento.' }, { status: 500 });
  }
}
