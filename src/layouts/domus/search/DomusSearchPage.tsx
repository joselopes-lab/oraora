'use client';
/**
 * @fileOverview Página de Catálogo de Imóveis exclusiva para o template Domus.
 */

import Image from 'next/image';
import Link from 'next/link';
import { DomusHeader } from '../components/DomusHeader';
import { DomusFooter } from '../components/DomusFooter';
import { WhatsAppWidget } from '@/app/sites/urban-padrao/components/WhatsAppWidget';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import SearchFilters from '@/components/SearchFilters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  whatsappUrl?: string;
};

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
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
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

type RadarList = {
  propertyIds: string[];
};

export default function DomusSearchPage({ broker, properties }: { broker: Broker; properties: Property[] }) {
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
            const types = property.informacoesbasicas.transactionTypes || ['sale'];
            if (!types.includes(finality)) return false;

            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                property.informacoesbasicas.nome.toLowerCase().includes(searchTermLower) ||
                property.localizacao.bairro.toLowerCase().includes(searchTermLower);

            const matchesType = !propertyTypeParam || propertyTypeParam === 'all' || property.caracteristicasimovel?.tipo === propertyTypeParam;
            const matchesState = !stateUf || property.localizacao.estado === stateUf;
            
            const searchCities = citiesParam ? citiesParam.split(',') : [];
            const matchesCity = searchCities.length === 0 || searchCities.includes(property.localizacao.cidade);

            const normalizeStr = (str?: string) => (str || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const searchNeighborhoods = neighborhoodsParam ? neighborhoodsParam.split(',').map(n => normalizeStr(n)).filter(Boolean) : [];
            const propBairro = normalizeStr(property.localizacao?.bairro || property.localizacao?.neighborhood);
            const matchesNeighborhood = searchNeighborhoods.length === 0 || searchNeighborhoods.includes(propBairro);

            const priceToCompare = finality === 'sale' 
                ? (property.informacoesbasicas.salePrice || property.informacoesbasicas.valor || 0)
                : (property.informacoesbasicas.rentPrice || 0);

            if (minPriceParam && priceToCompare < parseInt(minPriceParam)) return false;
            if (maxPriceParam && priceToCompare > parseInt(maxPriceParam)) return false;

            return matchesSearch && matchesType && matchesState && matchesCity && matchesNeighborhood;
        });
    }, [properties, searchParams, finality]);

    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortedProperties = useMemo(() => {
        let temp = [...filteredProperties];
        const getPrice = (p: Property) => finality === 'sale' ? (p.informacoesbasicas.salePrice || p.informacoesbasicas.valor || 0) : (p.informacoesbasicas.rentPrice || 0);
        if (sortBy === 'price_asc') temp.sort((a, b) => getPrice(a) - getPrice(b));
        else if (sortBy === 'price_desc') temp.sort((a, b) => getPrice(b) - getPrice(a));
        return temp;
    }, [filteredProperties, sortBy, finality]);

    const itemsPerPage = 9;
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
    const paginatedProperties = sortedProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSearch = (queryString: string) => { router.push(`${searchUrl}?${queryString}`); };

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

    const dynamicStyles = {
        '--background': broker.backgroundColor || '90 20% 97%',
        '--foreground': broker.foregroundColor || '110 16% 8%',
        '--primary': broker.primaryColor || '80 99% 49%',
        '--secondary': broker.secondaryColor || '110 16% 8%',
        '--accent': broker.accentColor || '97 78% 56%',
    } as React.CSSProperties;

    const handleClearFilters = () => {
      router.push(searchUrl);
    };

    return (
        <div style={dynamicStyles} className="domus-theme bg-background-light text-slate-900 font-display antialiased min-h-screen text-left">
            <DomusHeader broker={broker as any} />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 uppercase">Catálogo <span className="text-primary italic">Exclusivo</span></h1>
                    <p className="text-slate-500 max-w-2xl text-lg">Curadoria premium selecionada para o seu perfil {finality === 'sale' ? 'de compra' : 'de aluguel'}.</p>
                </div>

                <section className="mb-16">
                    <SearchFilters onSearch={handleSearch} availableStates={availableStates} />
                </section>

                {paginatedProperties.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold">{sortedProperties.length} imóveis encontrados</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Ordenar por:</span>
                            <select 
                                value={sortBy}
                                onChange={(e) => handleSearch(new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), sortBy: e.target.value }).toString())}
                                className="bg-transparent border-none font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer outline-none"
                            >
                                <option value="recent">Mais recentes</option>
                                <option value="price_asc">Menor preço</option>
                                <option value="price_desc">Maior preço</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
                        {paginatedProperties.map((property) => (
                            <Link href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} key={property.id} className="group flex flex-col gap-6 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-2xl transition-all">
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                    <div className="absolute top-6 left-6 z-10">
                                      <Badge className="bg-white/90 backdrop-blur-sm text-black border-none font-black text-[9px] uppercase px-3 py-1 shadow-sm tracking-widest">{renderBadge(property)}</Badge>
                                    </div>
                                    <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("absolute top-6 right-6 z-10 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white transition-all shadow-sm", savedPropertyIds.includes(property.id) && "text-primary bg-white")}>
                                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: savedPropertyIds.includes(property.id) ? "'FILL' 1" : "" }}>radar</span>
                                    </button>
                                    <Image alt={property.informacoesbasicas.nome} className="object-cover group-hover:scale-110 transition-transform duration-1000" src={property.midia?.[0] || property.media?.[0] || 'https://picsum.photos/seed/prop/400/300'} fill />
                                </div>
                                <div className="p-8 pt-0 flex flex-col flex-1">
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-1 tracking-tight">{property.informacoesbasicas.nome}</h4>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-6 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-primary text-base">location_on</span>
                                        {property.localizacao.bairro}, {property.localizacao.cidade}
                                    </p>
                                    <div className="mb-6">
                                        {renderPrice(property)}
                                    </div>
                                    <div className="mt-auto flex gap-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] border-t border-slate-50 dark:border-slate-800 pt-6">
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}</span>
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-16 flex justify-center pb-20">
                            <div className="flex items-center gap-2">
                                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="ghost" className="rounded-xl h-12 px-6 font-black uppercase text-xs tracking-widest text-slate-400">Anterior</Button>
                                <div className="flex gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button 
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={cn("size-10 rounded-xl font-black text-xs transition-all", currentPage === page ? "bg-primary text-slate-950 shadow-glow" : "text-slate-400 hover:text-slate-900")}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="ghost" className="rounded-xl h-12 px-6 font-black uppercase text-xs tracking-widest text-slate-400">Próxima</Button>
                            </div>
                        </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 mb-6">
                      <span className="material-symbols-outlined text-5xl">search_off</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Nenhum imóvel disponível</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 font-medium">Lamentamos, mas não encontramos imóveis ativos para os critérios selecionados. Tente expandir seu raio de busca ou remover alguns filtros.</p>
                    <Button onClick={handleClearFilters} className="bg-primary text-secondary font-black h-14 px-10 rounded-2xl hover:brightness-110 transition-all shadow-glow uppercase text-xs tracking-widest border-none">
                      Ver Todo o Catálogo
                    </Button>
                  </div>
                )}
            </main>
            <DomusFooter broker={broker as any} />
            <WhatsAppWidget brokerId={broker.id} />
        </div>
    );
}
