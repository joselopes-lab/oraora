import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/secrets';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da transação não fornecido' }, { status: 400 });
    }

    const token = process.env.ABACATE_PAY_TOKEN || await getSecret('ABACATE_PAY_TOKEN');

    if (!token) {
      return NextResponse.json({
        success: true,
        data: {
          id,
          status: 'PENDING',
          isFallback: true
        }
      });
    }

    const response = await fetch(`https://api.abacatepay.com/v2/transparents/check?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[AbacatePay Check] Status ${response.status}: ${errorText}`);
      return NextResponse.json({
        success: true,
        data: {
          id,
          status: 'PENDING'
        }
      });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[AbacatePay Check] Erro ao verificar PIX:', err?.message || err);
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao consultar status'
    }, { status: 500 });
  }
}
