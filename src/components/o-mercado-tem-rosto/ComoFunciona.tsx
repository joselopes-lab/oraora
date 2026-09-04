'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const ETAPAS = [
  {
    numero: '01',
    titulo: 'Faz parte do OraOra',
    descricao: 'Profissionais que utilizam a infraestrutura inteligente do OraOra em sua rotina de atendimento e gestão.',
  },
  {
    numero: '02',
    titulo: 'É selecionado para a campanha',
    descricao: 'Os profissionais participantes são selecionados de acordo com os critérios da campanha e relevância de mercado.',
  },
  {
    numero: '03',
    titulo: 'Sua história ganha espaço',
    descricao: 'Retratos editoriais e trajetórias são produzidos e veiculados em grandes canais e mídias urbanas.',
  },
  {
    numero: '04',
    titulo: 'O mercado conhece seu rosto',
    descricao: 'O corretor se torna o centro das atenções, fortalecendo sua marca pessoal e sua autoridade profissional.',
  },
];

export default function ComoFunciona() {
  return (
    <section className="py-28 md:py-36 bg-white text-zinc-900 border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Cabeçalho */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium tracking-wide uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#2bf20d]" />
            Transparência e Critérios
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-zinc-900 mb-6">
            Como um corretor vira um rosto da campanha?
          </h2>
          <p className="text-zinc-600 text-lg md:text-xl font-light leading-relaxed">
            Um processo estruturado para dar visibilidade a quem constrói o mercado todos os dias.
          </p>
        </div>

        {/* Grid de Etapas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {ETAPAS.map((etapa, index) => (
            <motion.div
              key={etapa.numero}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="flex flex-col justify-between p-8 rounded-3xl bg-zinc-50 border border-zinc-100 relative group hover:border-[#2bf20d]/50 transition-colors"
            >
              <div className="space-y-6">
                <span className="text-4xl md:text-5xl font-light text-zinc-300 font-mono group-hover:text-[#2bf20d] transition-colors">
                  {etapa.numero}
                </span>
                <h3 className="text-xl font-medium text-zinc-900 tracking-tight">
                  {etapa.titulo}
                </h3>
                <p className="text-zinc-600 text-sm font-light leading-relaxed">
                  {etapa.descricao}
                </p>
              </div>

              <div className="pt-8 mt-8 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>ETAPA {etapa.numero} DE 04</span>
                <span className="w-2 h-2 rounded-full bg-zinc-300 group-hover:bg-[#2bf20d] transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Aviso de Transparência */}
        <div className="mt-16 p-6 rounded-2xl bg-zinc-50 border border-zinc-100 max-w-3xl text-center mx-auto">
          <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed">
            <strong className="font-medium text-zinc-700">Nota importante:</strong> Os profissionais participantes são selecionados de acordo com os critérios da campanha. O preenchimento do formulário de inscrição não garante participação automática imediata.
          </p>
        </div>

      </div>
    </section>
  );
}
