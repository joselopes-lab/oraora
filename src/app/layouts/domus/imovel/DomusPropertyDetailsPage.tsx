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
import { useRouter, notFound } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WhatsAppWidget } from '@/app/sites/urban-padrao/components/WhatsAppWidget';
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

type DomusPropertyDetailsPageProps = {
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

export default function DomusPropertyDetailsPage({ broker, property, similarProperties }: DomusPropertyDetailsPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const content = broker.homepage || {};

  const radarListDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'radarLists', user.uid) : null),
      [user, firestore]
  );
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
      source: 'Contato Detalhes Imóvel (Domus)',
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

  const extractMapSrc = (linkOrIframe: string | undefined): string | null => {
    if (!linkOrIframe) return null;
    const iframeMatch = linkOrIframe.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    return null;
  };

  const mapSrc = extractMapSrc(property.localizacao.googleMapsLink);

  const dynamicStyles = {
    '--background': broker.backgroundColor || '90 20% 97%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '97 78% 56%',
    '--cta-button-bg': content.ctaButtonBgColor ? `hsl(${content.ctaButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-button-text': content.ctaButtonTextColor ? `hsl(${content.ctaButtonTextColor})` : 'hsl(var(--secondary))',
    '--cta-section-bg': content.ctaSectionBgColor ? `hsl(${content.ctaSectionBgColor})` : 'hsl(var(--secondary))',
    '--cta-section-title': content.ctaSectionTitleColor ? `hsl(${content.ctaSectionTitleColor})` : '#fff',
    '--cta-section-subtitle': content.ctaSectionSubtitleColor ? `hsl(${content.ctaSectionSubtitleColor})` : 'rgba(255,255,255,0.6)',
    '--cta-section-button-bg': content.ctaSectionButtonBgColor ? `hsl(${content.ctaSectionButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-section-button-text': content.ctaSectionButtonTextColor ? `hsl(${content.ctaSectionButtonTextColor})` : 'hsl(var(--secondary))',
    '--map-section-bg': content.mapSectionBgColor ? `hsl(${content.mapSectionBgColor})` : '#f3f4f1',
    '--map-title-color': content.mapTitleColor ? `hsl(${content.mapTitleColor})` : '#111827',
    '--map-text-color': content.mapTextColor ? `hsl(${content.mapTextColor})` : '#4b5563',
    '--map-button-bg': content.mapButtonBgColor ? `hsl(${content.mapButtonBgColor})` : '#1e293b',
    '--map-button-text': content.mapButtonTextColor ? `hsl(${content.mapButtonTextColor})` : '#ffffff',
  } as React.CSSProperties;

  const cardTitleColor = content.cardTitleColor ? hslToHex(content.cardTitleColor) : undefined;
  const cardValueColor = content.cardValueColor ? hslToHex(content.cardValueColor) : undefined;
  const cardIconColor = content.cardIconColor ? hslToHex(content.cardIconColor) : undefined;
  const statusTagBgColor = content.statusTagBgColor ? hslToHex(content.statusTagBgColor) : undefined;
  const statusTagTextColor = content.statusTagTextColor ? hslToHex(content.statusTagTextColor) : undefined;

  const whatsappLink = broker.whatsappUrl?.replace('wa.me.com.br', 'wa.me') || '#';

  return (
    <div style={dynamicStyles} className="domus-theme font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <style jsx>{`
        .sticky-card { top: 100px; }
        .neon-glow:hover { box-shadow: 0 0 20px rgba(0, 255, 0, 0.4); }
      `}</style>
      
      <DomusHeader broker={broker as any} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Actions */}
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-medium">Voltar para listagem</span>
          </button>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button 
                onClick={(e) => handleRadarToggle(e, property.id)}
                className={cn(
                    "p-2 border border-slate-200 dark:border-slate-800 rounded-full transition-colors shadow-sm",
                    isSaved ? "bg-primary/10 border-primary text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400"
                )}
            >
              <span className={cn("material-symbols-outlined", isSaved && "text-red-500")}>
                {isSaved ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <section className="grid grid-cols-12 gap-4 mb-12 md:h-[550px]">
          <div onClick={() => openGallery(0)} className="col-span-12 md:col-span-8 relative overflow-hidden rounded-2xl group cursor-pointer shadow-xl aspect-[4/3] md:aspect-auto">
            <Image 
                alt={property.informacoesbasicas.nome} 
                src={property.midia?.[0] || 'https://picsum.photos/seed/main/800/600'} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-6 left-6 flex gap-2">
              <span className="bg-primary text-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Destaque Premium</span>
              <span className="bg-white/90 backdrop-blur-sm text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">{property.informacoesbasicas.status}</span>
            </div>
          </div>
          <div className="hidden md:flex col-span-4 flex-col gap-4">
            <div onClick={() => openGallery(1)} className="flex-1 overflow-hidden rounded-2xl relative cursor-pointer">
              <Image alt="Interior" src={property.midia?.[1] || 'https://picsum.photos/seed/side1/400/300'} fill className="object-cover" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div onClick={() => openGallery(2)} className="overflow-hidden rounded-2xl relative cursor-pointer">
                <Image alt="Cozinha" src={property.midia?.[2] || 'https://picsum.photos/seed/side2/200/300'} fill className="object-cover" />
              </div>
              <div onClick={() => openGallery(3)} className="overflow-hidden rounded-2xl relative group cursor-pointer shadow-lg">
                <Image alt="Lazer" src={property.midia?.[3] || 'https://picsum.photos/seed/side3/200/300'} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <span className="text-white font-bold text-sm">+{Math.max(0, property.midia.length - 4)} fotos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Info Column */}
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-10">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                <div className="max-w-full overflow-hidden">
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-2 uppercase tracking-tight break-words leading-tight">{property.informacoesbasicas.nome}</h1>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-primary text-xl font-bold">location_on</span>
                    <span className="text-lg">{property.localizacao.bairro}, {property.localizacao.cidade} - {property.localizacao.estado}</span>
                  </div>
                </div>
                <div className="md:text-right bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0 max-w-full">
                  <span className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Investimento</span>
                  <span className="text-2xl md:text-4xl font-extrabold text-primary neon-glow block truncate">
                    {property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Consulte'}
                  </span>
                </div>
              </div>

              {/* Technical Attributes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 py-8 border-y border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-lg sm:text-xl">square_foot</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Área</span>
                    <span className="font-bold text-xs sm:text-sm truncate block">{property.caracteristicasimovel.tamanho}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-lg sm:text-xl">bed</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quartos</span>
                    <span className="font-bold text-xs sm:text-sm truncate block">{formatQuartos(property.caracteristicasimovel.quartos)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-lg sm:text-xl">directions_car</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vagas</span>
                    <span className="font-bold text-xs sm:text-sm truncate block">{property.caracteristicasimovel.vagas || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-lg sm:text-xl">shower</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Banheiros</span>
                    <span className="font-bold text-xs sm:text-sm truncate block">N/A</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Descrição do Imóvel
              </h3>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: property.informacoesbasicas.descricao || '' }} />
            </div>

            {/* Amenities */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Comodidades do Condomínio
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                {property.areascomuns?.map((item) => (
                  <div key={item} className="flex items-center gap-3 group">
                    <span className="material-symbols-outlined text-primary transition-transform group-hover:scale-110">check_circle</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Localização</h3>
              <div className="w-full h-[300px] sm:h-[400px] rounded-3xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative border border-slate-100 dark:border-slate-800 shadow-inner" style={{ backgroundColor: 'var(--map-section-bg)' }}>
                {mapSrc ? (
                    <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" className="grayscale dark:invert opacity-70" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <span className="material-symbols-outlined text-5xl">map</span>
                        <p>Mapa não configurado</p>
                    </div>
                )}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center flex-col gap-4 p-8 text-center">
                  <h4 className="text-2xl font-extrabold" style={{ color: 'var(--map-title-color)' }}>Encontre imóveis perto de você</h4>
                  <p className="text-sm max-w-sm font-medium" style={{ color: 'var(--map-text-color)' }}>Utilize nosso mapa interativo para explorar as melhores oportunidades nas regiões mais valorizadas.</p>
                  <div className="mt-2">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/20 rounded-full animate-ping absolute -top-2 -left-2"></div>
                      <span className="material-symbols-outlined text-primary text-5xl relative z-10 font-bold">location_on</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">info</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  A localização exata será fornecida após o agendamento da visita.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Lead Form Column */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky-card lg:sticky space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-2xl font-black mb-6 tracking-tight uppercase">Agendar Visita</h4>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <Input { ...form.register('name') } className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-medium text-slate-900 dark:text-white" placeholder="Seu nome" />
                    {form.formState.errors.name && <p className="text-xs text-red-500 px-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <Input { ...form.register('email') } className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-medium text-slate-900 dark:text-white" placeholder="seu@email.com" type="email" />
                    {form.formState.errors.email && <p className="text-xs text-red-500 px-1">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                    <Input { ...form.register('phone') } className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-medium text-slate-900 dark:text-white" placeholder="(00) 00000-0000" type="tel" />
                    {form.formState.errors.phone && <p className="text-xs text-red-500 px-1">{form.formState.errors.phone.message}</p>}
                  </div>
                  <button disabled={isSubmitting} className="w-full bg-black dark:bg-primary text-white dark:text-secondary font-black py-4 rounded-2xl hover:opacity-90 transition-all mt-4 flex items-center justify-center gap-2 uppercase text-[10px] sm:text-xs tracking-[0.1em] h-14" type="submit" style={{ color: 'var(--secondary)' }}>
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                    {isSubmitting ? 'SOLICITANDO...' : 'SOLICITAR AGENDAMENTO'}
                  </button>
                </form>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white dark:bg-slate-900 px-4 text-slate-400">ou</span></div>
                </div>
                <a className="w-full bg-primary text-secondary font-black py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 uppercase text-xs tracking-[0.1em] h-14" href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>
                  <span className="material-symbols-outlined text-lg">chat</span>
                  FALAR NO WHATSAPP
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        <section className="py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">Destaques</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold">Imóveis Semelhantes</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Explore outras opções na região que também podem te agradar.</p>
            </div>
            <Link href={`/sites/${broker.slug}/search`} className="font-bold text-primary hover:underline flex items-center gap-2">
              Ver todos <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProperties.map(sim => {
                const isTargetSaved = savedPropertyIds.includes(sim.id);
                const quartos = sim.caracteristicasimovel.quartos;
                return (
                  <Link key={sim.id} href={`/sites/${broker.slug}/imovel/${sim.informacoesbasicas.slug || sim.id}`} className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-transparent shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden">
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
                            {sim.informacoesbasicas.status}
                        </div>
                        <button onClick={(e) => handleRadarToggle(e, sim.id)} className={cn("absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-black hover:text-red-500 hover:bg-white transition-colors", isTargetSaved && "text-primary bg-white")}>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isTargetSaved ? "'FILL' 1" : "" }}>radar</span>
                        </button>
                        <Image alt={sim.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={sim.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                            {sim.informacoesbasicas.valor && (
                            <p className="text-white font-bold text-2xl tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sim.informacoesbasicas.valor)}
                            </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1" style={{color: cardTitleColor}}>{sim.informacoesbasicas.nome}</h3>
                            <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                {sim.localizacao.bairro}, {sim.localizacao.cidade}
                            </p>
                        </div>
                        <div className="flex items-center justify-between border-y border-gray-100 py-3 mt-1">
                            {sim.caracteristicasimovel.quartos && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]" style={{color: cardIconColor}}>bed</span>
                                    <span className="text-sm font-semibold text-[#111418]">{formatQuartos(sim.caracteristicasimovel.quartos)}</span>
                                </div>
                            )}
                            <div className="w-px h-4 bg-gray-200"></div>
                             {sim.caracteristicasimovel.vagas && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]" style={{color: cardIconColor}}>shower</span>
                                    <span className="text-sm font-semibold text-[#111418]">{sim.caracteristicasimovel.vagas}</span>
                                </div>
                             )}
                             <div className="w-px h-4 bg-gray-200"></div>
                            {sim.caracteristicasimovel.tamanho && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]" style={{color: cardIconColor}}>square_foot</span>
                                    <span className="text-sm font-semibold text-[#111418]">{sim.caracteristicasimovel.tamanho}</span>
                                </div>
                            )}
                        </div>
                    </div>
                  </Link>
                )
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20">
            <div className="rounded-[2.5rem] p-6 sm:p-12 md:p-20 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--cta-section-bg)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10 max-w-[800px] mx-auto flex flex-col gap-6 sm:gap-8 items-center">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight tracking-tight px-2" style={{ color: 'var(--cta-section-title)' }}>{content.ctaTitle || 'Pronto para encontrar seu próximo lar?'}</h2>
                    <p className="text-base sm:text-xl px-4" style={{ color: 'var(--cta-section-subtitle)' }}>{content.ctaSubtitle || 'Agende uma consultoria personalizada agora mesmo via WhatsApp.'}</p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto px-4">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-3 rounded-full h-16 px-10 text-lg font-black shadow-lg hover:scale-[1.05] transition-all uppercase tracking-widest" style={{ backgroundColor: 'var(--cta-section-button-bg)', color: 'var(--cta-section-button-text)' }}>
                            <span className="material-symbols-outlined font-bold">chat</span>
                            FALAR NO WHATSAPP
                        </a>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <DomusFooter broker={broker as any} />
      <WhatsAppWidget brokerId={broker.id} />

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
            <header className="p-6 flex items-center justify-between text-white border-b border-white/10">
                <h3 className="font-bold text-lg uppercase tracking-tight truncate mr-4">{property.informacoesbasicas.nome}</h3>
                <button onClick={closeGallery} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </header>
            <div className="flex-1 relative p-4 flex items-center justify-center">
                <button onClick={() => setSelectedImageIndex(prev => (prev - 1 + property.midia.length) % property.midia.length)} className="absolute left-4 z-10 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-primary hover:text-black transition-all text-white">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
                    <Image 
                        alt="Foto do imóvel" 
                        src={property.midia[selectedImageIndex]} 
                        fill 
                        className="object-contain"
                        priority
                    />
                </div>
                <button onClick={() => setSelectedImageIndex(prev => (prev + 1) % property.midia.length)} className="absolute right-4 z-10 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-primary hover:text-black transition-all text-white">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
            <footer className="p-6 bg-black/80 backdrop-blur-xl border-t border-white/10">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
                    {property.midia.map((img, idx) => (
                        <div key={idx} onClick={() => setSelectedImageIndex(idx)} className={cn("relative size-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0", selectedImageIndex === idx ? 'border-primary scale-110' : 'border-transparent opacity-50')}>
                            <Image alt="Miniatura" src={img} fill className="object-cover" />
                        </div>
                    ))}
                </div>
            </footer>
        </div>
      )}
    </div>
  );
}
