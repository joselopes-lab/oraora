'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatArea } from '@/lib/utils';
import { generateSemanticSlug } from '@/lib/slug';
import { Badge } from '@/components/ui/badge';

export function StudioPropertyCard({ property }: { property: any }) {
  const info = property.informacoesbasicas || {};
  const loc = property.localizacao || {};
  const car = property.caracteristicasimovel || {};
  const img = property.midia?.[0] || property.media?.[0] || 'https://picsum.photos/seed/studio-prop/600/400';
  const valor = info.salePrice || info.valor || info.rentPrice || 0;
  const priceFormatted = valor > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor) : 'Sob Consulta';

  return (
    <Link href={`/imoveis/${generateSemanticSlug(property)}`} className="group flex flex-col bg-card rounded-3xl overflow-hidden border border-border/40 shadow-sm hover:shadow-2xl transition-all duration-500">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-sm">
            {info.status || 'Exclusivo'}
          </Badge>
        </div>
        <Image src={img} alt={info.nome || 'Imóvel'} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">
          {loc.bairro ? `${loc.bairro}, ${loc.cidade || ''}` : (loc.cidade || 'Localização Privilegiada')}
        </span>
        <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-1">
          {info.nome}
        </h3>
        <p className="text-sm font-black text-foreground mb-6">
          {priceFormatted}
        </p>
        <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-bold">
          <div className="flex items-center gap-4">
            {car.quartos && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-primary">bed</span> {Array.isArray(car.quartos) ? car.quartos.join(', ') : car.quartos} qtos</span>}
            {car.tamanho && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-primary">square_foot</span> {formatArea(String(car.tamanho))}</span>}
          </div>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform text-primary">arrow_forward</span>
        </div>
      </div>
    </Link>
  );
}
