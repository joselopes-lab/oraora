
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { DomusHeader } from './components/DomusHeader';
import { DomusFooter } from './components/DomusFooter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useState, useEffect } from 'react';


type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
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
    aboutTagline?: string; // Added here
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

type DomusLayoutProps = {
  broker: Broker;
  properties: Property[];
};

export default function DomusLayout({ broker, properties }: DomusLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const content = broker.homepage || {};

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop()?.split('?')[0];
    } else if (url.includes('vimeo.com/')) {
      videoId = url.split('/').pop()?.split('?')[0];
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
    return null;
  };

  const videoEmbedUrl = getEmbedUrl(content.heroVideoUrl);

  const defaultContent = {
    heroTagline: "Curadoria Premium",
    heroTitle: "Encontre o lar dos seus sonhos com <span class=\"text-primary italic\">curadoria</span> exclusiva",
    heroSubtitle: "Imóveis selecionados com tecnologia e atendimento personalizado para uma experiência premium e sem burocracia.",
    heroImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlzbiXYY0BpchRCPRPqvTEk5BWBLgaa5EubTInww9SGxsUFqt1kdnrgrvROu_1uGCm_zf9dbSwIXVo9j14bfmkXYsdWizi8b4n-nxIvOTCFKn_-3cmrodAG0oMOMJS_BkQFTbOgsaTzlk_2ta7QqGoKM0benjx5savhNz0Q9NukbSP9UFGZEOkILVFfG35YLUD52Dw6EDPI5VeqxQyCNnn9-fqZ74F6pWzXw9T9PIfhaRPJyrLfKDt38xm-twOo6v8OrV1r77JMow",
    statsSold: "250+",
    statsExperience: "12",
    statsSatisfaction: "1.2k",
    statsSupport: "24/7",
    featuredTagline: "Nosso Destaque",
    featuredTitle: "Oportunidades em Destaque",
    featuredSubtitle: "Unidades selecionadas com exclusividade para você.",
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
  };

  const featuredProperties = properties?.slice(0, 6) || [];

  return (
    <div className="domus-theme font-display bg-background-light dark:bg-background-dark text-[#161811] dark:text-white transition-colors duration-300">
      <DomusHeader broker={broker} />
      <main>
        <section className="max-w-[1280px] mx-auto px-6 py-12 md:py-20">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
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
                      <button className="flex min-w-[200px] items-center justify-center gap-2 rounded-xl h-14 px-8 bg-primary text-background-dark text-base font-bold shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all">
                        <span className="material-symbols-outlined">play_circle</span>
                        Assistir Vídeo
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
                <button className="flex min-w-[200px] items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-white/5 border border-[#e3e5dc] dark:border-white/10 text-[#161811] dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                        Ver Catálogo
                    </button>
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
        </section>
        {!content.hideStats && (
        <section className="bg-white dark:bg-background-dark py-16 border-y border-[#f3f4f0] dark:border-white/5">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-gray-100 dark:divide-white/10">
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-primary tracking-tight text-5xl font-bold leading-tight">{content.statsSold || defaultContent.statsSold}</span>
                        <span className="text-[#161811]/70 dark:text-white/70 text-xs font-medium uppercase tracking-widest mt-2">Imóveis Vendidos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-primary tracking-tight text-5xl font-bold leading-tight">{content.statsExperience || defaultContent.statsExperience}</span>
                        <span className="text-[#161811]/70 dark:text-white/70 text-xs font-medium uppercase tracking-widest mt-2">Anos de Mercado</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-primary tracking-tight text-5xl font-bold leading-tight">{content.statsSatisfaction || defaultContent.statsSatisfaction}</span>
                        <span className="text-[#161811]/70 dark:text-white/70 text-xs font-medium uppercase tracking-widest mt-2">Clientes Satisfeitos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-primary tracking-tight text-5xl font-bold leading-tight">{content.statsSupport || defaultContent.statsSupport}</span>
                        <span className="text-[#161811]/70 dark:text-white/70 text-xs font-medium uppercase tracking-widest mt-2">Suporte Premium</span>
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
<button className="flex items-center gap-2 text-background-dark dark:text-primary font-bold hover:underline group">
                Ver todos os imóveis <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
              <div key={property.id} className="flex flex-col gap-4 group cursor-pointer">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-center bg-no-repeat bg-cover group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: 'url(' + (property.midia?.[0] || 'https://picsum.photos/400/300') + ')' }}></div>
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-background-dark/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">{property.informacoesbasicas.status}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[#161811] dark:text-white text-xl font-bold leading-normal">{property.informacoesbasicas.nome}</p>
                  <div className="flex items-center gap-1 text-primary">
<span className="material-symbols-outlined text-sm">location_on</span>
<span className="text-sm font-semibold uppercase tracking-wide">{property.localizacao.bairro}, {property.localizacao.cidade}</span>
</div>
<div className="flex gap-4 py-2 border-y border-[#f3f4f0] dark:border-white/5 mt-2">
<div className="flex items-center gap-1 text-[#161811]/60 dark:text-white/60 text-sm">
<span className="material-symbols-outlined text-lg">bed</span> {Array.isArray(property.caracteristicasimovel.quartos) ? property.caracteristicasimovel.quartos.join(', ') : property.caracteristicasimovel.quartos}
                    </div>
<div className="flex items-center gap-1 text-[#161811]/60 dark:text-white/60 text-sm">
<span className="material-symbols-outlined text-lg">bathtub</span> {property.caracteristicasimovel.vagas}
                    </div>
<div className="flex items-center gap-1 text-[#161811]/60 dark:text-white/60 text-sm">
<span className="material-symbols-outlined text-lg">square_foot</span> {property.caracteristicasimovel.tamanho}
                    </div>
</div>
<p className="text-[#161811] dark:text-white text-2xl font-bold mt-2">{property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Consulte'}</p>
</div>
</div>
            ))}
</div>
</section>
<section className="bg-white dark:bg-background-dark/50 py-24">
<div className="max-w-[1280px] mx-auto px-6">
<div className="flex flex-col lg:flex-row gap-16 items-center">
<div className="w-full lg:w-1/2">
<div className="relative">
<div className="w-full aspect-[5/6] bg-center bg-no-repeat bg-cover rounded-3xl shadow-2xl" style={{ backgroundImage: `url('${content.aboutImageUrl || defaultContent.aboutImageUrl}')` }}></div>
<div className="absolute -bottom-8 -right-8 bg-primary p-8 rounded-2xl shadow-xl max-w-[280px]">
<span className="material-symbols-outlined text-4xl text-background-dark mb-4">format_quote</span>
<p className="text-background-dark font-bold text-lg leading-snug">{content.aboutQuote || defaultContent.aboutQuote}</p>
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
<section className="max-w-[1280px] mx-auto px-6 py-20">
<div className="bg-background-dark rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
<div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
<div className="relative z-10 max-w-[800px] mx-auto flex flex-col gap-8 items-center">
<h2 className="text-white text-4xl md:text-6xl font-bold leading-tight tracking-tight">{content.ctaTitle || defaultContent.ctaTitle}</h2>
<p className="text-white/60 text-xl">{content.ctaSubtitle || defaultContent.ctaSubtitle}</p>
<div className="flex flex-col sm:flex-row gap-4 mt-4">
<button className="flex min-w-[240px] items-center justify-center gap-3 rounded-full h-16 px-10 bg-primary text-background-dark text-lg font-bold shadow-lg hover:scale-[1.05] transition-transform">
<span className="material-symbols-outlined font-bold">chat</span>
                        Falar no WhatsApp
                    </button>
</div>
</div>
</div>
</section>
</main>
<DomusFooter broker={broker} />
</div>
  );
}
