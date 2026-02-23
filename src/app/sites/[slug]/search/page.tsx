
'use client';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { notFound, useParams } from 'next/navigation';
import SearchResults from '@/layouts/urban-padrao/search/SearchResults';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  slug: string;
  layoutId?: string; 
};

type Portfolio = {
  propertyIds: string[];
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[];
    tamanho?: string;
    vagas?: string;
  };
};

export default function BrokerSearchPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [broker, setBroker] = useState<Broker | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function fetchData() {
      if (!firestore || !slug) return;
      try {
        const brokersRef = collection(firestore, 'brokers');
        const q = query(brokersRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          notFound();
          return;
        }

        const brokerDoc = querySnapshot.docs[0];
        const brokerData = { id: brokerDoc.id, ...brokerDoc.data() } as Broker;
        setBroker(brokerData);

        // Fetch portfolio properties (from /properties)
        const portfolioRef = doc(firestore, 'portfolios', brokerData.id);
        const portfolioSnap = await getDoc(portfolioRef);
        const portfolioPropertyIds = portfolioSnap.exists() ? portfolioSnap.data()?.propertyIds || [] : [];
        
        let fetchedPortfolioProperties: Property[] = [];
        if (portfolioPropertyIds.length > 0) {
            const propertiesRef = collection(firestore, 'properties');
            for (let i = 0; i < portfolioPropertyIds.length; i += 30) {
                const batch = portfolioPropertyIds.slice(i, i + 30);
                if (batch.length > 0) {
                    const propertiesQuery = query(propertiesRef, where('__name__', 'in', batch));
                    const propertiesSnap = await getDocs(propertiesQuery);
                    propertiesSnap.forEach(doc => {
                        fetchedPortfolioProperties.push({ id: doc.id, ...doc.data() } as Property);
                    });
                }
            }
        }
        
        // Fetch broker-specific properties (from /brokerProperties)
        const brokerPropertiesRef = collection(firestore, 'brokerProperties');
        const brokerPropsQuery = query(brokerPropertiesRef, where('brokerId', '==', brokerData.id), where('isVisibleOnSite', '==', true));
        const brokerPropsSnapshot = await getDocs(brokerPropsQuery);
        const fetchedBrokerProperties = brokerPropsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));

        // Combine both lists
        setProperties([...fetchedPortfolioProperties, ...fetchedBrokerProperties]);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [firestore, slug]);

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <p>Carregando...</p>
          </div>
      );
  }
  
  if (!broker) {
      return notFound();
  }

  return <SearchResults broker={broker} properties={properties} />;
}
