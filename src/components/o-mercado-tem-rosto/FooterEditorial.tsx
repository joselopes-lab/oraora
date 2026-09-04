'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function FooterEditorial() {
  return (
    <footer className="py-20 bg-zinc-950 text-white border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pb-16 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fa08e5cdf-9fd3-4be2-85a1-05ff0eaddc58-logo-oraora-p.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2"
                  alt="OraOra"
                  className="h-8 md:h-9 w-auto object-contain brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
            <p className="text-zinc-400 font-light text-sm max-w-sm">
              A infraestrutura inteligente para quem constrói o mercado imobiliário.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 text-xs uppercase tracking-wider font-medium text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">
              Plataforma OraOra
            </Link>
            <Link href="/sobre" className="hover:text-white transition-colors">
              Sobre
            </Link>
            <Link href="/contato" className="hover:text-white transition-colors">
              Contato
            </Link>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl md:text-3xl font-light text-white tracking-tight mb-1">
              O MERCADO TEM ROSTO.
            </h3>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
              E ele merece ser visto.
            </p>
          </div>

          <p className="text-xs text-zinc-500 font-light">
            © {new Date().getFullYear()} OraOra Soluções Digitais. Todos os direitos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
}
