
'use client';
/**
 * @fileOverview Página de detalhes do imóvel no dashboard administrativo.
 */
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useMemo } from 'react';
import { resolveConstructorByBuilderId } from '@/services/constructorResolutionService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BarChart3, ArrowLeft, Edit, Images, ImageIcon, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AlertDialog } from "@/components/ui/alert-dialog";
import { isAdminUser } from '@/lib/permissions';
import { calculateIdentityFingerprint } from '@/lib/property-identity';
import { getPhysicalIdentityDiagnosticAction, getPropertiesBrokerLinkCheckAction } from '@/app/dashboard/imoveis/actions.server';

type PropertyDoc = {
    id: string;
    builderId: string;
    personaIds?: string[];
    brokerId?: string;
    physicalPropertyId?: string;
    identityFingerprint?: string;
    matchStatus?: 'CONFIRMED' | 'PROBABLE' | 'UNCERTAIN' | 'NEW';
    informacoesbasicas: {
        nome: string;
        status: string;
        valor?: number;
        salePrice?: number;
        rentPrice?: number;
        condominio?: number;
        iptu?: number;
        slug?: string;
        slogan?: string;
        descricao?: string;
        transactionTypes?: string[];
    };
    caracteristicasimovel: {
        tipo: string;
        quartos?: string[] | string;
        tamanho?: string;
        vagas?: string;
    };
    localizacao: {
        address?: string;
        estado: string;
        cidade: string;
        bairro: string;
        googleMapsLink?: string;
        googleStreetViewLink?: string;
        latitude?: number;
        longitude?: number;
    };
    midia: string[];
    youtubeVideoUrl?: string;
    areascomuns: string[];
    proximidades: string[];
    statusobra: {
        fundacao: number;
        estrutura: number;
        alvenaria: number;
        acabamentos: number;
    };
    isVisibleOnSite: boolean;
};

type ConstructorDoc = {
    name: string;
}

type User = {
  userType: 'admin' | 'broker' | 'constructor';
};

type Persona = {
    id: string;
    name: string;
    icon: string;
    iconBackgroundColor: string;
}

export default function PropertyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const { toast } = useToast();

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const openGallery = (index: number) => {
      setSelectedImageIndex(index);
      setIsGalleryOpen(true);
    };
    
    const userDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    const isAdmin = isAdminUser(userProfile?.userType);

    const propertyDocRef = useMemoFirebase(() => (firestore && id ? doc(firestore, 'properties', id) : null), [firestore, id]);
    const { data: propertyData, isLoading: isPropertyLoading } = useDoc<PropertyDoc>(propertyDocRef);

    const [constructorData, setConstructorData] = useState<any | null>(null);
    const [isConstructorLoading, setIsConstructorLoading] = useState(false);

    useEffect(() => {
      if (!firestore || !propertyData?.builderId) {
        setConstructorData(null);
        return;
      }
      let isMounted = true;
      setIsConstructorLoading(true);
      resolveConstructorByBuilderId(firestore, propertyData.builderId)
        .then(res => {
          if (isMounted) setConstructorData(res);
        })
        .finally(() => {
          if (isMounted) setIsConstructorLoading(false);
        });
      return () => { isMounted = false; };
    }, [firestore, propertyData?.builderId]);
    
    const personasQuery = useMemoFirebase(
      () => (firestore && propertyData?.personaIds && propertyData.personaIds.length > 0
          ? query(collection(firestore, 'personas'), where('__name__', 'in', propertyData.personaIds))
          : null),
      [firestore, propertyData]
    );
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const marketReportQuery = useMemoFirebase(
      () => (firestore && propertyData?.localizacao.bairro 
        ? query(collection(firestore, 'marketReports'), orderBy('month', 'desc'), limit(1))
        : null),
      [firestore, propertyData?.localizacao.bairro]
    );
    const { data: latestReports, isLoading: isMarketLoading } = useCollection<any>(marketReportQuery);

    const neighborhoodData = useMemo(() => {
      if (!latestReports || latestReports.length === 0 || !propertyData) return null;
      const report = latestReports[0];
      return report.topNeighborhoods?.find((nb: any) => 
        nb.name.toLowerCase() === propertyData.localizacao.bairro.toLowerCase()
      );
    }, [latestReports, propertyData]);

    const propertyPricePerM2 = useMemo(() => {
      if (!propertyData?.informacoesbasicas.valor || !propertyData?.caracteristicasimovel.tamanho) return 0;
      
      const sanitizedSize = propertyData.caracteristicasimovel.tamanho
        .replace(/\./g, '')
        .replace(',', '.');

      const matches = sanitizedSize.match(/(\d+(?:\.\d+)?)/);
      const area = matches ? parseFloat(matches[0]) : 0;

      if (!area || isNaN(area)) return 0;
      return propertyData.informacoesbasicas.valor / area;
    }, [propertyData]);

    const calculatedFingerprint = useMemo(() => {
      if (!propertyData) return '';
      return propertyData.identityFingerprint || calculateIdentityFingerprint(propertyData);
    }, [propertyData]);

    const [physicalIdentityInfo, setPhysicalIdentityInfo] = useState<{ 
      exists: boolean; 
      physicalPropertyId: string | null; 
      relatedRecords: Array<{ id: string; collection: string; physicalPropertyId: string }> 
    } | null>(null);

    React.useEffect(() => {
      if (calculatedFingerprint) {
        getPhysicalIdentityDiagnosticAction(calculatedFingerprint, id, propertyData?.physicalPropertyId).then((res) => {
          setPhysicalIdentityInfo(res);
        });
      }
    }, [calculatedFingerprint, id, propertyData?.physicalPropertyId]);

    const physicalIdToQuery = propertyData?.physicalPropertyId || physicalIdentityInfo?.physicalPropertyId;
    const linkedPropertiesQuery = useMemoFirebase(
      () => (firestore && physicalIdToQuery ? query(collection(firestore, 'properties'), where('physicalPropertyId', '==', physicalIdToQuery)) : null),
      [firestore, physicalIdToQuery]
    );
    const { data: linkedProperties } = useCollection<any>(linkedPropertiesQuery);

    const [linkCheckData, setLinkCheckData] = useState<Array<{
      propertyId: string;
      propertyName: string;
      physicalPropertyId: string | null;
      brokerMatches: Array<{ id: string; name: string }>;
      portfolioCount: number;
      status: string;
      isConstructorProperty: boolean;
    }>>([]);

    React.useEffect(() => {
      if (isAdmin) {
        getPropertiesBrokerLinkCheckAction().then((res) => {
          if (res.success && res.results) {
            setLinkCheckData(res.results);
          }
        });
      }
    }, [isAdmin]);

    const formatBRL = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);
    };

    const handleGenerateAnalysis = () => {
      if (!neighborhoodData) {
        toast({
          variant: "destructive",
          title: "Dados insuficientes",
          description: "Não foi possível encontrar dados de mercado para este bairro."
        });
        return;
      }
      router.push(`/dashboard/imoveis/${id}/analise`);
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

    const isLoading = isPropertyLoading || isConstructorLoading || isAuthLoading || isProfileLoading || arePersonasLoading || isMarketLoading;
    const canEdit = userProfile?.userType === 'admin' || userProfile?.userType === 'constructor';

    if (isLoading) {
        return <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left"><p className="text-center py-20 text-slate-400 italic">Carregando detalhes do imóvel...</p></main>;
    }

    if (!propertyData) {
        return <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left"><p className="text-center py-20 text-slate-400 italic">Imóvel não encontrado.</p></main>;
    }

    const { informacoesbasicas, localizacao, isVisibleOnSite, areascomuns, youtubeVideoUrl, midia } = propertyData;
    const mapSrc = extractMapSrc(localizacao?.googleMapsLink);
    const videoEmbedUrl = getEmbedUrl(youtubeVideoUrl);

    return (
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left">
          <AlertDialog>
            <nav className="flex mb-6 text-sm font-medium text-text-secondary text-left">
                <Link className="hover:text-text-main" href="/dashboard">Home</Link>
                <span className="mx-2">/</span>
                <Link className="hover:text-text-main" href="/dashboard/imoveis">Imóveis</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main">{informacoesbasicas.nome}</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black tracking-tight text-text-main">{informacoesbasicas.nome}</h1>
                        <Badge className="bg-primary/20 text-green-800 border-none uppercase text-[10px] font-bold">{informacoesbasicas.status}</Badge>
                    </div>
                    <p className="text-text-secondary max-w-2xl">Gestão de ativos imobiliários e análise estratégica de mercado.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.back()} className="px-5 h-11 rounded-xl border-gray-200 text-text-main font-bold text-sm bg-white hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                            <ArrowLeft className="size-4" />
                            Voltar
                        </Button>
                        {canEdit && (
                            <Button asChild variant="outline" className="px-5 h-11 rounded-xl border-primary text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 transition-all flex items-center gap-2 shadow-sm">
                                <Link href={`/dashboard/imoveis/editar/${id}`}>
                                    <Edit className="size-4" />
                                    Editar
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="mb-8 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-6 text-left shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center justify-center size-3 rounded-full bg-amber-500 animate-pulse"></span>
                        <h2 className="text-base font-bold text-amber-900 uppercase tracking-wide">Painel de Diagnóstico de Identidade Física (Admin)</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">1. Document ID</span>
                            <span className="text-slate-900 font-bold truncate block mt-1" title={id}>{id}</span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">2. physicalPropertyId</span>
                            <span className="text-slate-900 font-bold truncate block mt-1" title={propertyData.physicalPropertyId || 'Não gerado'}>
                                {propertyData.physicalPropertyId || 'Não gerado'}
                            </span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">3. identityFingerprint</span>
                            <span className="text-slate-900 font-bold truncate block mt-1" title={calculatedFingerprint}>
                                {calculatedFingerprint || 'N/A'}
                            </span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">4. Coleção de Origem</span>
                            <span className="text-slate-900 font-bold uppercase block mt-1">
                                {propertyData.brokerId ? 'brokerProperties' : 'properties'}
                            </span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">5. Status da Identidade</span>
                            <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1",
                                (propertyData.matchStatus || 'CONFIRMED') === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                (propertyData.matchStatus === 'PROBABLE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                            )}>
                                {propertyData.matchStatus || 'CONFIRMED'}
                            </span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">6. Doc em physicalIdentities</span>
                            <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1",
                                physicalIdentityInfo?.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            )}>
                                {physicalIdentityInfo?.exists ? 'ENCONTRADO' : 'AUSENTE'}
                            </span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">7. ID no Índice Atômico</span>
                            <span className="text-slate-900 font-bold truncate block mt-1" title={physicalIdentityInfo?.physicalPropertyId || 'N/A'}>
                                {physicalIdentityInfo?.physicalPropertyId || 'N/A'}
                            </span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                            <span className="block text-slate-500 text-[10px] font-sans font-semibold uppercase">8. Registros Vinculados</span>
                            <span className="text-slate-900 font-bold block mt-1">
                                {physicalIdentityInfo?.relatedRecords ? physicalIdentityInfo.relatedRecords.length + 1 : 1}
                            </span>
                        </div>
                    </div>

                    {propertyData?.physicalPropertyId && (
                        <div className="mt-6 pt-6 border-t border-amber-200/60">
                            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">Comparação de Identidade</h3>
                            <div className="space-y-2 text-xs font-mono">
                                <div className="bg-white/90 p-3 rounded-xl border border-amber-200/50">
                                    <span className="text-[10px] text-slate-500 block uppercase font-sans">REGISTRO ATUAL</span>
                                    <span className="text-slate-900 font-bold block mt-1">Coleção: {propertyData.brokerId ? 'brokerProperties' : 'properties'}</span>
                                    <span className="text-slate-900 font-bold block mt-0.5">Document ID: {id}</span>
                                    <span className="text-slate-900 font-bold block mt-0.5">physicalPropertyId: {propertyData.physicalPropertyId}</span>
                                </div>
                                <div className="text-center font-bold text-amber-800 py-1 flex items-center justify-center gap-1">
                                    <span>MATCH</span>
                                    <span>↓</span>
                                </div>
                                {physicalIdentityInfo?.relatedRecords && physicalIdentityInfo.relatedRecords.length > 0 ? (
                                    physicalIdentityInfo.relatedRecords.map((linked) => (
                                        <div key={linked.id} className="bg-white/90 p-3 rounded-xl border border-amber-200/50">
                                            <span className="text-[10px] text-slate-500 block uppercase font-sans">REGISTRO RELACIONADO</span>
                                            <span className="text-slate-900 font-bold block mt-1">Coleção: {linked.collection}</span>
                                            <span className="text-slate-900 font-bold block mt-0.5">Document ID: {linked.id}</span>
                                            <span className="text-slate-900 font-bold block mt-0.5">physicalPropertyId: {linked.physicalPropertyId}</span>
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-[10px] font-bold uppercase">✅ MESMA IDENTIDADE FÍSICA</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white/90 p-3 rounded-xl border border-amber-200/50 text-slate-500 italic">
                                        NENHUM OUTRO REGISTRO RELACIONADO
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-amber-200/60">
                        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">TESTE DE VÍNCULO PROPERTIES ↔ BROKERPROPERTIES</h3>
                        <div className="space-y-3 text-xs font-mono">
                            {linkCheckData && linkCheckData.length > 0 ? (
                                linkCheckData.map((item) => (
                                    <div key={item.propertyId} className="bg-white/90 p-4 rounded-xl border border-amber-200/50 shadow-sm space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 text-sm">{item.propertyName}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                !item.physicalPropertyId ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            )}>
                                                {!item.physicalPropertyId ? '🔴 IDENTIDADE AUSENTE' : '🔵 PROPERTIES — IMÓVEL DE CONSTRUTORA'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 mt-2">
                                            <div>
                                                <span className="text-[10px] uppercase font-sans text-slate-500 block">Properties Document ID</span>
                                                <span className="text-slate-900 font-bold truncate block">{item.propertyId}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-sans text-slate-500 block">physicalPropertyId</span>
                                                <span className="text-slate-900 font-bold truncate block">{item.physicalPropertyId || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                                            <span className="text-[10px] uppercase font-sans text-slate-500">Status da Oferta / Carteira</span>
                                            <span className="font-bold text-slate-900">
                                                {item.portfolioCount > 0 ? `🟢 Na carteira de ${item.portfolioCount} corretor(es)` : '🟡 Nenhum corretor adicionou à carteira'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white/90 p-4 rounded-xl border border-amber-200/50 text-slate-500 italic">
                                    Nenhum imóvel encontrado na coleção properties ou aguardando carregamento...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* Photo Gallery Grid */}
                {midia && midia.length > 0 ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
                      {/* Main Cover Image */}
                      <div 
                        onClick={() => openGallery(0)} 
                        className="md:col-span-2 relative h-72 md:h-96 rounded-xl overflow-hidden group cursor-pointer bg-slate-100"
                      >
                        <Image 
                          src={midia[0]} 
                          alt={`${informacoesbasicas.nome} - Foto principal`} 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105" 
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-white text-xs font-bold flex items-center gap-1.5">
                            <Maximize2 className="size-4" /> Ampliar foto
                          </span>
                        </div>
                      </div>

                      {/* Side Secondary Images */}
                      <div className="hidden md:flex flex-col gap-2 h-96">
                        {midia.slice(1, 3).map((imgUrl, idx) => {
                          const isLastItem = idx === 1 && midia.length > 3;
                          const imageIndex = idx + 1;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => openGallery(imageIndex)} 
                              className="relative flex-1 rounded-xl overflow-hidden group cursor-pointer bg-slate-100"
                            >
                              <Image 
                                src={imgUrl} 
                                alt={`${informacoesbasicas.nome} - Foto ${imageIndex + 1}`} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-105" 
                                unoptimized
                              />
                              {isLastItem ? (
                                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-white p-2 text-center group-hover:bg-black/75 transition-colors">
                                  <Images className="size-6 mb-1 text-primary" />
                                  <span className="text-sm font-black">+{midia.length - 3} fotos</span>
                                  <span className="text-[10px] uppercase font-bold text-slate-300">Ver Galeria</span>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="size-5 text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {midia.length === 1 && (
                          <div className="flex-1 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <ImageIcon className="size-8 mb-2 text-slate-500" />
                            <p className="text-xs font-medium">1 foto disponível</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Floating Open Gallery Button */}
                    <Button
                      onClick={() => openGallery(0)}
                      className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2 shadow-lg"
                    >
                      <Images className="size-4 text-primary" />
                      Ver galeria completa ({midia.length} {midia.length === 1 ? 'foto' : 'fotos'})
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 gap-2 h-48 text-center shadow-sm">
                    <ImageIcon className="size-10 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Galeria de Fotos</p>
                    <p className="text-xs text-slate-400">Nenhuma foto cadastrada para este empreendimento.</p>
                  </div>
                )}

                {/* AI Investment Section */}
                <section className="bg-slate-900 rounded-2xl border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -z-0"></div>
                    <div className="p-8 lg:p-10 relative z-10 text-left">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Zap className="size-6 fill-current" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Análise de Investimento IA</h2>
                                </div>
                                <p className="text-slate-400 text-sm">Baseada no m² do empreendimento vs m² médio do bairro {propertyData.localizacao.bairro}.</p>
                            </div>
                            <Button 
                              onClick={handleGenerateAnalysis} 
                              disabled={!neighborhoodData}
                              className="bg-primary hover:bg-primary-hover text-slate-950 font-black h-12 px-8 rounded-xl shadow-glow border-none"
                            >
                                <BarChart3 className="size-4 mr-2" />
                                Gerar Análise Completa
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-left">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Preço do Ativo</span>
                                <div className="text-2xl font-bold text-white">R$ {formatBRL(propertyPricePerM2)} /m²</div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-left">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Média do Bairro</span>
                                <div className="text-2xl font-bold text-white">R$ {neighborhoodData ? formatBRL(neighborhoodData.price) : '---'} /m²</div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-left">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Var. Histórica (12m)</span>
                                <div className="text-2xl font-bold text-primary">+{neighborhoodData?.variation || '---'}%</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden p-6 md:p-8 text-left">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border text-left">
                                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl">info</span>
                                    Dados do Empreendimento
                                </h2>
                                {isVisibleOnSite && (
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-sm font-medium text-text-main">Ativo no Portal</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-left">
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-1">Construtora</p>
                                    <Link className="text-base font-bold text-text-main hover:text-primary transition-colors flex items-center gap-1" href={`/dashboard/construtoras/${propertyData.builderId}`}>
                                        {constructorData?.name || '---'}
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-1">Status da Obra</p>
                                    <p className="text-base font-bold text-text-main">{informacoesbasicas.status}</p>
                                </div>
                                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                    {informacoesbasicas.salePrice !== undefined && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Venda</p>
                                            <p className="text-lg font-black text-slate-900">{formatBRL(informacoesbasicas.salePrice || informacoesbasicas.valor || 0)}</p>
                                        </div>
                                    )}
                                    {informacoesbasicas.rentPrice !== undefined && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Aluguel</p>
                                            <p className="text-lg font-black text-primary">{formatBRL(informacoesbasicas.rentPrice)}/mês</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-1">Área Privativa</p>
                                    <p className="text-base font-bold text-text-main">{propertyData.caracteristicasimovel.tamanho}</p>
                                </div>
                            </div>
                        </div>

                        {/* Property Description */}
                        <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 md:p-8 text-left">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-6 border-b border-card-border pb-4 text-left">
                                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                                Descrição do Imóvel
                            </h2>
                            <div 
                                className="prose prose-sm max-w-none text-text-secondary leading-relaxed text-left"
                                dangerouslySetInnerHTML={{ __html: informacoesbasicas.descricao || 'Nenhuma descrição disponível.' }}
                            />
                        </div>

                        {videoEmbedUrl && (
                          <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 md:p-8 text-left">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-6 border-b border-card-border pb-4 text-left">
                                <span className="material-symbols-outlined text-primary text-2xl">play_circle</span>
                                Vídeo Tour
                            </h2>
                            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-soft bg-black">
                              <iframe src={videoEmbedUrl} title="Video Tour" className="w-full h-full" allowFullScreen></iframe>
                            </div>
                          </div>
                        )}

                        {/* Condo Amenities */}
                        <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 md:p-8 text-left">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-6 border-b border-card-border pb-4 text-left">
                                <span className="material-symbols-outlined text-primary text-2xl">pool</span>
                                Comodidades do Condomínio
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {areascomuns && areascomuns.length > 0 ? (
                                    areascomuns.map((amenity, i) => (
                                        <div key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                                            <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                            {amenity}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-text-secondary italic">Nenhuma comodidade informada.</p>
                                )}
                            </div>
                        </div>

                         <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 md:p-8 text-left">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-6 text-left">
                                <span className="material-symbols-outlined text-primary text-2xl">groups</span>
                                Perfil das Personas
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {personas && personas.length > 0 ? personas.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-primary/50 transition-all">
                                        <div className={cn("size-10 rounded-lg flex items-center justify-center", p.iconBackgroundColor)}>
                                            <span className="material-symbols-outlined text-lg">{p.icon}</span>
                                        </div>
                                        <span className="font-bold text-sm text-text-main">{p.name}</span>
                                    </div>
                                )) : <p className="text-sm text-text-secondary">Nenhuma persona vinculada.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 text-left">
                        <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 h-full text-left">
                           <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-6 text-left">
                                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                                Localização
                            </h2>
                             <div className="h-64 w-full rounded-xl overflow-hidden bg-gray-100 border border-card-border mb-6">
                                {mapSrc ? (
                                    <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" className="grayscale opacity-70" />
                                ) : <div className="flex flex-col items-center justify-center h-full text-text-secondary italic gap-2 p-4 text-center">
                                      <span className="material-symbols-outlined text-4xl">map</span>
                                      <p className="text-xs">Mapa de localização não disponível</p>
                                    </div>}
                            </div>
                             <div className="space-y-4 text-left">
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-0.5">Endereço</p>
                                    <p className="text-sm font-bold text-text-main">{localizacao.address || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-0.5">Bairro / Cidade</p>
                                    <p className="text-sm font-bold text-text-main">{localizacao.bairro}, {localizacao.cidade} - {localizacao.estado}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Lightbox Modal for Photo Gallery */}
            {isGalleryOpen && midia && midia.length > 0 && (
              <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
                {/* Top Header */}
                <div className="flex items-center justify-between z-10 max-w-7xl mx-auto w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                      {selectedImageIndex + 1} / {midia.length}
                    </span>
                    <span className="text-slate-300 font-medium text-sm hidden sm:inline">
                      {informacoesbasicas.nome}
                    </span>
                  </div>
                  <Button
                    onClick={() => setIsGalleryOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full size-10"
                  >
                    <X className="size-6" />
                  </Button>
                </div>

                {/* Center Image Navigation */}
                <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + midia.length) % midia.length)}
                    className="absolute left-2 md:left-6 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-primary hover:text-black transition-all border border-white/20 shadow-lg"
                    title="Foto anterior"
                  >
                    <ChevronLeft className="size-6 md:size-8" />
                  </button>

                  <div className="relative max-h-[75vh] max-w-[90vw] flex items-center justify-center">
                    <img
                      src={midia[selectedImageIndex]}
                      alt={`Foto ${selectedImageIndex + 1} de ${informacoesbasicas.nome}`}
                      className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                    />
                  </div>

                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % midia.length)}
                    className="absolute right-2 md:right-6 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-primary hover:text-black transition-all border border-white/20 shadow-lg"
                    title="Próxima foto"
                  >
                    <ChevronRight className="size-6 md:size-8" />
                  </button>
                </div>

                {/* Bottom Thumbnails Strip */}
                <div className="max-w-4xl mx-auto w-full overflow-x-auto py-2 flex items-center gap-2 justify-start sm:justify-center scrollbar-thin scrollbar-thumb-white/20">
                  {midia.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={cn(
                        "relative size-16 shrink-0 rounded-lg overflow-hidden transition-all border-2",
                        selectedImageIndex === idx
                          ? "border-primary ring-2 ring-primary/50 scale-105"
                          : "border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <img src={imgUrl} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AlertDialog>
        </main>
    );
}
