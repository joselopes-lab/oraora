
'use client';
import { DomusHeader } from '../components/DomusHeader';
import { DomusFooter } from '../components/DomusFooter';
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
  // Conteúdo da Homepage (compartilhado)
  homepage?: {
    aboutImageUrl?: string;
    aboutTitle?: string;
    aboutText?: string;
    aboutTagline?: string;
    aboutQuote?: string;
  };
  // Conteúdo do Corretor
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
  // Conteúdo do Portal Principal (Admin)
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

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export default function DomusSobrePage({ broker }: { broker: Broker }) {
  // Prioriza o conteúdo da homepage (para manter paridade com a index), depois o do corretor, portal e defaults
  const homeContent = broker.homepage || {};
  const brokerContent = broker.urbanPadraoSobre || {};
  const adminContent = broker.oraoraSobre || {};
  
  const defaultContent = {
    headerTagline: adminContent.headerTagline || 'Nossa História',
    headerTitle: adminContent.headerTitle || (brokerContent.brokerName ? `Conheça a trajetória de <span class="text-primary italic">${brokerContent.brokerName}</span>` : 'Transformando a forma como você encontra <span class="text-primary italic">seu lugar.</span>'),
    headerSubtitle: adminContent.headerSubtitle || brokerContent.bio || 'Fundada sob o pilar da tecnologia e atendimento personalizado, nascemos para quebrar paradigmas no mercado imobiliário premium. Não entregamos apenas chaves; entregamos o cenário dos seus melhores momentos.',
    // A imagem deve ser a mesma da index (aboutImageUrl da homepage)
    videoImageUrl: homeContent.aboutImageUrl || brokerContent.profileImageUrl || adminContent.videoImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr691TGrolLX_UNGmZey0eomt-NArAur-FCyrPxmhqeT6MTn8ydKzZTkwSHykN9gnmBnhE6UuVr4iBQz9Y3_dyRkQI2bpgSU-q4dSRqJMX4hhbjO_xwFpkFgm6RUq4tCEYOV2SrIho8Te-Z1soy-JI4Fowdl3h1pIenTpcjkV63dE6hvTTSDeg0y1xdoJBaYSqbgwlKtL7DLW6Y99HEO5F75tZ8-46D5-r8e7A35uYNTZkR_7RaKIN-O6IIkxpN170bO3jR9Qc0-k',
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
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="domus-theme font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <style jsx>{`
        .neon-glow {
            text-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
        }
        .hero-gradient {
            background: radial-gradient(circle at top right, rgba(0, 255, 0, 0.05) 0%, transparent 70%);
        }
      `}</style>
      
      <DomusHeader broker={broker} />
      
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
              <div className="absolute -bottom-8 -right-8 z-20 bg-primary p-8 max-w-xs rounded-2xl shadow-xl transform rotate-2">
                <span className="material-symbols-outlined text-black text-4xl mb-2">format_quote</span>
                <p className="text-black font-bold text-lg leading-tight">
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

        <section className="bg-white/50 dark:bg-card-dark py-24 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div className="space-y-2">
                <h3 className="text-5xl md:text-6xl font-bold text-primary neon-glow">{defaultContent.statAnunciados}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{brokerContent.statYearsExperience ? 'Anos de Mercado' : 'Anos de História'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-5xl md:text-6xl font-bold text-primary neon-glow">{defaultContent.statNegocios}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{brokerContent.statManagedDeals ? 'Negócios Geridos' : 'Em Vendas'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-5xl md:text-6xl font-bold text-primary neon-glow">{defaultContent.statCidades}</h3>
                <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{brokerContent.statAssistedFamilies ? 'Famílias Assessoradas' : 'Famílias Felizes'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-5xl md:text-6xl font-bold text-primary neon-glow">{defaultContent.statAvaliacao}</h3>
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
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors text-primary group-hover:text-black">
                <span className="material-symbols-outlined text-3xl">{defaultContent.pilar1Icon}</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">{defaultContent.pilar1Title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{defaultContent.pilar1Description}</p>
            </div>
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors text-primary group-hover:text-black">
                <span className="material-symbols-outlined text-3xl">{defaultContent.pilar2Icon}</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">{defaultContent.pilar2Title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{defaultContent.pilar2Description}</p>
            </div>
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors text-primary group-hover:text-black">
                <span className="material-symbols-outlined text-3xl">{defaultContent.pilar3Icon}</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">{defaultContent.pilar3Title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{defaultContent.pilar3Description}</p>
            </div>
          </div>
        </section>

        <section className="px-6 mb-24">
          <div className="max-w-7xl mx-auto bg-slate-950 rounded-2xl p-12 md:p-24 relative overflow-hidden text-center text-white">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-8">{defaultContent.ctaTitle}</h2>
              <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">{defaultContent.ctaSubtitle}</p>
              <a href={broker.whatsappUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-primary text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">chat</span>
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <DomusFooter broker={broker} />
    </div>
  );
}
