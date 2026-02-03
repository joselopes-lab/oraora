'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LivingHeader } from './components/LivingHeader';
import { LivingFooter } from './components/LivingFooter';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
  homepage?: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImageUrl?: string;
    statsSold?: string;
    statsExperience?: string;
    statsSatisfaction?: string;
    statsSupport?: string;
    hideStats?: boolean;
    featuredTagline?: string;
    featuredTitle?: string;
    featuredSubtitle?: string;
    aboutTitle?: string;
    aboutText?: string;
    aboutImageUrl?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
  };
  footerSlogan?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
   caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

type LivingLayoutProps = {
  broker: Broker;
  properties: Property[];
};

export default function LivingLayout({ broker, properties }: LivingLayoutProps) {
  const content = broker.homepage || {};
  const featuredProperties = properties.slice(0, 6);
  const styles = `
    :root {
      ${broker.primaryColor ? `--primary: ${broker.primaryColor};` : ''}
      ${broker.secondaryColor ? `--secondary: ${broker.secondaryColor};` : ''}
    }
  `;

  const defaultContent = {
      heroTitle: 'Top Notch Living Space For Life',
      heroSubtitle: 'Discover your dream home among our 1 million+ exclusive listings. We provide the finest luxury real estate services worldwide.',
      heroImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      statsSold: "1.8k+",
      statsExperience: "15+",
      statsSatisfaction: "4.8",
      statsSupport: "12k+",
      featuredTagline: "Featured Properties",
      featuredTitle: "Properties For You",
      featuredSubtitle: "A curated selection of the finest properties from our exclusive portfolio.",
      aboutTitle: "We Are The Best And Professional, Agency You Can Trust",
      aboutText: "With over a decade of experience, we have been committed to providing exceptional service and unparalleled expertise in the luxury real estate market. Our mission is to make your dream of a perfect home a reality.",
      aboutImageUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1992&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ctaTitle: "Become A Real Estate Agent",
      ctaSubtitle: "We are hiring! Join our team and grow your career with us."
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    if (Array.isArray(quartosData)) {
      return quartosData.join(', ');
    }
    return String(quartosData);
  };


  return (
    <div className="font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <style>{styles}</style>
      <LivingHeader broker={broker} />
      
      <main>
        {/* Hero Section */}
        <header className="relative h-screen min-h-[850px] flex items-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image alt="Luxury House" className="w-full h-full object-cover" src={content.heroImageUrl || defaultContent.heroImageUrl} fill />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl text-center mx-auto">
              <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-8">
                  {content.heroTitle || defaultContent.heroTitle}
              </h1>
              <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                  {content.heroSubtitle || defaultContent.heroSubtitle}
              </p>
              {/* Search Form Placeholder */}
              <div className="bg-white/10 backdrop-blur-xl p-3 rounded-full border border-white/20">
                <form className="flex items-center gap-2">
                    <input className="flex-1 bg-transparent border-none text-white placeholder-slate-400 focus:ring-0 px-4" placeholder="Enter keyword..." type="text"/>
                    <button className="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">search</span>
                        Search
                    </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        {!content.hideStats && (
        <section className="bg-slate-50 dark:bg-slate-800 py-16">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <h3 className="text-4xl font-extrabold text-primary">{content.statsSold || defaultContent.statsSold}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Properties Sold</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-4xl font-extrabold text-primary">{content.statsExperience || defaultContent.statsExperience}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Years Of Experience</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-4xl font-extrabold text-primary">{content.statsSatisfaction || defaultContent.statsSatisfaction}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Star Rating</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-4xl font-extrabold text-primary">{content.statsSupport || defaultContent.statsSupport}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Happy Clients</p>
                    </div>
                </div>
            </div>
        </section>
        )}

        {/* Featured Properties */}
        <section className="py-24 bg-white dark:bg-navy-900">
            <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
                <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">{content.featuredTagline || defaultContent.featuredTagline}</span>
                <h2 className="text-4xl font-extrabold mb-4">{content.featuredTitle || defaultContent.featuredTitle}</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{content.featuredSubtitle || defaultContent.featuredSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProperties.map(property => (
                <div className="group" key={property.id}>
                    <div className="relative overflow-hidden rounded-[2rem] mb-8 aspect-[10/11] property-card">
                        <Image alt={property.informacoesbasicas.nome} className="w-full h-full object-cover property-image transition-transform duration-700" width={400} height={440} src={property.midia?.[0] || 'https://picsum.photos/400/440'} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase border border-white/20">{property.informacoesbasicas.status}</span>
                        </div>
                        <div className="absolute top-6 right-6">
                          <button className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-white hover:bg-white hover:text-navy-900 transition-all">
                            <span className="material-symbols-outlined text-xl">favorite</span>
                          </button>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <h4 className="text-white text-xl font-bold mb-1">{property.informacoesbasicas.nome}</h4>
                            <p className="text-slate-300 text-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">location_on</span> {property.localizacao.bairro}, {property.localizacao.cidade}
                            </p>
                        </div>
                        <div className="absolute bottom-6 right-6">
                            <span className="text-primary font-black text-3xl block mb-1">
                                {property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Consulte'}
                            </span>
                        </div>
                    </div>
                </div>
                ))}
            </div>
            </div>
        </section>

        {/* About Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-800">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <Image alt="About Us" className="rounded-3xl shadow-xl w-full h-auto object-cover" width={600} height={700} src={content.aboutImageUrl || defaultContent.aboutImageUrl} />
              </div>
              <div>
                <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">About Us</span>
                <h2 className="text-4xl font-extrabold mb-8 leading-tight">{content.aboutTitle || defaultContent.aboutTitle}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10">{content.aboutText || defaultContent.aboutText}</p>
                <div className="flex gap-4">
                    <button className="bg-primary hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold transition-all">
                        Learn More
                    </button>
                    <button className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-8 py-4 rounded-full font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-all">
                        Contact Us
                    </button>
                </div>
              </div>
            </div>
        </section>
        
        {/* CTA */}
         <section className="py-24 bg-primary text-slate-900">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-extrabold mb-4">{content.ctaTitle || defaultContent.ctaTitle}</h2>
                <p className="max-w-2xl mx-auto mb-8">{content.ctaSubtitle || defaultContent.ctaSubtitle}</p>
                 <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-full font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all">
                    Start Today
                </button>
            </div>
        </section>
      </main>
      <LivingFooter broker={broker} />
    </div>
  );
}
