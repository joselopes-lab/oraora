
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';
import { queryInBatches } from '@/lib/firestoreUtils';

export async function GET() {
  try {
    // 1. Get all visible builders
    const buildersQuery = query(collection(db, 'builders'), where('isVisibleOnSite', '==', true));
    const buildersSnapshot = await getDocs(buildersQuery);
    const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

    if (visibleBuilderIds.length === 0) {
      // No visible builders, so no properties to show
      return NextResponse.json([]);
    }

    // 2. Get all visible properties that belong to visible builders
    const properties = await queryInBatches<Property>(
      'properties',
      'builderId',
      visibleBuilderIds,
      [where('isVisibleOnSite', '==', true)]
    );
    
    // 3. Format the data for the public API
    const publicProperties = properties.map(prop => ({
      id: prop.id,
      nome: prop.informacoesbasicas.nome,
      slug: prop.slug,
      status: prop.informacoesbasicas.status,
      tipo: prop.caracteristicasimovel.tipo,
      cidade: prop.localizacao.cidade,
      estado: prop.localizacao.estado,
      bairro: prop.localizacao.bairro,
      valor: prop.informacoesbasicas.valor,
      quartos: prop.caracteristicasimovel.unidades.quartos,
      vagas: prop.caracteristicasimovel.unidades.vagasgaragem,
      tamanho: prop.caracteristicasimovel.tamanho,
      previsao_entrega: prop.informacoesbasicas.previsaoentrega,
      imagem_destaque: prop.midia && prop.midia.length > 0 ? prop.midia[0] : null,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oraora.com.br'}/imoveis/${prop.slug}`,
      construtora: prop.contato.construtora,
    }));

    return NextResponse.json(publicProperties);

  } catch (error) {
    console.error("Error fetching properties for API:", error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
