
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import SearchFilters from '@/components/SearchFilters';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  layoutId?: string;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    transactionTypes?: string[];
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
    tipo: string;
  };
};

type SearchResultsPageProps = {
  broker: Broker;
  properties: Property[];
}

type RadarList = {
  propertyIds: string[];
};

export default function SearchResults({ broker, properties }: SearchResultsPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const isPortalAccess = pathname.startsWith('/sites');
    const searchUrl = isPortalAccess ? `/sites/${broker.slug}/search` : '/search';

    const radarListDocRef = useMemoFirebase(() => (user ? doc(firestore, 'radarLists', user.uid) : null), [user, firestore]);
    const { data: radarList } = useDoc<RadarList>(radarListDocRef);
    const savedPropertyIds = radarList?.propertyIds || [];

    const availableStates = useMemo(() => {
        return Array.from(new Set(properties.map(p => p.localizacao.estado))).filter(Boolean);
    }, [properties]);

    const finality = searchParams.get('finality') || 'sale';

    const filteredProperties = useMemo(() => {
        const propertyTypeParam = searchParams.get('type');
        const stateUf = searchParams.get('state');
        const citiesParam = searchParams.get('cities');
        const neighborhoodsParam = searchParams.get('neighborhoods');
        const roomsParam = searchParams.get('rooms');
        const minPriceParam = searchParams.get('minPrice');
        const maxPriceParam = searchParams.get('maxPrice');
        const searchTerm = searchParams.get('q') || '';

        return properties.filter(property => {
            // Filter by Finality
            const types = property.informacoesbasicas.transactionTypes || ['sale'];
            if (!types.includes(finality)) return false;

            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearchTerm = searchTermLower === '' ||
                property.informacoesbasicas.nome.toLowerCase().includes(searchTermLower) ||
                property.localizacao.bairro.toLowerCase().includes(searchTermLower) ||
                property.localizacao.cidade.toLowerCase().includes(searchTermLower);

            const matchesType = !propertyTypeParam || propertyTypeParam === 'all' || property.caracteristicasimovel?.tipo === propertyTypeParam;
            const matchesState = !stateUf || property.localizacao.estado === stateUf;
            
            const searchCities = citiesParam ? citiesParam.split(',') : [];
            const matchesCity = searchCities.length === 0 || searchCities.includes(property.localizacao.cidade);

            const searchNeighborhoods = neighborhoodsParam ? neighborhoodsParam.split(',') : [];
            const matchesNeighborhood = searchNeighborhoods.length === 0 || searchNeighborhoods.includes(property.localizacao.bairro);

            const searchRooms = roomsParam ? roomsParam.split(',') : [];
            if (searchRooms.length > 0) {
              const propertyRoomsArray = Array.isArray(property.caracteristicasimovel.quartos)
                  ? property.caracteristicasimovel.quartos.map(q => q.replace('+', ''))
                  : String(property.caracteristicasimovel.quartos || '').split(',').map(r => r.trim().replace('+', ''));

              const hasMatchingRoom = searchRooms.some(room => {
                  if (room === '4') return propertyRoomsArray.some(pRoom => parseInt(pRoom) >= 4);
                  return propertyRoomsArray.includes(room);
              });
              if (!hasMatchingRoom) return false;
            }
            
            const priceToCompare = finality === 'sale' 
                ? (property.informacoesbasicas.salePrice || property.informacoesbasicas.valor || 0)
                : (property.informacoesbasicas.rentPrice || 0);

            if (minPriceParam && priceToCompare < parseInt(minPriceParam)) return false;
            if (maxPriceParam && priceToCompare > parseInt(maxPriceParam)) return false;

            return matchesSearchTerm && matchesType && matchesState && matchesCity && matchesNeighborhood;
        });
    }, [properties, searchParams, finality]);

    const sortBy = searchParams.get('sortBy') || 'relevance';
    
    const sortedProperties = useMemo(() => {
        let tempProperties = [...filteredProperties];
        const getPrice = (p: Property) => finality === 'sale' ? (p.informacoesbasicas.salePrice || p.informacoesbasicas.valor || 0) : (p.informacoesbasicas.rentPrice || 0);
        switch (sortBy) {
            case 'price_asc': tempProperties.sort((a, b) => getPrice(a) - getPrice(b)); break;
            case 'price_desc': tempProperties.sort((a, b) => getPrice(b) - getPrice(a)); break;
            default: break;
        }
        return tempProperties;
    }, [filteredProperties, sortBy, finality]);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 9;
    const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
    const paginatedProperties = sortedProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set('page', String(page));
            router.push(`${searchUrl}?${current.toString()}`);
        }
    };
    
    const handleSearch = (queryString: string) => { router.push(`${searchUrl}?${queryString}`); };
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
        if (data.length === 0) return 'N/A';
        if (data.length === 1 && data[0] === '1') return '1 Quarto';
        return `${data.join(', ')} Quartos`;
    };

    const renderPrice = (property: Property) => {
        const types = property.informacoesbasicas.transactionTypes || ['sale'];
        const salePrice = property.informacoesbasicas.salePrice || property.informacoesbasicas.valor;
        const rentPrice = property.informacoesbasicas.rentPrice;
        const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v);
        if (types.includes('sale') && types.includes('rent')) {
          return (
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Venda: {fmt(salePrice || 0)}</span>
              <span className="text-primary font-bold text-lg">Aluguel: {fmt(rentPrice || 0)}/mês</span>
            </div>
          );
        }
        if (types.includes('rent')) {
          return (
            <div className="flex flex-col items-start mt-1">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ALUGUEL:</span>
              <p className="font-bold text-xl text-primary leading-tight">{fmt(rentPrice || 0)}/mês</p>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-start mt-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">VENDA:</span>
            <p className="font-bold text-xl text-slate-900 leading-tight">{fmt(salePrice || 0)}</p>
          </div>
        );
    };

    const renderBadge = (property: Property) => {
        const types = property.informacoesbasicas.transactionTypes || ['sale'];
        if (types.includes('sale') && types.includes('rent')) return "Venda + Aluguel";
        if (types.includes('rent')) return "Para Aluguel";
        return "À Venda";
    };

    const dynamicStyles = {
        '--background': broker.backgroundColor,
        '--foreground': broker.foregroundColor,
        '--primary': broker.primaryColor,
        '--secondary': broker.secondaryColor,
        '--accent': broker.accentColor,
    } as React.CSSProperties;

    return (
        <div style={dynamicStyles} className="urban-padrao-theme bg-background-light text-text-main font-display antialiased overflow-x-hidden text-left">
            <div className="relative flex min-h-screen w-full flex-col group/design-root">
                <UrbanPadraoHeader broker={broker} />
                <main className="flex-1 w-full flex flex-col items-center">
                    <section className="w-full bg-white border-b border-[#f0f2f4] py-12">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="flex flex-col gap-6">
                                <h1 className="text-3xl font-black text-text-main mb-2 uppercase">Busca de Imóveis</h1>
                                <SearchFilters onSearch={handleSearch} availableStates={availableStates} />
                            </div>
                        </div>
                    </section>
                    <section className="w-full py-10 bg-background-light flex-1">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                               {paginatedProperties.map((property) => (
                                <Link key={property.id} href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} className="group relative flex flex-col rounded-2xl bg-white border border-slate-100 shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                                            <Badge className="bg-white/90 backdrop-blur-sm text-black border-none font-bold text-[9px] uppercase py-1 px-3 tracking-widest">{renderBadge(property)}</Badge>
                                        </div>
                                        <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white transition-all shadow-sm", savedPropertyIds.includes(property.id) && "text-primary bg-white")}>
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: savedPropertyIds.includes(property.id) ? "'FILL' 1" : "" }}>radar</span>
                                        </button>
                                        <Image alt={property.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={property.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors truncate mb-1 uppercase">{property.informacoesbasicas.nome}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                                            <span className="material-symbols-outlined text-[14px]">location_on</span> {property.localizacao.bairro}, {property.localizacao.cidade}
                                        </p>
                                        <div className="mb-4">
                                            {renderPrice(property)}
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-bold uppercase">
                                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}</span>
                                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                                        </div>
                                    </div>
                                </Link>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-16 flex justify-center pb-12">
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" className="rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest">Anterior</Button>
                                        <span className="text-xs font-black text-slate-400 mx-4 uppercase tracking-widest">Página {currentPage} de {totalPages}</span>
                                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" className="rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest">Próxima</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
                <UrbanPadraoFooter broker={broker}/>
            </div>
        </div>
    );
}
