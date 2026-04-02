'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../../components/UrbanPadraoFooter';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useRouter, notFound } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppWidget } from '../../components/WhatsAppWidget';
import { Badge } from '@/components/ui/badge';


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
    descricao?: string;
    slug?: string;
    condominio?: number;
    iptu?: number;
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
    suites?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
  areascomuns?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

type PropertyDetailsPageProps = {
  broker: Broker;
  property: Property;
  similarProperties: Property[];
};

const leadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'O telefone é obrigatório'),
  message: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

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

export default function PropertyDetailsPage({ broker, property, similarProperties }: PropertyDetailsPageProps) {
  const { informacoesbasicas, midia, caracteristicasimovel, localizacao, areascomuns, youtubeVideoUrl } = property;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  
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


  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  useEffect(() => {
    if (informacoesbasicas?.nome) {
      form.reset({
        message: `Olá, gostaria de mais informações sobre ${informacoesbasicas.nome}...`
      })
    }
  }, [informacoesbasicas?.nome, form]);
  
  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: broker.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: informacoesbasicas.nome,
      message: data.message,
      source: 'Formulário de Contato do Imóvel',
    });

    if (result.success) {
      toast({
        title: 'Mensagem Enviada!',
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: result.message,
      });
    }
    setIsSubmitting(false);
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
    const dataAsString = Array.isArray(quartosData) ? quartosData.join(' ') : String(quartosData);
    const numbers = dataAsString.match(/\d+/g);
    if (!numbers || numbers.length === 0) return dataAsString.trim() || 'N/A';
    const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (uniqueNumbers.length === 0) return 'N/A';
    if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
    const last = uniqueNumbers.pop();
    return `${uniqueNumbers.join(', ')} e ${last}`;
  };

  const extractMapSrc = (linkOrIframe: string | undefined): string | null => {
    if (!linkOrIframe) return null;
    const iframeMatch = linkOrIframe.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    return null;
  };
  
  const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1]?.split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('/').pop()?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return null;
  };

  const videoEmbedUrl = getYoutubeEmbedUrl(youtubeVideoUrl);
  const mapSrc = extractMapSrc(localizacao?.googleMapsLink);
  const streetViewSrc = extractMapSrc(localizacao?.googleStreetViewLink);
  const content = broker.homepage || {};
  const statusTagBgColor = content.statusTagBgColor ? hslToHex(content.statusTagBgColor) : undefined;
  const statusTagTextColor = content.statusTagTextColor ? hslToHex(content.statusTagTextColor) : undefined;
  const cardTitleColor = content.cardTitleColor ? hslToHex(content.cardTitleColor) : undefined;
  const cardValueColor = content.cardValueColor ? hslToHex(content.cardValueColor) : undefined;
  const cardIconColor = content.cardIconColor ? hslToHex(content.cardIconColor) : undefined;

  const dynamicStyles: React.CSSProperties = {
    '--background': broker.backgroundColor,
    '--foreground': broker.foregroundColor,
    '--primary': broker.primaryColor,
    '--secondary': broker.secondaryColor,
    '--accent': broker.accentColor,
  } as any;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col group/design-root bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
      <UrbanPadraoHeader broker={broker} />
      <main className="flex-1 w-full flex flex-col items-center pb-20">
        <div className="w-full bg-white py-4 border-b border-[#f0f2f4]">
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <nav className="flex text-sm text-text-muted mb-4">
              <a className="hover:text-primary mr-2" href={`/sites/${broker.slug}`}>Início</a> /
              <a className="hover:text-primary mx-2" href={`/sites/${broker.slug}/search`}>Imóveis</a> /
              <span className="text-text-main font-medium ml-2">{informacoesbasicas.nome}</span>
            </nav>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-semibold uppercase text-text-main leading-tight">{informacoesbasicas.nome}</h1>
                <p className="text-text-muted flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  {localizacao.bairro}, {localizacao.cidade} - {localizacao.estado}
                </p>
              </div>
              <div className="flex flex-col items-end">
                {informacoesbasicas.valor && (
                  <span className="text-3xl font-black text-primary drop-shadow-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(informacoesbasicas.valor)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <section className="w-full max-w-[1280px] px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[500px]">
            <div onClick={() => openGallery(0)} className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft h-full">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${midia?.[0] || ''}")` }}></div>
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2 hover:bg-black/80 transition-colors">
                <span className="material-symbols-outlined text-base">photo_camera</span> Ver fotos
              </div>
              <div 
                className={cn("absolute top-4 left-4 z-10 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm", !statusTagBgColor && "bg-primary text-black")}
                style={{ backgroundColor: statusTagBgColor, color: statusTagTextColor }}
              >
                {informacoesbasicas.status}
              </div>
            </div>
            {midia.slice(1, 5).map((img, idx) => (
              <div key={idx} onClick={() => openGallery(idx + 1)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
                <Image alt="img" src={img} fill className="object-cover transition-transform duration-700 group-hover:scale-105"/>
              </div>
            ))}
          </div>
        </section>

        <div className="w-full max-w-[1280px] px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-primary text-3xl">square_foot</span>
                <span className="text-2xl font-black text-text-main">{caracteristicasimovel.tamanho}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Área Útil</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100 pl-6 w-full">
                <span className="material-symbols-outlined text-primary text-3xl">bed</span>
                <span className="text-2xl font-black text-text-main">{formatQuartos(caracteristicasimovel.quartos)}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Quartos</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100 pl-6 w-full">
                <span className="material-symbols-outlined text-primary text-3xl">garage_home</span>
                <span className="text-2xl font-black text-text-main">{caracteristicasimovel.vagas}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Vagas</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="px-4 py-2 bg-gray-50">{formatQuartos(caracteristicasimovel.quartos)} Quartos</Badge>
                <Badge variant="outline" className="px-4 py-2 bg-gray-50">{caracteristicasimovel.vagas} Vagas</Badge>
                <Badge variant="outline" className="px-4 py-2 bg-gray-50">{caracteristicasimovel.tamanho} úteis</Badge>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main mb-4">Sobre o Imóvel</h2>
              <div className="prose text-text-muted max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: informacoesbasicas?.descricao || '' }} />
            </div>
            {videoEmbedUrl && (
              <div>
                <h2 className="text-2xl font-bold text-text-main mb-4">Vídeo Tour</h2>
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-soft">
                  <iframe src={videoEmbedUrl} title="Video Tour" className="w-full h-full" allowFullScreen></iframe>
                </div>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-text-main mb-6">Diferenciais</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {areascomuns?.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-text-muted">
                    <span className="material-symbols-outlined text-secondary">check_circle</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {(mapSrc || streetViewSrc) && (
                <div>
                  <h2 className="text-2xl font-bold text-text-main mb-4">Localização</h2>
                  <Tabs defaultValue="map" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-gray-100 rounded-xl">
                          <TabsTrigger value="map" className="rounded-lg font-bold flex items-center gap-2 transition-all">
                              <span className="material-symbols-outlined">map</span> Mapa
                          </TabsTrigger>
                          <TabsTrigger value="streetview" className="rounded-lg font-bold flex items-center gap-2 transition-all">
                              <span className="material-symbols-outlined">streetview</span> Street View
                          </TabsTrigger>
                      </TabsList>
                      <TabsContent value="map">
                        <div className="bg-gray-100 rounded-xl h-[400px] w-full overflow-hidden mt-4">
                          {mapSrc ? <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }}></iframe> : <div className="flex items-center justify-center h-full">Mapa não disponível</div>}
                        </div>
                      </TabsContent>
                      <TabsContent value="streetview">
                        <div className="bg-gray-100 rounded-xl h-[400px] w-full overflow-hidden mt-4">
                          {streetViewSrc ? <iframe src={streetViewSrc} width="100%" height="100%" style={{ border: 0 }}></iframe> : <div className="flex items-center justify-center h-full">Street View não disponível</div>}
                        </div>
                      </TabsContent>
                    </Tabs>
                </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-float p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-text-main mb-4">Agendar Visita</h3>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                  <input {...form.register('name')} className="w-full h-12 px-4 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm" placeholder="Seu nome" />
                  <input {...form.register('email')} className="w-full h-12 px-4 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm" placeholder="E-mail" />
                  <input {...form.register('phone')} className="w-full h-12 px-4 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm" placeholder="Telefone" />
                  <textarea {...form.register('message')} className="w-full rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary bg-gray-50 resize-none h-32 p-3"></textarea>
                  <Button disabled={isSubmitting} type="submit" className="w-full h-12 bg-black text-white font-bold hover:bg-gray-900 shadow-lg">
                    {isSubmitting ? 'Enviando...' : 'Falar com Corretor'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <section className="w-full max-w-[1280px] px-6 mt-20 mb-[35px]">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-main">Imóveis Semelhantes</h2>
            <p className="text-text-muted mt-2">Explore outras opções que também podem te agradar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProperties.map(similarProperty => {
                const isSaved = savedPropertyIds.includes(similarProperty.id);
                const quartos = similarProperty.caracteristicasimovel.quartos;
                return (
                  <Link key={similarProperty.id} href={`/sites/${broker.slug}/imovel/${similarProperty.informacoesbasicas.slug || similarProperty.id}`} className="group relative flex flex-col rounded-2xl bg-white border border-transparent shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                        <div 
                            className={cn(
                                "absolute top-3 left-3 z-10 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide shadow-sm",
                                !statusTagBgColor && "bg-primary text-black"
                            )}
                            style={{
                                backgroundColor: statusTagBgColor,
                                color: statusTagTextColor
                            }}
                        >
                            {similarProperty.informacoesbasicas.status}
                        </div>
                        <button onClick={(e) => handleRadarClick(e, similarProperty.id)} className={cn("absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-black hover:text-red-500 hover:bg-white transition-colors", isSaved && "text-primary bg-white")}>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "" }}>radar</span>
                        </button>
                        <Image alt={similarProperty.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={similarProperty.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                            {similarProperty.informacoesbasicas.valor && (
                            <p className="text-white font-bold text-2xl tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(similarProperty.informacoesbasicas.valor)}
                            </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1" style={{color: cardTitleColor}}>{similarProperty.informacoesbasicas.nome}</h3>
                            <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                {similarProperty.localizacao.bairro}, {similarProperty.localizacao.cidade}
                            </p>
                        </div>
                        <div className="flex items-center justify-between border-y border-gray-100 py-3 mt-1">
                            {similarProperty.caracteristicasimovel.quartos && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]" style={{color: cardIconColor}}>bed</span>
                                    <span className="text-sm font-semibold text-[#111418]">{formatQuartos(similarProperty.caracteristicasimovel.quartos)}</span>
                                </div>
                            )}
                            <div className="w-px h-4 bg-gray-200"></div>
                             {similarProperty.caracteristicasimovel.vagas && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]" style={{color: cardIconColor}}>shower</span>
                                    <span className="text-sm font-semibold text-[#111418]">{similarProperty.caracteristicasimovel.vagas}</span>
                                </div>
                             )}
                             <div className="w-px h-4 bg-gray-200"></div>
                            {similarProperty.caracteristicasimovel.tamanho && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]" style={{color: cardIconColor}}>square_foot</span>
                                    <span className="text-sm font-semibold text-[#111418]">{similarProperty.caracteristicasimovel.tamanho}</span>
                                </div>
                            )}
                        </div>
                    </div>
                  </Link>
                )
            })}
          </div>
        </section>
      </main>
      <UrbanPadraoFooter broker={broker} />
      <WhatsAppWidget brokerId={broker.id} />

      {isGalleryOpen && midia && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <span className="text-white text-sm font-bold">{selectedImageIndex + 1} / {midia.length}</span>
            <button onClick={closeGallery} className="size-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4">
            <button onClick={() => setSelectedImageIndex(prev => (prev - 1 + midia.length) % midia.length)} className="absolute left-4 p-2 text-white hover:text-primary transition-colors"><span className="material-symbols-outlined text-4xl">chevron_left</span></button>
            <div className="relative max-h-full max-w-full"><img alt="Gallery" className="max-h-[80vh] w-auto object-contain" src={midia[selectedImageIndex]} /></div>
            <button onClick={() => setSelectedImageIndex(prev => (prev + 1) % midia.length)} className="absolute right-4 p-2 text-white hover:text-primary transition-colors"><span className="material-symbols-outlined text-4xl">chevron_right</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
