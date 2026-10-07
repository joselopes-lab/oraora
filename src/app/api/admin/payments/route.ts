import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/index.server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('payments').orderBy('createdAt', 'desc').get();

    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      const statusMap: Record<string, string> = {
        pending: 'Pendente',
        paid: 'Pago',
        refunded: 'Reembolsado',
        disputed: 'Em disputa',
        lost: 'Perdido'
      };

      const createdAtDate = data.createdAt ? new Date(data.createdAt) : new Date();
      const dateStr = createdAtDate.toLocaleDateString('pt-BR');
      const timeStr = createdAtDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return {
        id: doc.id,
        clientName: data.clientName || data.userName || data.userEmail?.split('@')[0] || 'Cliente OraOra',
        clientEmail: data.userEmail || '—',
        planName: data.planNameSnapshot || 'Plano OraOra',
        amount: Number(data.amount || 0),
        method: 'PIX', // Abacate Pay transparent checkout default in this flow
        date: dateStr,
        dateTime: `${dateStr} às ${timeStr}`,
        status: statusMap[data.status] || 'Pendente',
        provider: data.provider || 'AbacatePay',
        checkoutId: data.providerCheckoutId || data.externalId || doc.id,
        timeline: [
          { time: `${dateStr} ${timeStr}`, event: 'Cobrança gerada via checkout transparente' },
          ...(data.status === 'paid' ? [{ time: data.paidAt ? new Date(data.paidAt).toLocaleString('pt-BR') : `${dateStr} ${timeStr}`, event: 'Pagamento confirmado' }] : [])
        ]
      };
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error('[Admin Payments API] Erro ao listar pagamentos:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar pagamentos do Firestore.' }, { status: 500 });
  }
}
