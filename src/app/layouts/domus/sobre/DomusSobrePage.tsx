'use client';
/**
 * @fileOverview Página Sobre exclusiva para o template Domus.
 * Corrigido: Adicionadas funções auxiliares e verificações de segurança para evitar erros de cliente.
 */

import { DomusHeader } from '../components/DomusHeader';
import { DomusFooter } from '../components/DomusFooter';
import { WhatsAppWidget } from '@/app/sites/urban-padrao/components/WhatsAppWidget';
import Image from 'next/image';
import React from 'react';

type TeamMember = {
    name: string;
    title: string;
    description: string;
    imageUrl: string;
};

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  slug: string;
  layoutId?: string;
  homepage?: {
    aboutImageUrl?: string;
    aboutTitle?: string;
    aboutText?: string;
    aboutTagline?: string;
    aboutQuote?: string;
    ctaButtonBgColor?: string;
    ctaButtonTextColor?: string;
    ctaButtonText?: string;
    ctaButtonIcon?: string;
    aboutQuoteBgColor?: string;
    aboutQuoteTextColor?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    ctaSectionBgColor?: string;
    ctaSectionTitleColor?: string;
    ctaSectionSubtitleColor?: string;
    ctaSectionButtonBgColor?: string;
    ctaSectionButtonTextColor?: string;
  };
  urbanPadraoSobre?: {
    profileImageUrl?: string;
    brokerName?: string;
    brokerTitle?: string;
    bio?: string;
    statManagedDeals?: string;
    statAssistedFamilies?: string;
    statYearsExperience?: string;
    value1Title?: string;
    value1Description?: string;
    value2Title?: string;
    value2Description?: string;
    value3Title?: string;
    value3Description?: string;
  };
  oraoraSobre?: {
    headerTagline?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    videoImageUrl?: string;
    statAnunciados?: string;
    statNegocios?: string;
    statCidades?: string;
    statAvaliacao?: string;
    pilaresTitle?: string;
    pilaresSubtitle?: string;
    pilar1Icon?: string;
    pilar1Title?: string;
    pilar1Description?: string;
    pilar2Icon?: string;
    pilar2Title?: string;
    pilar2Description?: string;
    pilar3Icon?: string;
    pilar3Title?: string;
    pilar3Description?: string;
    timeTitle?: string;
    timeSubtitle?: string;
    timeMembers?: TeamMember[];
    ctaTitle?: string;
    ctaSubtitle?: string;
  };
  creci?: string;
  footerSlogan?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
};

const getYoutubeId = (url: string | undefined) => {
  if (!url) return null;
  try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
      if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
  } catch (e) {
      return null;
  }
  return null;
};

export default function DomusSobrePage({ broker }: { broker: Broker }) {
  const homeContent = broker.homepage || {};
  const brokerContent = broker.urbanPadraoSobre || {};
  const adminContent = broker.oraoraSobre || {};
  
  const defaultContent = {
    headerTagline: adminContent.headerTagline || 'Nossa História',
    headerTitle: adminContent.headerTitle || (brokerContent.brokerName ? `Conheça a trajetória de <span class="text-primary italic">${brokerContent.brokerName}</span>` : 'Transformando a forma como você encontra <span class="text-primary italic">seu lugar.</span>'),
    headerSubtitle: adminContent.headerSubtitle || brokerContent.bio || 'Fundada sob o pilar da tecnologia e atendimento personalizado, nascemos para quebrar paradigmas no mercado imobiliário premium. Não entregamos apenas chaves; entregamos o cenário dos seus melhores momentos.',
    videoImageUrl: homeContent.aboutImageUrl || brokerContent.profileImageUrl || adminContent.videoImageUrl || 'https://picsum.photos/seed/about/800/600',
    statAnunciados: adminContent.statAnunciados || brokerContent.statYearsExperience || '15+',
    statNegocios: adminContent.statNegocios || brokerContent.statManagedDeals || 'R$ 1Bi',
    statCidades: adminContent.statCidades || brokerContent.statAssistedFamilies || '2.5k',
    statAvaliacao: adminContent.statAvaliacao || '12',
    pilaresTitle: adminContent.pilaresTitle || 'Missão, Visão e Valores',
    pilaresSubtitle: adminContent.pilaresSubtitle || 'Nossos fundamentos guiam cada interação e decisão estratégica no mercado imobiliário de alto padrão.',
    pilar1Icon: adminContent.pilar1Icon || 'rocket_launch',
    pilar1Title: adminContent.pilar1Title || brokerContent.value1Title || 'Missão',
    pilar1Description: adminContent.pilar1Description || brokerContent.value1Description || 'Inovação constante para simplificar o mercado imobiliário, oferecendo uma experiência premium baseada em transparência e resultados.',
    pilar2Icon: adminContent.pilar2Icon || 'visibility',
    pilar2Title: adminContent.pilar2Title || brokerContent.value2Title || 'Visão',
    pilar2Description: adminContent.pilar2Description || brokerContent.value2Description || 'Ser a maior referência em inteligência imobiliária e atendimento de alto padrão no país até 2030.',
    pilar3Icon: adminContent.pilar3Icon || 'favorite',
    pilar3Title: adminContent.pilar3Title || brokerContent.value3Title || 'Valores',
    pilar3Description: adminContent.pilar3Description || brokerContent.value3Description || 'Ética inegociável, obsessão pelo cliente, agilidade tecnológica e compromisso com o luxo sustentável.',
    ctaTitle: adminContent.ctaTitle || 'Pronto para encontrar seu próximo lar?',
    ctaSubtitle: adminContent.ctaSubtitle || 'Agende uma consultoria personalizada agora mesmo via WhatsApp e descubra oportunidades exclusivas.',
  };

  const dynamicStyles = {
    '--background': broker.backgroundColor || '90 20% 97%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '97 78% 56%',
    '--cta-button-bg': homeContent.ctaButtonBgColor ? `hsl(${homeContent.ctaButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-button-text': homeContent.ctaButtonTextColor ? `hsl(${homeContent.ctaButtonTextColor})` : 'hsl(var(--secondary))',
    '--about-quote-bg': homeContent.aboutQuoteBgColor ? `hsl(${homeContent.aboutQuoteBgColor})` : 'hsl(var(--primary))',
    '--about-quote-text': homeContent.aboutQuoteTextColor ? `hsl(${homeContent.aboutQuoteTextColor})` : 'hsl(var(--secondary))',
    '--cta-section-bg': homeContent.ctaSectionBgColor ? `hsl(${homeContent.ctaSectionBgColor})` : 'hsl(var(--secondary))',
    '--cta-section-title': homeContent.ctaSectionTitleColor ? `hsl(${homeContent.ctaSectionTitleColor})` : '#fff',
    '--cta-section-subtitle': homeContent.ctaSectionSubtitleColor ? `hsl(${homeContent.ctaSectionSubtitleColor})` : 'rgba(255,255,255,0.6)',
    '--cta-section-button-bg': homeContent.ctaSectionButtonBgColor ? `hsl(${homeContent.ctaSectionButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-section-button-text': homeContent.ctaSectionButtonTextColor ? `hsl(${homeContent.ctaSectionButtonTextColor})` : 'hsl(var(--secondary))',
  } as React.CSSProperties;

  const whatsappLink = broker.whatsappUrl?.replace('wa.me.com.br', 'wa.me') || '#';

  return (
    <div style={dynamicStyles} className="domus-theme font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <style jsx>{`
        .hero-gradient {
            background: radial-gradient(circle at top right, hsl(var(--secondary) / 0.05) 0%, transparent 70%);
        }
      `}</style>
      
      <DomusHeader broker={broker as any} />
      
      <main className="pt-20">
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none hero-gradient"></div>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center py-20 relative z-10">
            <div className="relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 aspect-[4/5]">
                {defaultContent.videoImageUrl && (
                  <Image
                    alt="História"
                    src={defaultContent.videoImageUrl}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="absolute -bottom-8 -right-8 z-20 p-8 max-w-xs rounded-2xl shadow-xl transform rotate-2" style={{ backgroundColor: 'var(--about-quote-bg)', color: 'var(--about-quote-text)' }}>
                <span className="material-symbols-outlined text-4xl mb-2">format_quote</span>
                <p className="font-bold text-lg leading-tight">
                  {homeContent.aboutQuote || brokerContent.brokerTitle || "Minha missão é transformar a busca pelo seu imóvel em uma jornada de realização e segurança."}
                </p>
              </div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            </div>
            <div>
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-primary/20">
                {defaultContent.headerTagline}
              </span>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8" dangerouslySetInnerHTML={{ __html: defaultContent.headerTitle }} />
              <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400">
                <p>{defaultContent.headerSubtitle}</p>
              </div>
              <div className="mt-10 flex gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Credibilidade</p>
                    <p className="text-xs text-slate-500">{broker.creci || 'Registro Ativo'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/50 dark:bg-slate-900/50 py-24 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div className="space-y-2">
                <h3 className="text-4xl md:text-5xl font-bold text-primary">{defaultContent.statAnunciados}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{brokerContent.statYearsExperience ? 'Anos de Mercado' : 'Anos de História'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl md:text-5xl font-bold text-primary">{defaultContent.statNegocios}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{brokerContent.statManagedDeals ? 'Negócios Geridos' : 'Em Vendas'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl md:text-5xl font-bold text-primary">{defaultContent.statCidades}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{brokerContent.statAssistedFamilies ? 'Famílias Assessoradas' : 'Famílias Felizes'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl md:text-5xl font-bold text-primary">{defaultContent.statAvaliacao}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Prêmios Setoriais</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">{defaultContent.pilaresTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400">{defaultContent.pilaresSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors text-primary group-hover:text-secondary">
                <span className="material-symbols-outlined text-3xl">{defaultContent.pilar1Icon}</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">{defaultContent.pilar1Title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{defaultContent.pilar1Description}</p>
            </div>
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors text-primary group-hover:text-secondary">
                <span className="material-symbols-outlined text-3xl">{defaultContent.pilar2Icon}</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">{defaultContent.pilar2Title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{defaultContent.pilar2Description}</p>
            </div>
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors text-primary group-hover:text-secondary">
                <span className="material-symbols-outlined text-3xl">{defaultContent.pilar3Icon}</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">{defaultContent.pilar3Title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{defaultContent.pilar3Description}</p>
            </div>
          </div>
        </section>

        <section className="px-6 mb-24">
          <div className="max-w-7xl mx-auto rounded-2xl md:rounded-[40px] p-12 md:p-24 relative overflow-hidden text-center text-white border border-slate-800" style={{ backgroundColor: 'var(--cta-section-bg)' }}>
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/cta/1600/900')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-8" style={{ color: 'var(--cta-section-title)' }}>{defaultContent.ctaTitle}</h2>
              <p className="text-lg mb-12 max-w-xl mx-auto" style={{ color: 'var(--cta-section-subtitle)' }}>{defaultContent.ctaSubtitle}</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform uppercase tracking-widest shadow-lg" style={{ backgroundColor: 'var(--cta-section-button-bg)', color: 'var(--cta-section-button-text)' }}>
                <span className="material-symbols-outlined font-bold">chat</span>
                FALAR NO WHATSAPP
              </a>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 blur-[100px] -ml-48 -mb-48"></div>
          </div>
        </section>
      </main>
      <DomusFooter broker={broker as any} />
      <WhatsAppWidget brokerId={broker.id} />
    </div>
  );
}
