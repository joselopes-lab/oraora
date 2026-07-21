'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MapResultsComponent from '@/app/imoveis/MapResultsComponent';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import SearchFilters from '@/components/SearchFilters';
import { Badge } from "@/components/ui/badge";


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
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

type SearchResultsComponentProps = {
  properties: Property[];
}

type RadarList = {
  propertyIds: string[];
};


export default function SearchResultsComponent({ properties }: SearchResultsComponentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'relevance');
    const currentPage = useMemo(() => searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1, [searchParams]);
    const finality = searchParams.get('finality') || 'sale';
    
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    
    const { user } = useUser();
    const firestore = useFirestore();

    const radarListDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'radarLists', user.uid) : null),
        [user, firestore]
    );

    const { data: radarList } = useDoc<RadarList>(radarListDocRef);
    const savedPropertyIds = radarList?.propertyIds || [];

    const availableStates = useMemo(() => {
        return Array.from(new Set(properties.map(p => p.localizacao.estado))).filter(Boolean);
    }, [properties]);

    const createQueryString = useCallback(
      (updates: { name: string, value: string }[]) => {
        const params = new URLSearchParams(searchParams.toString());
        updates.forEach(update => {
          if (update.value) {
            params.set(update.name, update.value);
          } else {
            params.delete(update.name);
          }
        });
        params.set('page', '1');
        return params.toString();
      },
      [searchParams]
    );
    
    const updateURL = useCallback((updates: { name:string, value: string }[]) => {
        const newQueryString = createQueryString(updates);
        router.push(pathname + '?' + newQueryString, { scroll: false });
    }, [createQueryString, pathname, router]);

    const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { router.push('/radar'); return; }
        if (!firestore) return;
        const docRef = doc(firestore, 'radarLists', user.uid);
        if (savedPropertyIds.includes(propertyId)) {
            setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
            toast({ title: "Removido!", description: "Imóvel removido da sua lista." });
        } else {
            setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
            toast({ title: "Salvo!", description: "Imóvel salvando no seu Radar." });
        }
    };
    
    const handleSortChange = (value: string) => {
        setSortBy(value);
        updateURL([{ name: 'sortBy', value: value }]);
    };

    const sortedProperties = useMemo(() => {
        let sorted = [...properties];
        const getPrice = (p: Property) => finality === 'sale' ? (p.informacoesbasicas.salePrice || p.informacoesbasicas.valor || 0) : (p.informacoesbasicas.rentPrice || 0);

        switch (sortBy) {
            case 'price_asc':
                sorted.sort((a, b) => getPrice(a) - getPrice(b));
                break;
            case 'price_desc':
                sorted.sort((a, b) => getPrice(b) - getPrice(a));
                break;
            case 'area_asc':
                sorted.sort((a, b) => (parseInt(String(a.caracteristicasimovel.tamanho || '0')) || 0) - (parseInt(String(b.caracteristicasimovel.tamanho || '0')) || 0));
                break;
            case 'area_desc':
                sorted.sort((a, b) => (parseInt(String(b.caracteristicasimovel.tamanho || '0')) || 0) - (parseInt(String(a.caracteristicasimovel.tamanho || '0')) || 0));
                break;
            default: break;
        }
        return sorted;
    }, [properties, sortBy, finality]);

    const itemsPerPage = 9;
    const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
    const paginatedProperties = sortedProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set('page', String(newPage));
            router.push(`${pathname}?${current.toString()}`, { scroll: true });
        }
    };
    
    const formatQuartos = (quartosData: any): string => {
      if (!quartosData) return 'N/A';
      const dataAsString = Array.isArray(quartosData) ? quartosData.join(' ') : String(quartosData);
      const numbers = dataAsString.match(/\d+/g);
      if (!numbers || numbers.length === 0) return dataAsString.trim() || 'N/A';
      const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (uniqueNumbers.length === 0) return 'N/A';
      if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
      const last = uniqueNumbers.pop();
      return `${uniqueNumbers.join(', ')} e ${last}`;
    };

    const renderPrice = (property: Property) => {
      const types = property.informacoesbasicas.transactionTypes || ['sale'];
      const salePrice = property.informacoesbasicas.salePrice || property.informacoesbasicas.valor;
      const rentPrice = property.informacoesbasicas.rentPrice;
      const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v);

      if (types.includes('sale') && types.includes('rent')) {
        return (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">A partir de: {fmt(salePrice || 0)}</span>
            <span className="text-primary font-black text-lg">Aluguel: {fmt(rentPrice || 0)}/mês</span>
          </div>
        );
      }
      if (types.includes('rent')) {
        return (
          <div className="flex flex-col items-start mt-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preço Mensal:</span>
            <span className="text-primary font-black text-xl">{fmt(rentPrice || 0)}/mês</span>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-start mt-1">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">À Venda:</span>
          <span className="text-primary font-black text-xl">{fmt(salePrice || 0)}</span>
        </div>
      );
    };

    const renderBadge = (property: Property) => {
      const types = property.informacoesbasicas.transactionTypes || ['sale'];
      if (types.includes('sale') && types.includes('rent')) return "Venda + Aluguel";
      if (types.includes('rent')) return "Para Aluguel";
      return "À Venda";
    };

    const handleClearFilters = () => {
      router.push(pathname);
    };

    return (
        <div className="flex flex-1 w-full">
            <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-[320px] flex-col overflow-y-auto border-r border-gray-100 bg-white p-6 lg:flex">
                <SearchFilters vertical={true} availableStates={availableStates} />
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
                <div className="sticky top-20 z-40 flex flex-col gap-4 border-b border-[#f0f2f4] bg-white/95 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-8">
                    <div>
                        <h1 className="text-xl font-bold text-text-main uppercase tracking-tight">Resultados da Busca</h1>
                        <p className="text-sm text-text-muted">Encontramos <span className="font-medium text-text-main">{sortedProperties.length}</span> imóveis {finality === 'sale' ? 'para comprar' : 'para alugar'}.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg bg-[#f0f2f4] px-4 py-2 text-sm font-medium text-text-main hover:bg-gray-200 transition outline-none">
                                    <span className="material-symbols-outlined text-[20px]">sort</span>
                                    <span>
                                        {sortBy === 'price_asc' ? 'Menor Preço' : sortBy === 'price_desc' ? 'Maior Preço' : 'Mais Relevantes'}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
                                    <DropdownMenuRadioItem value="relevance">Mais relevantes</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="price_asc">Menor preço R$</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="price_desc">Maior preço R$</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="area_asc">Menor Área m²</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="area_desc">Maior Área m²</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="hidden md:flex rounded-lg bg-[#f0f2f4] p-1">
                            <button onClick={() => setViewMode('grid')} className={cn("rounded-md px-3 py-1.5 transition-all", viewMode === 'grid' && "bg-white shadow-sm")}>
                                <span className={cn("material-symbols-outlined text-[20px]", viewMode === 'grid' ? 'text-black' : 'text-text-muted')}>grid_view</span>
                            </button>
                            <button onClick={() => setViewMode('map')} className={cn("rounded-md px-3 py-1.5 transition-all", viewMode === 'map' && "bg-white shadow-sm")}>
                                <span className={cn("material-symbols-outlined text-[20px]", viewMode === 'map' ? 'text-black' : 'text-text-muted')}>map</span>
                            </button>
                        </div>
                    </div>
                </div>
                {viewMode === 'grid' ? (
                    <div className="w-full p-6 lg:p-8 text-left">
                        {paginatedProperties.length > 0 ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {paginatedProperties.map(property => {
                                    const isSaved = savedPropertyIds.includes(property.id);
                                    return (
                                    <Link href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} key={property.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                              <Badge className="bg-white/90 backdrop-blur-sm text-black border-none font-black text-[9px] uppercase px-3 py-1 shadow-sm tracking-widest">
                                                {renderBadge(property)}
                                              </Badge>
                                            </div>
                                            <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white transition-colors group/radar shadow-sm", isSaved && "text-primary bg-white")}>
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "" }}>radar</span>
                                            </button>
                                            <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={property.midia[0] || "https://picsum.photos/seed/prop/400/300"} width={400} height={300} />
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors truncate mb-1 uppercase tracking-tight">{property.informacoesbasicas.nome}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-4 font-medium">
                                              <span className="material-symbols-outlined text-primary text-base">location_on</span> {property.localizacao.bairro}, {property.localizacao.cidade}
                                            </p>
                                            <div className="mb-4">
                                                {renderPrice(property)}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                <div className="flex items-center gap-4">
                                                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-base">bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}</span>
                                                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-base">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">arrow_forward</span>
                                            </div>
                                        </div>
                                    </Link>
                                )})}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-16 flex justify-center pb-10">
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" className="rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest">Anterior</Button>
                                        <span className="text-xs font-black text-slate-400 mx-4 uppercase tracking-widest">Página {currentPage} de {totalPages}</span>
                                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" className="rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest">Próxima</Button>
                                    </div>
                                </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                             <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                               <span className="material-symbols-outlined text-5xl">search_off</span>
                             </div>
                             <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum imóvel encontrado</h3>
                             <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">Não existem imóveis cadastrados para os filtros selecionados no momento. Tente remover alguns filtros para ver mais resultados.</p>
                             <Button onClick={handleClearFilters} className="bg-slate-900 text-white font-bold h-12 px-8 rounded-xl hover:bg-black transition-all">
                               Limpar Todos os Filtros
                             </Button>
                          </div>
                        )}
                    </div>
                ) : (
                    <div className="relative" style={{ height: 'calc(100vh - 80px - 88px)' }}>
                        <MapResultsComponent properties={sortedProperties} searchControls={<SearchFilters vertical={true} availableStates={availableStates} />} />
                    </div>
                )}
            </div>
        </div>
    );
}
