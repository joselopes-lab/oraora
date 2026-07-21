'use client';

import React from 'react';
import Link from 'next/link';
import { BrokerSDK } from '../../sdk.types';
import { Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { useNavigation } from '@/lib/navigation/navigationService';

interface VertexFooterProps {
  broker: BrokerSDK;
}

export function VertexFooter({ broker }: VertexFooterProps) {
  const nav = useNavigation(broker.slug);

  return (
    <footer className="bg-white dark:bg-slate-950 py-20 border-t border-slate-100 dark:border-white/5 text-left">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16">
        <div className="md:col-span-4 space-y-8 text-left">
          <div className="flex items-center gap-3">
             <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
               <span className="material-symbols-outlined text-secondary text-2xl font-bold">vertex</span>
             </div>
             <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{broker.brandName}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-medium">
            Elevando o padrão de consultoria imobiliária através de inteligência de dados e curadoria exclusiva.
          </p>
          <div className="flex gap-4">
            {[
              { icon: <Instagram className="size-4" />, href: broker.instagramUrl },
              { icon: <Linkedin className="size-4" />, href: broker.linkedinUrl },
              { icon: <MessageCircle className="size-4" />, href: broker.whatsappUrl },
            ].map((social, i) => social.href && (
              <a key={i} href={social.href} className="size-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-slate-900 transition-all border border-slate-100 dark:border-white/5 shadow-sm">
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-12 text-left">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Plataforma</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-300">
              <li><Link href={nav.home()} className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link href={nav.search()} className="hover:text-primary transition-colors">Imóveis</Link></li>
              <li><Link href={nav.map()} className="hover:text-primary transition-colors">Mapa</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Empresa</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-300">
              <li><Link href={nav.about()} className="hover:text-primary transition-colors">Sobre Mim</Link></li>
              <li><Link href={nav.services()} className="hover:text-primary transition-colors">Serviços</Link></li>
              <li><Link href={nav.contact()} className="hover:text-primary transition-colors">Contato</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-300">
              <li><Link href={nav.privacy()} className="hover:text-primary transition-colors">Privacidade</Link></li>
              <li><Link href={nav.terms()} className="hover:text-primary transition-colors">Termos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Contato</h4>
            <div className="space-y-2 text-xs font-bold text-slate-500">
              <p>João Pessoa, PB</p>
              <p>{broker.creci || 'CRECI Ativo'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 pt-16 mt-16 border-t border-slate-50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 Vertex Real Estate. All rights reserved.</p>
        <div className="flex items-center gap-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Powered by</span>
          <img src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fb51a21ec-d89e-4b7e-be51-d741841e8903-logo-oraora-b.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2" alt="Oraora" className="h-4 w-auto" />
        </div>
      </div>
    </footer>
  );
}
