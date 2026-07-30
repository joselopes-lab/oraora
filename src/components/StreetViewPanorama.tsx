'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ('places' | 'geometry' | 'drawing')[] = ['places'];

interface StreetViewPanoramaProps {
  fullAddress: string;
  lat?: number;
  lng?: number;
  streetViewLink?: string;
}

export function StreetViewPanoramaView({ fullAddress, lat, lng }: StreetViewPanoramaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCbPxGXZuW0kPodzVnymKb8CbXnAF5Pdkg',
    libraries,
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (!isLoaded || loadError) {
      if (loadError) setStatus('unavailable');
      return;
    }

    if (!window.google || !window.google.maps) {
      setStatus('unavailable');
      return;
    }

    let isMounted = true;

    const initializeStreetView = (location: google.maps.LatLng | google.maps.LatLngLiteral) => {
      const svService = new window.google.maps.StreetViewService();
      
      svService.getPanorama(
        {
          location,
          radius: 100,
          source: window.google.maps.StreetViewSource.OUTDOOR,
        },
        (data, svStatus) => {
          if (!isMounted) return;

          if (svStatus === window.google.maps.StreetViewStatus.OK && data && data.location && data.location.pano) {
            setStatus('available');
            setTimeout(() => {
              if (containerRef.current && window.google?.maps) {
                new window.google.maps.StreetViewPanorama(containerRef.current, {
                  pano: data.location.pano,
                  pov: { heading: 165, pitch: 0 },
                  zoom: 1,
                  addressControl: true,
                  showRoadLabels: true,
                  motionTracking: false,
                  motionTrackingControl: false,
                });
              }
            }, 50);
          } else {
            // Tenta sem a restrição outdoor com raio maior
            svService.getPanorama(
              {
                location,
                radius: 150,
              },
              (fallbackData, fallbackStatus) => {
                if (!isMounted) return;

                if (fallbackStatus === window.google.maps.StreetViewStatus.OK && fallbackData && fallbackData.location && fallbackData.location.pano) {
                  setStatus('available');
                  setTimeout(() => {
                    if (containerRef.current && window.google?.maps) {
                      new window.google.maps.StreetViewPanorama(containerRef.current, {
                        pano: fallbackData.location.pano,
                        pov: { heading: 165, pitch: 0 },
                        zoom: 1,
                        addressControl: true,
                        showRoadLabels: true,
                      });
                    }
                  }, 50);
                } else {
                  setStatus('unavailable');
                }
              }
            );
          }
        }
      );
    };

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      initializeStreetView({ lat, lng });
    } else if (fullAddress && fullAddress.trim().length > 0) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: fullAddress }, (results, geocodeStatus) => {
        if (!isMounted) return;
        if (geocodeStatus === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
          const loc = results[0].geometry.location;
          initializeStreetView(loc);
        } else {
          setStatus('unavailable');
        }
      });
    } else {
      setStatus('unavailable');
    }

    return () => {
      isMounted = false;
    };
  }, [isLoaded, loadError, fullAddress, lat, lng]);

  if (status === 'unavailable' || loadError) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 gap-2 h-full w-full min-h-[350px]">
        <span className="material-symbols-outlined text-4xl text-slate-400">streetview</span>
        <p className="font-semibold text-base">Street View não disponível para este endereço.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[450px]">
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 gap-2 bg-gray-100 dark:bg-slate-900 rounded-[2rem]">
          <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">sync</span>
          <p className="font-semibold text-sm">Buscando Street View...</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[450px] rounded-[2rem] overflow-hidden"
        style={{ visibility: status === 'available' ? 'visible' : 'hidden' }}
      />
    </div>
  );
}
