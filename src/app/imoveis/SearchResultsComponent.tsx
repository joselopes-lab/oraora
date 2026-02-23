

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
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

    // URL-derived state for filters
    const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'relevance');

    const currentPage = useMemo(() => searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1, [searchParams]);
    
    // Local UI state
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    
    const { user } = useUser();
    const firestore = useFirestore();

    const radarListDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'radarLists', user.uid) : null),
        [user, firestore]
    );

    const { data: radarList } = useDoc<RadarList>(radarListDocRef);
    const savedPropertyIds = radarList?.propertyIds || [];

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
        // Reset page on filter change
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

        if (!user) {
            router.push('/radar');
            return;
        }

        if (!firestore) return;

        const docRef = doc(firestore, 'radarLists', user.uid);
        
        if (savedPropertyIds.includes(propertyId)) {
            setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
            toast({ title: "Removido do Radar!", description: "O imóvel foi removido da sua lista." });
        } else {
            setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
            toast({ title: "Adicionado ao Radar!", description: "O imóvel foi salvo na sua lista de oportunidades." });
        }
    };
    
    const handleSortChange = (value: string) => {
        setSortBy(value);
        updateURL([{ name: 'sortBy', value: value }]);
    };

    const sortedProperties = useMemo(() => {
        let sorted = [...properties];
        switch (sortBy) {
            case 'price_asc':
                sorted.sort((a, b) => (a.informacoesbasicas.valor || 0) - (b.informacoesbasicas.valor || 0));
                break;
            case 'price_desc':
                sorted.sort((a, b) => (b.informacoesbasicas.valor || 0) - (a.informacoesbasicas.valor || 0));
                break;
            case 'area_asc':
                sorted.sort((a, b) => (parseInt(a.caracteristicasimovel.tamanho || '0') || 0) - (parseInt(b.caracteristicasimovel.tamanho || '0') || 0));
                break;
            case 'area_desc':
                sorted.sort((a, b) => (parseInt(b.caracteristicasimovel.tamanho || '0') || 0) - (parseInt(a.caracteristicasimovel.tamanho || '0') || 0));
                break;
            case 'relevance':
            default:
                // Default relevance logic can be implemented here if needed
                break;
        }
        return sorted;
    }, [properties, sortBy]);

    const itemsPerPage = 9;

    const totalPages = useMemo(() => {
        return Math.ceil(sortedProperties.length / itemsPerPage);
    }, [sortedProperties.length, itemsPerPage]);

    const paginatedProperties = useMemo(() => {
        return sortedProperties.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [sortedProperties, currentPage, itemsPerPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set('page', String(newPage));
            router.push(`${pathname}?${current.toString()}`, { scroll: true });
        }
    };
    
    const formatQuartos = (quartosData: any): string => {
      if (!quartosData) return 'N/A';
  
      const dataAsString = Array.isArray(quartosData)
          ? quartosData.join(' ')
          : String(quartosData);
  
      const numbers = dataAsString.match(/\d+/g);
      
      if (!numbers || numbers.length === 0) {
          const trimmedString = dataAsString.trim();
          return trimmedString ? trimmedString : 'N/A';
      }
  
      const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
      
      if (uniqueNumbers.length === 0) return 'N/A';
      if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
      
      const last = uniqueNumbers.pop();
      return `${uniqueNumbers.join(', ')} e ${last}`;
    };

    return (
        <main className="flex flex-1">
        {viewMode === 'grid' && (
          <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-96 min-w-[384px] flex-col overflow-y-auto border-r border-[#f0f2f4] bg-white p-6 lg:flex">
            <SearchFilters />
          </aside>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-20 z-40 flex flex-col gap-4 border-b border-[#f0f2f4] bg-white/95 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <h1 className="text-xl font-bold text-text-main">
                Imóveis em Destaque
              </h1>
              <p className="text-sm text-text-muted">Encontramos <span className="font-medium text-text-main">{sortedProperties.length}</span> resultados premium</p>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
              <button className="flex lg:hidden shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                <span className="material-symbols-outlined text-[20px]">tune</span>
                Filtros
              </button>
              <div className="hidden h-8 w-[1px] bg-gray-200 md:block"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg bg-[#f0f2f4] px-4 py-2 text-sm font-medium text-text-main hover:bg-gray-200 transition">
                    <span className="material-symbols-outlined text-[20px]">sort</span>
                    <span>
                        {sortBy === 'price_asc' && 'Menor Preço'}
                        {sortBy === 'price_desc' && 'Maior Preço'}
                        {sortBy === 'area_asc' && 'Menor Área'}
                        {sortBy === 'area_desc' && 'Maior Área'}
                        {sortBy === 'relevance' && 'Mais Relevantes'}
                    </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
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
                  <button onClick={() => setViewMode('grid')} className={cn("rounded-md px-3 py-1.5", viewMode === 'grid' && "bg-white shadow-sm")}>
                      <span className={cn("material-symbols-outlined text-[20px]", viewMode === 'grid' ? 'text-black' : 'text-text-muted hover:text-black')}>grid_view</span>
                  </button>
                  <button onClick={() => setViewMode('map')} className={cn("rounded-md px-3 py-1.5", viewMode === 'map' && "bg-white shadow-sm")}>
                      <span className={cn("material-symbols-outlined text-[20px]", viewMode === 'map' ? 'text-black' : 'text-text-muted hover:text-black')}>map</span>
                  </button>
              </div>
            </div>
          </div>
          {viewMode === 'grid' ? (
              <div className="w-full p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProperties.map(property => {
                  const isSaved = savedPropertyIds.includes(property.id);
                  const quartos = property.caracteristicasimovel.quartos;
                  return (
                  <Link href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} key={property.id} className="group relative break-inside-avoid overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                       <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                           <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur-sm">
                               {property.informacoesbasicas.status}
                           </div>
                           <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-colors group/radar", isSaved ? "text-primary" : "hover:text-primary")}>
                               <span className="material-symbols-outlined text-[20px]">radar</span>
                           </button>
                       </div>
                      {property.informacoesbasicas.status === 'Lançamento' && (
                        <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-black shadow-[0_0_15px_rgba(195,231,56,0.4)]">
                          Novo
                        </div>
                      )}
                      <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={property.midia[0] || "https://picsum.photos/400/300"} width={400} height={300}/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 text-white">
                        {property.informacoesbasicas.valor && (
                        <p className="font-bold text-xl"><span className="text-xs font-normal text-gray-300 block">A partir de:</span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.informacoesbasicas.valor)}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg uppercase text-dark-text group-hover:text-primary transition-colors">{property.informacoesbasicas.nome}</h3>
                      <p className="text-sm text-gray-500 mt-1">{property.localizacao.bairro}, {property.localizacao.cidade}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">bed</span> {formatQuartos(quartos)}</span>
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">shower</span> {property.caracteristicasimovel.vagas}</span>
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                      </div>
                    </div>
                  </Link>
                )})}
              </div>
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                            Anterior
                        </Button>
                        <span className="text-sm font-medium text-gray-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline">
                            Próxima
                        </Button>
                    </div>
                </div>
              )}
              </div>
          ) : (
             <div className="relative" style={{ height: 'calc(100vh - 80px - 88px)'}}>
                <MapResultsComponent properties={sortedProperties} searchControls={<SearchFilters />} />
            </div>
          )}
        </div>
        </main>
    )
}
      
    
    
