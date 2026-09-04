'use client';
import { useEffect } from 'react';
import { trackEvent } from '@/lib/tracking';

export function PropertyViewTracker({ property }: { property: any }) {
    useEffect(() => {
        trackEvent('view_item', {
            propertyId: property.id,
            nome: property.informacoesbasicas.nome,
            tipo: property.caracteristicasimovel.tipo,
            cidade: property.localizacao.cidade,
            bairro: property.localizacao.bairro,
            valor: property.informacoesbasicas.valor,
        });
    }, [property]);
    return null;
}
