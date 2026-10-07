import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/secrets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = process.env.ABACATE_PAY_TOKEN || await getSecret('ABACATE_PAY_TOKEN');

    if (!token) {
      return NextResponse.json({ success: false, error: 'ABACATE_PAY_TOKEN não configurado.' }, { status: 400 });
    }

    const response = await fetch('https://api.abacatepay.com/v2/transparents/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[AbacatePay List] Status ${response.status}: ${errorText}`);
      return NextResponse.json({ success: false, error: `Erro na API AbacatePay: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    const rawCharges = Array.isArray(result?.data) ? result.data : (result?.data?.data || result?.data?.charges || result || []);

    // Função para buscar informações detalhadas do cliente e mapear name, email, taxId e cellphone de forma robusta
    const enrichedCharges = await Promise.all(
      rawCharges.map(async (charge: any) => {
        let cust = charge.customer || charge.customerData || charge.client || {};
        const customerId = charge.customerId || charge.client?.id;

        if (customerId && (!cust.name || !cust.taxId || !cust.cellphone)) {
          try {
            const custRes = await fetch(`https://api.abacatepay.com/v2/customers/check?id=${encodeURIComponent(customerId)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            if (custRes.ok) {
              const custJson = await custRes.json();
              const fetchedCust = custJson?.data || custJson;
              if (fetchedCust) {
                cust = { ...cust, ...fetchedCust };
              }
            }
          } catch (e) {
            // Ignora falhas pontuais de busca de cliente individual
          }
        }

        const rawName = cust.name || cust.fullName || charge.name || charge.customerName || charge.metadata?.customerName || charge.metadata?.userName || charge.client?.name || '';
        const rawEmail = cust.email || charge.email || charge.customerEmail || charge.metadata?.email || '';

        let derivedName = rawName;
        if (!derivedName && rawEmail && rawEmail !== '—') {
          const parts = rawEmail.split('@')[0].split('.');
          derivedName = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }

        const detailedCustomer = {
          name: derivedName || (rawEmail !== '—' ? rawEmail.split('@')[0] : 'Cliente Registrado'),
          email: rawEmail || '—',
          taxId: cust.taxId || cust.cpf || cust.cnpj || charge.taxId || charge.metadata?.taxId || '—',
          cellphone: cust.cellphone || cust.phone || cust.whatsapp || charge.cellphone || charge.metadata?.cellphone || '—'
        };

        return {
          ...charge,
          customer: detailedCustomer
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedCharges
    });
  } catch (error: any) {
    console.error('[AbacatePay List API] Erro:', error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno' }, { status: 500 });
  }
}
