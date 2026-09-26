'use client';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import locationData from '@/lib/location-data.json';
import { cn, formatArea } from '@/lib/utils';

type Property = {
  id: string;
  title?: string;
  informacoesbasicas?: {
    nome?: string;
    status?: string;
    valor?: number;
    descricao?: string;
    slug?: string;
  };
  localizacao?: {
    bairro?: string;
    cidade?: string;
    estado?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  midia?: string[];
  images?: string[];
  caracteristicasimovel?: {
    tipo?: string;
    quartos?: string[] | string | number;
    tamanho?: string | number;
    vagas?: string | number;
  };
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
  lat: -7.1195, // João Pessoa
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

export default function MapResultsComponent({ properties = [], searchControls }: { properties: Property[], searchControls?: React.ReactNode }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCbPxGXZuW0kPodzVnymKb8CbXnAF5Pdkg',
        libraries: ['places'],
        preventGoogleFontsLoading: true, 
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const [selectedProperty, setSelectedProperty] = useState<GeocodedProperty | null>(null);
    const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isResultsOpen, setIsResultsOpen] = useState(true);
    
    // State for POIs
    const [places, setPlaces] = useState<Poi[]>([]);
    const [activePoiTypes, setActivePoiTypes] = useState<string[]>([]);
    const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

    const searchParams = useSearchParams();
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(13);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 2);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
      }
    };

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const scrollByAmount = (offset: number) => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        setTimeout(checkScroll, 300);
      }
    };

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
        if (isLoaded && Array.isArray(properties) && properties.length > 0) {
          const geocoder = new window.google.maps.Geocoder();
          const geocoded: GeocodedProperty[] = [];
          let processedCount = 0;

          properties.forEach(property => {
            const loc = property.localizacao || {};
            const addressString = loc.address || [loc.bairro, loc.cidade, loc.estado].filter(Boolean).join(', ') || 'João Pessoa, Paraíba';
            const lat = loc.latitude;
            const lng = loc.longitude;
            const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

            if (hasValidCoords) {
                geocoded.push({ ...property, position: { lat: lat!, lng: lng! } });
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
        } else {
          setGeocodedProperties([]);
        }
      }, [isLoaded, properties]);

    useEffect(() => {
        if (!isLoaded) return;
        
        const geocoder = new window.google.maps.Geocoder();
        const stateUf = searchParams.get('state');
        const citiesParam = searchParams.get('cities');
        const neighborhoodsParam = searchParams.get('neighborhoods');

        let address = 'João Pessoa, Brazil';
        let newZoom = 13;

        if (stateUf) {
            const stateData = locationData.states.find(s => s.uf === stateUf);
            address = stateData ? stateData.name : stateUf;
            newZoom = 7;
        }

        if (citiesParam) {
            const firstCity = citiesParam.split(',')[0].trim();
            if (firstCity) {
                address = `${firstCity}, ${address}`;
                newZoom = 12;
            }
        }

        if (neighborhoodsParam) {
            const firstNeighborhood = neighborhoodsParam.split(',')[0].trim();
            if (firstNeighborhood) {
                address = `${firstNeighborhood}, ${address}`;
                newZoom = 14;
            }
        }
        
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setMapCenter({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                });
                setZoom(newZoom);
            }
        });
    }, [isLoaded, searchParams]);

    const handleMarkerClick = (property: GeocodedProperty) => {
        setSelectedProperty(property);
        if (mapRef.current && property.position) {
            mapRef.current.panTo(property.position);
        }
    };

    const handleCloseModal = () => {
        setSelectedProperty(null);
    };

    const togglePoiCategory = (type: string) => {
        setActivePoiTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    useEffect(() => {
        if (!isLoaded || !mapRef.current || activePoiTypes.length === 0) {
            setPlaces([]);
            return;
        }

        const service = new window.google.maps.places.PlacesService(mapRef.current);
        const newPlaces: Poi[] = [];
        let completedRequests = 0;

        activePoiTypes.forEach(type => {
            const request = {
                location: mapRef.current?.getCenter() || defaultCenter,
                radius: 2000,
                type: type
            };

            service.nearbySearch(request, (results, status) => {
                completedRequests++;
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    results.forEach(place => {
                        if (place.geometry?.location && place.place_id && place.name) {
                            newPlaces.push({
                                id: place.place_id,
                                name: place.name,
                                type: type,
                                position: {
                                    lat: place.geometry.location.lat(),
                                    lng: place.geometry.location.lng()
                                }
                            });
                        }
                    });
                }
                if (completedRequests === activePoiTypes.length) {
                    setPlaces(newPlaces);
                }
            });
        });
    }, [isLoaded, activePoiTypes, mapCenter]);

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <p>Erro ao carregar o Google Maps. Verifique sua chave de API.</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <p>Carregando mapa...</p>
            </div>
        );
    }

    return (
      <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px]">
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
                      featureType: 'poi.business',
                      stylers: [{ visibility: 'off' }],
                  },
              ],
          }}
        >
          {geocodedProperties.map((property) => {
              const isSelected = selectedProperty?.id === property.id;
              const isHovered = hoveredPropertyId === property.id;
              const valor = property.informacoesbasicas?.valor;
              const hasValidPrice = typeof valor === 'number' && !isNaN(valor) && valor > 0;
              const priceText = hasValidPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor) : 'Detalhes';

              return (
                  <Marker
                      key={property.id}
                      position={property.position}
                      onClick={() => handleMarkerClick(property)}
                      zIndex={isSelected || isHovered ? 1000 : 1}
                      icon={{
                          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" width="90" height="36" viewBox="0 0 90 36">
                                  <rect width="90" height="36" rx="18" fill="${isSelected ? '#000000' : '#ffffff'}" stroke="${isSelected ? '#ffffff' : '#e5e7eb'}" stroke-width="2"/>
                                  <text x="45" y="22" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${isSelected ? '#ffffff' : '#111827'}" text-anchor="middle">${priceText}</text>
                              </svg>
                          `),
                          scaledSize: new window.google.maps.Size(76, 32),
                          anchor: new window.google.maps.Point(38, 16),
                      }}
                  />
              );
          })}

          {places.map((poi) => (
              <Marker
                  key={poi.id}
                  position={poi.position}
                  title={poi.name}
                  onClick={() => setSelectedPoi(poi)}
                  icon={poiIcons[poi.type] || undefined}
              />
          ))}

          {selectedPoi && (
              <InfoWindow
                  position={selectedPoi.position}
                  onCloseClick={() => setSelectedPoi(null)}
              >
                  <div className="p-2 max-w-xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">{selectedPoi.type}</span>
                      <h4 className="font-bold text-sm text-gray-900">{selectedPoi.name}</h4>
                  </div>
              </InfoWindow>
          )}
        </GoogleMap>

        {/* Compact POI Category Navigation Bar with Smooth Scroll & Hidden Scrollbar */}
        <div className="absolute top-6 left-6 right-[420px] z-30 pointer-events-auto flex items-center">
          <div className="relative flex items-center w-full bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-float border border-gray-100">
            {canScrollLeft && (
              <button 
                onClick={() => scrollByAmount(-220)}
                className="absolute left-1 z-10 size-8 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-sm border border-gray-200 flex items-center justify-center transition-all"
                aria-label="Rolar para esquerda"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
            )}

            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-0.5 w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {poiCategories.map(category => {
                  const isActive = activePoiTypes.includes(category.type);
                  return (
                      <button
                          key={category.type}
                          onClick={() => togglePoiCategory(category.type)}
                          className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
                              isActive ? "bg-black text-white shadow-xs" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          )}
                      >
                          <span className="material-symbols-outlined text-[14px]">{category.icon}</span>
                          <span className="text-[11px] font-bold">{category.name}</span>
                      </button>
                  );
              })}
            </div>

            {canScrollRight && (
              <button 
                onClick={() => scrollByAmount(220)}
                className="absolute right-1 z-10 size-8 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-sm border border-gray-200 flex items-center justify-center transition-all"
                aria-label="Rolar para direita"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            )}
          </div>
        </div>

        <div className={cn("absolute top-6 right-6 bottom-6 w-full max-w-[400px] z-30 flex flex-col transition-transform duration-300 ease-in-out", !isResultsOpen && "translate-x-[calc(100%+32px)]")}>
          <div className="bg-white rounded-2xl shadow-float border border-gray-100 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-lg">Resultados na área</h3>
                  <p className="text-xs text-text-muted">{Array.isArray(properties) ? properties.length : 0} imóveis encontrados</p>
                </div>
                 <button onClick={() => setIsResultsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div className="flex-1 h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {Array.isArray(properties) && properties.length > 0 ? properties.map(property => {
                  const loc = property.localizacao || {};
                  const locationText = [loc.bairro, loc.cidade].filter(Boolean).join(', ');
                  const info = property.informacoesbasicas || {};
                  const caracteristicas = property.caracteristicasimovel || {};
                  const imgUrl = property.midia?.[0] || property.images?.[0] || 'https://picsum.photos/seed/list/400/300';
                  const quartosVal = caracteristicas.quartos;
                  const quartosFormatted = Array.isArray(quartosVal) ? quartosVal.join(', ') : quartosVal;
                  const valor = info.valor;
                  const hasValidPrice = typeof valor === 'number' && !isNaN(valor) && valor > 0;

                  return (
                    <div key={property.id} className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => handleMarkerClick(property as GeocodedProperty)}>
                      <div className="relative h-40 w-full overflow-hidden">
                        <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-bold">Venda</div>
                        <div className="absolute top-2 right-2 z-10 bg-white/30 backdrop-blur-md p-1.5 rounded-full hover:bg-white text-white hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">favorite</span>
                        </div>
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{backgroundImage: `url("${imgUrl}")`}}></div>
                      </div>
                      <div className="p-3">
                          <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                  <h4 className="font-bold text-text-main text-sm">{info.nome || property.title || 'Imóvel'}</h4>
                                  {locationText && (
                                    <p className="text-text-muted text-xs flex items-start gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[14px] mt-px">location_on</span>
                                        <span>{locationText}</span>
                                    </p>
                                  )}
                              </div>
                              {hasValidPrice && (
                                <span className="text-primary-hover font-black text-sm whitespace-nowrap">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor!)}
                                </span>
                              )}
                          </div>
                          <div className="flex gap-3 text-xs text-text-muted font-medium pt-2 border-t border-gray-100 mt-2">
                              {quartosFormatted !== undefined && quartosFormatted !== null && (
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bed</span> {quartosFormatted}</span>
                              )}
                              {caracteristicas.tamanho !== undefined && caracteristicas.tamanho !== null && (
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">square_foot</span> {formatArea(String(caracteristicas.tamanho))}</span>
                              )}
                          </div>
                      </div>
                    </div>
                  );
                }) : (
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
             <button onClick={() => setIsResultsOpen(true)} className="absolute top-6 right-6 z-30 flex items-center justify-center size-12 bg-white rounded-full shadow-float border border-gray-100 text-gray-600 hover:text-black hover:scale-105 transition-all">
                <span className="material-symbols-outlined">list_alt</span>
            </button>
        )}

        {selectedProperty && (() => {
            const selLoc = selectedProperty.localizacao || {};
            const selLocationText = [selLoc.bairro, selLoc.cidade].filter(Boolean).join(', ');
            const selInfo = selectedProperty.informacoesbasicas || {};
            const selCar = selectedProperty.caracteristicasimovel || {};
            const selImg = selectedProperty.midia?.[0] || selectedProperty.images?.[0] || 'https://picsum.photos/seed/modal/400/224';
            const selQuartos = selCar.quartos;
            const selQuartosFmt = Array.isArray(selQuartos) ? selQuartos.join(', ') : selQuartos;
            const selValor = selInfo.valor;
            const selHasValidPrice = typeof selValor === 'number' && !isNaN(selValor) && selValor > 0;

            return (
              <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/20" onClick={handleCloseModal}>
                  <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-float overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={handleCloseModal} className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur rounded-full p-1.5 text-gray-500 hover:text-black hover:bg-white transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                      <div className="h-56 relative w-full group cursor-pointer">
                          <div className="absolute top-3 left-3 z-10 flex gap-2">
                              <span className="bg-primary !text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">Destaque</span>
                              <span className="bg-black/70 backdrop-blur !text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">Venda</span>
                          </div>
                          <Image alt={selInfo.nome || selectedProperty.title || 'Imóvel'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={selImg} fill referrerPolicy="no-referrer" />
                      </div>
                      <div className="p-5 flex flex-col gap-3">
                          <div className="flex justify-between items-start mb-1">
                          <div>
                              <h3 className="text-xl font-bold text-text-main leading-tight">{selInfo.nome || selectedProperty.title || 'Imóvel'}</h3>
                              {selLocationText && (
                                <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">location_on</span>
                                    {selLocationText}
                                </p>
                              )}
                          </div>
                          <div className="text-right">
                              {selHasValidPrice && (
                              <p className="text-xl font-black text-primary-hover">{selValor!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                              )}
                          </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
                          {selQuartosFmt !== undefined && selQuartosFmt !== null && (
                            <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                                <span className="material-symbols-outlined text-gray-400 mb-1 text-xl">bed</span>
                                <span className="text-xs font-bold text-text-main">{selQuartosFmt} Quartos</span>
                            </div>
                          )}
                          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                              <span className="material-symbols-outlined text-gray-400 mb-1 text-xl">shower</span>
                              <span className="text-xs font-bold text-text-main">{selCar.vagas || 0} Vagas</span>
                          </div>
                          {selCar.tamanho !== undefined && selCar.tamanho !== null && (
                            <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                                <span className="material-symbols-outlined text-gray-400 mb-1 text-xl">square_foot</span>
                                <span className="text-xs font-bold text-text-main">{formatArea(String(selCar.tamanho))}</span>
                            </div>
                          )}
                          </div>
                          {selInfo.descricao && (
                            <div>
                            <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                                {selInfo.descricao}
                            </p>
                            </div>
                          )}
                          <div className="flex gap-3 mt-2">
                              <Link href={`/imoveis/${selInfo.slug || selectedProperty.id}`} className="flex-1 bg-primary hover:bg-primary-hover !text-white font-bold h-11 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                                  Ver Detalhes
                                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                              </Link>
                          <button className="size-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all">
                              <span className="material-symbols-outlined">favorite_border</span>
                          </button>
                          </div>
                      </div>
                  </div>
              </div>
            );
          })()}
      </div>
    );
}
