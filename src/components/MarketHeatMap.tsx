
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Mapa de Calor (Heatmap) robusto para Next.js 15.
 * 
 * Abordagem imperativa para evitar o erro "Map container is already initialized":
 * 1. Usa useRef para o container DOM.
 * 2. Carrega Leaflet e plugins dinamicamente no useEffect.
 * 3. Gerencia manualmente a criação e destruição (cleanup) da instância.
 */

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface MarketHeatMapProps {
  data: HeatPoint[];
  className?: string;
}

const MAP_CENTER: [number, number] = [-7.1195, -34.8451]; // João Pessoa

export default function MarketHeatMap({ data, className }: MarketHeatMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    const initMap = async () => {
      try {
        // Carrega o Leaflet apenas no cliente
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        // @ts-ignore - Plugin de calor
        await import('leaflet.heat');

        // Limpeza rigorosa antes de iniciar
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = '';
        }

        // Inicializa nova instância no container Ref
        const map = L.map(mapContainerRef.current!).setView(MAP_CENTER, 13);
        mapInstanceRef.current = map;

        // Camada de Base (Visual Limpo)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Camada de Calor
        if (data && data.length > 0) {
          // Aumentamos o peso dos pontos para garantir que a cor apareça mesmo com poucos dados
          const heatPoints = data.map(p => [p.lat, p.lng, p.intensity * 1.5] as [number, number, number]);
          
          // @ts-ignore
          L.heatLayer(heatPoints, {
            radius: 50,    // Raio otimizado para preencher o bairro
            blur: 25,      // Blur ajustado para manter a cor vibrante mas suave
            maxZoom: 17,
            max: 0.5,      // Diminuímos o teto para que as cores "saturem" mais rápido
            gradient: {
              0.2: '#dcfce7', // Verde Base
              0.4: '#8cf91f', // Limão Vibrante
              0.6: '#2bf20d', // Verde Principal
              0.8: '#166534', // Verde Escuro
              1.0: '#064e3b'  // Verde Profundo (Áreas de Pico)
            }
          }).addTo(map);
        }
      } catch (err) {
        console.error("Falha ao carregar o mapa Leaflet:", err);
      }
    };

    initMap();

    // Cleanup Agressivo
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, data]);

  return (
    <div className="relative group">
        <div 
          ref={mapContainerRef} 
          className={cn("w-full h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-soft z-0", className)}
        />
        
        {/* Painel de Legenda Interpretativa */}
        <div className="absolute bottom-6 right-6 z-[10] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100 pointer-events-none text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Concentração de Valor m²</p>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-sm bg-[#064e3b]"></div> 
                  <span className="text-[10px] font-bold uppercase text-slate-700">Máxima Valorização</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-sm bg-[#2bf20d]"></div> 
                  <span className="text-[10px] font-bold uppercase text-slate-700">Média de Mercado</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-sm bg-[#dcfce7]"></div> 
                  <span className="text-[10px] font-bold uppercase text-slate-700">Valor Base</span>
                </div>
            </div>
        </div>
    </div>
  );
}
