'use client';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { notFound, useParams } from 'next/navigation';
import { getThemePage } from '@/layouts/registry';
import { useEffect, useState, use } from 'react';
import { getBrokerData } from '../../utils';
import { incrementMetric } from '../../actions';

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
  businessSettings?: {
    enabledTransactions: string[];
  }
};

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

export default function BrokerSearchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const [SearchPageComponent, setSearchPageComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!firestore || !slug) return;
      try {
        const brokerData = await getBrokerData(firestore, slug);

        if (!brokerData) {
          setBroker(null);
          setLoading(false);
          return;
        }

        setBroker(brokerData as Broker);
        const enabledTransactions = brokerData.businessSettings?.enabledTransactions || ['sale', 'rent'];

        const LoadedSearchPage = await getThemePage(brokerData.layoutId, 'search');
        setSearchPageComponent(() => LoadedSearchPage);

        // Increment access metrics
        await incrementMetric(brokerData.id, 'siteHits');

        // Fetch portfolio properties
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
                    propertiesSnap.forEach(docSnap => {
                        const data = docSnap.data() as any;
                        if (data.isVisibleOnSite !== false) {
                            fetchedPortfolioProperties.push({ id: docSnap.id, ...data } as Property);
                        }
                    });
                }
            }
        }
        
        // Fetch broker-specific properties
        const brokerPropertiesRef = collection(firestore, 'brokerProperties');
        const brokerPropsQuery = query(brokerPropertiesRef, where('brokerId', '==', brokerData.id), where('isVisibleOnSite', '==', true));
        const brokerPropsSnapshot = await getDocs(brokerPropsQuery);
        const fetchedBrokerProperties = brokerPropsSnapshot.docs
            .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));

        setProperties([...fetchedPortfolioProperties, ...fetchedBrokerProperties]);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setBroker(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [firestore, slug]);

  if (loading || !SearchPageComponent) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
      );
  }
  
  if (!broker) {
      return notFound();
  }

  return <SearchPageComponent broker={broker as any} properties={properties} />;
}
