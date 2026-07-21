
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
import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BarChart3, ArrowLeft, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AlertDialog } from "@/components/ui/alert-dialog";

type PropertyDoc = {
    id: string;
    builderId: string;
    personaIds?: string[];
    brokerId?: string;
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
    
    const userDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    const propertyDocRef = useMemoFirebase(() => (firestore && id ? doc(firestore, 'properties', id) : null), [firestore, id]);
    const { data: propertyData, isLoading: isPropertyLoading } = useDoc<PropertyDoc>(propertyDocRef);

    const constructorDocRef = useMemoFirebase(() => (firestore && propertyData?.builderId ? doc(firestore, 'constructors', propertyData.builderId) : null), [firestore, propertyData]);
    const { data: constructorData, isLoading: isConstructorLoading } = useDoc<ConstructorDoc>(constructorDocRef);
    
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

    const { informacoesbasicas, localizacao, isVisibleOnSite, areascomuns, youtubeVideoUrl } = propertyData;
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

            <div className="space-y-8">
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
          </AlertDialog>
        </main>
    );
}
