'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Inversao() {
  return (
    <section className="py-28 md:py-36 bg-white text-zinc-900 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6 mb-20"
        >
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">
            A Inversão do Olhar
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-zinc-400">
            Estamos acostumados a ver o imóvel.
          </h2>
          <p className="text-xl md:text-2xl font-light text-zinc-500 pt-4">
            Grandes empreendimentos. Grandes lançamentos. Grandes campanhas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="p-12 md:p-20 rounded-3xl bg-zinc-900 text-white shadow-2xl space-y-8"
        >
          <p className="text-xl md:text-2xl font-light text-zinc-300">
            Mas quase sempre existe alguém por trás daquela venda.
          </p>
          
          <div className="text-4xl md:text-6xl lg:text-7xl font-normal text-[#2bf20d] tracking-tight">
            O corretor.
          </div>

          <div className="pt-8 border-t border-zinc-800">
            <p className="text-2xl md:text-3xl font-light text-white">
              Dessa vez, <br />
              <span className="font-normal">o protagonista é ele.</span>
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
