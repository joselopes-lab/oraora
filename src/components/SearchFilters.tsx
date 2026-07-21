'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import locationData from '@/lib/location-data.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Building2, Bed, DollarSign, ChevronDown, Zap, Filter } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview SearchFilters.tsx - ORAORA SEARCH ENGINE 1.0
 * 
 * Componente universal de busca. Centraliza toda a lógica de filtragem,
 * estados de localização e persistência via URL.
 */

interface SearchFiltersProps {
  onSearch?: (query: string) => void;
  vertical?: boolean;
  simple?: boolean;
  className?: string;
  availableStates?: string[];
  enabledTransactions?: string[];
  variant?: 'urban' | 'domus' | 'vertex' | 'aura' | 'living';
}

const propertyTypeOptions = ['Apartamento', 'Casa', 'Cobertura', 'Terreno', 'Studio', 'Comercial'];
const roomOptions = ["1", "2", "3", "4+"];

export default function SearchFilters({ 
    onSearch, 
    vertical = false, 
    simple = false, 
    className, 
    availableStates,
    enabledTransactions = ['sale', 'rent'],
    variant = 'urban'
}: SearchFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // 1. Resolução de Modo Inicial
    const initialMode = useMemo(() => {
        const finality = searchParams.get('finality');
        const defaultMode = enabledTransactions.includes('sale') ? 'sale' : 'rent';
        return (finality && enabledTransactions.includes(finality)) 
            ? (finality as 'sale' | 'rent') 
            : (defaultMode as 'sale' | 'rent');
    }, [searchParams, enabledTransactions]);

    const [searchMode, setSearchMode] = useState<'sale' | 'rent'>(initialMode);

    // Estados de Filtro
    const [query, setQuery] = useState(() => searchParams.get('q') || '');
    const [propertyType, setPropertyType] = useState(() => searchParams.get('type') || 'all');
    const [selectedState, setSelectedState] = useState(() => searchParams.get('state') || '');
    const [selectedCities, setSelectedCities] = useState<string[]>(() => searchParams.get('cities')?.split(',').filter(Boolean) || []);
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(() => searchParams.get('neighborhoods')?.split(',').filter(Boolean) || []);
    const [rooms, setRooms] = useState<string[]>(() => searchParams.get('rooms')?.split(',').filter(Boolean) || []);
    const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');

    // Estados de Localização
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const cityRef = useRef<HTMLDivElement>(null);
    
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
    const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
    const [isNeighborhoodDropdownOpen, setIsNeighborhoodDropdownOpen] = useState(false);
    const neighborhoodRef = useRef<HTMLDivElement>(null);

    // Sincronização com URL
    useEffect(() => {
        const finality = searchParams.get('finality');
        if (finality && (finality === 'sale' || finality === 'rent')) {
            setSearchMode(finality);
        }
    }, [searchParams]);

    // Resolução de Cidades e Bairros
    useEffect(() => {
      if (selectedState) {
          const stateData = locationData.states.find(s => s.uf === selectedState || s.name === selectedState);
          setAvailableCities(stateData?.cities.map(c => c.name) || []);
      }
    }, [selectedState]);

    useEffect(() => {
        if (selectedCities.length > 0 && selectedState) {
            const stateData = locationData.states.find(s => s.uf === selectedState || s.name === selectedState);
            if(stateData) {
                const allNeighborhoods = selectedCities.flatMap(cityName => {
                    const cityData = stateData.cities.find(c => c.name === cityName);
                    return cityData ? cityData.neighborhoods : [];
                });
                setAvailableNeighborhoods([...new Set(allNeighborhoods)]);
            }
        }
    }, [selectedCities, selectedState]);

    // Handlers
    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        params.set('finality', searchMode);
        if (query) params.set('q', query);
        if (propertyType !== 'all') params.set('type', propertyType);
        if (selectedState) params.set('state', selectedState);
        if (selectedCities.length > 0) params.set('cities', selectedCities.join(','));
        if (selectedNeighborhoods.length > 0) params.set('neighborhoods', selectedNeighborhoods.join(','));
        if (rooms.length > 0) params.set('rooms', rooms.join(','));
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        params.set('page', '1');

        if (onSearch) onSearch(params.toString());
        else router.push(`/imoveis?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setQuery('');
        setPropertyType('all');
        setSelectedState('');
        setSelectedCities([]);
        setSelectedNeighborhoods([]);
        setRooms([]);
        setMinPrice('');
        setMaxPrice('');
        if (onSearch) onSearch(`finality=${searchMode}`);
        else router.push(`/imoveis?finality=${searchMode}`);
    };

    const handleCitySelect = (city: string) => {
        setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
    }
    
    const handleNeighborhoodSelect = (neighborhood: string) => {
        setSelectedNeighborhoods(prev => prev.includes(neighborhood) ? prev.filter(n => n !== neighborhood) : [...prev, neighborhood]);
    }

    // Estilização por Variante
    const styles = {
        urban: {
            card: "bg-white border-gray-100 rounded-2xl p-6",
            tabs: "bg-gray-100",
            tabActive: "data-[state=active]:bg-white data-[state=active]:text-slate-900",
            input: "bg-gray-50 border-gray-100 rounded-xl",
            button: "bg-slate-900 text-white hover:bg-black",
            icon: "text-primary"
        },
        domus: {
            card: "bg-white/80 backdrop-blur-md border-slate-100 rounded-[2.5rem] p-8",
            tabs: "bg-slate-100/50",
            tabActive: "data-[state=active]:bg-white data-[state=active]:text-slate-900",
            input: "bg-slate-50/50 border-slate-100 rounded-2xl",
            button: "bg-primary text-slate-900 shadow-glow font-black",
            icon: "text-primary"
        },
        vertex: {
            card: "bg-slate-900/95 backdrop-blur-xl border-white/5 rounded-[2rem] p-8 text-white",
            tabs: "bg-white/5",
            tabActive: "data-[state=active]:bg-primary data-[state=active]:text-slate-950",
            input: "bg-white/5 border-white/10 rounded-xl text-white",
            button: "bg-primary text-slate-950 shadow-glow font-black",
            icon: "text-primary"
        },
        aura: {
            card: "bg-white border-slate-50 rounded-3xl p-8 shadow-soft",
            tabs: "bg-slate-50",
            tabActive: "data-[state=active]:bg-white",
            input: "bg-slate-50 border-transparent rounded-2xl",
            button: "bg-primary text-primary-foreground font-bold",
            icon: "text-primary"
        },
        living: {
            card: "bg-white border-gray-200 rounded-2xl p-6",
            tabs: "bg-gray-100",
            tabActive: "data-[state=active]:bg-white",
            input: "bg-gray-50 border-gray-200 rounded-xl",
            button: "bg-primary text-white font-bold",
            icon: "text-primary"
        }
    }[variant];

    const showTabs = enabledTransactions.includes('sale') && enabledTransactions.includes('rent');

    return (
        <div className={cn(styles.card, "shadow-soft transition-all duration-300", className)}>
            <form onSubmit={handleSearchSubmit} className="space-y-6">
                {showTabs && (
                    <Tabs value={searchMode} onValueChange={(v: any) => setSearchMode(v)} className="w-full max-w-[240px]">
                        <TabsList className={cn("grid w-full grid-cols-2 p-1 h-11 rounded-xl", styles.tabs)}>
                            <TabsTrigger value="sale" className={cn("font-bold text-[10px] uppercase tracking-widest rounded-lg", styles.tabActive)}>Comprar</TabsTrigger>
                            <TabsTrigger value="rent" className={cn("font-bold text-[10px] uppercase tracking-widest rounded-lg", styles.tabActive)}>Alugar</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {/* Linha 1: Palavra-chave e Tipo */}
                <div className={cn("grid gap-4", vertical ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12")}>
                    <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-5")}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">O que você busca?</label>
                        <div className="relative group">
                            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-4", styles.icon)} />
                            <Input 
                                value={query} 
                                onChange={e => setQuery(e.target.value)}
                                className={cn("h-12 pl-12 pr-4 font-bold text-sm transition-all", styles.input)} 
                                placeholder="Condomínio, nome ou características..." 
                            />
                        </div>
                    </div>

                    <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-4")}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo de Imóvel</label>
                        <div className="relative">
                            <Building2 className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-4", styles.icon)} />
                            <select 
                                value={propertyType} 
                                onChange={e => setPropertyType(e.target.value)}
                                className={cn("w-full h-12 pl-12 pr-10 appearance-none font-bold text-sm outline-none", styles.input)}
                            >
                                <option value="all">Todos os tipos</option>
                                {propertyTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                    </div>

                    <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-3")}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Localização (UF)</label>
                        <div className="relative">
                            <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-4", styles.icon)} />
                            <select 
                                value={selectedState} 
                                onChange={e => { setSelectedState(e.target.value); setSelectedCities([]); setSelectedNeighborhoods([]); }}
                                className={cn("w-full h-12 pl-12 pr-10 appearance-none font-bold text-sm outline-none", styles.input)}
                            >
                                <option value="">Estado (UF)...</option>
                                {(availableStates || locationData.states.map(s => s.uf)).map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Linha 2: Cidade, Bairro e Avançados */}
                {!simple && (
                    <div className={cn("grid gap-4", vertical ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12")}>
                        <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-4")}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cidade(s)</label>
                            <div className="relative" ref={cityRef}>
                                <div 
                                    onClick={() => { if(selectedState) setIsCityDropdownOpen(!isCityDropdownOpen); else toast({ title: "Selecione a UF", description: "Escolha o estado primeiro." }); }}
                                    className={cn("w-full h-12 px-4 flex items-center justify-between cursor-pointer text-sm font-bold truncate", styles.input, !selectedState && "opacity-50")}
                                >
                                    <span>{selectedCities.length > 0 ? `${selectedCities.length} Selecionadas` : 'Escolha a cidade...'}</span>
                                    <ChevronDown className="size-4 text-slate-400" />
                                </div>
                                {isCityDropdownOpen && (
                                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-100 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {availableCities.map(c => (
                                                <label key={c} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                    <Checkbox checked={selectedCities.includes(c)} onCheckedChange={() => handleCitySelect(c)} />
                                                    <span className="text-xs font-bold">{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-4")}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bairro(s)</label>
                            <div className="relative" ref={neighborhoodRef}>
                                <div 
                                    onClick={() => { if(selectedCities.length) setIsNeighborhoodDropdownOpen(!isNeighborhoodDropdownOpen); else toast({ title: "Selecione a Cidade", description: "Escolha ao menos uma cidade primeiro." }); }}
                                    className={cn("w-full h-12 px-4 flex items-center justify-between cursor-pointer text-sm font-bold truncate", styles.input, !selectedCities.length && "opacity-50")}
                                >
                                    <span>{selectedNeighborhoods.length > 0 ? `${selectedNeighborhoods.length} Selecionados` : 'Bairros...'}</span>
                                    <ChevronDown className="size-4 text-slate-400" />
                                </div>
                                {isNeighborhoodDropdownOpen && (
                                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-100 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {availableNeighborhoods.map(n => (
                                                <label key={n} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                    <Checkbox checked={selectedNeighborhoods.includes(n)} onCheckedChange={() => handleNeighborhoodSelect(n)} />
                                                    <span className="text-xs font-bold">{n}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-4")}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quartos</label>
                            <div className={cn("flex p-1 h-12 rounded-xl", styles.tabs)}>
                                {roomOptions.map(opt => (
                                    <button 
                                        key={opt} 
                                        type="button" 
                                        onClick={() => setRooms(prev => prev.includes(opt) ? prev.filter(r => r !== opt) : [...prev, opt])}
                                        className={cn("flex-1 rounded-lg text-xs font-black transition-all", rooms.includes(opt) ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={cn("space-y-1.5", vertical ? "" : "lg:col-span-5")}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faixa de Preço (R$)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">MIN</span>
                                    <Input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" className={cn("h-12 pl-12 pr-4 font-bold text-sm", styles.input)} placeholder="0" />
                                </div>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">MAX</span>
                                    <Input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" className={cn("h-12 pl-12 pr-4 font-bold text-sm", styles.input)} placeholder="Ilimitado" />
                                </div>
                            </div>
                        </div>

                        <div className={cn("flex items-end gap-2", vertical ? "flex-col" : "lg:col-span-7")}>
                            <Button type="button" variant="ghost" onClick={handleClearFilters} className="h-12 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900">
                                Limpar
                            </Button>
                            <Button type="submit" className={cn("h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex-1 w-full", styles.button)}>
                                <Search className="size-4 mr-2" /> Buscar Imóveis
                            </Button>
                        </div>
                    </div>
                )}

                {simple && (
                    <div className="flex justify-end pt-2">
                        <Button type="submit" className={cn("h-12 px-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg", styles.button)}>
                            Pesquisar
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
