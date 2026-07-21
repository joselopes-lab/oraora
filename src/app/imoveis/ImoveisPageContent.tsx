
'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import SearchResultsComponent from '@/app/imoveis/SearchResultsComponent';
import { useEffect, useState, useMemo } from 'react';

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    transactionTypes?: string[];
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
    const finality = searchParams.get('finality') || 'sale';
    const propertyTypeParam = searchParams.get('type');
    const stateUf = searchParams.get('state');
    const citiesParam = searchParams.get('cities');
    const neighborhoodsParam = searchParams.get('neighborhoods');
    const roomsParam = searchParams.get('rooms');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const qParam = searchParams.get('q');

    return allProperties.filter(property => {
      // 1. Filter by Finality (Transaction Type)
      const types = property.informacoesbasicas.transactionTypes || ['sale'];
      if (!types.includes(finality)) return false;

      // 2. Filter by Property Type
      if (propertyTypeParam && propertyTypeParam !== 'all' && property.caracteristicasimovel.tipo !== propertyTypeParam) {
        return false;
      }
      
      // 3. Filter by State
      if (stateUf && property.localizacao.estado !== stateUf) {
        return false;
      }

      // 4. Filter by Cities
      const searchCities = citiesParam ? citiesParam.split(',') : [];
      if (searchCities.length > 0 && !searchCities.includes(property.localizacao.cidade)) {
        return false;
      }
      
      // 5. Filter by Neighborhoods
      const searchNeighborhoods = neighborhoodsParam ? neighborhoodsParam.split(',') : [];
      if (searchNeighborhoods.length > 0 && !searchNeighborhoods.includes(property.localizacao.bairro)) {
         return false;
      }

      // 6. Filter by Rooms (Multi-select)
      const searchRooms = roomsParam ? roomsParam.split(',') : [];
      if (searchRooms.length > 0) {
        const propertyRoomsArray = Array.isArray(property.caracteristicasimovel.quartos)
            ? property.caracteristicasimovel.quartos.map(q => q.replace('+', ''))
            : String(property.caracteristicasimovel.quartos || '').split(',').map(r => r.trim().replace('+', ''));

        const hasMatchingRoom = searchRooms.some(room => {
            if (room === '4') {
                return propertyRoomsArray.some(pRoom => parseInt(pRoom) >= 4);
            }
            return propertyRoomsArray.includes(room);
        });
        if (!hasMatchingRoom) return false;
      }
      
      // 7. Filter by Price
      const priceToCompare = finality === 'sale' 
        ? (property.informacoesbasicas.salePrice || property.informacoesbasicas.valor || 0)
        : (property.informacoesbasicas.rentPrice || 0);

      if (minPriceParam && priceToCompare < parseInt(minPriceParam, 10)) return false;
      if (maxPriceParam && priceToCompare > parseInt(maxPriceParam, 10)) return false;

      // 8. Filter by Search Query
      if (qParam) {
          const q = qParam.toLowerCase();
          const matchesSearch = property.informacoesbasicas.nome.toLowerCase().includes(q) || 
                                property.localizacao.bairro.toLowerCase().includes(q) ||
                                property.localizacao.cidade.toLowerCase().includes(q);
          if (!matchesSearch) return false;
      }

      return true;
    });
  }, [allProperties, searchParams]);
  
  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
      )
  }

  return (
    <div className="flex-1 flex">
        <SearchResultsComponent properties={filteredProperties} />
    </div>
  );
}
