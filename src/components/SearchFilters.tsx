'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import locationData from '@/lib/location-data.json';
import { Button } from '@/components/ui/button';

export default function SearchFilters({ onSearch }: { onSearch?: (query: string) => void }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // URL-derived state for filters
    const [propertyType, setPropertyType] = useState(() => searchParams.get('type') || 'all');
    const [selectedState, setSelectedState] = useState(() => searchParams.get('state') || '');
    const [selectedCities, setSelectedCities] = useState<string[]>(() => searchParams.get('cities')?.split(',').filter(Boolean) || []);
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(() => searchParams.get('neighborhoods')?.split(',').filter(Boolean) || []);
    const [rooms, setRooms] = useState<string[]>(() => searchParams.get('rooms')?.split(',').filter(Boolean) || []);
    const [price, setPrice] = useState(() => searchParams.get('price') || '5000000');

    // Local UI state
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const cityRef = useRef<HTMLDivElement>(null);
    
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
    const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
    const [isNeighborhoodDropdownOpen, setIsNeighborhoodDropdownOpen] = useState(false);
    const neighborhoodRef = useRef<HTMLDivElement>(null);

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
            { name: 'price', value: price },
        ];
        const newQueryString = createQueryString(updates);
        if (onSearch) {
          onSearch(newQueryString);
        } else {
          router.push(`/imoveis?${newQueryString}`, { scroll: false });
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

    useEffect(() => {
      if (selectedState) {
          const stateData = locationData.states.find(s => s.uf === selectedState);
          setAvailableCities(stateData?.cities.map(c => c.name) || []);
      } else {
          setAvailableCities([]);
      }
      setSelectedCities([]);
      setSelectedNeighborhoods([]);
    }, [selectedState]);

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
        setSelectedNeighborhoods([]);
    }, [selectedCities, selectedState]);


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

    return (
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</label>
            <select onChange={(e) => {setSelectedState(e.target.value); setSelectedCities([]); setSelectedNeighborhoods([]);}} value={selectedState} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-dark-text font-medium placeholder-gray-400 appearance-none">
               <option value="">Selecione um Estado</option>
               {locationData.states.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
            </select>
          </div>
          <div className="relative z-30 space-y-1.5" ref={cityRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cidades</label>
             <div className="relative">
               <div onClick={() => setIsCityDropdownOpen(true)} className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl min-h-[44px] flex items-center cursor-pointer overflow-hidden text-sm font-medium">
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
          </div>
           <div className="relative z-20 space-y-1.5" ref={neighborhoodRef}>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bairros</label>
              <div className="relative">
                  <div onClick={() => setIsNeighborhoodDropdownOpen(true)} className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl min-h-[44px] flex items-center cursor-pointer overflow-hidden text-sm font-medium">
                  {selectedNeighborhoods.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                      {selectedNeighborhoods.slice(0, 3).map(n => (
                          <div key={n} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span>{n}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleNeighborhoodRemove(n)}} className="text-blue-400 hover:text-blue-700">
                              <span className="material-symbols-outlined text-[12px]">close</span>
                          </button>
                          </div>
                      ))}
                      {selectedNeighborhoods.length > 3 && <span className='text-xs text-gray-500'>+{selectedNeighborhoods.length - 3}</span>}
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo de imóvel</label>
            <select onChange={(e) => setPropertyType(e.target.value)} value={propertyType} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-dark-text font-medium appearance-none">
                <option value="all">Todos os tipos</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Cobertura">Cobertura</option>
            </select>
          </div>
          <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quartos</label>
              <div className="flex items-center h-11 w-full bg-gray-50 border border-gray-200 rounded-xl p-1 gap-1">
                  {["1", "2", "3", "4+"].map(room => (
                  <button key={room} type="button" onClick={() => handleRoomToggle(room)} className={cn("flex-1 h-full rounded-lg text-sm font-bold transition-colors", rooms.includes(room) ? 'bg-black text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200')}>
                      {room}
                  </button>
                  ))}
              </div>
          </div>
          <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Imóveis até:</label>
                  <div className="text-right">
                      <span className="font-display font-bold text-dark-text">R$ {Number(price).toLocaleString('pt-BR')}</span>
                  </div>
              </div>
              <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" max="5000000" min="100000" step="50000" type="range" />
          </div>
          <Button type="submit" className="w-full h-12">Aplicar Filtros</Button>
        </form>
    )
}
