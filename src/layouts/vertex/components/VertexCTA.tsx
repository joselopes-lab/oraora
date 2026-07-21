
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface VertexCTAProps {
  title?: string;
  subtitle?: string;
}

export function VertexCTA({ 
  title = "Pronto para encontrar seu próximo lar?", 
  subtitle = "Agende uma consultoria personalizada agora mesmo via WhatsApp e descubra oportunidades exclusivas off-market." 
}: VertexCTAProps) {
  return (
    <div className="relative rounded-[3rem] p-12 md:p-24 bg-slate-950 overflow-hidden text-center shadow-2xl border border-white/5">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] -ml-20 -mb-20"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto space-y-10">
        <div className="space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none"
          >
            {title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium"
          >
            {subtitle}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button size="lg" className="h-16 px-12 rounded-2xl bg-primary text-slate-950 font-black uppercase text-xs tracking-[0.2em] shadow-glow hover:scale-[1.05] transition-all border-none">
            <MessageCircle className="size-5 mr-3 fill-current" />
            Iniciar Conversa
          </Button>
        </motion.div>
        
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Disponibilidade imediata para atendimento premium</p>
      </div>
    </div>
  );
}
