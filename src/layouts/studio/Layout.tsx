'use client';

import React from 'react';
import { LayoutProps } from '../sdk.types';
import * as Studio from './components';
import { useNavigation } from '@/lib/navigation/navigationService';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';

/**
 * @fileOverview Layout.tsx - Studio Homepage Experience
 */

export default function StudioLayout({ 
  broker, 
  properties, 
  content, 
  theme,
  seo 
}: LayoutProps) {
  const nav = useNavigation(broker.slug);
  const brandName = broker.brandName || 'Imóveis';

  const heroContent = {
    tagline: content.heroTagline || "",
    title: content.heroTitle || `Portfólio de <span class='text-primary font-serif italic'>${brandName}</span>`,
    subtitle: content.heroSubtitle || seo?.description || "",
    imageUrl: content.heroImageUrl || ''
  };

  const aboutContent = {
    title: content.aboutTitle || "Sobre",
    text: [
      content.aboutText || "",
      broker.geographicContextText
    ].filter(Boolean).join('\n\n'),
    imageUrl: content.aboutImageUrl || broker.logoUrl || ''
  };

  const dynamicStyles = {
    '--primary': theme.primary || '38 92% 50%',
    '--secondary': theme.secondary || '20 14% 8%',
    '--background': theme.background || '0 0% 100%',
    '--foreground': theme.foreground || '20 14% 12%',
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="studio-theme min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white">
      {/* 1. Header */}
      <Studio.StudioHeader broker={broker} />

      {/* 2. Hero Cinematic */}
      <Studio.StudioHero 
        tagline={heroContent.tagline}
        title={heroContent.title}
        subtitle={heroContent.subtitle}
        imageUrl={heroContent.imageUrl}
        searchUrl={nav.search()}
        whatsappUrl={broker.whatsappUrl}
      />

      {/* 3. Featured Properties Editorial Grid */}
      <section className="py-28 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3 block">Portfólio</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-foreground">Imóveis em Destaque</h2>
          </div>
          <Button asChild variant="outline" className="rounded-full font-black text-xs uppercase tracking-widest h-12 px-8 border-foreground/20 hover:bg-foreground hover:text-background transition-all">
            <Link href={nav.search()}>Ver Todos os Imóveis</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {properties.slice(0, 6).map((property) => (
            <Studio.StudioPropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* 4. About / Broker Studio Section */}
      <section className="py-28 bg-muted/40 border-y border-border/40 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6 relative">
            {aboutContent.imageUrl && (
              <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-2xl">
                <Image src={aboutContent.imageUrl} alt={brandName} fill className="object-cover object-center" referrerPolicy="no-referrer" />
              </div>
            )}
            {broker.creci && (
              <div className="absolute -bottom-8 -right-8 bg-background border border-border/40 p-8 rounded-3xl shadow-xl hidden sm:block max-w-xs">
                <span className="font-serif text-3xl font-bold text-primary block mb-1">CRECI {broker.creci}</span>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Registro Profissional</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-6 flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3 block">Quem Somos</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-foreground mb-8 leading-tight">{aboutContent.title}</h2>
            <div className="space-y-6 text-muted-foreground font-light leading-relaxed text-base sm:text-lg mb-10">
              {aboutContent.text.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            {broker.whatsappUrl && (
              <div>
                <Button asChild className="rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-14 px-10 shadow-xl hover:scale-105 transition-all">
                  <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer">Contato via WhatsApp</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-secondary text-secondary-foreground py-20 px-6 lg:px-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-6">
            <span className="font-serif text-2xl font-bold tracking-tight text-white">{brandName}</span>
            {seo?.slogan && (
              <p className="text-slate-400 text-sm max-w-sm font-light leading-relaxed">
                {seo.slogan}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Navegação</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              <li><Link href={nav.home()} className="hover:text-white transition-colors">Início</Link></li>
              <li><Link href={nav.search()} className="hover:text-white transition-colors">Portfólio</Link></li>
              <li><Link href={nav.about()} className="hover:text-white transition-colors">Sobre</Link></li>
              <li><Link href={nav.contact()} className="hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Contato</h4>
            {broker.creci && <p className="text-xs text-slate-400 mb-2 font-medium">CRECI: {broker.creci}</p>}
            {broker.whatsappUrl && (
              <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline block mt-4">WhatsApp Direto →</a>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</p>
        </div>
      </footer>

      <WhatsAppWidget whatsappUrl={broker.whatsappUrl} brandName={brandName} />
    </div>
  );
}
