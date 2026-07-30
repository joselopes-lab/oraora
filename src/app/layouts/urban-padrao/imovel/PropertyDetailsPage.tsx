
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreetViewPanoramaView } from '@/components/StreetViewPanorama';
import { WhatsAppWidget } from '../components/WhatsAppWidget';
import { WhatsAppLeadModal } from '@/components/WhatsAppLeadModal';
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
};

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    condominio?: number;
    iptu?: number;
    transactionTypes?: string[];
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
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

export default function PropertyDetailsPage({ broker, property, similarProperties }: { broker: Broker; property: Property; similarProperties: Property[] }) {
  const { informacoesbasicas, midia, caracteristicasimovel, localizacao, areascomuns, youtubeVideoUrl } = property;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [streetViewAvailable, setStreetViewAvailable] = useState<boolean>(true);
  
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const isPortalAccess = pathname.startsWith('/sites');

  const radarListDocRef = useMemoFirebase(() => (user ? doc(firestore, 'radarLists', user.uid) : null), [user, firestore]);
  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];
  const isSaved = savedPropertyIds.includes(property.id);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', email: '', phone: '', message: `Olá, gostaria de saber mais sobre ${informacoesbasicas.nome}...` },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: broker.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: informacoesbasicas.nome,
      message: data.message,
      source: 'property_form',
      origin: 'form',
    });
    if (result.success) {
      toast({ title: 'Mensagem Enviada!' });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
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

  const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { router.push('/radar'); return; }
    if (!firestore) return;
    const docRef = doc(firestore, 'radarLists', user.uid);
    if (savedPropertyIds.includes(propertyId)) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido!" });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Salvo!" });
    }
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    const data = Array.isArray(quartosData) ? quartosData : [String(quartosData)];
    return data.length === 1 && data[0] === '1' ? '1 Quarto' : `${data.join(', ')} Quartos`;
  };

  const fmt = (v: number | undefined) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v) : null;

  const renderPriceSection = () => {
    const types = informacoesbasicas.transactionTypes || ['sale'];
    const salePrice = informacoesbasicas.salePrice || informacoesbasicas.valor;
    const rentPrice = informacoesbasicas.rentPrice;
    const condo = informacoesbasicas.condominio;
    const iptu = informacoesbasicas.iptu;

    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft text-left space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {types.includes('sale') && (
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor de Venda</span>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{fmt(salePrice)}</p>
                </div>
            )}
            {types.includes('rent') && (
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor de Aluguel</span>
                    <p className="text-4xl font-black text-primary">{fmt(rentPrice)}<span className="text-lg font-bold ml-1">/mês</span></p>
                </div>
            )}
        </div>
        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condomínio</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">{fmt(condo) || 'Consultar'}</p>
            </div>
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">IPTU (Anual)</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">{fmt(iptu) || 'Consultar'}</p>
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

  const extractMapSrc = (input: string | undefined): string | null => {
    if (!input) return null;
    const iframeMatch = input.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    if (input.startsWith('http')) return input;
    return null;
  };

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
    '--background': broker.backgroundColor,
    '--foreground': broker.foregroundColor,
    '--primary': broker.primaryColor,
    '--secondary': broker.secondaryColor,
    '--accent': broker.accentColor,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <UrbanPadraoHeader broker={broker} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Actions */}
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-bold uppercase text-xs tracking-widest">Voltar</span>
          </button>
          <div className="flex gap-3">
             <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("flex items-center justify-center size-10 rounded-full bg-white border border-slate-100 shadow-sm transition-all", isSaved ? "text-primary border-primary" : "text-slate-400 hover:text-primary")}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "" }}>radar</span>
             </button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-12 h-[300px] md:h-[500px]">
          <div onClick={() => openGallery(0)} className="md:col-span-8 relative rounded-[2rem] overflow-hidden group cursor-pointer shadow-xl h-full">
            <Image alt="Main" src={midia?.[0] || 'https://picsum.photos/seed/main/800/600'} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute top-6 left-6 z-10"><Badge className="bg-white/90 backdrop-blur-sm text-black border-none font-bold uppercase py-1 px-4 tracking-widest shadow-sm">{renderBadge(property)}</Badge></div>
          </div>
          <div className="hidden md:flex md:col-span-4 flex-col gap-4">
             <div onClick={() => openGallery(1)} className="flex-1 relative rounded-[1.5rem] overflow-hidden cursor-pointer shadow-md"><Image alt="2" src={midia?.[1] || 'https://picsum.photos/seed/2/400/300'} fill className="object-cover" /></div>
             <div onClick={() => openGallery(2)} className="flex-1 relative rounded-[1.5rem] overflow-hidden cursor-pointer shadow-md"><Image alt="3" src={midia?.[2] || 'https://picsum.photos/seed/3/400/300'} fill className="object-cover" /></div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          <div className="lg:col-span-8 space-y-10">
            <div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-tight">{informacoesbasicas.nome}</h1>
                <p className="text-xl text-slate-500 font-medium flex items-center gap-2 mb-8">
                    <span className="material-symbols-outlined text-primary font-bold">location_on</span>
                    {localizacao.bairro}, {localizacao.cidade}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área Útil</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">square_foot</span> {caracteristicasimovel.tamanho}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dormitórios</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">bed</span> {formatQuartos(caracteristicasimovel.quartos)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vagas</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">directions_car</span> {caracteristicasimovel.vagas || 'N/A'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">verified</span> {informacoesbasicas.status}
                        </p>
                    </div>
                </div>
            </div>

            {renderPriceSection()}

            <div className="prose prose-slate dark:prose-invert max-w-none text-left">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6">Sobre o Ativo</h2>
              <div className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: informacoesbasicas.descricao || '' }} />
            </div>

            {areascomuns && areascomuns.length > 0 && (
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-8">Diferenciais e Lazer</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {areascomuns.map(area => (
                            <div key={area} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-primary transition-all">
                                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">check_circle</span>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{area}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Seção LOCALIZAÇÃO */}
            {showLocationSection && (
              <div className="text-left space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
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
                    <div className="bg-gray-100 dark:bg-slate-900 rounded-[2rem] h-[450px] w-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
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
                    <div className="bg-gray-100 dark:bg-slate-900 rounded-[2rem] h-[450px] w-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative flex items-center justify-center">
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
            <aside className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-left">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Agendar Visita</h3>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <Input {...form.register('name')} placeholder="Seu nome" className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl" />
                  <Input {...form.register('email')} placeholder="seu@email.com" className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl" />
                  <Input {...form.register('phone')} placeholder="(00) 00000-0000" className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl" />
                  <Textarea {...form.register('message')} placeholder="Sua mensagem..." rows={4} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl resize-none" />
                  <Button disabled={isSubmitting} className="w-full h-14 bg-black dark:bg-primary text-white dark:text-black font-black uppercase tracking-widest text-xs shadow-lg mt-4">
                    {isSubmitting ? 'Enviando...' : 'Solicitar Atendimento'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setIsWhatsAppModalOpen(true)} 
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black uppercase tracking-widest text-xs shadow-lg mt-4 flex items-center justify-center gap-2"
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
            <section className="mt-32 text-left">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">Destaques Semelhantes</span>
                        <h2 className="text-4xl font-black uppercase tracking-tight">Poderão te <span className="text-primary italic">agradar</span></h2>
                    </div>
                    <Link className="font-bold text-slate-900 dark:text-primary hover:underline" href={searchUrl}>Ver tudo</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {similarProperties.map(sim => (
                        <Link key={sim.id} href={isPortalAccess ? `/sites/${broker.slug}/imovel/${sim.id}` : `/imovel/${sim.id}`} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft hover:shadow-xl transition-all group">
                            <div className="relative aspect-square overflow-hidden">
                                <Badge className="absolute top-4 left-4 z-10 bg-white/90 text-black border-none font-bold uppercase py-1 px-3 text-[9px] tracking-widest">{renderBadge(sim)}</Badge>
                                <Image alt="Sim" src={sim.midia?.[0] || 'https://picsum.photos/seed/sim/400/400'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white uppercase truncate mb-1">{sim.informacoesbasicas.nome}</h3>
                                <p className="text-xs text-slate-400 font-medium mb-4">{sim.localizacao.bairro}, {sim.localizacao.cidade}</p>
                                <p className="text-lg font-black text-primary">{renderSimPrice(sim)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        )}
      </main>
      <UrbanPadraoFooter broker={broker} />
      <WhatsAppWidget broker={broker} property={property} source="property_whatsapp" />

      <WhatsAppLeadModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        broker={broker}
        property={property}
        source="property_whatsapp"
        origin="whatsapp"
      />
    </div>
  );
}
