'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Manifesto() {
  return (
    <section className="py-28 md:py-36 bg-zinc-50 text-zinc-900 border-t border-zinc-100">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
        
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs uppercase tracking-widest text-[#1db308] font-semibold mb-6 block"
        >
          Manifesto da Campanha
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-zinc-900 mb-16 leading-tight"
        >
          &ldquo;O mercado imobiliário não é feito apenas de imóveis.&rdquo;
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6 text-xl md:text-2xl font-light text-zinc-600 max-w-2xl mx-auto leading-relaxed"
        >
          <p className="text-zinc-900 font-normal">É feito de pessoas.</p>
          <p>Pessoas que atendem.<br />
          Que procuram.<br />
          Que apresentam.<br />
          Que negociam.<br />
          Que acompanham.<br />
          Que constroem relações.</p>
          <p className="text-zinc-900 font-normal pt-4">São elas que fazem o mercado acontecer.</p>
        </motion.div>

      </div>
    </section>
  );
}
