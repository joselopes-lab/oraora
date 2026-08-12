'use client';
import React, { useEffect, useRef, useState } from 'react';

type Poi = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  address?: string;
};

type InteractivePropertyMapProps = {
  propertyLat?: number;
  propertyLng?: number;
  propertyTitle?: string;
  propertyAddress?: string;
  pois?: Poi[];
};

let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google && window.google.maps) return Promise.resolve();
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-native-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-native-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

export default function InteractivePropertyMap({
  propertyLat,
  propertyLng,
  propertyTitle,
  propertyAddress,
  pois = [],
}: InteractivePropertyMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCbPxGXZuW0kPodzVnymKb8CbXnAF5Pdkg';

  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted) return;
        if (!mapRef.current || !window.google || !window.google.maps) {
          setError(true);
          setLoading(false);
          return;
        }

        const lat = propertyLat && !isNaN(propertyLat) ? propertyLat : -7.1195;
        const lng = propertyLng && !isNaN(propertyLng) ? propertyLng : -34.8451;

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });

        const infoWindow = new window.google.maps.InfoWindow();

        if (propertyLat && propertyLng) {
          const propertyMarker = new window.google.maps.Marker({
            position: { lat: propertyLat, lng: propertyLng },
            map,
            title: propertyTitle || 'Imóvel',
          });

          propertyMarker.addListener('click', () => {
            const content = `
              <div style="padding: 4px; max-width: 220px;">
                <h4 style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #0f172a;">${propertyTitle || 'Imóvel'}</h4>
                ${propertyAddress ? `<p style="font-size: 11px; color: #475569; margin-bottom: 6px;">${propertyAddress}</p>` : ''}
                <span style="display: inline-block; padding: 2px 6px; background: rgba(59, 130, 246, 0.1); color: #2563eb; font-size: 9px; font-weight: bold; border-radius: 4px;">Imóvel</span>
              </div>
            `;
            infoWindow.setContent(content);
            infoWindow.open(map, propertyMarker);
          });
        }

        pois.forEach((poi) => {
          if (!poi.latitude || !poi.longitude) return;
          const poiMarker = new window.google.maps.Marker({
            position: { lat: poi.latitude, lng: poi.longitude },
            map,
            title: poi.name,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            },
          });

          poiMarker.addListener('click', () => {
            const content = `
              <div style="padding: 4px; max-width: 220px;">
                <h4 style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #0f172a;">${poi.name}</h4>
                <p style="font-size: 11px; color: #475569; text-transform: capitalize; margin-bottom: 4px;">Categoria: ${poi.category}</p>
                <p style="font-size: 11px; font-weight: bold; color: #2563eb;">Distância: ${poi.distanceMeters} m</p>
              </div>
            `;
            infoWindow.setContent(content);
            infoWindow.open(map, poiMarker);
          });
        });

        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propertyLat, propertyLng, propertyTitle, propertyAddress, pois, apiKey]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-900 text-slate-500 font-medium p-4 text-center">
        Mapa indisponível no momento.
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 font-medium animate-pulse z-10">
          Carregando mapa...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
