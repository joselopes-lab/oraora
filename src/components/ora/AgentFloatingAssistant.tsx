'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AgentChat from './AgentChat';
import { usePathname } from 'next/navigation';

export default function AgentFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-[9999] h-10 md:h-11 px-3.5 md:px-4 rounded-full bg-slate-900 text-white flex items-center gap-2 md:gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group font-medium text-xs md:text-sm"
        title="Pergunte ou peça ajuda para operar o OraOra"
      >
        <Sparkles className="size-4 md:size-5 text-emerald-400 group-hover:rotate-12 transition-transform shrink-0" />
        <span className="whitespace-nowrap">Assistente OraOra</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={cn(
          "fixed z-[10000] bg-white border border-slate-200 shadow-2xl transition-all duration-300 flex flex-col",
          "bottom-[132px] right-4 md:right-6 w-[380px] sm:w-[400px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-170px)] rounded-2xl overflow-hidden",
          "max-md:inset-x-0 max-md:bottom-0 max-md:w-full max-md:h-[85vh] max-md:max-h-[85dvh] max-md:rounded-t-2xl max-md:rounded-b-none"
        )}>
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
            <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="size-4 text-emerald-400"/> Agente OraOra</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"><X className="size-5" /></button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <AgentChat currentPath={pathname} />
          </div>
        </div>
      )}
    </>
  );
}
