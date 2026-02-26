'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { WhatsAppWidget } from '../components/WhatsAppWidget';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accentColor?: string;
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
    address?: string;
    bairro: string;
    cidade: string;
    estado: string;
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

type MapClientPageProps = {
  broker: Broker;
  properties: Property[];
};

type GeocodedProperty = Property & {
    position: { lat: number; lng: number };
};

type Poi = {
  id: string;
  position: { lat: number; lng: number };
  name: string;
  type: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -7.1195,
  lng: -34.8451,
};

const poiCategories = [
    { type: 'school', name: 'Escolas', icon: 'school' },
    { type: 'bank', name: 'Bancos', icon: 'account_balance' },
    { type: 'supermarket', name: 'Mercados', icon: 'shopping_cart' },
    { type: 'shopping_mall', name: 'Shoppings', icon: 'store' },
    { type: 'gym', name: 'Academias', icon: 'fitness_center' },
    { type: 'gas_station', name: 'Postos', icon: 'local_gas_station' },
    { type: 'park', name: 'Praças', icon: 'park' },
    { type: 'bakery', name: 'Padarias', icon: 'bakery_dining' },
    { type: 'bar', name: 'Bares', icon: 'local_bar' },
    { type: 'restaurant', name: 'Restaurantes', icon: 'restaurant' },
    { type: 'subway_station', name: 'Metrô', icon: 'tram' },
    { type: 'pet_store', name: 'Petshops', icon: 'pets' },
];

export default function MapClientPage({ broker, properties }: MapClientPageProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCbPxGXZuW0kPodzVnymKb8CbXnAF5Pdkg',
    libraries: ['places'],
    preventGoogleFontsLoading: true, 
  });
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<GeocodedProperty | null>(null);
  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRooms, setFilterRooms] = useState("any");
  const [filterMinPrice, setFilterMinPrice] = useState("0");
  const [filterMaxPrice, setFilterMaxPrice] = useState("unlimited");
  
  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    type: "all",
    rooms: "any",
    min: "0",
    max: "unlimited"
  });

  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  
  const [places, setPlaces] = useState<Poi[]>([]);
  const [activePoiTypes, setActivePoiTypes] = useState<string[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(13);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const poiIcons: { [key: string]: google.maps.Symbol } = useMemo(() => {
    if (!isLoaded) return {};
    const path = window.google.maps.SymbolPath.CIRCLE;
    return {
      school: { path, fillColor: '#4285F4', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      bank: { path, fillColor: '#FBBC05', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      supermarket: { path, fillColor: '#34A853', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      shopping_mall: { path, fillColor: '#EA4335', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      gym: { path, fillColor: '#9C27B0', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      gas_station: { path, fillColor: '#FF9800', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      park: { path, fillColor: '#009688', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      bakery: { path, fillColor: '#795548', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      bar: { path, fillColor: '#FFC107', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      restaurant: { path, fillColor: '#E91E63', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      subway_station: { path, fillColor: '#2196F3', fillOpacity: 1, strokeWeight: 0, scale: 5 },
      pet_store: { path, fillColor: '#673AB7', fillOpacity: 1, strokeWeight: 0, scale: 5 },
    };
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && properties.length > 0) {
      const geocoder = new window.google.maps.Geocoder();
      const geocoded: GeocodedProperty[] = [];
      let processedCount = 0;

      properties.forEach(property => {
        const addressString = property.localizacao.address || `${property.localizacao.bairro}, ${property.localizacao.cidade}, ${property.localizacao.estado}`;

        if (property.localizacao.latitude && property.localizacao.longitude) {
            geocoded.push({ ...property, position: { lat: property.localizacao.latitude, lng: property.localizacao.longitude } });
            processedCount++;
            if (processedCount === properties.length) {
                setGeocodedProperties(geocoded);
            }
        } else {
          geocoder.geocode({ address: addressString }, (results, status) => {
            processedCount++;
            if (status === 'OK' && results && results[0]) {
              geocoded.push({
                ...property,
                position: {
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                },
              });
            }
            if (processedCount === properties.length) {
              setGeocodedProperties(geocoded);
            }
          });
        }
      });
    }
  }, [isLoaded, properties]);

  const filteredProperties = useMemo(() => {
    return geocodedProperties.filter(property => {
      const q = appliedFilters.q.toLowerCase();
      const matchesSearch = q === "" || 
        property.informacoesbasicas.nome.toLowerCase().includes(q) ||
        property.localizacao.bairro.toLowerCase().includes(q) ||
        property.localizacao.cidade.toLowerCase().includes(q);

      const matchesType = appliedFilters.type === "all" || property.caracteristicasimovel.tipo === appliedFilters.type;

      let matchesRooms = true;
      if (appliedFilters.rooms !== "any") {
        const propertyRooms = Array.isArray(property.caracteristicasimovel.quartos)
          ? property.caracteristicasimovel.quartos.map(r => parseInt(r))
          : [parseInt(String(property.caracteristicasimovel.quartos || '0'))];
        
        const filterVal = parseInt(appliedFilters.rooms);
        if (appliedFilters.rooms.includes("+")) {
          matchesRooms = propertyRooms.some(r => r >= filterVal);
        } else {
          matchesRooms = propertyRooms.includes(filterVal);
        }
      }

      const price = property.informacoesbasicas.valor || 0;
      const min = parseInt(appliedFilters.min);
      const max = appliedFilters.max === "unlimited" ? Infinity : parseInt(appliedFilters.max);
      const matchesPrice = price >= min && price <= max;

      return matchesSearch && matchesType && matchesRooms && matchesPrice;
    });
  }, [geocodedProperties, appliedFilters]);
    
  const handleMarkerClick = (property: GeocodedProperty) => {
      setSelectedProperty(property);
  };
  
  const handleCloseModal = () => {
      setSelectedProperty(null);
  }
  
  const handlePoiToggle = (poiType: string) => {
    setActivePoiTypes(prev => 
      prev.includes(poiType) ? prev.filter(t => t !== poiType) : [...prev, poiType]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      q: searchQuery,
      type: filterType,
      rooms: filterRooms,
      min: filterMinPrice,
      max: filterMaxPrice
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterRooms("any");
    setFilterMinPrice("0");
    setFilterMaxPrice("unlimited");
    setAppliedFilters({
      q: "",
      type: "all",
      rooms: "any",
      min: "0",
      max: "unlimited"
    });
  };

  useEffect(() => {
      if (!isLoaded || !mapRef.current || !mapRef.current.getCenter()) return;

      if (activePoiTypes.length === 0) {
        setPlaces([]);
        return;
      }

      const service = new window.google.maps.places.PlacesService(mapRef.current);
      let newPlaces: Poi[] = [];
      let searchesCompleted = 0;
      
      activePoiTypes.forEach(type => {
        const request = {
          location: mapRef.current?.getCenter(),
          radius: 5000,
          type: type,
        };

        service.nearbySearch(request, (results, status) => {
          searchesCompleted++;
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const pois = results.map(place => ({
              id: place.place_id || `${place.name}-${Math.random()}`,
              position: {
                lat: place.geometry?.location?.lat()!,
                lng: place.geometry?.location?.lng()!,
              },
              name: place.name!,
              type: type,
            }));
            
            const uniquePlaces = new Map<string, Poi>();
            [...newPlaces, ...pois].forEach(p => {
                if (p.id) uniquePlaces.set(p.id, p);
            });
            newPlaces = Array.from(uniquePlaces.values());
          }
          if (searchesCompleted === activePoiTypes.length) {
              setPlaces(newPlaces);
          }
        });
      });
    }, [activePoiTypes, isLoaded]);

  if (loadError) {
      return <div className="p-4">Erro ao carregar o mapa. Por favor, recarregue a página.</div>;
  }

  const dynamicStyles = {
    '--background': broker.backgroundColor,
    '--foreground': broker.foregroundColor,
    '--primary': broker.primaryColor,
    '--secondary': broker.secondaryColor,
    '--accent': broker.accentColor,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col group/design-root bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
      <UrbanPadraoHeader broker={broker} />
      <main className="flex-1 w-full flex relative h-[calc(100vh-64px)] overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#f3f4f6] w-full h-full">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={zoom}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                  {
                    "featureType": "poi",
                    "elementType": "labels.icon",
                    "stylers": [
                      { "visibility": "off" }
                    ]
                  },
                ]
              }}
            >
              {filteredProperties.map((property) => (
                  <Marker 
                    key={property.id} 
                    position={property.position} 
                    onClick={() => handleMarkerClick(property)}
                     icon={{
                        path: 'M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0',
                        fillColor: selectedProperty?.id === property.id ? '#c3e738' : '#111418',
                        fillOpacity: 1,
                        strokeColor: '#FFFFFF',
                        strokeWeight: selectedProperty?.id === property.id ? 2 : 1.5,
                        scale: selectedProperty?.id === property.id ? 1.2 : 0.8,
                    }}
                  />
                )
              )}
              {places.map((place) => (
                  <Marker
                      key={place.id}
                      position={place.position}
                      icon={poiIcons[place.type as keyof typeof poiIcons]}
                      onClick={() => setSelectedPoi(place)}
                      title={place.name}
                    />
              ))}
              {selectedPoi && (
                <InfoWindow
                  position={selectedPoi.position}
                  onCloseClick={() => setSelectedPoi(null)}
                >
                  <div className="p-1 font-bold text-black">{selectedPoi.name}</div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : <div className="w-full h-full flex items-center justify-center bg-gray-200 map-pattern"><p>Carregando mapa...</p></div>}
        </div>
        
        <div className={cn("absolute top-6 left-6 z-30 w-full max-w-sm flex flex-col gap-4 transition-transform duration-300 ease-in-out", !isFilterOpen && "-translate-x-[calc(100%+32px)]")}>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-float border border-gray-100 p-[5px]">
                <form onSubmit={handleSearchSubmit} className="p-4" style={{ padding: '5px' }}>
                    <div className="relative mb-4">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-12 pl-10 pr-4 py-2.5 rounded-xl border-gray-200 bg-gray-50 text-sm font-medium focus:border-black focus:ring-0 transition-all placeholder:text-gray-400" 
                          placeholder="Cidade, bairro ou condomínio" 
                          type="text"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="flex-1 min-w-[100px] cursor-pointer">
                            <span className="text-[10px] text-gray-500 font-bold block mb-1">Tipo</span>
                            <select 
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value)}
                              className="w-full h-11 border border-gray-200 rounded-xl p-2 text-xs font-bold focus:ring-primary focus:border-primary"
                            >
                                <option value="all">Todos</option>
                                <option value="Apartamento">Apartamento</option>
                                <option value="Casa">Casa</option>
                                <option value="Cobertura">Cobertura</option>
                                <option value="Studio">Studio</option>
                                <option value="Terreno">Terreno</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[80px] cursor-pointer">
                            <span className="text-[10px] text-gray-500 font-bold block mb-1">Quartos</span>
                            <select 
                              value={filterRooms}
                              onChange={(e) => setFilterRooms(e.target.value)}
                              className="w-full h-11 border border-gray-200 rounded-xl p-2 text-xs font-bold focus:ring-primary focus:border-primary"
                            >
                              <option value="any">Qualquer</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4+">4+</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[100px] cursor-pointer">
                            <span className="text-[10px] text-gray-500 font-bold block mb-1">Preço Mínimo</span>
                             <select 
                              value={filterMinPrice}
                              onChange={(e) => setFilterMinPrice(e.target.value)}
                              className="w-full h-11 border border-gray-200 rounded-xl p-2 text-xs font-bold focus:ring-primary focus:border-primary"
                             >
                              <option value="0">R$ 0</option>
                              <option value="500000">R$ 500.000</option>
                              <option value="1000000">R$ 1.000.000</option>
                              <option value="2000000">R$ 2.000.000</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[100px] cursor-pointer">
                            <span className="text-[10px] text-gray-500 font-bold block mb-1">Preço Máximo</span>
                             <select 
                              value={filterMaxPrice}
                              onChange={(e) => setFilterMaxPrice(e.target.value)}
                              className="w-full h-11 border border-gray-200 rounded-xl p-2 text-xs font-bold focus:ring-primary focus:border-primary"
                             >
                              <option value="unlimited">Sem limite</option>
                              <option value="1000000">R$ 1.000.000</option>
                              <option value="2000000">R$ 2.000.000</option>
                              <option value="5000000">R$ 5.000.000</option>
                              <option value="10000000">R$ 10.000.000</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={handleClearFilters}
                          className="h-12 border border-gray-200 text-text-muted rounded-xl font-bold hover:bg-gray-800 hover:text-white transition-all shadow-sm flex-1 flex items-center justify-center gap-2"
                        >
                            Limpar
                        </button>
                        <button 
                          type="submit" 
                          className="h-12 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg flex-1 flex items-center justify-center gap-2"
                        >
                            Buscar
                        </button>
                    </div>
                </form>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-float border border-gray-100 p-2 flex items-center justify-start gap-2 flex-wrap">
              {poiCategories.map(category => (
                  <button 
                      key={category.type} 
                      onClick={() => handlePoiToggle(category.type)}
                      className={cn('flex flex-col items-center justify-center gap-1 p-1 rounded-lg transition-colors w-16 text-text-muted', activePoiTypes.includes(category.type) ? 'bg-primary/20 text-text-main' : 'hover:bg-gray-100')}
                      title={category.name}
                  >
                      <span className="material-symbols-outlined text-xl">{category.icon}</span>
                      <span className="text-[10px] font-bold">{category.name}</span>
                  </button>
              ))}
            </div>
        </div>
          
        {!isFilterOpen && (
          <button onClick={() => setIsFilterOpen(true)} className="absolute top-6 left-6 z-30 flex items-center justify-center size-12 bg-white rounded-full shadow-float border border-gray-100 text-gray-600 hover:text-black hover:scale-105 transition-all">
              <span className="material-symbols-outlined">tune</span>
          </button>
        )}

        <div className={cn("absolute top-6 right-6 bottom-6 w-full max-w-[400px] z-30 flex flex-col transition-transform duration-300 ease-in-out", !isResultsOpen && "translate-x-[calc(100%+32px)]")}>
          <div className="bg-white rounded-2xl shadow-float border border-gray-100 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-lg">Resultados na área</h3>
                  <p className="text-xs text-text-muted">{filteredProperties.length} imóveis encontrados</p>
                </div>
                 <button onClick={() => setIsResultsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div className="flex-1 h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {filteredProperties.length > 0 ? filteredProperties.map(property => (
                  <div key={property.id} className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => handleMarkerClick(property)}>
                    <div className="relative h-40 w-full overflow-hidden">
                      <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-bold">Venda</div>
                      <div className="absolute top-2 right-2 z-10 bg-white/30 backdrop-blur-md p-1.5 rounded-full hover:bg-white text-white hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">favorite</span>
                      </div>
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{backgroundImage: `url("${property.midia?.[0] || 'https://picsum.photos/seed/list/400/300'}")`}}></div>
                    </div>
                    <div className="p-3">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                                <h4 className="font-bold text-text-main text-sm">{property.informacoesbasicas.nome}</h4>
                                <p className="text-text-muted text-xs flex items-start gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[14px] mt-px">location_on</span>
                                    <span>{property.localizacao.bairro}, {property.localizacao.cidade}</span>
                                </p>
                            </div>
                            {property.informacoesbasicas.valor && <span className="text-primary-hover font-black text-sm whitespace-nowrap">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits:0 }).format(property.informacoesbasicas.valor)}</span>}
                        </div>
                        <div className="flex gap-3 text-xs text-text-muted font-medium pt-2 border-t border-gray-100 mt-2">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bed</span> {Array.isArray(property.caracteristicasimovel.quartos) ? property.caracteristicasimovel.quartos.join(', ') : property.caracteristicasimovel.quartos}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                        </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center text-center h-full p-4">
                    <span className="material-symbols-outlined text-5xl text-gray-300">search_off</span>
                    <h4 className="font-bold mt-4">Nenhum resultado</h4>
                    <p className="text-xs text-gray-500 mt-1">Tente ajustar seus filtros para encontrar o imóvel perfeito.</p>
                  </div>
                )}
              </div>
          </div>
        </div>
        
        {!isResultsOpen && (
             <button onClick={() => setIsResultsOpen(true)} className="absolute top-6 right-6 z-30 flex items-center justify-center size-12 bg-white rounded-full shadow-float border border-gray-200 text-gray-600 hover:text-black hover:scale-105 transition-all">
                <span className="material-symbols-outlined">list_alt</span>
            </button>
        )}

        {selectedProperty && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/20" onClick={handleCloseModal}>
                <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-float overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleCloseModal} className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur rounded-full p-1.5 text-gray-500 hover:text-black hover:bg-white transition-colors shadow-sm">
                         <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <div className="h-56 relative w-full group cursor-pointer">
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                            <span className="bg-primary text-black text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">Destaque</span>
                            <span className="bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">Venda</span>
                        </div>
                        <div className="absolute top-3 right-3 z-10 bg-white/30 backdrop-blur-md p-1.5 rounded-full hover:bg-white text-white hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">favorite</span>
                        </div>
                        <Image alt={selectedProperty.informacoesbasicas.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={selectedProperty.midia?.[0] || 'https://picsum.photos/seed/modal/400/224'} fill/>
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="text-xl font-bold text-text-main leading-tight">{selectedProperty.informacoesbasicas.nome}</h3>
                            <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">location_on</span>
                                {selectedProperty.localizacao.bairro}, {selectedProperty.localizacao.cidade}
                            </p>
                        </div>
                        <div className="text-right">
                            {selectedProperty.informacoesbasicas.valor && (
                            <p className="text-xl font-black text-primary-hover">{selectedProperty.informacoesbasicas.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            )}
                            <p className="text-xs text-text-muted font-medium">Cond: R$ 850</p>
                        </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                            <span className="material-symbols-outlined text-gray-400 mb-1 text-xl">bed</span>
                            <span className="text-xs font-bold text-text-main">{Array.isArray(selectedProperty.caracteristicasimovel.quartos) ? selectedProperty.caracteristicasimovel.quartos.join(', ') : selectedProperty.caracteristicasimovel.quartos} Quartos</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                            <span className="material-symbols-outlined text-gray-400 mb-1 text-xl">shower</span>
                            <span className="text-xs font-bold text-text-main">{selectedProperty.caracteristicasimovel.vagas || 0} Banheiros</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                            <span className="material-symbols-outlined text-gray-400 mb-1 text-xl">square_foot</span>
                            <span className="text-xs font-bold text-text-main">{selectedProperty.caracteristicasimovel.tamanho}</span>
                        </div>
                        </div>
                        <div>
                        <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                            {selectedProperty.informacoesbasicas.descricao}
                        </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <Link href={`/sites/${broker.slug}/imovel/${selectedProperty.informacoesbasicas.slug || selectedProperty.id}`} className="flex-1 bg-primary hover:bg-primary-hover text-black font-bold h-11 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                                Ver Detalhes
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </Link>
                        <button className="size-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all">
                            <span className="material-symbols-outlined">favorite</span>
                        </button>
                        </div>
                    </div>
                </div>
            </div>
          )}
        <WhatsAppWidget brokerId={broker.id}/>
      </main>
    </div>
  );
}
