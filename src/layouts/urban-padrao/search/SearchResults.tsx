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

    const finality = searchParams.get('finality');

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
            if (finality && finality !== 'all' && !types.includes(finality)) return false;

            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearchTerm = searchTermLower === '' ||
                property.informacoesbasicas.nome.toLowerCase().includes(searchTermLower) ||
                property.localizacao.bairro.toLowerCase().includes(searchTermLower) ||
                property.localizacao.cidade.toLowerCase().includes(searchTermLower);

            const matchesType = !propertyTypeParam || propertyTypeParam === 'all' || property.caracteristicasimovel?.tipo === propertyTypeParam;
            const matchesState = !stateUf || property.localizacao.estado === stateUf;
            
            const searchCities = citiesParam ? citiesParam.split(',') : [];
            const matchesCity = searchCities.length === 0 || searchCities.includes(property.localizacao.cidade);

            const normalizeStr = (str?: string) => (str || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const searchNeighborhoods = neighborhoodsParam ? neighborhoodsParam.split(',').map(n => normalizeStr(n)).filter(Boolean) : [];
            const propBairro = normalizeStr(property.localizacao?.bairro || property.localizacao?.neighborhood);
            const matchesNeighborhood = searchNeighborhoods.length === 0 || searchNeighborhoods.includes(propBairro);

            const searchRooms = roomsParam ? roomsParam.split(',') : [];
            if (searchRooms.length > 0) {
              const propertyRoomsArray = Array.isArray(property.caracteristicasimovel.quartos)
                  ? property.caracteristicasimovel.quartos.map(q => q.replace('+', ''))
                  : String(property.caracteristicasimovel.quartos || '').split(',').map(r => r.trim().replace('+', ''));

              const hasMatchingRoom = searchRooms.some(room => {
                  if (room === '4') {
                      return propertyRoomsArray.some(pRoom => parseInt(pRoom) >= 4);
                  }
                  return propertyRoomsArray.includes(room);
              });
              if (!hasMatchingRoom) return false;
            }
            
            const priceToCompare = finality === 'rent' 
                ? (property.informacoesbasicas.rentPrice || 0)
                : (property.informacoesbasicas.salePrice || property.informacoesbasicas.valor || 0);

            if (minPriceParam && priceToCompare < parseInt(minPriceParam)) return false;
            if (maxPriceParam && priceToCompare > parseInt(maxPriceParam)) return false;

            return matchesSearchTerm && matchesType && matchesState && matchesCity && matchesNeighborhood;
        });
    }, [properties, searchParams, finality]);

    const sortBy = searchParams.get('sortBy') || 'relevance';
    
    const sortedProperties = useMemo(() => {
        let tempProperties = [...filteredProperties];
        const getPrice = (p: Property) => finality === 'rent' ? (p.informacoesbasicas.rentPrice || 0) : (p.informacoesbasicas.salePrice || p.informacoesbasicas.valor || 0);
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
    const paginatedProperties = sortedProperties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    
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
            toast({ title: "Removido!", description: "Imóvel removido da sua lista." });
        } else {
            setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
            toast({ title: "Salvo!", description: "Imóvel salvo no seu Radar." });
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

    const renderBadges = (property: Property) => {
        const types = property.informacoesbasicas.transactionTypes || ['sale'];
        const badges = [];
        if (types.includes('sale')) badges.push("À Venda");
        if (types.includes('rent')) badges.push("Para Aluguel");
        return badges;
    };

    const dynamicStyles = {
        '--background': broker.backgroundColor,
        '--foreground': broker.foregroundColor,
        '--primary': broker.primaryColor,
        '--secondary': broker.secondaryColor,
        '--accent': broker.accentColor,
    } as React.CSSProperties;

    const handleClearFilters = () => {
      router.push(searchUrl);
    };

    return (
        <div style={dynamicStyles} className="urban-padrao-theme bg-background-light text-text-main font-display antialiased overflow-x-hidden text-left">
            <div className="relative flex min-h-screen w-full flex-col group/design-root">
                <UrbanPadraoHeader broker={broker} />
                <main className="flex-1 w-full flex flex-col items-center">
                    <section className="w-full bg-white border-b border-[#f0f2f4] py-8 lg:py-12">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-text-main mb-2 uppercase">Busca de Imóveis</h1>
                                    <p className="text-text-muted">Utilize os filtros abaixo para refinar sua busca.</p>
                                </div>
                                <SearchFilters onSearch={handleSearch} availableStates={availableStates} />
                            </div>
                        </div>
                    </section>
                    <section className="w-full py-10 bg-background-light flex-1">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            {paginatedProperties.length > 0 ? (
                              <>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-text-main">{filteredProperties.length} Imóveis encontrados</h2>
                                        <p className="text-sm text-text-muted">Exibindo {paginatedProperties.length} de {filteredProperties.length} resultados</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-text-muted">Ordenar por:</span>
                                        <div className="relative group">
                                            <select value={sortBy} onChange={(e) => handleSearch(new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), sortBy: e.target.value }).toString())} className="appearance-none bg-white border border-gray-200 text-text-main py-2 pl-4 pr-10 rounded-lg text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer outline-none">
                                                <option value="relevance">Mais Relevantes</option>
                                                <option value="price_asc">Menor Preço</option>
                                                <option value="price_desc">Maior Preço</option>
                                                <option value="recent">Mais Recentes</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-lg">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {paginatedProperties.map((property) => (
                                    <Link key={property.id} href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} className="group relative flex flex-col rounded-2xl bg-white border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:border-primary/50 transition-all duration-300 overflow-hidden">
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                                                {renderBadges(property).map((badge, idx) => (
                                                    <Badge key={idx} className="bg-white/90 backdrop-blur-sm text-black border-none font-bold text-[9px] uppercase px-3 py-1 tracking-widest w-fit">{badge}</Badge>
                                                ))}
                                            </div>
                                            <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white transition-all shadow-sm", savedPropertyIds.includes(property.id) && "text-primary bg-white")}>
                                                <span className="material-symbols-outlined" style={{ fontVariationSettings: savedPropertyIds.includes(property.id) ? "'FILL' 1" : "" }}>radar</span>
                                            </button>
                                            <Image alt={property.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" src={property.midia?.[0] || property.media?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                                        </div>
                                        <div className="p-5 flex flex-col p-5 gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors truncate mb-1 uppercase tracking-tight">{property.informacoesbasicas.nome}</h3>
                                                <p className="text-sm text-text-muted mt-1 flex items-center gap-1 font-medium">
                                                    <span className="material-symbols-outlined text-primary text-base">location_on</span>
                                                    {property.localizacao.bairro}, {property.localizacao.cidade}
                                                </p>
                                            </div>
                                            <div className="mb-4">
                                                {renderPrice(property)}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                                <div className="flex items-center gap-4">
                                                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-lg">bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}</span>
                                                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-lg">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">arrow_forward</span>
                                            </div>
                                        </div>
                                    </Link>
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                <div className="mt-16 flex justify-center pb-12">
                                    <nav className="flex items-center gap-2">
                                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-pointer hover:bg-gray-50 disabled:opacity-50">
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={cn("flex items-center justify-center size-10 rounded-full border border-gray-200 font-medium transition-all", currentPage === i + 1 ? 'bg-secondary !text-white font-bold shadow-md' : 'bg-white text-text-muted hover:bg-gray-100 hover:border-gray-300')}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-text-main hover:bg-black hover:text-white hover:border-black transition-all">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </nav>
                                </div>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                  <span className="material-symbols-outlined text-5xl">search_off</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum imóvel disponível</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">No momento não existem imóveis cadastrados para os filtros selecionados. Tente ajustar sua busca para ver mais opções.</p>
                                <Button onClick={handleClearFilters} className="bg-primary text-black font-bold h-12 px-8 rounded-xl hover:bg-primary-hover transition-all">
                                  Ver Todos os Imóveis
                                </Button>
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
