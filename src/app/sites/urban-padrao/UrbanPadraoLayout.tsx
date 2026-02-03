
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


// NOTE: This is now a regular component, not a default page export.
// It will be imported and used by the main [slug]/page.tsx.

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
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
    aboutQuote?: string; // Added from Domus
  }
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
  };
};

type UrbanPadraoPageProps = {
  broker: Broker;
  properties: Property[];
}

type RadarList = {
  propertyIds: string[];
};


export default function UrbanPadraoLayout({ broker, properties }: UrbanPadraoPageProps) {
  const router = useRouter();
  const featuredProperties = properties?.slice(0, 6) || [];
  const content = broker.homepage || {};
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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
  
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/sites/${broker.slug}/search`);
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return '';
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


  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
      <UrbanPadraoHeader broker={broker} />
      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative px-4 pt-6 pb-20 md:px-10 lg:px-20 max-w-[1440px]">
          <div className="relative w-full rounded-2xl overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-center justify-center bg-black group cursor-pointer">
            {/* Background Image acting as Video Thumbnail */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              data-alt="Modern luxury living room interior with floor to ceiling windows overlooking a city skyline at sunset"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%), url("${content.heroImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzPeUZUrjmZi1J6YXvGV6PUhFRbF5C43OfQNC14zZjfRDhiA6SJGvTiMBwmOE6NONcPtqlUT-byvh0sabE8__a8rXqGsHVmCRktA8lqGHtXsQLdsEoewXy2QBy6gY780D68cWXi_y3oXYoy6essuqpeSCCySFlIh0JcOuINOy7EpKFi58DMV9dEDK6yg-ZhpdOXpU5_SFlJ77FjB-DgGMFngpcbp6tAnMRQflFN1ocdH4KTnLAGONujmpJBOrpUhWQgzI7rb4_N0E'}")`,
              }}
            ></div>
            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4 mt-[-60px]">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-medium text-white uppercase tracking-wider">{content.heroTagline || 'Lançamentos Exclusivos'}</span>
              </div>
              <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6" dangerouslySetInnerHTML={{ __html: content.heroTitle || 'Viva a experiência de morar <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">bem.</span>' }}></h1>
              <p className="text-gray-200 text-base md:text-lg max-w-2xl mb-10 font-light">
                {content.heroSubtitle || 'Curadoria de imóveis de alto padrão com atendimento personalizado. Encontre o lar dos seus sonhos com tecnologia e sofisticação.'}
              </p>
              {/* Play Button */}
              {videoEmbedUrl && (
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
            </div>
          </div>
          {/* Floating Search Bar */}
          <div className="relative z-20 -mt-16 w-full max-w-5xl mx-auto px-4">
            <div className="bg-white p-4 rounded-xl shadow-card border border-gray-100">
              <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Localização</label>
                  <div className="flex items-center h-12 bg-[#f8f9fa] rounded-lg px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-text-muted">location_on</span>
                    <input className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium placeholder-gray-400" placeholder="Bairro, Cidade ou Condomínio" type="text" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Tipo</label>
                  <div className="flex items-center h-12 bg-[#f8f9fa] rounded-lg px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-text-muted">home_work</span>
                    <select className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium cursor-pointer">
                      <option>Apartamento</option>
                      <option>Casa de Condomínio</option>
                      <option>Cobertura</option>
                      <option>Terreno</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Faixa de Preço</label>
                  <div className="flex items-center h-12 bg-[#f8f9fa] rounded-lg px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-text-muted">attach_money</span>
                    <select className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium cursor-pointer">
                      <option>Qualquer valor</option>
                      <option>R$ 500k - R$ 1M</option>
                      <option>R$ 1M - R$ 3M</option>
                      <option>Acima de R$ 3M</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <button className="h-12 px-8 rounded-lg bg-black text-primary font-bold hover:bg-gray-900 transition-colors shadow-lg flex items-center justify-center gap-2" type="submit">
                    <span className="material-symbols-outlined">search</span>
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
        {/* Stats Bar */}
        {!content.hideStats && (
          <section className="w-full py-8 border-b border-[#f0f2f4] bg-white">
            <div className="layout-container max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black text-primary">{content.statsSold || '+250'}</span>
                  <span className="text-sm font-medium text-text-muted mt-1">Imóveis Vendidos</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black text-primary">{content.statsExperience || '12'}</span>
                  <span className="text-sm font-medium text-text-muted mt-1">Anos de Mercado</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black text-primary">{content.statsSatisfaction || '98%'}</span>
                  <span className="text-sm font-medium text-text-muted mt-1">Clientes Satisfeitos</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-black text-primary">{content.statsSupport || '24/7'}</span>
                  <span className="text-sm font-medium text-text-muted mt-1">Suporte Premium</span>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Featured Properties */}
        <section className="w-full py-16 lg:py-24 bg-background-light">
          <div className="layout-container max-w-[1280px] mx-auto px-6 flex flex-col gap-12">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="text-secondary font-bold tracking-wider uppercase text-sm mb-2 block">{content.featuredTagline || 'Destaques'}</span>
                <h2 className="text-text-main text-3xl md:text-4xl font-bold leading-tight">{content.featuredTitle || 'Imóveis Selecionados'}</h2>
                <p className="text-text-muted mt-4">{content.featuredSubtitle || 'Oportunidades únicas escolhidas a dedo para você viver o extraordinário.'}</p>
              </div>
              <a className="flex items-center gap-2 font-bold text-black border-b-2 border-primary pb-1 hover:text-primary transition-colors" href={`/sites/${broker.slug}/search`}>
                Ver todos os imóveis
                <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>
            {/* Properties Container */}
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => {
                const isSaved = savedPropertyIds.includes(property.id);
                const quartos = property.caracteristicasimovel.quartos;
                return (
                <Link href={`/sites/${broker.slug}/imovel/${property.id}`} key={property.id} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 group">
                  <div className="relative h-60 w-full overflow-hidden">
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md">
                            <span className="text-white text-xs font-bold">{property.informacoesbasicas.status}</span>
                        </div>
                        <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white transition-colors group/radar", isSaved ? "text-primary" : "hover:text-primary")}>
                            <span className="material-symbols-outlined text-[20px]">radar</span>
                        </button>
                    </div>
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${property.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/300'})`,
                      }}
                    ></div>
                  </div>
                  <div className="flex flex-col p-5 gap-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-text-main leading-snug">{property.informacoesbasicas.nome}</h3>
                      {property.informacoesbasicas.valor && (
                        <span className="text-primary font-black text-lg">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(property.informacoesbasicas.valor)}
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {property.localizacao.bairro}, {property.localizacao.cidade}
                    </p>
                    <div className="h-px w-full bg-gray-100 my-1"></div>
                    <div className="flex justify-between text-sm text-text-muted font-medium">
                      {quartos && (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">bed</span> {formatQuartos(quartos)} Quartos</span>
                      )}
                      {property.caracteristicasimovel.tamanho && (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )})}
              </div>
            ) : (
               <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-white">
                <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">apartment</span>
                <h3 className="text-xl font-bold text-gray-700">Nenhum imóvel em destaque</h3>
                <p className="text-gray-500 mt-2">Este corretor ainda não selecionou imóveis para a carteira.</p>
            </div>
            )}
            
          </div>
        </section>
        {/* Broker & Presentation Section */}
        <section className="w-full py-16 lg:py-24 bg-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f8f9fa] skew-x-12 translate-x-20 hidden lg:block"></div>
          <div className="absolute bottom-20 left-10 size-32 rounded-full border-4 border-primary/20 hidden lg:block"></div>
          <div className="layout-container max-w-[1280px] mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    data-alt="Professional portrait of a real estate broker smiling in a suit"
                    style={{
                      backgroundImage: `url("${content.aboutImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnnSrwSkNX4VEMzf8v2AibJQp1RcHvNb3_q0wuoHZwhVlAJKqmwIhebGEXD_ehHxVeLXegQhl11I3AK8d7sHOjyX2Ru2QsxLQ7CNKGhMFL1kuVczfW4JlWO-MgFaOLLDGfDt2hXsZyS7t5vdOo90YwN1Cwqcoemknmi74RiulnUXgpEBnQguZIsUxNueG01P_uPnYKeZbzSmXBrfvlrkH_y3PAJxi8hET-_dNaHXrJavIJPjRaZDjfN1aQrROrA0lpueLFt6_FA6I'}")`,
                    }}
                  ></div>
                  {/* Floating Card */}
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
                  <h3 className="text-primary font-bold tracking-wider uppercase mb-2">{content.aboutTagline || 'Sobre Mim'}</h3>
                  <h2 className="text-4xl md:text-5xl font-black text-text-main leading-tight mb-4">
                    {content.aboutTitle || 'Mais que um corretor, seu parceiro de negócios.'}
                  </h2>
                  <p className="text-lg text-text-muted leading-relaxed">
                    {content.aboutText || 'Com mais de uma década de experiência no mercado de alto padrão, ofereço uma consultoria completa e personalizada. Meu objetivo é transformar a busca pelo imóvel ideal em uma jornada tranquila e segura.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-lg">
                    <span className="material-symbols-outlined text-primary text-3xl">verified</span>
                    <span className="font-bold text-text-main">Avaliação Precisa</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-lg">
                    <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
                    <span className="font-bold text-text-main">Assessoria Jurídica</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-lg">
                    <span className="material-symbols-outlined text-primary text-3xl">camera_outdoor</span>
                    <span className="font-bold text-text-main">Tour Virtual 360º</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-lg">
                    <span className="material-symbols-outlined text-primary text-3xl">handshake</span>
                    <span className="font-bold text-text-main">Negociação Segura</span>
                  </div>
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
        <section className="w-full py-16 bg-background-light">
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl text-white relative">
              <div className="grid md:grid-cols-2 min-h-[400px]">
                <div className="p-10 flex flex-col justify-center gap-6 relative z-10">
                  <h2 className="text-3xl font-bold">Encontre imóveis perto de você</h2>
                  <p className="text-gray-400">Utilize nosso mapa interativo para explorar as melhores oportunidades nas regiões mais valorizadas da cidade.</p>
                  <Link href={`/sites/${broker.slug}/explorar-no-mapa`} className="w-fit flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition-colors">
                    <span className="material-symbols-outlined">map</span>
                    Explorar no Mapa
                  </Link>
                </div>
                <div className="relative h-full w-full min-h-[300px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    data-alt="Stylized dark map of Sao Paulo city streets"
                    data-location="Sao Paulo"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFSXKPYHVcn6bMCHX6E36kKsWYH-Jrnidp5qgbqRJGbl2tdlfAHRWGgw_BH0FSGiuPAeKoFjGKd4iIxXaS7RDxBjhDpxchyUI6ZBIYy7at-GoSMkswUwLtYY2J431RQH8lRwvQ71Fextok_2cbHyuBu2WkdM3MerdFb1zeCcIMCEPpddgbOA9bubnLDWwsPuexTRzdQSnvapPmcLOzJ-pHK_tWJ-1E5X7glsU1dhw3RJ7oeECQqHntdfmjefwEy47loPNgWOSqzY0")',
                      filter: 'grayscale(100%) contrast(120%)',
                    }}
                  ></div>
                  {/* Map Pin Overlay (Simulated) */}
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
