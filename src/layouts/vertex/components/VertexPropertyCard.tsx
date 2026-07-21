
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Maximize, Bed, ArrowUpRight } from 'lucide-react';
import { PropertySDK } from '../../sdk.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VertexPropertyCardProps {
  property: PropertySDK;
  href?: string;
}

export function VertexPropertyCard({ property, href = "#" }: VertexPropertyCardProps) {
  const price = property.informacoesbasicas.valor || property.informacoesbasicas.salePrice || 0;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col text-left"
    >
      {/* Media Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image 
          src={property.midia?.[0] || 'https://picsum.photos/seed/prop/600/450'} 
          alt={property.informacoesbasicas.nome} 
          fill 
          className="object-cover transition-transform duration-1000 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Badges */}
        <div className="absolute top-6 left-6 flex gap-2">
          <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-lg">
            {property.informacoesbasicas.status}
          </Badge>
        </div>

        {/* Hover Arrow */}
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
          <div className="size-10 rounded-full bg-primary text-slate-900 flex items-center justify-center shadow-xl">
            <ArrowUpRight className="size-5 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-8 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-none mb-2">
            {property.informacoesbasicas.nome}
          </h3>
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <MapPin className="size-3 text-primary" />
            {property.localizacao.bairro}, {property.localizacao.cidade}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50 dark:border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
              <Maximize className="size-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Área</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{property.caracteristicasimovel.tamanho}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
              <Bed className="size-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dorms</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{property.caracteristicasimovel.quartos}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Investimento</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {price > 0 ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'Consulte'}
            </p>
          </div>
          <Link href={href} className="text-[10px] font-black uppercase text-primary-hover tracking-[0.2em] border-b-2 border-transparent hover:border-primary transition-all pb-1">
            Ver Detalhes
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
