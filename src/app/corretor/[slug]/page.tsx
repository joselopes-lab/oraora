
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs, limit } from 'firebase/firestore';
import BrokerPublicPageClient from './broker-public-page-client';
import { type Property } from '@/app/dashboard/properties/page';
import { queryInBatches } from '@/lib/firestoreUtils';
import { AuthProvider } from '@/context/auth-context';
import { LocationProvider } from '@/context/location-context';
import Image from 'next/image';

interface Broker {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  logoUrl?: string;
  portfolioPropertyIds?: string[];
  hiddenPortfolioPropertyIds?: string[];
  backgroundColor?: string;
  theme?: 'light' | 'dark';
  verMaisButtonColor?: string;
  verMaisButtonBackgroundColor?: string;
  faleAgoraButtonColor?: string;
  faleAgoraButtonBackgroundColor?: string;
  bannerDesktopUrl?: string;
  bannerMobileUrl?: string;
  featuredPropertyIds?: string[];
  videoCoverUrl?: string;
  youtubeUrl?: string;
  footerText?: string;
}

async function getBrokerData(brokerId: string): Promise<{ broker: Broker | null, properties: Property[], featuredProperties: Property[] }> {
  if (!brokerId) return { broker: null, properties: [], featuredProperties: [] };

  try {
    const brokerDocRef = doc(db, 'users', brokerId);
    const brokerDocSnap = await getDoc(brokerDocRef);

    if (!brokerDocSnap.exists() || brokerDocSnap.data().role !== 'Corretor') {
      return { broker: null, properties: [], featuredProperties: [] };
    }

    const brokerData = { id: brokerDocSnap.id, ...brokerDocSnap.data() } as Broker;
    let portfolioProperties: Property[] = [];
    
    // 1. Fetch properties from portfolio (from builders)
    const propertyIds = brokerData.portfolioPropertyIds || [];
    const hiddenPropertyIds = brokerData.hiddenPortfolioPropertyIds || [];
    const visiblePropertyIds = propertyIds.filter(id => !hiddenPropertyIds.includes(id));
    
    if (visiblePropertyIds.length > 0) {
        portfolioProperties = await queryInBatches<Property>(
            'properties',
            documentId(),
            visiblePropertyIds,
            [where('isVisibleOnSite', '==', true)]
        );
    }
    
    // 2. Fetch "avulso" properties (where builderId is the broker's own ID)
    const avulsoQuery = query(collection(db, 'properties'), where('builderId', '==', brokerId), where('isVisibleOnSite', '==', true));
    const avulsoSnapshot = await getDocs(avulsoQuery);
    const avulsoProperties = avulsoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    
    // 3. Combine and remove duplicates
    const allVisiblePropsMap = new Map<string, Property>();
    [...portfolioProperties, ...avulsoProperties].forEach(p => {
      if (!allVisiblePropsMap.has(p.id)) {
        allVisiblePropsMap.set(p.id, p);
      }
    });
    const allVisibleProps = Array.from(allVisiblePropsMap.values());

    // 4. Separate featured from regular properties
    const featuredPropertyIds = brokerData.featuredPropertyIds?.filter(Boolean) || [];
    const properties = allVisibleProps.filter(p => !featuredPropertyIds.includes(p.id));
    const featuredProperties = allVisibleProps
        .filter(p => featuredPropertyIds.includes(p.id))
        .sort((a, b) => featuredPropertyIds.indexOf(a.id) - featuredPropertyIds.indexOf(b.id));
    
    return { broker: brokerData, properties, featuredProperties };

  } catch (error) {
    console.error("Erro ao buscar dados do corretor:", error);
    return { broker: null, properties: [], featuredProperties: [] };
  }
}

export default async function BrokerPublicPage({ params }: { params: { slug: string } }) {
    const brokerUserQuery = query(collection(db, 'users'), where('slug', '==', params.slug), limit(1));
    const brokerUserSnapshot = await getDocs(brokerUserQuery);

    if (brokerUserSnapshot.empty) {
        notFound();
    }
    const brokerId = brokerUserSnapshot.docs[0].id;
  
  const { broker, properties, featuredProperties } = await getBrokerData(brokerId);

  if (!broker) {
    notFound();
  }

  const plainBroker = JSON.parse(JSON.stringify(broker));
  const plainProperties = JSON.parse(JSON.stringify(properties));
  const plainFeaturedProperties = JSON.parse(JSON.stringify(featuredProperties));
  
  const pageStyle = {
    backgroundColor: broker.theme === 'dark' ? '#000000' : (broker.backgroundColor || 'transparent'),
  };

  return (
    <LocationProvider>
        <AuthProvider>
            <div style={pageStyle} className="flex flex-col min-h-screen">
                <BrokerPublicPageClient broker={plainBroker} properties={plainProperties} featuredProperties={plainFeaturedProperties} />
                 <footer style={{ backgroundColor: '#232323' }} className="text-white py-8 px-4">
                    <div className="container mx-auto text-center">
                        {broker.footerText && <p>{broker.footerText}</p>}
                        {broker.logoUrl && (
                          <div className="mt-6 flex justify-center">
                            <Image
                              src={broker.logoUrl}
                              alt={`Logo de ${broker.name}`}
                              width={150}
                              height={50}
                              className="h-12 w-auto object-contain"
                            />
                          </div>
                        )}
                    </div>
                </footer>
            </div>
        </AuthProvider>
    </LocationProvider>
  );
}
