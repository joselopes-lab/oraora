'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, ArrowUpRight } from 'lucide-react';
import { CORRETORES_MOCK_CAMPANHA } from '@/data/o-mercado-tem-rosto/corretores';

export default function CampanhaOOH() {
  const destaques = CORRETORES_MOCK_CAMPANHA.filter((c) => c.destaqueOoh).slice(0, 2);

  return (
    <section className="py-28 md:py-36 bg-zinc-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Cabeçalho */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#2bf20d] text-xs font-medium tracking-wide uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#2bf20d]" />
            Mídia OOH & Grande Circulação
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-6">
            Você provavelmente já viu alguns deles.
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
            Agora eles estão onde merecem estar: nos maiores painéis urbanos, avenidas e centros de negócios do país.
          </p>
        </div>

        {/* Mocks OOH Grid */}
        <div className="space-y-16">
          
          {/* Mockup 1: Grande Painel Urbano / LED Digital */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12"
          >
            <div className="w-full lg:w-1/2 space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#2bf20d] font-mono">
                01 — Painel Digital / Eixo Metropolitano
              </span>
              <h3 className="text-3xl md:text-4xl font-light text-white">
                O protagonismo fora das telas.
              </h3>
              <p className="text-zinc-400 font-light leading-relaxed">
                Grandes empena cegas e painéis de LED em avenidas de grande circulação transformam o corretor em uma figura pública reconhecida, valorizando sua reputação e autoridade no mercado.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-zinc-500 font-mono">
                <span>FORMATO: LED OOH 9x3m</span>
                <span>•</span>
                <span>SÃO PAULO / RIO DE JANEIRO</span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center overflow-hidden">
                <img
                  src={destaques[0]?.fotoOohUrl || destaques[0]?.fotoUrl}
                  alt={destaques[0]?.nome}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#2bf20d] font-mono">Campanha OOH</span>
                    <h4 className="text-xl text-white font-light">{destaques[0]?.nome}</h4>
                    <p className="text-xs text-zinc-300 font-light">{destaques[0]?.especialidade}</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#2bf20d] border border-[#2bf20d]/30">
                    oraora
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mockup 2: Mobiliário Urbano / Aeroportos e Centros */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl p-8 md:p-16 flex flex-col lg:flex-row-reverse items-center gap-12"
          >
            <div className="w-full lg:w-1/2 space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#2bf20d] font-mono">
                02 — Mobiliário Urbano / Aeroportos
              </span>
              <h3 className="text-3xl md:text-4xl font-light text-white">
                Onde o mercado acontece.
              </h3>
              <p className="text-zinc-400 font-light leading-relaxed">
                Exposição qualificada em locais de alto fluxo de executivos, investidores e tomadores de decisão, elevando o padrão de percepção da profissão imobiliária.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-zinc-500 font-mono">
                <span>FORMATO: MUB / TOTEM</span>
                <span>•</span>
                <span>CURITIBA / BELO HORIZONTE</span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center overflow-hidden">
                <img
                  src={destaques[1]?.fotoOohUrl || destaques[1]?.fotoUrl}
                  alt={destaques[1]?.nome}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#2bf20d] font-mono">Campanha OOH</span>
                    <h4 className="text-xl text-white font-light">{destaques[1]?.nome}</h4>
                    <p className="text-xs text-zinc-300 font-light">{destaques[1]?.especialidade}</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#2bf20d] border border-[#2bf20d]/30">
                    oraora
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Rodapé da seção */}
        <div className="mt-20 pt-12 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-zinc-400 font-light text-sm">
            Uma iniciativa contínua de valorização e visibilidade profissional promovida pelo OraOra.
          </p>
          <a
            href="#participar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2bf20d] text-zinc-950 font-medium text-xs tracking-wider uppercase hover:bg-[#25d40a] transition-colors"
          >
            Quero fazer parte <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
