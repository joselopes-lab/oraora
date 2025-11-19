
'use client'

import { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { collection, getDocs, query, where, Query, DocumentData, doc, documentId, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '../dashboard/properties/page';
import { type Persona } from '../dashboard/personas/page';
import SearchForm from '@/components/search-form';
import { Button } from '@/components/ui/button';
import { Loader2, Building, ArrowLeft, ArrowRight, Filter, Users, X } from 'lucide-react';
import { LocationContext } from '@/context/location-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PropertyCard from '@/components/property-card';
import { Separator } from '@/components/ui/separator';
import { type Banner } from '../dashboard/banners/page';
import BannerDisplay from '@/components/banner-display';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { queryInBatches } from '@/lib/firestoreUtils';


const PROPERTIES_PER_PAGE = 10;

async function getFeaturedPropertyIds(): Promise<string[]> {
    try {
        const docRef = doc(db, 'settings', 'featured');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().propertyIds || [];
        }
        return [];
    } catch {
        return [];
    }
}

export default function ImoveisClientPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { selectedState } = useContext(LocationContext);
    const { user, selectedPersonaId, setSelectedPersonaId } = useAuth();
    
    const [properties, setProperties] = useState<Property[]>([]);
    const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [banners, setBanners] = useState<Record<string, Banner[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPersonaBoxVisible, setIsPersonaBoxVisible] = useState(true);
    const [allStateProperties, setAllStateProperties] = useState<Property[]>([]);


    useEffect(() => {
        const fetchBannersAndPersonas = async () => {
            const bannerLocations: (Banner['location'])[] = ['search_top', 'search_infeed', 'search_bottom'];
            const bannersQuery = query(collection(db, 'banners'), where('location', 'in', bannerLocations), where('isActive', '==', true));
            const bannersSnapshot = await getDocs(bannersQuery);
            const fetchedBanners = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));

            const groupedBanners = fetchedBanners.reduce((acc, banner) => {
                const { location } = banner;
                if (!acc[location]) { acc[location] = []; }
                acc[location].push(banner);
                return acc;
            }, {} as Record<string, Banner[]>);
            setBanners(groupedBanners);

            const personasQuery = query(collection(db, 'personas'));
            const personasSnapshot = await getDocs(personasQuery);
            setPersonas(personasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona)));
        };
        fetchBannersAndPersonas();
    }, []);

    useEffect(() => {
        const fetchProperties = async () => {
            if (!selectedState) {
                setAllStateProperties([]);
                setFeaturedProperties([]);
                setProperties([]);
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);

            const featuredIds = await getFeaturedPropertyIds();
            const buildersSnapshot = await getDocs(query(collection(db, 'builders'), where('isVisibleOnSite', '==', true)));
            const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

            if (visibleBuilderIds.length === 0) {
                setProperties([]); setFeaturedProperties([]); setIsLoading(false);
                return;
            }

            let allPropsData = await queryInBatches<Property>(
                'properties', 
                'builderId', 
                visibleBuilderIds,
                [
                    where('localizacao.estado', '==', selectedState.sigla),
                    where('isVisibleOnSite', '==', true),
                ]
            );
            
            setAllStateProperties(allPropsData);

            const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

            if (selectedPersonaId) {
                allPropsData = allPropsData.filter(p => p.personaIds?.includes(selectedPersonaId));
            } 
            
            const cidade = currentParams.get('cidade');
            if (cidade) allPropsData = allPropsData.filter(p => p.localizacao.cidade === cidade);
            
            const bairros = currentParams.get('bairro')?.split(',').filter(Boolean);
            if (bairros && bairros.length > 0 && !bairros.includes('Todos os bairros')) {
                allPropsData = allPropsData.filter(p => {
                    return bairros.includes(p.localizacao.bairro || '');
                });
            }
            
            const tipos = currentParams.get('tipo')?.split(',').filter(Boolean);
            if (tipos && tipos.length > 0) {
                allPropsData = allPropsData.filter(p => p.caracteristicasimovel.tipo && tipos.includes(p.caracteristicasimovel.tipo));
            }

            if (currentParams.get('status')) allPropsData = allPropsData.filter(p => p.informacoesbasicas.status === currentParams.get('status'));
            
            if (currentParams.get('quartos')) {
                const quartosParam = currentParams.get('quartos');
                allPropsData = allPropsData.filter(p => {
                    const propQuartos = p.caracteristicasimovel.unidades.quartos;
                    if (!propQuartos) return false;
                    if (Array.isArray(propQuartos)) return propQuartos.some(q => (quartosParam === '5+' ? parseInt(q) >= 5 : q === quartosParam));
                    if (typeof propQuartos === 'string') return quartosParam === '5+' ? parseInt(propQuartos) >= 5 : propQuartos === quartosParam;
                    return false;
                });
            }
            if (currentParams.get('vagas')) {
                const vagasParam = currentParams.get('vagas');
                allPropsData = allPropsData.filter(p => {
                    const propVagas = p.caracteristicasimovel.unidades.vagasgaragem;
                    if (!propVagas) return false;
                    return vagasParam === '4+' ? parseInt(propVagas) >= 4 : propVagas === vagasParam;
                });
            }
            if (currentParams.get('valorMin') || currentParams.get('valorMax')) {
                const min = Number(currentParams.get('valorMin') || 0);
                const max = Number(currentParams.get('valorMax') || Infinity);
                allPropsData = allPropsData.filter(p => p.informacoesbasicas.valor && p.informacoesbasicas.valor >= min && p.informacoesbasicas.valor <= max);
            }
            if (currentParams.get('areas_comuns')) {
                const areasParam = currentParams.get('areas_comuns')!.split(',');
                allPropsData = allPropsData.filter(p => areasParam.every(area => p.areascomuns?.includes(area)));
            }

            // Randomize non-featured properties
            const regularResults = allPropsData.filter(p => !featuredIds.includes(p.id));
            const shuffledRegularResults = regularResults.sort(() => Math.random() - 0.5);

            const featuredResults = allPropsData
                .filter(p => featuredIds.includes(p.id))
                .sort((a, b) => featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id));
            
            setFeaturedProperties(featuredResults);
            setProperties(shuffledRegularResults);
            setCurrentPage(1);
            setIsLoading(false);
        };

        fetchProperties();
    }, [searchParams, selectedState, selectedPersonaId]);

    useEffect(() => { if (!isLoading) window.scrollTo(0, 0); }, [currentPage, isLoading]);

    const handleClearPersona = () => {
        setSelectedPersonaId(null);
        router.push(pathname);
    }
    
    const totalPages = Math.ceil(properties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = properties.slice((currentPage - 1) * PROPERTIES_PER_PAGE, currentPage * PROPERTIES_PER_PAGE);
    const totalResults = properties.length + featuredProperties.length;
    const selectedPersona = selectedPersonaId ? personas.find(p => p.id === selectedPersonaId) : null;

    return (
        <main className="flex-grow">
            <div className="container mx-auto px-4 py-4 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                        <div className="lg:hidden">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="filters" className="border rounded-lg bg-card shadow-sm"><AccordionTrigger className="p-4 text-lg font-semibold flex items-center gap-2"><Filter className="h-5 w-5" />Filtrar Imóveis</AccordionTrigger><AccordionContent className="p-6 pt-0"><SearchForm properties={allStateProperties} /></AccordionContent></AccordionItem>
                            </Accordion>
                        </div>
                        <div className="hidden lg:block p-6 rounded-lg bg-card border shadow-sm sticky top-24">
                            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Filtrar Imóveis</h2><SearchForm properties={allStateProperties} />
                        </div>
                    </aside>
                    
                    <section className="lg:col-span-3">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground">Buscando imóveis...</p></div>
                    ) : (
                        <>
                            <div className="mb-6 pb-4 border-b">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Imóveis Encontrados {selectedState?.nome ? `em ${selectedState.nome}`: ''}</h1>
                                <p className="text-muted-foreground mt-1">{totalResults} resultado(s) para sua busca.</p>
                            </div>

                            {user && !selectedPersonaId && personas.length > 0 && isPersonaBoxVisible && (
                                <div className="mb-6 p-4 rounded-lg bg-card border relative">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground"
                                        onClick={() => setIsPersonaBoxVisible(false)}
                                    >
                                        <X className="h-5 w-5"/>
                                        <span className="sr-only">Fechar seleção de personas</span>
                                    </Button>
                                    <p className="text-sm font-medium mb-4 flex items-center gap-2"><Users className="h-4 w-4"/>Selecione uma persona para encontrar imóveis sob medida para você:</p>
                                    <Carousel opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full"
                                    >
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
                                                                    <Image src={p.imageUrl || 'https://placehold.co/400x225.png'} alt={p.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" data-ai-hint="lifestyle" />
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

                             {selectedPersona && (
                                <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-primary/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Exibindo imóveis para a persona:</p>
                                        <p className="font-semibold text-lg">{selectedPersona.name}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleClearPersona}><X className="mr-2 h-4 w-4"/>Limpar Filtro</Button>
                                </div>
                             )}

                            <BannerDisplay banners={banners['search_top']} />
                            {totalResults > 0 || featuredProperties.length > 0 ? (
                                <div className="space-y-6">
                                    {featuredProperties.length > 0 && (<div className="space-y-6">{featuredProperties.map(prop => <PropertyCard key={`featured-${prop.id}`} property={prop} layout="horizontal" isFeatured={true} />)}<Separator className="my-8" /></div>)}
                                    {paginatedProperties.map((prop, index) => (<div key={prop.id}><PropertyCard property={prop} layout="horizontal" />{index === 4 && <BannerDisplay banners={banners['search_infeed']} />}</div>))}
                                    {totalPages > 1 && (<div className="flex justify-center items-center gap-4 pt-6"><Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button><span className="text-sm font-medium">Página {currentPage} / {totalPages}</span><Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próxima<ArrowRight className="ml-2 h-4 w-4" /></Button></div>)}
                                    <BannerDisplay banners={banners['search_bottom']} />
                                </div>
                            ) : (
                                <div className="text-center py-16 rounded-lg bg-card border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]"><Building className="h-16 w-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-semibold">Nenhum imóvel encontrado</h2><p className="text-muted-foreground mt-2 max-w-sm">Tente ajustar seus filtros de busca para encontrar mais resultados.</p></div>
                            )}
                        </>
                    )}
                    </section>
                </div>
            </div>
        </main>
    );
}
