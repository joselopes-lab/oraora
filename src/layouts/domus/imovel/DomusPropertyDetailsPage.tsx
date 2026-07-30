
'use client';
/**
 * @fileOverview Página de Detalhes do Imóvel exclusiva para o template Domus.
 */

import Image from 'next/image';
import Link from 'next/link';
import { DomusHeader } from '../components/DomusHeader';
import { DomusFooter } from '../components/DomusFooter';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreetViewPanoramaView } from '@/components/StreetViewPanorama';
import { WhatsAppWidget } from '@/app/sites/urban-padrao/components/WhatsAppWidget';
import { WhatsAppLeadModal } from '@/components/WhatsAppLeadModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  whatsappUrl?: string;
  homepage?: {
    ctaButtonBgColor?: string;
    ctaButtonTextColor?: string;
    ctaButtonText?: string;
    ctaButtonIcon?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
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
    statusTagBgColor?: string;
    statusTagTextColor?: string;
    cardTitleColor?: string;
    cardValueColor?: string;
    cardIconColor?: string;
  };
};

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
  isVisibleOnSite?: boolean;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    descricao?: string;
    slug?: string;
    condominio?: number;
    iptu?: number;
    transactionTypes?: string[];
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    googleStreetViewLink?: string;
  };
  midia: string[];
  youtubeVideoUrl?: string;
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
  areascomuns?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

type RadarList = {
  propertyIds: string[];
};

const leadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'O telefone é obrigatório'),
  message: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

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
        const channel = Math.round(255 * color);
        const hex = channel.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export default function DomusPropertyDetailsPage({ broker, property, similarProperties }: { broker: Broker; property: Property; similarProperties: Property[] }) {
  const displayMidia = property.midia && property.midia.length > 0 ? property.midia : ((property as any).media || []);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [streetViewAvailable, setStreetViewAvailable] = useState<boolean>(true);
  const content = broker.homepage || {};

  const pathname = usePathname();
  const isPortalAccess = pathname.startsWith('/sites'); 
  const searchUrl = isPortalAccess ? `/sites/${broker.slug}/search` : '/search';

  const radarListDocRef = useMemoFirebase(() => (user ? doc(firestore, 'radarLists', user.uid) : null), [user, firestore]);
  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];
  const isSaved = savedPropertyIds.includes(property.id);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: `Olá, gostaria de mais informações sobre o imóvel ${property.informacoesbasicas.nome}.`,
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: broker.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: property.informacoesbasicas.nome,
      message: data.message,
      source: 'property_form',
      origin: 'form',
    });

    if (result.success) {
      toast({ title: 'Solicitação Enviada!', description: 'Nossa equipe retornará em breve.' });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Erro ao Enviar', description: result.message });
    }
    setIsSubmitting(false);
  };

  const handleRadarToggle = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
        router.push('/radar');
        return;
    }
    if (!firestore) return;
    const docRef = doc(firestore, 'radarLists', user.uid);
    const isTargetSaved = savedPropertyIds.includes(propertyId);
    if (isTargetSaved) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido!", description: "Imóvel removido da sua lista." });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Salvo!", description: "Imóvel adicionado à sua lista." });
    }
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    const data = Array.isArray(quartosData) ? quartosData : [String(quartosData)];
    if (data.length === 0) return 'N/A';
    if (data.length === 1 && data[0] === '1') return '1';
    return data.join(', ');
  };

  const extractMapSrc = (input: string | undefined): string | null => {
    if (!input) return null;
    const iframeMatch = input.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    if (input.startsWith('http')) return input;
    return null;
  };

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    } else if (url.includes('vimeo.com/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    }
    
    if (!videoId) return null;
    if (url.includes('vimeo')) return `https://player.vimeo.com/video/${videoId}`;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const videoEmbedUrl = getEmbedUrl(property.youtubeVideoUrl);

  const localizacao = property.localizacao;
  const addressRaw = (localizacao?.address || (localizacao as any)?.endereco || '').trim();
  const bairro = localizacao?.bairro || '';
  const cidade = localizacao?.cidade || '';
  const estado = localizacao?.estado || (localizacao as any)?.state || '';

  let fullAddress = addressRaw;
  if (!fullAddress) {
    fullAddress = [bairro, cidade, estado].filter(Boolean).join(', ');
  } else if (cidade && !addressRaw.toLowerCase().includes(cidade.toLowerCase())) {
    const extra = [bairro, `${cidade}${estado ? ` - ${estado}` : ''}`].filter(Boolean).join(', ');
    fullAddress = `${addressRaw}, ${extra}`;
  }

  const mapSrc = extractMapSrc(localizacao?.googleMapsLink) || (fullAddress ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed` : null);
  const streetViewSrc = extractMapSrc(localizacao?.googleStreetViewLink) || (fullAddress ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&layer=c&cbll=&cbp=12,0,0,0,0&output=embed` : null);

  const showLocationSection = localizacao?.exibirLocalizacao !== false && (property as any)?.exibirLocalizacao !== false && Boolean(fullAddress);

  const dynamicStyles = {
    '--background': broker.backgroundColor || '90 20% 97%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '97 78% 56%',
  } as React.CSSProperties;

  const statusTagBgColor = content.statusTagBgColor ? hslToHex(content.statusTagBgColor) : undefined;
  const statusTagTextColor = content.statusTagTextColor ? hslToHex(content.statusTagTextColor) : undefined;

  const whatsappLink = broker.whatsappUrl?.replace('wa.me.com.br', 'wa.me') || '#';

  const fmt = (v: number | undefined) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v) : null;

  const renderPriceSection = () => {
    const types = property.informacoesbasicas.transactionTypes || ['sale'];
    const salePrice = property.informacoesbasicas.salePrice || property.informacoesbasicas.valor;
    const rentPrice = property.informacoesbasicas.rentPrice;
    const condo = property.informacoesbasicas.condominio;
    const iptu = property.informacoesbasicas.iptu;

    return (
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl text-left space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {types.includes('sale') && (
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Investimento (Venda)</span>
                    <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{fmt(salePrice)}</p>
                </div>
            )}
            {types.includes('rent') && (
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço Mensal (Aluguel)</span>
                    <p className="text-5xl font-black text-primary tracking-tighter">{fmt(rentPrice)}<span className="text-xl font-bold ml-1">/mês</span></p>
                </div>
            )}
        </div>
        <div className="pt-10 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-8">
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condomínio Estimado</span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{fmt(condo) || 'A consultar'}</p>
            </div>
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">IPTU Mensal</span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{fmt(iptu) || 'A consultar'}</p>
            </div>
        </div>
      </div>
    );
  };

  const renderBadge = (p: Property) => {
    const types = p.informacoesbasicas.transactionTypes || ['sale'];
    if (types.includes('sale') && types.includes('rent')) return "Venda + Aluguel";
    if (types.includes('rent')) return "Para Aluguel";
    return "À Venda";
  };

  const renderSimPrice = (p: Property) => {
    const types = p.informacoesbasicas.transactionTypes || ['sale'];
    if (types.includes('rent')) return `${fmt(p.informacoesbasicas.rentPrice)}/mês`;
    return fmt(p.informacoesbasicas.salePrice || p.informacoesbasicas.valor);
  };

  return (
    <div style={dynamicStyles} className="domus-theme font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 text-left">
      <DomusHeader broker={broker as any} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex items-center justify-between text-left">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-black uppercase text-[10px] tracking-widest">Voltar</span>
          </button>
        </div>

        <section className="grid grid-cols-12 gap-4 mb-12 md:h-[550px]">
          <div onClick={() => openGallery(0)} className="col-span-12 md:col-span-8 relative overflow-hidden rounded-[2.5rem] group cursor-pointer shadow-2xl">
            <Image alt="Main" src={displayMidia[0] || 'https://picsum.photos/seed/main/800/600'} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute top-8 left-8"><Badge className="bg-white/90 backdrop-blur-sm text-black border-none font-black uppercase py-1.5 px-4 tracking-widest shadow-sm text-[10px]">{renderBadge(property)}</Badge></div>
          </div>
          <div className="hidden md:flex col-span-4 flex-col gap-4">
             <div onClick={() => openGallery(1)} className="flex-1 relative rounded-[2rem] overflow-hidden cursor-pointer shadow-md">
               <Image alt="2" src={displayMidia[1] || 'https://picsum.photos/seed/2/400/300'} fill className="object-cover" />
             </div>
             <div onClick={() => openGallery(2)} className="flex-1 relative rounded-[2rem] overflow-hidden cursor-pointer shadow-md">
               <Image alt="3" src={displayMidia[2] || 'https://picsum.photos/seed/3/400/300'} fill className="object-cover" />
             </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 text-left">
          <div className="lg:col-span-8 space-y-12">
            <div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-tight">{property.informacoesbasicas.nome}</h1>
                <p className="text-2xl text-slate-500 font-medium flex items-center gap-2 mb-8">
                    <span className="material-symbols-outlined text-primary font-bold text-3xl">location_on</span>
                    {property.localizacao.bairro}, {property.localizacao.cidade}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 py-10 border-y border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área Útil</span>
                        <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">square_foot</span> {property.caracteristicasimovel.tamanho}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dormitórios</span>
                        <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vagas</span>
                        <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">directions_car</span> {property.caracteristicasimovel.vagas || 'N/A'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</span>
                        <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">apartment</span> {property.caracteristicasimovel.tipo}
                        </p>
                    </div>
                </div>
            </div>

            {renderPriceSection()}

            <div className="prose prose-slate dark:prose-invert max-w-none text-left">
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-8">Curadoria e Detalhes</h2>
              <div className="text-slate-600 dark:text-slate-400 text-xl leading-relaxed font-light" dangerouslySetInnerHTML={{ __html: property.informacoesbasicas.descricao || '' }} />
            </div>

            {videoEmbedUrl && (
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-8">Apresentação Exclusiva</h2>
                <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-black border border-slate-100 dark:border-slate-800">
                  <iframe src={videoEmbedUrl} title="Apresentação Exclusiva" className="w-full h-full" allowFullScreen></iframe>
                </div>
              </div>
            )}

            {property.areascomuns && property.areascomuns.length > 0 && (
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-10">Diferenciais do Ativo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {property.areascomuns.map(area => (
                            <div key={area} className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-soft group hover:border-primary transition-all">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                </div>
                                <span className="font-bold text-base text-slate-800 dark:text-slate-200">{area}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Seção LOCALIZAÇÃO */}
            {showLocationSection && (
              <div className="text-left space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    LOCALIZAÇÃO
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">location_on</span>
                    {fullAddress}
                  </p>
                </div>

                <Tabs defaultValue="map" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-xs h-12 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-4">
                    <TabsTrigger value="map" className="rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
                      <span className="material-symbols-outlined text-sm">map</span> Mapa
                    </TabsTrigger>
                    <TabsTrigger value="streetview" className="rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
                      <span className="material-symbols-outlined text-sm">streetview</span> Street View
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="map" className="mt-0">
                    <div className="bg-gray-100 dark:bg-slate-900 rounded-[2.5rem] h-[450px] w-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                      {mapSrc ? (
                        <iframe
                          src={mapSrc}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          title="Mapa Google"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                          Mapa não disponível para este endereço.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="streetview" className="mt-0">
                    <div className="bg-gray-100 dark:bg-slate-900 rounded-[2.5rem] h-[450px] w-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative flex items-center justify-center">
                      <StreetViewPanoramaView
                        fullAddress={fullAddress}
                        lat={localizacao?.latitude}
                        lng={localizacao?.longitude}
                        streetViewLink={localizacao?.googleStreetViewLink}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <aside className="sticky top-24 space-y-8">
              <div className="bg-slate-950 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 size-40 bg-primary/10 blur-[80px] -z-0"></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-8 relative z-10">Consultoria Exclusiva</h3>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 relative z-10 text-left">
                  <Input {...form.register('name')} placeholder="Seu nome" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-500" />
                  <Input {...form.register('email')} placeholder="seu@email.com" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-500" />
                  <Input {...form.register('phone')} placeholder="(00) 00000-0000" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-500" />
                  <Button disabled={isSubmitting} className="w-full h-16 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-glow hover:brightness-110 transition-all mt-6">
                    {isSubmitting ? 'Enviando...' : 'Solicitar Atendimento'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setIsWhatsAppModalOpen(true)} 
                    disabled={isSubmitting}
                    className="w-full h-16 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-4"
                  >
                    <span className="material-symbols-outlined text-lg font-bold">chat</span>
                    Conversar pelo WhatsApp
                  </Button>
                </form>
              </div>
            </aside>
          </div>
        </div>

        {similarProperties.length > 0 && (
            <section className="mt-40 text-left">
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Sugestões Domus</span>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Poderão lhe <span className="text-primary italic">interessar</span></h2>
                    </div>
                    <Link className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 hover:text-primary transition-colors" href={searchUrl}>Ver Tudo</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {similarProperties.map(sim => (
                        <Link key={sim.id} href={isPortalAccess ? `/sites/${broker.slug}/imovel/${sim.informacoesbasicas.slug || sim.id}` : `/imovel/${sim.informacoesbasicas.slug || sim.id}`} className="flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft hover:shadow-2xl transition-all group">
                            <div className="relative aspect-square overflow-hidden">
                                <Badge className="absolute top-5 left-5 z-10 bg-white/90 text-black border-none font-black uppercase py-1 px-3 text-[8px] tracking-widest">{renderBadge(sim)}</Badge>
                                <Image alt="Sim" src={sim.midia?.[0] || sim.media?.[0] || 'https://picsum.photos/seed/sim/400/400'} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                            </div>
                            <div className="p-8">
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase truncate mb-2 tracking-tight">{sim.informacoesbasicas.nome}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{sim.localizacao.bairro}, {sim.localizacao.cidade}</p>
                                <p className="text-xl font-black text-primary tracking-tighter">{renderSimPrice(sim)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        )}
      </main>
      <DomusFooter broker={broker as any} />
      <WhatsAppWidget broker={broker} property={property} source="property_whatsapp" />

      <WhatsAppLeadModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        broker={broker}
        property={property}
        source="property_whatsapp"
        origin="whatsapp"
      />
      
      {isGalleryOpen && displayMidia.length > 0 && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <header className="p-6 flex items-center justify-between text-white border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-widest">{selectedImageIndex + 1} / {displayMidia.length}</span>
            <button onClick={closeGallery} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>
          <div className="flex-1 relative flex items-center justify-center p-4">
            <button onClick={() => setSelectedImageIndex(prev => (prev - 1 + displayMidia.length) % displayMidia.length)} className="absolute left-6 p-4 rounded-full bg-white/5 text-white hover:bg-primary hover:text-black transition-all"><span className="material-symbols-outlined text-4xl">chevron_left</span></button>
            <div className="relative h-full w-full flex items-center justify-center">
               <Image alt="Full" src={displayMidia[selectedImageIndex]} fill className="object-contain" />
            </div>
            <button onClick={() => setSelectedImageIndex(prev => (prev + 1) % displayMidia.length)} className="absolute right-6 p-4 rounded-full bg-white/5 text-white hover:bg-primary hover:text-black transition-all"><span className="material-symbols-outlined text-4xl">chevron_right</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
