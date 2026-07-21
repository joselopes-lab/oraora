
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronRight } from 'lucide-react';

interface VertexBuilderCardProps {
  name: string;
  logoUrl?: string;
  propertyCount?: number;
}

export function VertexBuilderCard({ name, logoUrl, propertyCount = 0 }: VertexBuilderCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-soft hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
    >
      <div className="flex items-center gap-5">
        <div className="size-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="size-full object-contain p-2" />
          ) : (
            <Building2 className="size-6 text-slate-300" />
          )}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{name}</h4>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{propertyCount} Ativos na rede</p>
        </div>
      </div>
      <div className="size-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-slate-900 transition-all">
        <ChevronRight className="size-4" />
      </div>
    </motion.div>
  );
}
