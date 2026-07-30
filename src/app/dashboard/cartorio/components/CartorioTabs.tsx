'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CartorioTabsProps {
  activeTab: 'servicos' | 'processos' | 'como-funciona';
  setActiveTab: (tab: 'servicos' | 'processos' | 'como-funciona') => void;
  servicesCount: number;
  processesCount: number;
}

export default function CartorioTabs({
  activeTab,
  setActiveTab,
  servicesCount,
  processesCount,
}: CartorioTabsProps) {
  return (
    <div className="flex border-b border-slate-100 gap-6 shrink-0">
      <button
        type="button"
        onClick={() => setActiveTab('servicos')}
        className={cn(
          "py-4 text-sm font-bold tracking-wide uppercase cursor-pointer border-none bg-transparent transition-all relative",
          activeTab === 'servicos'
            ? "text-slate-900 border-b-2 border-primary font-black"
            : "text-slate-400 hover:text-slate-600"
        )}
      >
        Serviços Disponíveis ({servicesCount})
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('processos')}
        className={cn(
          "py-4 text-sm font-bold tracking-wide uppercase cursor-pointer border-none bg-transparent transition-all relative",
          activeTab === 'processos'
            ? "text-slate-900 border-b-2 border-primary font-black"
            : "text-slate-400 hover:text-slate-600"
        )}
      >
        Processos do Corretor ({processesCount})
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('como-funciona')}
        className={cn(
          "py-4 text-sm font-bold tracking-wide uppercase cursor-pointer border-none bg-transparent transition-all relative",
          activeTab === 'como-funciona'
            ? "text-slate-900 border-b-2 border-primary font-black"
            : "text-slate-400 hover:text-slate-600"
        )}
      >
        Como funciona
      </button>
    </div>
  );
}
