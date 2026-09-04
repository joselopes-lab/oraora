import { NextResponse } from 'next/server';
import { generateSiteContent } from '@/ai/flows/generate-site-content-flow';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }
    const result = await generateSiteContent(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na API de geração de conteúdo:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao gerar conteúdo' },
      { status: 500 }
    );
  }
}
