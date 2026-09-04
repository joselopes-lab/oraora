'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function PorQueFazemos() {
  return (
    <section className="py-28 md:py-36 bg-zinc-50 text-zinc-900 border-t border-zinc-100">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/60 text-zinc-800 text-xs font-medium tracking-wide uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#1db308]" />
          Propósito OraOra
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-zinc-900 mb-12"
        >
          Por que fazemos isso?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-6 text-xl md:text-2xl font-light text-zinc-600 leading-relaxed mb-16"
        >
          <p>
            Porque acreditamos que tecnologia não existe para substituir quem constrói o mercado.
          </p>
          <p className="text-zinc-900 font-normal">
            Existe para dar mais estrutura para essas pessoas crescerem.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="p-10 md:p-14 rounded-3xl bg-white border border-zinc-200/80 shadow-sm"
        >
          <p className="text-2xl md:text-3xl font-light text-zinc-900">
            Quando o corretor cresce, <br />
            <span className="font-medium text-[#1db308]">o mercado cresce junto.</span>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
