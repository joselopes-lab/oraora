'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between bg-white text-zinc-900 pt-32 pb-20 px-6 md:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        
        {/* Marca / Selo discreto */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-4 mb-12"
        >
          <Link href="/" className="flex items-center">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fa08e5cdf-9fd3-4be2-85a1-05ff0eaddc58-logo-oraora-p.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2"
              alt="OraOra"
              className="h-9 md:h-11 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>
          <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-900 text-xs font-medium tracking-wide uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2bf20d]" />
            APRESENTA
          </span>
        </motion.div>

        {/* Título Monumental */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.95] text-zinc-900 mb-8">
            O MERCADO <br />
            <span className="text-zinc-400">TEM ROSTO.</span>
          </h1>
        </motion.div>

        {/* Subtítulo e Texto descritivo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12 items-end border-t border-zinc-100 pt-12"
        >
          <div>
            <p className="text-2xl md:text-3xl font-light text-zinc-800 mb-4">
              E ele está por toda parte.
            </p>
            <p className="text-zinc-600 text-base md:text-lg font-light leading-relaxed max-w-xl">
              Conheça os profissionais que fazem o mercado imobiliário acontecer todos os dias, transformando negociações em histórias reais de conquista.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:justify-end">
            <a
              href="#rostos"
              className="px-8 py-4 rounded-full bg-zinc-900 text-white font-medium text-xs tracking-wider uppercase hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Conheça os rostos
            </a>
            <a
              href="#participar"
              className="px-8 py-4 rounded-full bg-zinc-100 text-zinc-900 font-medium text-xs tracking-wider uppercase hover:bg-zinc-200 transition-colors"
            >
              Quero fazer parte
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
