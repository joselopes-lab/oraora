'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SearchFilters from '@/components/SearchFilters';
import { cn } from '@/lib/utils';

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
  };
};

type SearchResultsPageProps = {
  broker: Broker;
  properties: Property[];
}


export default function SearchResults({ broker, properties }: SearchResultsPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filteredProperties = useMemo(() => {
        const propertyTypeParam = searchParams.get('type');
        const stateUf = searchParams.get('state');
        const citiesParam = searchParams.get('cities');
        const neighborhoodsParam = searchParams.get('neighborhoods');
        const roomsParam = searchParams.get('rooms');
        const minPriceParam = searchParams.get('minPrice');
        const maxPriceParam = searchParams.get('maxPrice');
        const searchTerm = searchParams.get('q') || '';
    
        if (!propertyTypeParam && !stateUf && !citiesParam && !neighborhoodsParam && !roomsParam && !minPriceParam && !maxPriceParam && !searchTerm) {
            return properties;
        }

        return properties.filter(property => {
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
                  if (room === '4') {
                      return propertyRoomsArray.some(pRoom => parseInt(pRoom) >= 4);
                  }
                  return propertyRoomsArray.includes(room);
              });
              if (!hasMatchingRoom) return false;
            }
            
            const propertyValue = property.informacoesbasicas.valor || 0;
            const matchesMinPrice = !minPriceParam || propertyValue >= parseInt(minPriceParam);
            const matchesMaxPrice = !maxPriceParam || propertyValue <= parseInt(maxPriceParam);

            return matchesSearchTerm && matchesType && matchesState && matchesCity && matchesNeighborhood && matchesMinPrice && matchesMaxPrice;
        });
    }, [properties, searchParams]);

    const sortBy = searchParams.get('sortBy') || 'relevance';
    
    const sortedProperties = useMemo(() => {
        let tempProperties = [...filteredProperties];
        switch (sortBy) {
            case 'price_asc':
                tempProperties.sort((a, b) => (a.informacoesbasicas.valor || 0) - (b.informacoesbasicas.valor || 0));
                break;
            case 'price_desc':
                tempProperties.sort((a, b) => (b.informacoesbasicas.valor || 0) - (a.informacoesbasicas.valor || 0));
                break;
            default:
                break;
        }
        return tempProperties;
    }, [filteredProperties, sortBy]);

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
            router.push(`${pathname}?${current.toString()}`);
        }
    };
    
    const handleSearch = (queryString: string) => {
        router.push(`${pathname}?${queryString}`);
    };
    
    const formatQuartos = (quartosData: any): string => {
        if (!quartosData) return 'N/A';
        if (Array.isArray(quartosData)) {
            return quartosData.join(', ');
        }
        return String(quartosData);
    };

    const dynamicStyles = {
        '--background': broker.backgroundColor,
        '--foreground': broker.foregroundColor,
        '--primary': broker.primaryColor,
        '--secondary': broker.secondaryColor,
        '--accent': broker.accentColor,
      } as React.CSSProperties;

    return (
        <div style={dynamicStyles} className="urban-padrao-theme bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
            <div className="relative flex min-h-screen w-full flex-col group/design-root">
                <UrbanPadraoHeader broker={broker} />
                <main className="flex-1 w-full flex flex-col items-center">
                    <section className="w-full bg-white border-b border-[#f0f2f4] py-8 lg:py-12">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-text-main mb-2">Encontre o imóvel ideal</h1>
                                    <p className="text-text-muted">Utilize os filtros abaixo para refinar sua busca.</p>
                                </div>
                                <SearchFilters onSearch={handleSearch} />
                            </div>
                        </div>
                    </section>
                    <section className="w-full py-10 bg-background-light flex-1">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-text-main">{filteredProperties.length} Imóveis encontrados</h2>
                                    <p className="text-sm text-text-muted">Exibindo {paginatedProperties.length} de {filteredProperties.length} resultados</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-text-muted">Ordenar por:</span>
                                    <div className="relative group">
                                        <select value={sortBy} onChange={(e) => handleSearch(new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), sortBy: e.target.value }).toString())} className="appearance-none bg-white border border-gray-200 text-text-main py-2 pl-4 pr-10 rounded-lg text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer">
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
                                        <span className="absolute top-3 left-3 z-10 rounded-md bg-primary px-2 py-1 text-xs font-bold text-black uppercase tracking-wide shadow-sm">{property.informacoesbasicas.status}</span>
                                        <button className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">favorite</span>
                                        </button>
                                        <Image alt={property.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={property.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                                            {property.informacoesbasicas.valor && (
                                            <p className="text-white font-bold text-2xl tracking-tight">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.informacoesbasicas.valor)}
                                            </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col p-5 gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">{property.informacoesbasicas.nome}</h3>
                                            <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                {property.localizacao.bairro}, {property.localizacao.cidade}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border-y border-gray-100 py-3 mt-1">
                                            {property.caracteristicasimovel.quartos && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">bed</span>
                                                    <span className="text-sm font-semibold text-[#111418]">{formatQuartos(property.caracteristicasimovel.quartos)}</span>
                                                </div>
                                            )}
                                            <div className="w-px h-4 bg-gray-200"></div>
                                             {property.caracteristicasimovel.vagas && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">shower</span>
                                                    <span className="text-sm font-semibold text-[#111418]">{property.caracteristicasimovel.vagas}</span>
                                                </div>
                                             )}
                                             <div className="w-px h-4 bg-gray-200"></div>
                                            {property.caracteristicasimovel.tamanho && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">square_foot</span>
                                                    <span className="text-sm font-semibold text-[#111418]">{property.caracteristicasimovel.tamanho}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                ))}
                            </div>
                            {/* Pagination */}
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
                                            className={cn("flex items-center justify-center size-10 rounded-full border border-gray-200 font-medium transition-all", currentPage === i + 1 ? 'bg-primary text-black font-bold shadow-md' : 'bg-white text-text-muted hover:bg-gray-100 hover:border-gray-300')}
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
                        </div>
                    </section>
                    <section className="w-full py-16 bg-black text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFSXKPYHVcn6bMCHX6E36kKsWYH-Jrnidp5qgbqRJGbl2tdlfAHRWGgw_BH0FSGiuPAeKoFjGKd4iIxXaS7RDxBjhDpxchyUI6ZBIYy7at-GoSMkswUwLtYY2J431RQH8lRwvQ71Fextok_2cbHyuBu2WkdM3MerdFb1zeCcIMCEPpddgbOA9bubnLDWwsPuexTRzdQSnvapPmcLOzJ-pHK_tWJ-1E5X7glsU1dhw3RJ7oeECQqHntdfmjefwEy47loPNgWOSqzY0")'}}></div>
                        <div className="layout-container max-w-[1280px] mx-auto px-6 relative z-10 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Não encontrou o que procurava?</h2>
                            <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg">
                                Cadastre-se para receber alertas de novos imóveis que correspondem ao seu perfil ou fale diretamente com nossa equipe.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <input className="h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-80" placeholder="Seu melhor e-mail" type="email" />
                                <button className="h-12 px-8 rounded-lg bg-primary text-black font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                                    Receber Alertas
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
                <UrbanPadraoFooter broker={broker}/>
            </div>
        </div>
    );
}
