
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import UrbanPadraoLayout from '@/layouts/urban-padrao/UrbanPadraoLayout';
import LivingLayout from '@/layouts/living/LivingLayout';
import DomusLayout from '@/app/layouts/domus/DomusLayout';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

// Tipos de dados
type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
  layoutId?: string;
  homepage?: {
    heroTagline?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroVideoUrl?: string;
    heroImageUrl?: string;
    statsSold?: string;
    statsExperience?: string;
    statsSatisfaction?: string;
    statsSupport?: string;
    featuredTagline?: string;
    featuredTitle?: string;
    featuredSubtitle?: string;
    featuredPropertyIds?: string[];
    aboutTagline?: string;
    aboutTitle?: string;
    aboutText?: string;
    aboutImageUrl?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    value1Icon?: string;
    value1Title?: string;
    value1Description?: string;
    value2Icon?: string;
    value2Title?: string;
    value2Description?: string;
    value3Icon?: string;
    value3Title?: string;
    value3Description?: string;
    value4Icon?: string;
    value4Title?: string;
    value4Description?: string;
    aboutQuote?: string;
    aboutAwardTitle?: string;
    aboutAwardText?: string;
    hideStats?: boolean;
    statsSectionBgColor?: string;
    statsNumberColor?: string;
    statsLabelColor?: string;
  };
  footerSlogan?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
};

type Property = {
  id: string;
  isVisibleOnSite?: boolean;
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
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

// Funções de busca de dados no servidor
async function getBrokerData(slug: string): Promise<Broker | null> {
  const { firestore } = initializeFirebase();
  const brokersRef = collection(firestore, 'brokers');
  const q = query(brokersRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const brokerDoc = querySnapshot.docs[0];
  return { id: brokerDoc.id, ...brokerDoc.data() } as Broker;
}

async function getPortfolioProperties(brokerId: string): Promise<Property[]> {
  const { firestore } = initializeFirebase();
  const portfolioRef = doc(firestore, 'portfolios', brokerId);
  const portfolioSnap = await getDoc(portfolioRef);

  if (!portfolioSnap.exists()) {
    return [];
  }

  const propertyIds = portfolioSnap.data()?.propertyIds || [];
  if (propertyIds.length === 0) {
    return [];
  }
  
  const propertiesData: Property[] = [];
  const propertiesRef = collection(firestore, 'properties');

  for (let i = 0; i < propertyIds.length; i += 30) {
    const batch = propertyIds.slice(i, i + 30);
    if (batch.length > 0) {
        const q = query(propertiesRef, where('__name__', 'in', batch));
        const propertiesSnap = await getDocs(q);
        propertiesSnap.forEach(doc => {
            const propertyData = { id: doc.id, ...doc.data() } as Property;
            if (propertyData.isVisibleOnSite !== false) {
                propertiesData.push(propertyData);
            }
        });
    }
  }

  return propertiesData;
}

async function getBrokerProperties(brokerId: string): Promise<Property[]> {
  const { firestore } = initializeFirebase();
  const brokerPropertiesRef = collection(firestore, 'brokerProperties');
  const q = query(brokerPropertiesRef, where('brokerId', '==', brokerId), where('isVisibleOnSite', '==', true));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
}

export default async function BrokerSitePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  const [portfolioProperties, brokerProperties] = await Promise.all([
    getPortfolioProperties(broker.id),
    getBrokerProperties(broker.id)
  ]);

  const allProperties = [...portfolioProperties, ...brokerProperties];

  // Logic for Featured Properties (up to 6)
  let featuredProperties: Property[] = [];
  const selectedIds = broker.homepage?.featuredPropertyIds || [];

  if (selectedIds.length > 0) {
    // Fill featured based on selection order
    selectedIds.forEach(id => {
      const match = allProperties.find(p => p.id === id);
      if (match) featuredProperties.push(match);
    });
    
    // If less than 6 selected, and we have more, we can optionally fill or just leave as is.
    // User requested specifically to prioritize selection.
  }

  // If no manual selection or selection was empty, do random shuffle
  if (featuredProperties.length === 0 && allProperties.length > 0) {
    featuredProperties = [...allProperties].sort(() => 0.5 - Math.random()).slice(0, 6);
  }

  // To maintain compatibility with existing layouts that might slice properties directly,
  // we ensure that the 'allProperties' list starts with the featured ones.
  const otherProperties = allProperties.filter(p => !featuredProperties.find(fp => fp.id === p.id));
  const sortedProperties = [...featuredProperties, ...otherProperties];

  switch (broker.layoutId) {
    case 'urban-padrao':
      return <UrbanPadraoLayout broker={broker} properties={sortedProperties} />;
    case 'living':
        return <LivingLayout broker={broker} properties={sortedProperties} />;
    case 'domus':
        return <DomusLayout broker={broker} properties={sortedProperties} />;
    default:
      return <UrbanPadraoLayout broker={broker} properties={sortedProperties} />;
  }
}

export async function generateStaticParams() {
  try {
    const { firestore } = initializeFirebase();
    const brokersRef = collection(firestore, 'brokers');
    const snapshot = await getDocs(query(brokersRef, where('slug', '!=', null)));
    
    return snapshot.docs.map(doc => ({
      slug: doc.data().slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params for broker sites:", error);
    return [];
  }
}
