
'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase'; // Alterado de 'firebase/firestore' para '@/firebase'
import { useSearchParams } from 'next/navigation';
import SearchResultsComponent from '@/app/imoveis/SearchResultsComponent';
import { useEffect, useState, useMemo } from 'react';
import locationData from '@/lib/location-data.json';

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
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

export default function ImoveisPageContent() {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchProperties() {
      if (!firestore) return;
      try {
        const propertiesRef = collection(firestore, 'properties');
        const q = query(propertiesRef, where('isVisibleOnSite', '==', true));
        const propertiesSnap = await getDocs(q);
        const props = propertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setAllProperties(props);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [firestore]);

  const filteredProperties = useMemo(() => {
    const propertyTypeParam = searchParams.get('type');
    const stateUf = searchParams.get('state');
    const citiesParam = searchParams.get('cities');
    const neighborhoodsParam = searchParams.get('neighborhoods');
    const roomsParam = searchParams.get('rooms');
    const maxPrice = searchParams.get('price');

    const searchTypes = propertyTypeParam && propertyTypeParam !== 'all' ? propertyTypeParam.split(',') : [];
    const searchCities = citiesParam ? citiesParam.split(',').map(c => c.trim()) : [];
    const searchNeighborhoods = neighborhoodsParam ? neighborhoodsParam.split(',').map(n => n.trim()) : [];
    const searchRooms = roomsParam ? roomsParam.split(',').map(r => r.replace('+','')) : [];

    if (searchTypes.length === 0 && !stateUf && searchCities.length === 0 && searchNeighborhoods.length === 0 && searchRooms.length === 0 && !maxPrice) {
      return allProperties;
    }
    
    return allProperties.filter(property => {
      // Filter by Property Type
      if (searchTypes.length > 0 && !searchTypes.includes(property.caracteristicasimovel.tipo)) {
        return false;
      }
      
      // Filter by State
      if (stateUf && property.localizacao.estado !== stateUf) {
        return false;
      }

      // Filter by Cities
      if (searchCities.length > 0 && !searchCities.includes(property.localizacao.cidade)) {
        return false;
      }
      
      // Filter by Neighborhoods
      if (searchNeighborhoods.length > 0 && !searchNeighborhoods.includes(property.localizacao.bairro)) {
         return false;
      }

      // Filter by Rooms
      if (searchRooms.length > 0) {
        const propertyRooms = Array.isArray(property.caracteristicasimovel.quartos) 
            ? property.caracteristicasimovel.quartos.map(q => q.replace('+', '')) 
            : String(property.caracteristicasimovel.quartos || '').split(',').map(r => r.trim().replace('+', ''));

        const hasMatchingRoom = searchRooms.some(room => {
            if (room.endsWith('+')) {
                const minRooms = parseInt(room.replace('+', ''), 10);
                return propertyRooms.some(pRoom => parseInt(pRoom) >= minRooms);
            }
            return propertyRooms.includes(room);
        });

        if (!hasMatchingRoom) {
            return false;
        }
      }
      
      // Filter by Price
      if (maxPrice && property.informacoesbasicas.valor) {
        if(property.informacoesbasicas.valor > parseInt(maxPrice, 10)) {
          return false;
        }
      }

      return true;
    });
  }, [allProperties, searchParams]);
  
  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center">
              <p>Carregando imóveis...</p>
          </div>
      )
  }

  return (
    <div className="flex-1 flex">
        <SearchResultsComponent properties={filteredProperties} />
    </div>
  );
}
