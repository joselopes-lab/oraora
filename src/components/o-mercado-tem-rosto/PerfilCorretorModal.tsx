'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Award, Globe, Instagram, Quote, ArrowUpRight } from 'lucide-react';
import { CorretorCampanha } from '@/data/o-mercado-tem-rosto/corretores';

interface PerfilCorretorModalProps {
  corretor: CorretorCampanha | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PerfilCorretorModal({ corretor, isOpen, onClose }: PerfilCorretorModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !corretor) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop com blur suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors shadow-sm"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Coluna da Esquerda: Retrato Grande */}
          <div className="w-full md:w-1/2 relative bg-zinc-100 min-h-[320px] md:min-h-[550px]">
            <img
              src={corretor.fotoUrl}
              alt={corretor.nome}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 md:p-10">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#2bf20d] text-zinc-900 text-xs font-semibold tracking-wide mb-3">
                  {corretor.especialidade}
                </span>
                <p className="text-white text-sm font-light flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2bf20d]" />
                  {corretor.cidade} — {corretor.estado}
                </p>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Informações e Biografia */}
          <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                  {corretor.creci}
                </div>
                <h3 className="text-3xl md:text-4xl font-light text-zinc-900 tracking-tight">
                  {corretor.nome}
                </h3>
              </div>

              {/* Frase Pessoal em Destaque */}
              <div className="relative p-6 bg-zinc-50 rounded-2xl border-l-2 border-[#2bf20d]">
                <Quote className="w-6 h-6 text-zinc-300 mb-2" />
                <p className="text-zinc-700 font-light italic text-base leading-relaxed">
                  &ldquo;{corretor.frase}&rdquo;
                </p>
              </div>

              {/* Biografia Editorial */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-zinc-400">
                  Sobre o Profissional
                </h4>
                <p className="text-zinc-600 text-sm md:text-base font-light leading-relaxed">
                  {corretor.biografia}
                </p>
              </div>

              {/* Links e Redes */}
              <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100">
                {corretor.site && (
                  <a
                    href={corretor.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visitar site
                    <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                  </a>
                )}
                {corretor.instagram && (
                  <a
                    href={`https://instagram.com/${corretor.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    {corretor.instagram}
                    <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                  </a>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-8 mt-8 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-400 tracking-wider">
                O MERCADO TEM ROSTO — ORAORA
              </span>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-900 text-white rounded-full text-xs font-medium tracking-wide hover:bg-zinc-800 transition-colors"
              >
                Fechar perfil
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
