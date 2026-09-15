import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/secrets';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = process.env.ABACATE_PAY_TOKEN || await getSecret('ABACATE_PAY_TOKEN');

    // Extract fields whether wrapped in `data` or direct
    const rawData = body?.data || body || {};
    const amount = Number(rawData.amount || 2990);
    const description = rawData.description || 'Assinatura OraOra';
    const expiresIn = Number(rawData.expiresIn || 3600);
    const customer = rawData.customer || rawData;

    // Strict sanitization
    const sanitizedEmail = (customer?.email || '').trim().toLowerCase();
    const sanitizedTaxId = (customer?.taxId || '').replace(/\D/g, '');
    const sanitizedName = (customer?.name || '').trim();
    const sanitizedCellphone = (customer?.cellphone || '').replace(/\D/g, '');

    // If no token is configured, use demo mode fallback
    if (!token) {
      console.warn('[AbacatePay Transparent] ABACATE_PAY_TOKEN não configurado. Utilizando modo demonstração.');
      return NextResponse.json({
        success: true,
        data: {
          id: `pix_char_mock_${Date.now()}`,
          amount: amount,
          status: 'PENDING',
          brCode: '00020101021226950014br.gov.bcb.pix.0135www.abacatepay.com.br/qr/v2/mock1234567890',
          brCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        },
        error: null,
        isFallback: true
      });
    }

    // Step 1: Mandatory Customer Registration in AbacatePay API v2
    // Conforme docs/abacate-llms.txt:
    // POST /customers/create: Cria (ou retorna existente) um cliente. Campo obrigatório: email.
    // Clientes são únicos por CPF/CNPJ.
    if (!sanitizedEmail) {
      return NextResponse.json({
        success: false,
        error: 'O e-mail do cliente é obrigatório para realizar o cadastro na AbacatePay.',
        data: null
      }, { status: 400 });
    }

    const custPayload: Record<string, any> = {
      email: sanitizedEmail
    };
    if (sanitizedName) custPayload.name = sanitizedName;
    if (sanitizedTaxId) custPayload.taxId = sanitizedTaxId;
    if (sanitizedCellphone) custPayload.cellphone = sanitizedCellphone;

    console.log('[AbacatePay] Realizando cadastro de cliente:', JSON.stringify(custPayload, null, 2));

    const custResp = await fetch('https://api.abacatepay.com/v2/customers/create', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(custPayload),
    });

    const custData = await custResp.json().catch(async () => ({ error: await custResp.text() }));

    if (!custResp.ok || !custData?.success || !custData?.data?.id) {
      const customerError = custData?.error || `Falha (${custResp.status}) ao cadastrar cliente na AbacatePay.`;
      console.error('[AbacatePay] Erro no cadastro do cliente:', customerError);
      return NextResponse.json({
        success: false,
        error: customerError,
        data: null
      }, { status: custResp.status >= 400 && custResp.status < 500 ? custResp.status : 400 });
    }

    const createdCustomerId = custData.data.id;
    console.log('[AbacatePay] Cliente cadastrado/localizado com sucesso:', createdCustomerId);

    // Step 2: Gerar Checkout Transparente (PIX) vinculado exclusivamente ao cliente cadastrado
    // Conforme docs/abacate-llms.txt:
    // POST /transparents/create: Cria um PIX. Campo obrigatório: data.amount (em centavos).
    const transparentPayload = {
      method: 'PIX',
      data: {
        amount,
        expiresIn,
        description,
        customerId: createdCustomerId,
        customer: {
          name: sanitizedName,
          email: sanitizedEmail,
          taxId: sanitizedTaxId,
          cellphone: sanitizedCellphone,
        },
      },
    };

    console.log('[AbacatePay Transparent] Criando PIX Transparente para o cliente:', JSON.stringify(transparentPayload, null, 2));

    const response = await fetch('https://api.abacatepay.com/v2/transparents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(transparentPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(async () => ({ error: await response.text() }));
      console.error(`[AbacatePay Transparent] Erro na API (${response.status}):`, errorData);

      return NextResponse.json({
        success: false,
        error: errorData?.error || `Erro ${response.status} ao gerar cobrança transparente na AbacatePay.`,
        data: null
      }, { status: response.status >= 400 && response.status < 500 ? response.status : 400 });
    }

    const result = await response.json();
    
    // Normalize AbacatePay v2 response format
    const pixObj = result?.data || result;
    const brCode = pixObj?.brCode || pixObj?.pix?.brCode || '';
    let brCodeBase64 = pixObj?.brCodeBase64 || pixObj?.qrCodeBase64 || pixObj?.pix?.brCodeBase64 || pixObj?.qrCode || '';

    if (brCodeBase64 && !brCodeBase64.startsWith('data:')) {
      brCodeBase64 = `data:image/png;base64,${brCodeBase64}`;
    }

    const normalizedData = {
      id: pixObj?.id || pixObj?.pixId || `pix_${Date.now()}`,
      amount: pixObj?.amount || amount,
      status: pixObj?.status || 'PENDING',
      brCode: brCode,
      brCodeBase64: brCodeBase64,
      expiresAt: pixObj?.expiresAt || new Date(Date.now() + expiresIn * 1000).toISOString()
    };

    return NextResponse.json({
      success: true,
      data: normalizedData,
      error: null
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[AbacatePay Transparent] Exceção geral:', error?.message || error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Falha interna ao gerar PIX',
      data: null
    }, { status: 500 });
  }
}
