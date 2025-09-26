
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, documentId, Query, DocumentData } from 'firebase/firestore';
import { type Property } from '@/app/dashboard/properties/page';
import { type Persona } from '@/app/dashboard/personas/page';
import PublicLayout from '@/components/public-layout';
import PropertyCard from '@/components/property-card';
import { Loader2, HeartCrack, GitCompareArrows, Users, X, ArrowLeft, ArrowRight, Radar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { queryInBatches } from '@/lib/firestoreUtils';

const PROPERTIES_PER_PAGE = 8;

function RadarList() {
    const { favorites, loading: authLoading } = useAuth();
    const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFavoriteProperties = async () => {
            if (authLoading) return;
            if (favorites.length === 0) {
                setFavoriteProperties([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const properties = await queryInBatches<Property>(
                    'properties',
                    documentId(),
                    favorites,
                    [where('isVisibleOnSite', '==', true)]
                );
                
                const orderedProperties = favorites
                    .map(id => properties.find(p => p.id === id))
                    .filter((p): p is Property => p !== undefined);
                setFavoriteProperties(orderedProperties);
            } catch (error) {
                console.error("Error fetching favorite properties: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFavoriteProperties();
    }, [favorites, authLoading]);
    
    if (isLoading || authLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <>
        <div className="flex justify-end mb-6">
            {favoriteProperties.length > 1 && (
                <Button asChild>
                    <Link href="/comparar"><GitCompareArrows className="mr-2 h-4 w-4" />Comparar Imóveis</Link>
                </Button>
            )}
        </div>
        {favoriteProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {favoriteProperties.map(prop => <PropertyCard key={prop.id} property={prop} />)}
            </div>
        ) : (
             <div className="text-center py-16 rounded-lg bg-card border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
                <Radar className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold">Seu radar está vazio</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">Clique no ícone de radar nos imóveis para salvá-los aqui.</p>
                <Button asChild className="mt-6"><Link href="/imoveis">Ver Imóveis</Link></Button>
            </div>
        )}
        </>
    );
}


function PersonaPropertiesList() {
    const { selectedPersonaId, setSelectedPersonaId } = useAuth();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPersonaBoxVisible, setIsPersonaBoxVisible] = useState(true);

     useEffect(() => {
        const fetchPersonas = async () => {
            const personasQuery = query(collection(db, 'personas'));
            const personasSnapshot = await getDocs(personasQuery);
            setPersonas(personasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona)));
        };
        fetchPersonas();
    }, []);

    useEffect(() => {
        const fetchProperties = async () => {
            if (!selectedPersonaId) {
                setProperties([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                let propertiesQuery: Query<DocumentData> = query(
                    collection(db, 'properties'),
                    where('isVisibleOnSite', '==', true),
                    where('personaIds', 'array-contains', selectedPersonaId)
                );
                const querySnapshot = await getDocs(propertiesQuery);
                setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
            } catch (error) {
                console.error("Error fetching properties by persona: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, [selectedPersonaId]);

    const totalPages = Math.ceil(properties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = properties.slice((currentPage - 1) * PROPERTIES_PER_PAGE, currentPage * PROPERTIES_PER_PAGE);

    return (
        <div className="space-y-8">
            {personas.length > 0 && isPersonaBoxVisible && (
                 <div className="p-4 rounded-lg bg-card border relative">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground z-10"
                        onClick={() => setIsPersonaBoxVisible(false)}
                    >
                        <X className="h-5 w-5"/>
                        <span className="sr-only">Fechar seleção de personas</span>
                    </Button>
                    <p className="text-sm font-medium mb-4 flex items-center gap-2"><Users className="h-4 w-4"/>Selecione uma persona para encontrar imóveis sob medida para você:</p>
                    <Carousel opts={{ align: "start", loop: false }} className="w-full">
                        <CarouselContent>
                            {personas.map(p => (
                                <CarouselItem key={p.id} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1 h-full">
                                        <Card 
                                            className={cn(
                                                "h-full cursor-pointer hover:border-primary transition-colors flex flex-col",
                                                selectedPersonaId === p.id && "border-primary ring-2 ring-primary"
                                            )}
                                            onClick={() => setSelectedPersonaId(p.id)}
                                        >
                                            <CardContent className="flex flex-col p-4 gap-4 flex-grow">
                                                <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                                    <Image src={p.imageUrl || 'https://placehold.co/400x225.png'} alt={p.name} fill className="object-cover" data-ai-hint="lifestyle" />
                                                </div>
                                                <div className="text-left w-full">
                                                    <p className="font-semibold text-lg text-left">{p.name}</p>
                                                    <p className="text-base text-muted-foreground mt-1 text-left">{p.description}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
            )}
            
            {isLoading ? (
                 <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : properties.length > 0 ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {paginatedProperties.map(prop => <PropertyCard key={prop.id} property={prop} />)}
                    </div>
                     {totalPages > 1 && (<div className="flex justify-center items-center gap-4 pt-6"><Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button><span className="text-sm font-medium">Página {currentPage} / {totalPages}</span><Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próxima<ArrowRight className="ml-2 h-4 w-4" /></Button></div>)}
                </div>
            ) : (
                 <div className="text-center py-16 rounded-lg bg-card border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold">Selecione uma persona</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm">Escolha um perfil acima para ver os imóveis ideais para você.</p>
                </div>
            )}
        </div>
    );
}

function FavoritesPageContent() {
    return (
        <main className="container mx-auto px-4 py-8 md:py-12 flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Área do Cliente</h1>
            <Tabs defaultValue="radar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="radar">Meu Radar</TabsTrigger>
                    <TabsTrigger value="personas">Imóveis para seu Perfil</TabsTrigger>
                </TabsList>
                <TabsContent value="radar" className="mt-8">
                    <RadarList />
                </TabsContent>
                <TabsContent value="personas" className="mt-8">
                    <PersonaPropertiesList />
                </TabsContent>
            </Tabs>
        </main>
    );
}


export default function FavoritesPage() {
    return (
        <PublicLayout>
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <FavoritesPageContent />
            </Suspense>
        </PublicLayout>
    )
}
