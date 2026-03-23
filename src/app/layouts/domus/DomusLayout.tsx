'use client';
import Image from 'next/image';
import Link from 'next/link';
import { DomusHeader } from './components/DomusHeader';
import { DomusFooter } from './components/DomusFooter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useState, useEffect, useMemo } from 'react';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


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
  homepage?: {
    heroTagline?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroVideoUrl?: string;
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
    value1Icon?: string;
    value1Title?: string;
    value1Description?: string;
    value2Icon?: string;
    value2Title?: string;
    value2Description?: string;
    value3Icon?: string;
    value3Title?: string;
    value3Description?: string;
    value4Icon?: string;
    value4Title?: string;
    value4Description?: string;
    aboutQuote?: string;
    aboutTagline?: string; 
    cardIconColor?: string;
    cardValueColor?: string;
    cardTitleColor?: string;
    statusTagBgColor?: string;
    statusTagTextColor?: string;
    searchQuery?: string;
    searchButtonBgColor?: string;
    searchButtonTextColor?: string;
    ctaButtonBgColor?: string;
    ctaButtonTextColor?: string;
    ctaButtonText?: string;
    ctaButtonIcon?: string;
    aboutQuoteBgColor?: string;
    aboutQuoteTextColor?: string;
    ctaSectionBgColor?: string;
    ctaSectionTitleColor?: string;
    ctaSectionSubtitleColor?: string;
    ctaSectionButtonBgColor?: string;
    ctaSectionButtonTextColor?: string;
    mapSectionBgColor?: string;
    mapTitleColor?: string;
    mapTextColor?: string;
    mapButtonBgColor?: string;
    mapButtonTextColor?: string;
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
    slug?: string;
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
    tipo: string;
  };
};

type DomusLayoutProps = {
  broker: Broker;
  properties: Property[];
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

export default function DomusLayout({ broker, properties }: DomusLayoutProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("5000000");

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const content = broker.homepage || {};

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filterType !== 'all') params.set('type', filterType);
    if (maxPrice !== '5000000') params.set('maxPrice', maxPrice);
    params.set('finality', 'venda');
    
    router.push(`/sites/${broker.slug}/search?${params.toString()}`);
  };

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    try {
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('/').pop()?.split('?')[0] || '';
        } else if (url.includes('vimeo.com/')) {
            videoId = url.split('/').pop()?.split('?')[0] || '';
        } else {
            return null;
        }
        
        if (videoId) {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            } else if (url.includes('vimeo.com')) {
                return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
            }
        }
    } catch (e) {
        console.error("Invalid URL format for video", e);
    }
    return null;
  };

  const videoEmbedUrl = getEmbedUrl(content.heroVideoUrl);

  const defaultContent = {
    heroTagline: "Curadoria Premium",
    heroTitle: "Encontre o lar dos seus sonhos com <span class=\"text-primary italic\">curadoria</span> exclusiva",
    heroSubtitle: "Imóveis selecionados com tecnologia e atendimento personalizado para uma experiência premium e sem burocracia.",
    heroImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlzbiXYY0BpchRCPRPqvTEk5BWBLgaa5EubTInww9SGxsUFqt1kdnrgrvROu_1uGCm_zf9dbSwIXVo9j14bfmkXYsdWizi8b4n-nxIvOTCFKn_-3cmrodAG0oMOMJS_BkQFTbOgsaTzlk_2ta7QqGoKM0benjx5savhNz0Q9NukbSP9UFGZEOkILVFfG35YLUD52Dw6EDPI5VeqxQyCNnn9-fqZ74F6pWzXw9T9PIfhaRPJyrLfKDt38xm-twOo6v8OrV1r77JMow",
    statsSold: "+30",
    statsExperience: "+5",
    statsSatisfaction: "100%",
    statsSupport: "Suporte",
    hideStats: false,
    featuredTagline: "Nosso Destaque",
    featuredTitle: "Properties For You",
    featuredSubtitle: "A curated selection of the finest properties from our exclusive portfolio.",
    aboutTagline: "Especialista",
    aboutTitle: "Sobre Minha Atuação",
    aboutQuote: "Minha missão é transformar a busca pelo seu imóvel em uma jornada de realização e segurança.",
    aboutText: "Minha missão é transformar a busca pelo seu imóvel em uma jornada de realização e segurança.",
    aboutImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCM_b3EaOEvVt16q_MhVl3nWZWvrUS7neMrE5Ng43tpxzd343XO68CG6RgIGx4ViOgAR-_u5yyiIc5pHYUZgcBhHcBFDMI_qGV2eFRHU4MJMUNFffp9Y6snQaPzhpsakm1bKvROIBJbfWnUL1UdvYOLEd1ie82tJYGh4olJNZ3ZA3XBShcbnk1-kM0xAFTbH2yWdCx5c2FOFwm5cSCvQKtVFOC12jco7HQ7_ppbi5xMhuPQyyT4DZSRmeFzpqZui7MnDIAZu9N4EOU",
    value1Icon: "analytics",
    value1Title: "Avaliação Precisa",
    value1Description: "Uso de Big Data para determinar o valor real de mercado.",
    value2Icon: "360",
    value2Title: "Tour Virtual 360°",
    value2Description: "Visite propriedades sem sair de casa com tecnologia de ponta.",
    value3Icon: "gavel",
    value3Title: "Assessoria Jurídica",
    value3Description: "Segurança documental completa em todas as etapas da venda.",
    value4Icon: "verified_user",
    value4Title: "Negociação Segura",
    value4Description: "Intermediação profissional focada no melhor interesse do cliente.",
    ctaTitle: "Pronto para encontrar seu próximo lar?",
    ctaSubtitle: "Agende uma consultoria personalizada agora mesmo via WhatsApp.",
    mapTitle: "Encontre imóveis perto de você",
    mapSubtitle: "Utilize nosso mapa interativo para explorar as melhores oportunidades nas regiões mais valorizadas.",
  };

  const featuredProperties = properties?.slice(0, 6) || [];

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    const data = Array.isArray(quartosData) ? quartosData : [String(quartosData)];
    if (data.length === 0) return 'N/A';
    if (data.length === 1 && data[0] === '1') return '1 Quarto';
    return `${data.join(', ')} Quartos`;
  };

  const dynamicStyles = {
    '--background': broker.backgroundColor || '90 20% 97%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '97 78% 56%',
    '--card-title': content.cardTitleColor ? `hsl(${content.cardTitleColor})` : 'inherit',
    '--card-value': content.cardValueColor ? `hsl(${content.cardValueColor})` : 'hsl(var(--primary))',
    '--card-icon': content.cardIconColor ? `hsl(${content.cardIconColor})` : 'hsl(var(--primary))',
    '--status-tag-bg': content.statusTagBgColor ? `hsl(${content.statusTagBgColor})` : 'rgba(255,255,255,0.9)',
    '--status-tag-text': content.statusTagTextColor ? `hsl(${content.statusTagTextColor})` : '#000',
    '--search-button-bg': content.searchButtonBgColor ? `hsl(${content.searchButtonBgColor})` : 'hsl(var(--primary))',
    '--search-button-text': content.searchButtonTextColor ? `hsl(${content.searchButtonTextColor})` : 'hsl(var(--secondary))',
    '--cta-button-bg': content.ctaButtonBgColor ? `hsl(${content.ctaButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-button-text': content.ctaButtonTextColor ? `hsl(${content.ctaButtonTextColor})` : 'hsl(var(--secondary))',
    '--about-quote-bg': content.aboutQuoteBgColor ? `hsl(${content.aboutQuoteBgColor})` : 'hsl(var(--primary))',
    '--about-quote-text': content.aboutQuoteTextColor ? `hsl(${content.aboutQuoteTextColor})` : 'hsl(var(--secondary))',
    '--cta-section-bg': content.ctaSectionBgColor ? `hsl(${content.ctaSectionBgColor})` : 'hsl(var(--secondary))',
    '--cta-section-title': content.ctaSectionTitleColor ? `hsl(${content.ctaSectionTitleColor})` : '#fff',
    '--cta-section-subtitle': content.ctaSectionSubtitleColor ? `hsl(${content.ctaSectionSubtitleColor})` : 'rgba(255,255,255,0.6)',
    '--cta-section-button-bg': content.ctaSectionButtonBgColor ? `hsl(${content.ctaSectionButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-section-button-text': content.ctaSectionButtonTextColor ? `hsl(${content.ctaSectionButtonTextColor})` : 'hsl(var(--secondary))',
    '--map-section-bg': content.mapSectionBgColor ? `hsl(${content.mapSectionBgColor})` : 'hsl(var(--secondary))',
    '--map-title-color': content.mapTitleColor ? `hsl(${content.mapTitleColor})` : '#fff',
    '--map-text-color': content.mapTextColor ? `hsl(${content.mapTextColor})` : 'rgba(255,255,255,0.6)',
    '--map-button-bg': content.mapButtonBgColor ? `hsl(${content.mapButtonBgColor})` : 'hsl(var(--primary))',
    '--map-button-text': content.mapButtonTextColor ? `hsl(${content.mapButtonTextColor})` : 'hsl(var(--secondary))',
  } as React.CSSProperties;

  const whatsappLink = broker.whatsappUrl ? 
    (broker.whatsappUrl.includes('wa.me/') && !broker.whatsappUrl.includes('wa.me/55') ? 
      broker.whatsappUrl.replace('wa.me/', 'wa.me/55') : 
      broker.whatsappUrl.replace('wa.me.com.br', 'wa.me')) 
    : '#';

  return (
    <div style={dynamicStyles} className="domus-theme font-display bg-background-light dark:bg-background-dark text-[#161811] dark:text-white transition-colors duration-300 min-h-screen">
      <style jsx global>{`
        .price-slider {
            accent-color: hsl(var(--primary));
        }
        .price-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: hsl(var(--primary)) !important;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .price-slider::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: hsl(var(--primary)) !important;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
      `}</style>
      <DomusHeader broker={broker} />
      <main>
        <section className="max-w-[1280px] mx-auto px-6 pt-12 md:pt-20 pb-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center mb-16 lg:mb-24">
            <div className="flex flex-col gap-8 flex-1 text-left">
              <div className="flex flex-col gap-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-background-dark dark:text-primary rounded-full text-xs font-bold uppercase tracking-wider w-fit">
                  <span className="material-symbols-outlined text-sm">verified</span> {content.heroTagline || defaultContent.heroTagline}
                </span>
                <h1 className="text-[#161811] dark:text-white text-5xl md:text-7xl font-bold leading-[1.1] tracking-[-0.04em]" dangerouslySetInnerHTML={{ __html: content.heroTitle || defaultContent.heroTitle }} />
                <p className="text-[#161811]/70 dark:text-white/60 text-lg md:text-xl font-normal max-w-[540px]">
                  {content.heroSubtitle || defaultContent.heroSubtitle}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {videoEmbedUrl && isMounted && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="flex min-w-[200px] items-center justify-center gap-2 rounded-xl h-14 px-8 bg-primary text-secondary text-base font-bold shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all">
                        <span className="material-symbols-outlined">play_circle</span>
                        Assistir Apresentação
                      </button>
                    </DialogTrigger>
                    <DialogContent className="p-0 bg-black border-0 max-w-4xl">
                      <DialogHeader>
                        <VisuallyHidden>
                            <DialogTitle>Vídeo de Apresentação</DialogTitle>
                            <DialogDescription>
                                Vídeo de apresentação do corretor ou do imóvel.
                            </DialogDescription>
                        </VisuallyHidden>
                      </DialogHeader>
                      <div className="aspect-video">
                        <iframe
                          src={videoEmbedUrl}
                          title="Vídeo de Apresentação"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-lg"
                        ></iframe>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Link href={`/sites/${broker.slug}/search`} className="flex min-w-[200px] items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-white/5 border border-[#e3e5dc] dark:border-white/10 text-[#161811] dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                    Ver Catálogo
                </Link>
              </div>
            </div>
            <div className="w-full flex-1">
              <div className="relative group">
                <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundImage: `url('${content.heroImageUrl || defaultContent.heroImageUrl}')` }}>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl hidden lg:block border border-[#e3e5dc] dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      <div className="size-10 rounded-full border-2 border-white dark:border-slate-900 bg-gray-200" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCzoEhFf4NB0oQ8rruRMT_PzBdJ8cEqBbpwQXGHEQ0akQ_8Y31TZwVutNyK7ZEkNpQgPux4uz8EEXYBXgPCN822oBIb0K9gMOvyU8g4py6kG_k3DL26MqyUkrOjpRMkSJkn9pPawJIrJR5W3whBfJF5Sd-2VmuyvSdEu1aScgAVLFdsYfIL88b35CLZarVtP-kTsV_eht6QvzW-uX78x-Km7TCTL-l6HEW8_8dnGOl6I82Xtx87Q86bc-BbHcKtlz0y8epWDuNJSQs")`, backgroundSize: 'cover' }}></div>
                      <div className="size-10 rounded-full border-2 border-white dark:border-slate-900 bg-gray-200" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBSzz044pk2lxCYLrbZ8zjv1JH2sIvLqg0frCGeltHUztOjzFhlFooV9zyuh9xCoU3bEUbt_CVnVp0ie4BWpAPqXXA14V6UgLZpXbP7562jWkeRCMO5qqDs4g5XB5aovWl86Nw16vKB7ofDhQT5NAyXoVccwVoPpTYm7NwoJMtvSe60qeMluk0qO9wb9rKv3px_Bv4Ew2WeO-d4KEJRWi8nzsruUGeXLn4J6Jur95zaOvXLEukiZu64MRIVDjH6wUn8MdO9T5wJtsc")`, backgroundSize: 'cover' }}></div>
                      <div className="size-10 rounded-full border-2 border-white dark:border-slate-900 bg-primary flex items-center justify-center text-xs font-bold text-background-dark">
                        +50
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">Clientes felizes este mês</p>
                      <p className="text-xs text-[#161811]/60 dark:text-white/60">Novas conquistas diárias</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl relative z-20 mt-[30px] w-full">
            <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-6 items-end">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 w-full">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Tipo de Imóvel</label>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full h-11 bg-gray-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl py-2 px-4 text-xs font-bold focus:ring-primary focus:border-primary text-slate-900 dark:text-white appearance-none"
                        >
                            <option value="all">Todos os tipos</option>
                            <option value="Apartamento">Apartamentos</option>
                            <option value="Casa">Casas de Luxo</option>
                            <option value="Cobertura">Coberturas</option>
                            <option value="Terreno">Terrenos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Cidade ou Bairro</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">place</span>
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-gray-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:ring-primary focus:border-primary text-slate-900 dark:text-white transition-all outline-none" 
                                placeholder="João Pessoa, Manaíra..." 
                                type="text"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-3 ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Máximo</label>
                            <span className="text-[10px] font-black text-primary uppercase">{parseInt(maxPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="py-2 px-1">
                            <input 
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary price-slider" 
                                max="5000000" 
                                min="0" 
                                step="50000" 
                                type="range"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                <button type="submit" style={{ backgroundColor: 'var(--search-button-bg)', color: 'var(--search-button-text)' }} className="w-full lg:w-auto min-w-[200px] font-black h-14 rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.05] transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-[0.1em] group">
                    <span className="material-symbols-outlined transition-transform group-hover:rotate-12">search</span>
                    Buscar Imóveis
                </button>
            </form>
          </div>
        </section>

        {!content.hideStats && (
        <section className="bg-white dark:bg-background-dark py-16 border-y border-[#f3f4f0] dark:border-white/5">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-gray-100 dark:divide-white/10">
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        <div className="text-2xl md:text-3xl font-bold text-[#161811] dark:text-white leading-tight">
                            {content.statsSold || defaultContent.statsSold} Imóveis
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        <div className="text-2xl md:text-3xl font-bold text-[#161811] dark:text-white leading-tight">
                            {content.statsExperience || defaultContent.statsExperience} Anos
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        <div className="text-2xl md:text-3xl font-bold text-[#161811] dark:text-white leading-tight">
                            {content.statsSatisfaction || defaultContent.statsSatisfaction} Satisfação
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        <div className="text-2xl md:text-3xl font-bold text-[#161811] dark:text-white leading-tight">
                            Suporte Premium
                        </div>
                    </div>
                </div>
            </div>
        </section>
        )}
<section className="max-w-[1280px] mx-auto px-6 py-20">
<div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
<div className="flex flex-col gap-3">
    <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2">{content.featuredTagline || defaultContent.featuredTagline}</span>
<h2 className="text-[#161811] dark:text-white text-4xl font-bold leading-tight tracking-tight">{content.featuredTitle || defaultContent.featuredTitle}</h2>
<p className="text-[#161811]/60 dark:text-white/60 text-lg">{content.featuredSubtitle || defaultContent.featuredSubtitle}</p>
</div>
<Link href={`/sites/${broker.slug}/search`} className="flex items-center gap-2 text-background-dark dark:text-primary font-bold hover:underline group">
                Ver todos os imóveis <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</Link>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
              <Link key={property.id} href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} className="flex flex-col gap-4 group cursor-pointer">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-center bg-no-repeat bg-cover group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: 'url(' + (property.midia?.[0] || 'https://picsum.photos/400/300') + ')' }}></div>
                  <div className="absolute top-4 left-4" style={{ backgroundColor: 'var(--status-tag-bg)', color: 'var(--status-tag-text)' }}>
                    <span className="backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest">{property.informacoesbasicas.status}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-[#161811] dark:text-white text-xl font-semibold leading-normal uppercase" style={{ color: 'var(--card-title)' }}>{property.informacoesbasicas.nome}</h4>
                  <div className="flex items-center gap-1 text-primary">
<span className="material-symbols-outlined text-sm">location_on</span>
<span className="text-sm font-semibold uppercase tracking-wide">{property.localizacao.bairro}, {property.localizacao.cidade}</span>
</div>
<div className="flex gap-4 py-2 border-y border-[#f3f4f0] dark:border-white/5 mt-2">
<div className="flex items-center gap-1 text-[#161811]/60 dark:text-white/60 text-sm">
<span className="material-symbols-outlined text-lg" style={{ color: 'var(--card-icon)' }}>bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}
                    </div>
<div className="flex items-center gap-1 text-[#161811]/60 dark:text-white/60 text-sm">
<span className="material-symbols-outlined text-lg" style={{ color: 'var(--card-icon)' }}>directions_car</span> {property.caracteristicasimovel.vagas}
                    </div>
<div className="flex items-center gap-1 text-[#161811]/60 dark:text-white/60 text-sm">
<span className="material-symbols-outlined text-lg" style={{ color: 'var(--card-icon)' }}>square_foot</span> {property.caracteristicasimovel.tamanho}
                    </div>
</div>
<p className="text-[#161811] dark:text-white text-2xl font-bold mt-2" style={{ color: 'var(--card-value)' }}>{property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Consulte'}</p>
</div>
</Link>
            ))}
</div>
</section>
<section className="bg-white dark:bg-background-dark/50 py-24">
<div className="max-w-[1280px] mx-auto px-6">
<div className="flex flex-col lg:flex-row gap-16 items-center">
<div className="w-full lg:w-1/2">
<div className="relative">
<div className="w-full aspect-[5/6] bg-center bg-no-repeat bg-cover rounded-3xl shadow-2xl" style={{ backgroundImage: `url('${content.aboutImageUrl || defaultContent.aboutImageUrl}')` }}></div>
<div className="absolute -bottom-8 -right-8 p-8 rounded-2xl shadow-xl max-w-[280px]" style={{ backgroundColor: 'var(--about-quote-bg)', color: 'var(--about-quote-text)' }}>
<span className="material-symbols-outlined text-4xl mb-4">format_quote</span>
<p className="font-bold text-lg leading-snug">{content.aboutQuote || defaultContent.aboutQuote}</p>
</div>
</div>
</div>
<div className="w-full lg:w-1/2 flex flex-col gap-10">
<div className="flex flex-col gap-4">
<span className="px-3 py-1 bg-primary/20 text-background-dark dark:text-primary rounded-full text-xs font-bold uppercase tracking-wider w-fit">{content.aboutTagline || defaultContent.aboutTagline}</span>
<h2 className="text-[#161811] dark:text-white text-4xl md:text-5xl font-bold leading-tight tracking-tight">{content.aboutTitle || defaultContent.aboutTitle}</h2>
<p className="text-[#161811]/60 dark:text-white/60 text-lg">{content.aboutText || "Combinamos tradição imobiliária com as tecnologias mais modernas do setor para garantir o melhor negócio."}</p>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">{content.value1Icon || defaultContent.value1Icon}</span>
                    </div>
                    <h3 className="text-[#161811] dark:text-white text-xl font-bold">{content.value1Title || defaultContent.value1Title}</h3>
                    <p className="text-[#161811]/60 dark:text-white/60 text-sm">{content.value1Description || defaultContent.value1Description}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">{content.value2Icon || defaultContent.value2Icon}</span>
                    </div>
                    <h3 className="text-[#161811] dark:text-white text-xl font-bold">{content.value2Title || defaultContent.value2Title}</h3>
                    <p className="text-[#161811]/60 dark:text-white/60 text-sm">{content.value2Description || defaultContent.value2Description}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">{content.value3Icon || defaultContent.value3Icon}</span>
                    </div>
                    <h3 className="text-[#161811] dark:text-white text-xl font-bold">{content.value3Title || defaultContent.value3Title}</h3>
                    <p className="text-[#161811]/60 dark:text-white/60 text-sm">{content.value3Description || defaultContent.value3Description}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">{content.value4Icon || defaultContent.value4Icon}</span>
                    </div>
                    <h3 className="text-[#161811] dark:text-white text-xl font-bold">{content.value4Title || defaultContent.value4Title}</h3>
                    <p className="text-[#161811]/60 dark:text-white/60 text-sm">{content.value4Description || defaultContent.value4Description}</p>
                  </div>
                </div>
</div>
</div>
</div>
</section>

        {/* Map Section for Domus */}
        <section className="w-full py-20 px-6">
            <div className="max-w-7xl mx-auto rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--map-section-bg)' }}>
                <div className="relative z-10 max-w-[800px] mx-auto flex flex-col gap-8 items-center">
                    <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight" style={{ color: 'var(--map-title-color)' }}>{content.mapTitle || defaultContent.mapTitle}</h2>
                    <p className="text-xl" style={{ color: 'var(--map-text-color)' }}>{content.mapSubtitle || defaultContent.mapSubtitle}</p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <Link href={`/sites/${broker.slug}/explorar-no-mapa`} className="flex min-w-[240px] items-center justify-center gap-3 rounded-full h-16 px-10 text-lg font-black shadow-lg hover:scale-[1.05] transition-transform uppercase tracking-widest" style={{ backgroundColor: 'var(--map-button-bg)', color: 'var(--map-button-text)' }}>
                            <span className="material-symbols-outlined font-bold">map</span>
                            Explorar no Mapa
                        </Link>
                    </div>
                </div>
                <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFSXKPYHVcn6bMCHX6E36kKsWYH-Jrnidp5qgbqRJGbl2tdlfAHRWGgw_BH0FSGiuPAeKoFjGKd4iIxXaS7RDxBjhDpxchyUI6ZBIYy7at-GoSMkswUwLtYY2J431RQH8lRwvQ71Fextok_2cbHyuBu2WkdM3MerdFb1zeCcIMCEPpddgbOA9bubnLDWwsPuexTRzdQSnvapPmcLOzJ-pHK_tWJ-1E5X7glsU1dhw3RJ7oeECQqHntdfmjefwEy47loPNgWOSqzY0')] opacity-10 bg-cover bg-center grayscale"></div>
            </div>
        </section>

        <section className="max-w-[1280px] mx-auto px-6 py-20">
            <div className="rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--cta-section-bg)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10 max-w-[800px] mx-auto flex flex-col gap-8 items-center">
                    <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight" style={{ color: 'var(--cta-section-title)' }}>{content.ctaTitle || 'Pronto para encontrar seu próximo lar?'}</h2>
                    <p className="text-xl" style={{ color: 'var(--cta-section-subtitle)' }}>{content.ctaSubtitle || 'Agende uma consultoria personalizada agora mesmo via WhatsApp.'}</p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex min-w-[240px] items-center justify-center gap-3 rounded-full h-16 px-10 text-lg font-black shadow-lg hover:scale-[1.05] transition-transform uppercase tracking-widest" style={{ backgroundColor: 'var(--cta-section-button-bg)', color: 'var(--cta-section-button-text)' }}>
                            <span className="material-symbols-outlined font-bold">chat</span>
                            FALAR NO WHATSAPP
                        </a>
                    </div>
                </div>
            </div>
</section>
</main>
<DomusFooter broker={broker} />
<WhatsAppWidget brokerId={broker.id} />
</div>
  );
}
