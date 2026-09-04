import { adminDb } from '@/firebase/index.server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da construtora não fornecido.' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('constructors').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Construtora não encontrada.' },
        { status: 404 }
      );
    }

    const data = docSnap.data();

    // Verifica se está visível no site (se a flag existir e for explicitamente false)
    if (data?.isVisibleOnSite === false) {
      return NextResponse.json(
        { error: 'Construtora não publicada.' },
        { status: 404 }
      );
    }

    // Projeta e retorna estritamente os campos públicos autorizados
    const publicData = {
      id: docSnap.id,
      name: data?.name || '',
      logoUrl: data?.logoUrl || '',
      icon: data?.icon || '',
      city: data?.city || '',
      state: data?.state || '',
      phone: data?.phone || '',
      publicEmail: data?.publicEmail || '',
      websiteUrl: data?.websiteUrl || '',
      isVisibleOnSite: data?.isVisibleOnSite !== false,
    };

    return NextResponse.json(publicData, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar dados públicos da construtora:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição.' },
      { status: 500 }
    );
  }
}
