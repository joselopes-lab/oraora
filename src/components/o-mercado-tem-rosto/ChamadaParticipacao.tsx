'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function ChamadaParticipacao() {
  return (
    <section id="participar" className="py-28 md:py-36 bg-[#2bf20d] text-zinc-950 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/10 text-zinc-950 text-xs font-semibold tracking-wide uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
          Sua História na Campanha
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-zinc-950 mb-8"
        >
          E se o próximo rosto fosse o seu?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-4 text-xl md:text-2xl font-light text-zinc-900 max-w-2xl mx-auto mb-14"
        >
          <p>Estamos começando com alguns profissionais.</p>
          <p className="font-normal">Mas o mercado imobiliário tem milhares de histórias.</p>
          <p>A sua pode ser uma delas.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <a
            href="#formulario"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-zinc-950 text-white font-medium text-sm tracking-wider uppercase hover:bg-zinc-900 transition-all shadow-xl hover:scale-105"
          >
            Quero fazer parte <ArrowUpRight className="w-5 h-5 text-[#2bf20d]" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
