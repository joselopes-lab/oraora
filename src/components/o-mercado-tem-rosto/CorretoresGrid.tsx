'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin, Sparkles, Filter } from 'lucide-react';
import { CorretorCampanha, CORRETORES_MOCK_CAMPANHA } from '@/data/o-mercado-tem-rosto/corretores';
import PerfilCorretorModal from './PerfilCorretorModal';

export default function CorretoresGrid() {
  const [selectedCorretor, setSelectedCorretor] = useState<CorretorCampanha | null>(null);
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todas');

  // Extrair listas únicas para os filtros
  const especialidades = Array.from(new Set(CORRETORES_MOCK_CAMPANHA.map((c) => c.especialidade)));
  const cidades = Array.from(new Set(CORRETORES_MOCK_CAMPANHA.map((c) => c.cidade)));

  // Filtrar corretores
  const corretoresFiltrados = CORRETORES_MOCK_CAMPANHA.filter((c) => {
    const matchEsp = filtroEspecialidade === 'todos' || c.especialidade === filtroEspecialidade;
    const matchCid = filtroCidade === 'todas' || c.cidade === filtroCidade;
    return matchEsp && matchCid;
  });

  return (
    <section id="rostos" className="py-28 md:py-36 bg-white text-zinc-900 border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium tracking-wide uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#2bf20d]" />
              Protagonismo Real
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-zinc-900 max-w-2xl">
              Conheça quem movimenta o mercado.
            </h2>
          </div>
          <p className="text-zinc-600 max-w-md text-base md:text-lg font-light leading-relaxed">
            Profissionais dedicados que transformam negociações em histórias de conquista. Conheça as trajetórias por trás dos números.
          </p>
        </div>

        {/* Filtros Editoriais */}
        <div className="flex flex-wrap items-center gap-3 mb-14 pb-6 border-b border-zinc-100">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Filtrar por:
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEspecialidade('todos')}
              aria-pressed={filtroEspecialidade === 'todos'}
              className={`px-4 py-2 rounded-full text-xs transition-all duration-300 ${
                filtroEspecialidade === 'todos'
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Todas Especialidades
            </button>
            {especialidades.map((esp) => (
              <button
                key={esp}
                onClick={() => setFiltroEspecialidade(esp)}
                aria-pressed={filtroEspecialidade === esp}
                className={`px-4 py-2 rounded-full text-xs transition-all duration-300 ${
                  filtroEspecialidade === esp
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {esp}
              </button>
            ))}
          </div>

          <div className="w-full h-px md:hidden my-2" />

          <div className="flex flex-wrap gap-2 md:ml-auto">
            <button
              onClick={() => setFiltroCidade('todas')}
              aria-pressed={filtroCidade === 'todas'}
              className={`px-4 py-2 rounded-full text-xs transition-all duration-300 ${
                filtroCidade === 'todas'
                  ? 'bg-[#2bf20d]/20 text-zinc-900 font-medium border border-[#2bf20d]/40'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Todas Cidades
            </button>
            {cidades.map((cid) => (
              <button
                key={cid}
                onClick={() => setFiltroCidade(cid)}
                aria-pressed={filtroCidade === cid}
                className={`px-4 py-2 rounded-full text-xs transition-all duration-300 ${
                  filtroCidade === cid
                    ? 'bg-[#2bf20d]/20 text-zinc-900 font-medium border border-[#2bf20d]/40'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cid}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Editorial de Corretores */}
        {corretoresFiltrados.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-500 text-lg font-light">Nenhum profissional encontrado com os filtros selecionados.</p>
            <button
              onClick={() => {
                setFiltroEspecialidade('todos');
                setFiltroCidade('todas');
              }}
              className="mt-4 px-6 py-2.5 bg-zinc-900 text-white text-xs tracking-wider uppercase rounded-full hover:bg-zinc-800 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 lg:gap-16">
            {corretoresFiltrados.map((corretor, index) => (
              <motion.div
                key={corretor.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setSelectedCorretor(corretor)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Imagem Editorial */}
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 rounded-2xl mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">
                  <img
                    src={corretor.fotoUrl}
                    alt={corretor.nome}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                    <span className="inline-flex items-center gap-2 text-white text-sm font-medium tracking-wide">
                      Conhecer perfil <ArrowUpRight className="w-4 h-4 text-[#2bf20d]" />
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-zinc-900 text-xs font-medium tracking-wide shadow-sm">
                      {corretor.cidade} — {corretor.estado}
                    </span>
                  </div>
                </div>

                {/* Informações do Profissional */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-[#1db308] font-semibold">
                      {corretor.especialidade}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {corretor.creci}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-light text-zinc-900 group-hover:text-zinc-600 transition-colors">
                    {corretor.nome}
                  </h3>

                  <p className="text-zinc-600 text-sm italic font-light line-clamp-2 pt-1">
                    &ldquo;{corretor.frase}&rdquo;
                  </p>

                  <div className="pt-3 flex items-center text-xs font-medium text-zinc-900 group-hover:text-[#1db308] transition-colors">
                    <span className="border-b border-zinc-900 group-hover:border-[#2bf20d] pb-0.5 flex items-center gap-1">
                      Conhecer perfil <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Modal de Perfil Detalhado */}
      <PerfilCorretorModal
        corretor={selectedCorretor}
        isOpen={selectedCorretor !== null}
        onClose={() => setSelectedCorretor(null)}
      />
    </section>
  );
}
