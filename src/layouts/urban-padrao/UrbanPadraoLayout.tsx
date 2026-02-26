
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from './components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from './components/UrbanPadraoFooter';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useState, useEffect, Suspense } from 'react';
import SearchFilters from '@/components/SearchFilters';

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
    aboutTagline?: string;
    aboutTitle?: string;
    aboutText?: string;
    aboutImageUrl?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    aboutAwardTitle?: string;
    aboutAwardText?: string;
    aboutQuote?: string;
    searchButtonBgColor?: string;
    searchButtonTextColor?: string;
    statsSectionBgColor?: string;
    statsNumberColor?: string;
    statsLabelColor?: string;
    cardIconColor?: string;
    cardValueColor?: string;
    cardTitleColor?: string;
    statusTagBgColor?: string;
    statusTagTextColor?: string;
    aboutSectionBgColor?: string;
    aboutTaglineColor?: string;
    aboutTitleColor?: string;
    aboutTextColor?: string;
    mapSectionBgColor?: string;
    mapTitleColor?: string;
    mapTextColor?: string;
    mapButtonBgColor?: string;
    mapButtonTextColor?: string;
  }
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
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
  };
};

type UrbanPadraoPageProps = {
  broker: Broker;
  properties: Property[];
}

type RadarList = {
  propertyIds: string[];
};

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);

    const sNormalized = s / 100;
    const lNormalized = l / 100;

    const a = sNormalized * Math.min(lNormalized, 1 - lNormalized);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = lNormalized - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export default function UrbanPadraoLayout({ broker, properties }: UrbanPadraoPageProps) {
  const router = useRouter();
  const featuredProperties = properties?.slice(0, 6) || [];
  const content = broker.homepage || {};
  const [isMounted, setIsMounted] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const radarListDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'radarLists', user.uid) : null),
      [user, firestore]
  );

  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];

  const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        router.push('/radar');
        return;
    }

    if (!firestore) return;

    const docRef = doc(firestore, 'radarLists', user.uid);
    
    if (savedPropertyIds.includes(propertyId)) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido do Radar!", description: "O imóvel foi removido da sua lista." });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Adicionado ao Radar!", description: "O imóvel foi salvo na sua lista de oportunidades." });
    }
  };
  
  const handleSearch = (queryString: string) => {
    router.push(`/sites/${broker.slug}/search?${queryString}`);
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    if (Array.isArray(quartosData)) {
      return quartosData.join(', ');
    }
    return String(quartosData);
  };
  
  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("/").pop()?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes("vimeo.com/")) {
      videoId = url.split("/").pop()?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return null;
  };
  const videoEmbedUrl = getEmbedUrl(content.heroVideoUrl);

  const dynamicStyles = {
    '--background': broker.backgroundColor,
    '--foreground': broker.foregroundColor,
    '--primary': broker.primaryColor,
    '--secondary': broker.secondaryColor,
    '--accent': broker.accentColor,
  } as React.CSSProperties;

  const statsSectionBgColor = broker.homepage?.statsSectionBgColor ? hslToHex(broker.homepage.statsSectionBgColor) : '#ffffff';
  const statsNumberColor = broker.homepage?.statsNumberColor ? hslToHex(broker.homepage.statsNumberColor) : 'hsl(var(--primary))';
  const statsLabelColor = broker.homepage?.statsLabelColor ? hslToHex(broker.homepage.statsLabelColor) : 'hsl(var(--muted-foreground))';
  const cardIconColor = broker.homepage?.cardIconColor ? hslToHex(broker.homepage.cardIconColor) : undefined;
  const cardValueColor = broker.homepage?.cardValueColor ? hslToHex(broker.homepage.cardValueColor) : undefined;
  const cardTitleColor = broker.homepage?.cardTitleColor ? hslToHex(broker.homepage.cardTitleColor) : undefined;
  const statusTagBgColor = broker.homepage?.statusTagBgColor ? hslToHex(broker.homepage.statusTagBgColor) : undefined;
  const statusTagTextColor = broker.homepage?.statusTagTextColor ? hslToHex(broker.homepage.statusTagTextColor) : undefined;
  const aboutSectionBgColor = broker.homepage?.aboutSectionBgColor ? hslToHex(broker.homepage.aboutSectionBgColor) : '#ffffff';
  const aboutTaglineColor = broker.homepage?.aboutTaglineColor ? hslToHex(broker.homepage.aboutTaglineColor) : 'hsl(var(--primary))';
  const aboutTitleColor = broker.homepage?.aboutTitleColor ? hslToHex(broker.homepage.aboutTitleColor) : undefined;
  const aboutTextColor = broker.homepage?.aboutTextColor ? hslToHex(broker.homepage.aboutTextColor) : undefined;
  const mapSectionBgColor = broker.homepage?.mapSectionBgColor ? hslToHex(broker.homepage.mapSectionBgColor) : '#f8f9fa';
  const mapTitleColor = broker.homepage?.mapTitleColor ? hslToHex(broker.homepage.mapTitleColor) : undefined;
  const mapTextColor = broker.homepage?.mapTextColor ? hslToHex(broker.homepage.mapTextColor) : undefined;
  const mapButtonBgColor = broker.homepage?.mapButtonBgColor ? hslToHex(broker.homepage.mapButtonBgColor) : undefined;
  const mapButtonTextColor = broker.homepage?.mapButtonTextColor ? hslToHex(broker.homepage.mapButtonTextColor) : undefined;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col group/design-root bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
      <UrbanPadraoHeader broker={broker} />
      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative z-10 px-4 pt-6 pb-20 md:px-10 lg:px-20 max-w-[1440px]">
          <div className="relative w-full rounded-2xl overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-center justify-center bg-black group cursor-pointer">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%), url("${content.heroImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop'}")`,
              }}
            ></div>
            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4 mt-[-60px]">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-medium text-white uppercase tracking-wider">{content.heroTagline || 'Lançamentos Exclusivos'}</span>
              </div>
              <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6" dangerouslySetInnerHTML={{ __html: content.heroTitle || 'Viva a experiência de morar <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">bem.</span>' }}></h1>
              <p className="text-gray-200 text-base md:text-lg max-w-2xl mb-10 font-light">
                {content.heroSubtitle || 'Curadoria de imóveis de alto padrão com atendimento personalizado.'}
              </p>
              {videoEmbedUrl && isMounted && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-4 group/play-link">
                        <div className="group/btn relative flex items-center justify-center size-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 group-hover/play-link:bg-primary group-hover/play-link:border-primary transition-all duration-300">
                          <span className="material-symbols-outlined text-white text-4xl group-hover/play-link:text-black ml-1">play_arrow</span>
                        </div>
                        <span className="text-white text-sm font-medium">Assista ao vídeo de apresentação</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="p-0 bg-black border-0 max-w-4xl">
                     <DialogHeader>
                          <VisuallyHidden>
                              <DialogTitle>Vídeo de Apresentação</DialogTitle>
                              <DialogDescription>Vídeo de apresentação.</DialogDescription>
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
            </div>
          </div>
          {/* Floating Search Bar */}
          <div className="relative z-20 -mt-16 w-full max-w-5xl mx-auto px-4">
            <Suspense fallback={<div className="h-24 bg-white rounded-2xl animate-pulse shadow-card border border-gray-100" />}>
              <SearchFilters onSearch={handleSearch} className="shadow-card border border-gray-100" />
            </Suspense>
          </div>
        </section>
        
        {!content.hideStats && (
          <section className="w-full py-8 border-b border-[#f0f2f4]" style={{ backgroundColor: statsSectionBgColor }}>
            <div className="layout-container max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black" style={{color: statsNumberColor}}>{content.statsSold || '+250'}</span>
                  <span className="text-sm font-medium mt-1" style={{color: statsLabelColor}}>Imóveis Vendidos</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black" style={{color: statsNumberColor}}>{content.statsExperience || '12'}</span>
                  <span className="text-sm font-medium mt-1" style={{color: statsLabelColor}}>Anos de Mercado</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black" style={{color: statsNumberColor}}>{content.statsSatisfaction || '98%'}</span>
                  <span className="text-sm font-medium mt-1" style={{color: statsLabelColor}}>Clientes Satisfeitos</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black" style={{color: statsNumberColor}}>{content.statsSupport || '24/7'}</span>
                  <span className="text-sm font-medium mt-1" style={{color: statsLabelColor}}>Suporte Premium</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="w-full py-16 lg:py-24 bg-background-light">
          <div className="layout-container max-w-[1280px] mx-auto px-6 flex flex-col gap-12">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="text-secondary font-bold tracking-wider uppercase text-sm mb-2 block">{content.featuredTagline || 'Destaques'}</span>
                <h2 className="text-text-main text-3xl md:text-4xl font-bold leading-tight">{content.featuredTitle || 'Imóveis Selecionados'}</h2>
                <p className="text-text-muted mt-4">{content.featuredSubtitle || 'Oportunidades únicas escolhidas a dedo.'}</p>
              </div>
              <Link className="flex items-center gap-2 font-bold text-black border-b-2 border-primary pb-1 hover:text-primary transition-colors" href={`/sites/${broker.slug}/search`}>
                Ver todos os imóveis
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => {
                const isSaved = savedPropertyIds.includes(property.id);
                return (
                <Link href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} key={property.id} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 group">
                  <div className="relative h-60 w-full overflow-hidden">
                    <div
                      className={cn(
                        "absolute top-3 left-3 z-10 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide shadow-sm",
                        !statusTagBgColor && 'bg-primary text-primary-foreground'
                      )}
                      style={{
                          backgroundColor: statusTagBgColor,
                          color: statusTagTextColor
                      }}
                    >
                      {property.informacoesbasicas.status}
                    </div>
                    <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white transition-colors group/radar", isSaved ? "text-primary" : "hover:text-primary")}>
                        <span className="material-symbols-outlined text-[20px]">radar</span>
                    </button>
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${property.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/300'})`,
                      }}
                    ></div>
                  </div>
                  <div className="flex flex-col p-5 gap-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-text-main leading-snug group-hover:text-primary transition-colors line-clamp-1" style={{color: cardTitleColor}}>{property.informacoesbasicas.nome}</h3>
                      {property.informacoesbasicas.valor && (
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className="text-xs text-text-muted block">A partir de</span>
                          <span className="font-black text-lg block" style={{ color: cardValueColor || 'var(--primary)' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.informacoesbasicas.valor)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-text-muted text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {property.localizacao.bairro}, {property.localizacao.cidade}
                    </p>
                    <div className="h-px w-full bg-gray-100 my-1"></div>
                    <div className="flex justify-between text-sm text-text-muted font-medium">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{color: cardIconColor}}>bed</span> {formatQuartos(property.caracteristicasimovel.quartos)} Quartos</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{color: cardIconColor}}>square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="w-full py-16 lg:py-24" style={{ backgroundColor: aboutSectionBgColor }}>
          <div className="layout-container max-w-[1280px] mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${content.aboutImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop'}")`,
                    }}
                  ></div>
                  <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg max-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-primary/20 p-2 rounded-full text-black">
                        <span className="material-symbols-outlined">award_star</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">{content.aboutAwardTitle || 'Prêmio 2024'}</p>
                        <p className="text-sm font-bold">{content.aboutAwardText || 'Top Performance'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 flex flex-col gap-6">
                <div>
                  <h3 className="font-bold tracking-wider uppercase mb-2" style={{ color: aboutTaglineColor }}>{content.aboutTagline || 'Sobre Mim'}</h3>
                  <h2 className="text-4xl md:text-5xl font-black text-text-main leading-tight mb-4" style={{ color: aboutTitleColor }}>
                    {content.aboutTitle || 'Sua jornada imobiliária com sofisticação.'}
                  </h2>
                  <p className="text-lg text-text-muted leading-relaxed" style={{ color: aboutTextColor }}>
                    {content.aboutText || 'Ofereço uma consultoria completa e personalizada no mercado de luxo.'}
                  </p>
                </div>
                <div className="mt-4">
                  <button className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-black text-white font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl">
                    Agendar Consultoria
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map / Location Section */}
        <section className="w-full py-16 hidden lg:block" style={{ backgroundColor: mapSectionBgColor }}>
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl text-white relative">
              <div className="grid md:grid-cols-2 min-h-[400px]">
                <div className="p-10 flex flex-col justify-center gap-6 relative z-10">
                  <h2 className="text-3xl font-bold" style={{ color: mapTitleColor }}>Encontre imóveis perto de você</h2>
                  <p className="text-gray-400" style={{ color: mapTextColor }}>Explore as melhores oportunidades nas regiões mais valorizadas.</p>
                  <Link href={`/sites/${broker.slug}/explorar-no-mapa`} className="w-fit flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors" style={{ backgroundColor: mapButtonBgColor || 'var(--primary)', color: mapButtonTextColor || 'var(--background-dark)' }}>
                    <span className="material-symbols-outlined">map</span>
                    Explorar no Mapa
                  </Link>
                </div>
                <div className="relative h-full w-full min-h-[300px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFSXKPYHVcn6bMCHX6E36kKsWYH-Jrnidp5qgbqRJGbl2tdlfAHRWGgw_BH0FSGiuPAeKoFjGKd4iIxXaS7RDxBjhDpxchyUI6ZBIYy7at-GoSMkswUwLtYY2J431RQH8lRwvQ71Fextok_2cbHyuBu2WkdM3MerdFb1zeCcIMCEPpddgbOA9bubnLDWwsPuexTRzdQSnvapPmcLOzJ-pHK_tWJ-1E5X7glsU1dhw3RJ7oeECQqHntdfmjefwEy47loPNgWOSqzY0")',
                      filter: 'grayscale(100%) contrast(120%)',
                    }}
                  ></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                    <span className="material-symbols-outlined text-primary text-5xl drop-shadow-lg">location_on</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <UrbanPadraoFooter broker={broker} />
      <WhatsAppWidget brokerId={broker.id} />
    </div>
  );
}
