
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { type Property } from '@/app/dashboard/properties/page';
import SearchForm from '@/components/search-form';
import { Button } from '@/components/ui/button';
import { Loader2, Building, ArrowLeft, ArrowRight, Filter } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PropertyCard from '@/components/property-card';
import BannerDisplay from '@/components/banner-display';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Banner } from '@/app/dashboard/banners/page';
import { usePropertyActions } from '@/hooks/use-property-actions';
import PropertyDetailSheet from '@/components/property-detail-sheet';


interface Broker {
  id: string;
  name: string;
  whatsapp?: string;
}

interface ImoveisClientPageProps {
  broker: Broker;
  initialProperties: Property[];
}

const PROPERTIES_PER_PAGE = 9;

function SearchResults({ broker, initialProperties }: ImoveisClientPageProps) {
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<Property[]>(initialProperties);
    const [banners, setBanners] = useState<Record<string, Banner[]>>({});
    const [currentPage, setCurrentPage] = useState(1);
    
    const {
        selectedProperty,
        isSheetOpen,
        handleViewDetails,
        setIsSheetOpen,
    } = usePropertyActions(broker);

    useEffect(() => {
        const fetchBanners = async () => {
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
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        let filtered = initialProperties;
        
        const cidade = searchParams.get('cidade');
        if (cidade) filtered = filtered.filter(p => p.localizacao.cidade === cidade);
        
        const bairros = searchParams.get('bairro')?.split(',').filter(Boolean);
        if (bairros && bairros.length > 0) {
           filtered = filtered.filter(p => p.localizacao.bairro && bairros.includes(p.localizacao.bairro));
        }
        
        const tipos = searchParams.get('tipo')?.split(',').filter(Boolean);
        if (tipos && tipos.length > 0) {
           filtered = filtered.filter(p => p.caracteristicasimovel.tipo && tipos.includes(p.caracteristicasimovel.tipo));
        }

        const status = searchParams.get('status');
        if (status) filtered = filtered.filter(p => p.informacoesbasicas.status === status);

        const quartos = searchParams.get('quartos');
        if (quartos) {
            filtered = filtered.filter(p => {
                const propQuartos = p.caracteristicasimovel.unidades.quartos;
                if (!propQuartos) return false;
                if (Array.isArray(propQuartos)) return propQuartos.some(q => (quartos === '5+' ? parseInt(q) >= 5 : q === quartos));
                return quartos === '5+' ? parseInt(propQuartos as string) >= 5 : propQuartos === quartos;
            });
        }
        
        const vagas = searchParams.get('vagas');
        if (vagas) {
             filtered = filtered.filter(p => {
                const propVagas = p.caracteristicasimovel.unidades.vagasgaragem;
                if (!propVagas) return false;
                return vagas === '4+' ? parseInt(propVagas) >= 4 : propVagas === vagas;
            });
        }
        
        const min = Number(searchParams.get('valorMin') || 0);
        const max = Number(searchParams.get('valorMax') || Infinity);
        if (min > 0 || max < Infinity) {
            filtered = filtered.filter(p => p.informacoesbasicas.valor && p.informacoesbasicas.valor >= min && p.informacoesbasicas.valor <= max);
        }

        const areas = searchParams.get('areas_comuns')?.split(',');
        if (areas && areas.length > 0) {
            filtered = filtered.filter(p => areas.every(area => p.areascomuns?.includes(area)));
        }

        setProperties(filtered);
        setCurrentPage(1);

    }, [searchParams, initialProperties]);
    
    useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

    const totalPages = Math.ceil(properties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = properties.slice((currentPage - 1) * PROPERTIES_PER_PAGE, currentPage * PROPERTIES_PER_PAGE);
    const totalResults = properties.length;
    
    return (
        <>
        <main className="flex-grow">
            <div className="container mx-auto px-4">
                 <section className="relative z-20 bg-gradient-to-b from-[#b6e803] to-[#0fe808] backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl mb-12 py-12">
                    <SearchForm properties={initialProperties} brokerId={broker.id} />
                </section>

                <div className="mb-6 pb-4">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Imóveis Encontrados</h1>
                    <p className="text-white/80 mt-1">{totalResults} resultado(s) para sua busca.</p>
                </div>
                
                <BannerDisplay banners={banners['search_top']} />

                {totalResults > 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {paginatedProperties.map((prop, index) => (
                                <div key={prop.id}>
                                    <PropertyCard
                                      property={prop}
                                      variant="featured"
                                      brokerId={broker.id}
                                      brokerWhatsApp={broker.whatsapp}
                                      onViewDetails={() => handleViewDetails(prop)}
                                    />
                                    {index === 4 && <BannerDisplay banners={banners['search_infeed']} />}
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 pt-6">
                                <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
                                <span className="text-sm font-medium text-white">Página {currentPage} / {totalPages}</span>
                                <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próxima<ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </div>
                        )}
                        <BannerDisplay banners={banners['search_bottom']} />
                    </div>
                ) : (
                    <div className="text-center py-16 rounded-lg bg-card border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
                        <Building className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold">Nenhum imóvel encontrado</h2>
                        <p className="text-muted-foreground mt-2 max-w-sm">Tente ajustar seus filtros de busca para encontrar mais resultados.</p>
                    </div>
                )}
            </div>
        </main>
        {selectedProperty && (
            <PropertyDetailSheet
                property={selectedProperty}
                brokerId={broker.id}
                brokerWhatsApp={broker.whatsapp}
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        )}
        </>
    );
}

export default function ImoveisClientPage(props: ImoveisClientPageProps) {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <SearchResults {...props} />
        </Suspense>
    );
}
