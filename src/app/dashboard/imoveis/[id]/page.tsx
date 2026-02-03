
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, DocumentData, collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type PropertyDoc = {
    id: string;
    builderId: string;
    personaIds?: string[];
    informacoesbasicas: {
        nome: string;
        status: string;
        slug?: string;
        slogan?: string;
        descricao?: string;
    };
    caracteristicasimovel: {
        tipo: string;
        quartos?: string[];
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
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
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


    const isLoading = isPropertyLoading || isConstructorLoading || isAuthLoading || isProfileLoading || arePersonasLoading;
    const canEdit = userProfile?.userType === 'admin' || userProfile?.userType === 'constructor';

    if (isLoading) {
        return <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32"><p>Carregando detalhes do imóvel...</p></main>;
    }

    if (!propertyData) {
        return <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32"><p>Imóvel não encontrado.</p></main>;
    }

    const { informacoesbasicas, caracteristicasimovel, localizacao, midia, areascomuns, proximidades, statusobra, seoTitle, seoKeywords, seoDescription, isVisibleOnSite, youtubeVideoUrl } = propertyData;
    
    const extractSrcFromIframe = (linkOrIframe: string | undefined): string | null => {
      if (!linkOrIframe) return null;
      const iframeMatch = linkOrIframe.match(/src="([^"]*)"/);
      if (iframeMatch && iframeMatch[1]) {
        return iframeMatch[1];
      }
      try {
        const url = new URL(linkOrIframe);
        if (url.hostname.includes('google.com') && (url.pathname.includes('/maps') || url.pathname.includes('/maps/embed'))) {
          return linkOrIframe;
        }
      } catch (e) {
        // Not a valid URL
      }
      return null;
    };
    const mapSrc = extractSrcFromIframe(localizacao.googleMapsLink);
    const streetViewSrc = extractSrcFromIframe(localizacao.googleStreetViewLink);


    const getStatusClass = () => {
        switch (informacoesbasicas.status) {
            case 'Lançamento': return "bg-green-100 text-green-800 border-green-200";
            case 'Em Construção': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'Pronto para Morar': return "bg-gray-100 text-gray-800 border-gray-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    }
    
    return (
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
            <nav className="flex mb-6 text-sm font-medium text-text-secondary">
                <Link className="hover:text-text-main" href="/dashboard">Home</Link>
                <span className="mx-2">/</span>
                <Link className="hover:text-text-main" href="/dashboard/imoveis">Imóveis</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main">{informacoesbasicas.nome}</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black tracking-tight text-text-main">{informacoesbasicas.nome}</h1>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${getStatusClass()}`}>{informacoesbasicas.status}</span>
                    </div>
                    <p className="text-text-secondary max-w-2xl">Visualize todas as informações detalhadas, mídia e status da obra deste empreendimento.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => router.back()} className="px-5 py-2.5 rounded-lg border border-card-border text-text-main font-bold text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Voltar
                    </Button>
                    {canEdit && (
                        <Button asChild variant="outline" className="px-5 py-2.5 rounded-lg border-primary text-primary font-bold text-sm bg-primary/10 hover:bg-primary/20 transition-colors shadow-sm flex items-center gap-2">
                           <Link href={`/dashboard/imoveis/editar/${id}`}>
                             <span className="material-symbols-outlined text-[18px]">edit</span>
                             Editar Imóvel
                           </Link>
                        </Button>
                    )}
                    <Button className="px-5 py-2.5 rounded-lg bg-secondary text-text-main font-bold text-sm hover:bg-primary transition-colors shadow-sm shadow-primary/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        Ver no Site
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border">
                                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl">info</span>
                                    Dados Principais
                                </h2>
                                {isVisibleOnSite && (
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-sm font-medium text-text-main">Visível no Site</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-1">Construtora</p>
                                    <Link className="text-base font-bold text-text-main hover:text-primary-hover hover:underline transition-colors flex items-center gap-1" href={`/dashboard/construtoras/${propertyData.builderId}`}>
                                        <span className="material-symbols-outlined text-lg">apartment</span>
                                        {constructorData?.name || 'Carregando...'}
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-1">Nome do Imóvel</p>
                                    <p className="text-base font-bold text-text-main">{informacoesbasicas.nome}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium uppercase mb-1">URL Amigável</p>
                                    <p className="text-sm font-medium text-text-secondary bg-gray-50 px-2 py-1 rounded border border-card-border truncate">/imoveis/{informacoesbasicas.slug}</p>
                                </div>
                                {informacoesbasicas.slogan && (
                                    <div>
                                        <p className="text-xs text-text-secondary font-medium uppercase mb-1">Slogan</p>
                                        <p className="text-base font-medium text-text-main italic">"{informacoesbasicas.slogan}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 md:p-8">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">groups</span>
                                Personas Ideais
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {personas && personas.length > 0 ? personas.map(p => (
                                    <Link key={p.id} href={`/dashboard/personas/${p.id}`} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-primary/50 hover:bg-white transition-all">
                                        <div className={`size-10 rounded-full ${p.iconBackgroundColor} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-lg">{p.icon}</span>
                                        </div>
                                        <span className="font-bold text-sm text-text-main">{p.name}</span>
                                    </Link>
                                )) : <p className="text-sm text-text-secondary">Nenhuma persona vinculada a este imóvel.</p>}
                            </div>
                        </div>
                    </div>
                     <div className="lg:col-span-1 row-span-2">
                        <div className="bg-white rounded-xl border border-card-border shadow-sm p-6 h-full">
                           <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                                Localização
                            </h2>
                            <Tabs defaultValue="map" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="map">Mapa</TabsTrigger>
                                    <TabsTrigger value="streetview">Street View</TabsTrigger>
                                </TabsList>
                                <TabsContent value="map">
                                    <div className="h-64 w-full rounded-lg overflow-hidden bg-gray-100 border border-card-border">
                                        {mapSrc ? (
                                            <iframe
                                                src={mapSrc}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen={false}
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            ></iframe>
                                        ) : <div className="flex items-center justify-center h-full text-text-secondary">Mapa não disponível</div>}
                                    </div>
                                </TabsContent>
                                <TabsContent value="streetview">
                                     <div className="h-64 w-full rounded-lg overflow-hidden bg-gray-100 border border-card-border">
                                        {streetViewSrc ? (
                                            <iframe
                                                src={streetViewSrc}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen={false}
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            ></iframe>
                                        ) : <div className="flex items-center justify-center h-full text-text-secondary">Street View não disponível</div>}
                                    </div>
                                </TabsContent>
                            </Tabs>
                             <div className="space-y-3 mt-4">
                                <p className="text-sm text-text-secondary"><span className="font-bold text-text-main">Endereço:</span> {localizacao.address || 'Não informado'}</p>
                                <p className="text-sm text-text-secondary"><span className="font-bold text-text-main">Bairro:</span> {localizacao.bairro}</p>
                                <p className="text-sm text-text-secondary"><span className="font-bold text-text-main">Cidade:</span> {localizacao.cidade} / {localizacao.estado}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden p-6 md:p-8">
                             <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border">
                                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl">apartment</span>
                                    Sobre o Empreendimento
                                </h2>
                            </div>
                            <p className="text-text-secondary leading-relaxed">{informacoesbasicas.descricao}</p>
                            
                            <h3 className="font-bold text-base mt-8 mb-4">Áreas Comuns & Diferenciais</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                                {areascomuns?.map(item => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
