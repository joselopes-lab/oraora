'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import locationData from '@/lib/location-data.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFiltersProps {
  onSearch?: (query: string) => void;
  vertical?: boolean;
  className?: string;
}

export default function SearchFilters({ onSearch, vertical = false, className }: SearchFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFirstRender = useRef(true);

    // URL-derived state for filters
    const [propertyType, setPropertyType] = useState(() => searchParams.get('type') || 'all');
    const [selectedState, setSelectedState] = useState(() => searchParams.get('state') || '');
    const [selectedCities, setSelectedCities] = useState<string[]>(() => searchParams.get('cities')?.split(',').filter(Boolean) || []);
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(() => searchParams.get('neighborhoods')?.split(',').filter(Boolean) || []);
    const [rooms, setRooms] = useState<string[]>(() => searchParams.get('rooms')?.split(',').filter(Boolean) || []);
    const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');

    // Local UI state
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const cityRef = useRef<HTMLDivElement>(null);
    
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
    const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
    const [isNeighborhoodDropdownOpen, setIsNeighborhoodDropdownOpen] = useState(false);
    const neighborhoodRef = useRef<HTMLDivElement>(null);

    // Sync internal state with URL params when they change (e.g. navigation)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setPropertyType(searchParams.get('type') || 'all');
        setSelectedState(searchParams.get('state') || '');
        setSelectedCities(searchParams.get('cities')?.split(',').filter(Boolean) || []);
        setSelectedNeighborhoods(searchParams.get('neighborhoods')?.split(',').filter(Boolean) || []);
        setRooms(searchParams.get('rooms')?.split(',').filter(Boolean) || []);
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
    }, [searchParams]);

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
    
    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const updates = [
            { name: 'type', value: propertyType },
            { name: 'state', value: selectedState },
            { name: 'cities', value: selectedCities.join(',') },
            { name: 'neighborhoods', value: selectedNeighborhoods.join(',') },
            { name: 'rooms', value: rooms.join(',') },
            { name: 'minPrice', value: minPrice },
            { name: 'maxPrice', value: maxPrice },
        ];
        const newQueryString = createQueryString(updates.filter(u => u.value));
        if (onSearch) {
          onSearch(newQueryString);
        } else {
          router.push(`/imoveis?${newQueryString}`, { scroll: true });
        }
    };

    const handleRoomToggle = (room: string) => {
        setRooms(prev => 
            prev.includes(room) ? prev.filter(r => r !== room) : [...prev, room]
        );
    };
  
    const handleCitySelect = (city: string) => {
      setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
      setCitySearch('');
    };
  
    const handleCityRemove = (city: string) => {
      setSelectedCities(prev => prev.filter(c => c !== city));
    };
    
    const handleNeighborhoodSelect = (neighborhood: string) => {
      setSelectedNeighborhoods(prev => prev.includes(neighborhood) ? prev.filter(n => n !== neighborhood) : [...prev, neighborhood]);
      setNeighborhoodSearch('');
    };
  
    const handleNeighborhoodRemove = (neighborhood: string) => {
      setSelectedNeighborhoods(prev => prev.filter(n => n !== neighborhood));
    };

    // Update available cities when state changes
    useEffect(() => {
      if (selectedState) {
          const stateData = locationData.states.find(s => s.uf === selectedState);
          setAvailableCities(stateData?.cities.map(c => c.name) || []);
      } else {
          setAvailableCities([]);
      }
      
      // Only clear selections if this wasn't triggered by the URL sync/mount
      const urlState = searchParams.get('state') || '';
      if (selectedState !== urlState && !isFirstRender.current) {
          setSelectedCities([]);
          setSelectedNeighborhoods([]);
      }
    }, [selectedState, searchParams]);

    // Update available neighborhoods when cities change
    useEffect(() => {
        if (selectedCities.length > 0 && selectedState) {
            const stateData = locationData.states.find(s => s.uf === selectedState);
            if(stateData) {
                const allNeighborhoods = selectedCities.flatMap(cityName => {
                    const cityData = stateData.cities.find(c => c.name === cityName);
                    return cityData ? cityData.neighborhoods : [];
                });
                setAvailableNeighborhoods([...new Set(allNeighborhoods)]);
            }
        } else {
            setAvailableNeighborhoods([]);
        }

        // Only clear if not initial mount and mismatch with URL
        const urlCities = searchParams.get('cities') || '';
        if (selectedCities.join(',') !== urlCities && !isFirstRender.current) {
            setSelectedNeighborhoods([]);
        }
    }, [selectedCities, selectedState, searchParams]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
                setIsCityDropdownOpen(false);
            }
            if (neighborhoodRef.current && !neighborhoodRef.current.contains(event.target as Node)) {
                setIsNeighborhoodDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCities = availableCities.filter(c => 
        c.toLowerCase().includes(citySearch.toLowerCase()) && !selectedCities.includes(c)
    );
    
    const filteredNeighborhoods = availableNeighborhoods.filter(n => 
      n.toLowerCase().includes(neighborhoodSearch.toLowerCase()) && !selectedNeighborhoods.includes(n)
    );

    if (vertical) {
      return (
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-6">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Localização</label>
            <div className="flex flex-col gap-3">
              <select 
                onChange={(e) => setSelectedState(e.target.value)} 
                value={selectedState} 
                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 focus:ring-1 focus:ring-primary outline-none text-text-main font-medium text-sm transition-all appearance-none"
              >
                <option value="">Selecione um Estado</option>
                {locationData.states.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
              </select>

              <div className="relative" ref={cityRef}>
                <div onClick={() => setIsCityDropdownOpen(true)} className="w-full px-4 bg-gray-50 border border-gray-100 rounded-xl h-11 flex items-center cursor-pointer overflow-hidden text-sm font-medium">
                  {selectedCities.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedCities.slice(0, 1).map(c => (
                        <span key={c} className="text-text-main">{c}</span>
                      ))}
                      {selectedCities.length > 1 && <span className="text-primary font-bold">+{selectedCities.length - 1}</span>}
                    </div>
                  ) : <span className="text-gray-400">Selecione cidades</span>}
                </div>
                {isCityDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-xl z-[60]">
                    <div className="p-2">
                      <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full px-3 py-2 text-sm border-gray-100 rounded-md focus:ring-1 focus:ring-primary outline-none" placeholder="Buscar..."/>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCities.map(c => (
                        <div key={c} onClick={() => handleCitySelect(c)} className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">{c}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={neighborhoodRef}>
                <div onClick={() => setIsNeighborhoodDropdownOpen(true)} className="w-full px-4 bg-gray-50 border border-gray-100 rounded-xl h-11 flex items-center cursor-pointer overflow-hidden text-sm font-medium">
                  {selectedNeighborhoods.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedNeighborhoods.slice(0, 1).map(n => (
                        <span key={n} className="text-text-main">{n}</span>
                      ))}
                      {selectedNeighborhoods.length > 1 && <span className="text-primary font-bold">+{selectedNeighborhoods.length - 1}</span>}
                    </div>
                  ) : <span className="text-gray-400">Selecione bairros</span>}
                </div>
                {isNeighborhoodDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-xl z-[50]">
                    <div className="p-2">
                      <input value={neighborhoodSearch} onChange={(e) => setNeighborhoodSearch(e.target.value)} className="w-full px-3 py-2 text-sm border-gray-100 rounded-md focus:ring-1 focus:ring-primary outline-none" placeholder="Buscar..."/>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredNeighborhoods.map(n => (
                        <div key={n} onClick={() => handleNeighborhoodSelect(n)} className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">{n}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Quartos</label>
            <div className="flex flex-wrap gap-2">
              {["1", "2", "3", "4+"].map(room => (
                <button 
                  key={room} 
                  type="button" 
                  onClick={() => handleRoomToggle(room)} 
                  className={cn(
                    "size-8 rounded-lg text-xs font-bold transition-all",
                    rooms.includes(room) ? 'bg-primary text-black shadow-sm' : 'text-gray-400 border border-transparent hover:border-gray-200'
                  )}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Preço</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)} 
                placeholder="Mín" 
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
              />
              <input 
                type="number" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
                placeholder="Máx" 
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-black hover:bg-gray-900 text-primary font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined font-bold">search</span>
            Buscar Imóveis
          </Button>
        </form>
      );
    }

    return (
        <form onSubmit={handleSearchSubmit} className={cn("bg-white/80 backdrop-blur-lg rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-100", className)}>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5 lg:col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Localização</label>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <select onChange={(e) => setSelectedState(e.target.value)} value={selectedState} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-dark-text font-medium placeholder-gray-400 appearance-none text-sm">
                            <option value="">Selecione um Estado</option>
                            {locationData.states.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
                        </select>
                        <div className="relative z-30" ref={cityRef}>
                          <div onClick={() => setIsCityDropdownOpen(true)} className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl h-12 flex items-center cursor-pointer overflow-hidden text-sm font-medium">
                            {selectedCities.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCities.map(c => (
                                  <div key={c} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <span>{c}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleCityRemove(c)}} className="text-blue-400 hover:text-blue-700">
                                      <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-gray-400">Selecione cidades</span>}
                          </div>
                          {isCityDropdownOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg z-30">
                              <div className="p-2">
                                <div className="relative">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                  <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full pl-10 px-3 py-2 text-sm border-gray-200 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none" placeholder="Buscar cidade..."/>
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredCities.map(c => (
                                  <div key={c} onClick={() => handleCitySelect(c)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                    <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', selectedCities.includes(c) ? 'bg-primary border-primary' : 'bg-white border-gray-300')}>
                                      {selectedCities.includes(c) && <span className="material-symbols-outlined text-xs text-black">check</span>}
                                    </div>
                                    {c}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative z-20" ref={neighborhoodRef}>
                            <div onClick={() => setIsNeighborhoodDropdownOpen(true)} className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl h-12 flex items-center cursor-pointer overflow-hidden text-sm font-medium">
                            {selectedNeighborhoods.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                {selectedNeighborhoods.slice(0, 2).map(n => (
                                    <div key={n} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <span>{n}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleNeighborhoodRemove(n)}} className="text-blue-400 hover:text-blue-700">
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                    </div>
                                ))}
                                {selectedNeighborhoods.length > 2 && <span className='text-xs text-gray-500'>+{selectedNeighborhoods.length - 2}</span>}
                                </div>
                            ) : <span className="text-gray-400">Selecione bairros</span>}
                            </div>
                            {isNeighborhoodDropdownOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg z-20">
                                <div className="p-2">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                    <input value={neighborhoodSearch} onChange={(e) => setNeighborhoodSearch(e.target.value)} className="w-full pl-10 px-3 py-2 text-sm border-gray-200 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none" placeholder="Buscar bairro..."/>
                                </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                {filteredNeighborhoods.map(n => (
                                    <div key={n} onClick={() => handleNeighborhoodSelect(n)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                    <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', selectedNeighborhoods.includes(n) ? 'bg-primary border-primary' : 'bg-white border-gray-300')}>
                                        {selectedNeighborhoods.includes(n) && <span className="material-symbols-outlined text-xs text-black">check</span>}
                                    </div>
                                    {n}
                                    </div>
                                ))}
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quartos</label>
                <div className="flex items-center h-12 w-full bg-gray-50 border border-gray-200 rounded-xl p-1 gap-1">
                  {["1", "2", "3", "4+"].map(room => (
                      <button key={room} type="button" onClick={() => handleRoomToggle(room)} className={cn("flex-1 h-full rounded-lg text-sm font-bold transition-colors", rooms.includes(room) ? 'bg-black text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200')}>
                        {room}
                      </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Preço Mínimo</label>
                    <Input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="R$ 0" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-dark-text font-medium" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Preço Máximo</label>
                    <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Sem limite" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-dark-text font-medium" />
                </div>
              </div>
              <div className="w-full flex items-end">
                <Button className="h-12 w-full px-8 rounded-lg bg-black text-primary font-bold hover:bg-gray-900 transition-colors shadow-lg flex items-center justify-center gap-2" type="submit">
                    <span className="material-symbols-outlined font-bold">search</span>
                    Buscar
                </Button>
              </div>
            </div>
          </div>
        </form>
    )
}
