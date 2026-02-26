
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import PropertyDetailsPage from '@/layouts/urban-padrao/imovel/PropertyDetailsPage';
import type { Metadata } from 'next';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

// Tipos de dados
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

type Property = {
  id: string;
  builderId: string;
  isVisibleOnSite?: boolean;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    address?: string;
    bairro: string;
    cidade: string;
    estado: string;
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    googleStreetViewLink?: string;
  };
  midia: string[];
  youtubeVideoUrl?: string;
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    suites?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
  areascomuns?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
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

async function getPropertyData(propertySlug: string): Promise<Property | null> {
    const { firestore } = initializeFirebase();
    let propData: Property | null = null;
    
    // Query 'properties' collection by slug
    const propertiesRef = collection(firestore, 'properties');
    let q = query(propertiesRef, where('informacoesbasicas.slug', '==', propertySlug), limit(1));
    let propertySnap = await getDocs(q);

    if (!propertySnap.empty) {
        const doc = propertySnap.docs[0];
        propData = { id: doc.id, ...doc.data() } as Property;
    } else {
        // If not found, query 'brokerProperties' collection by slug
        const brokerPropertiesRef = collection(firestore, 'brokerProperties');
        q = query(brokerPropertiesRef, where('informacoesbasicas.slug', '==', propertySlug), limit(1));
        propertySnap = await getDocs(q);

        if (!propertySnap.empty) {
            const doc = propertySnap.docs[0];
            propData = { id: doc.id, ...doc.data() } as Property;
        }
    }
    
    // Fallback to checking by ID if slug search fails (for old URLs)
    if (!propData) {
        try {
            let propertyRef = doc(firestore, 'properties', propertySlug);
            let docSnap = await getDoc(propertyRef);
            if (docSnap.exists()) {
                propData = { id: docSnap.id, ...docSnap.data() } as Property;
            } else {
                propertyRef = doc(firestore, 'brokerProperties', propertySlug);
                docSnap = await getDoc(propertyRef);
                if (docSnap.exists()) {
                    propData = { id: docSnap.id, ...docSnap.data() } as Property;
                }
            }
        } catch(e) {
            console.error("Error fetching document by ID, could be invalid slug format for ID", e);
        }
    }

    return propData;
}

async function getSimilarProperties(property: Property): Promise<Property[]> {
  const { firestore } = initializeFirebase();
  const propertiesRef = collection(firestore, 'properties');
  
  const q = query(
    propertiesRef, 
    where('isVisibleOnSite', '==', true),
    where('localizacao.cidade', '==', property.localizacao.cidade),
    limit(5)
  );
  
  const querySnapshot = await getDocs(q);
  
  const similar = querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Property))
    .filter(p => p.id !== property.id);

  return similar.slice(0, 4);
}

// Generate Metadata for SEO
export async function generateMetadata({ params: { id: propertyIdentifier } }: { params: { id: string } }): Promise<Metadata> {
  const property = await getPropertyData(propertyIdentifier);

  if (!property) {
    return {
      title: 'Imóvel não encontrado',
      description: 'A página que você está procurando não existe ou foi movida.',
    };
  }

  const title = property.seoTitle || property.informacoesbasicas.nome;
  const description = property.seoDescription || property.informacoesbasicas.descricao?.substring(0, 155) || 'Veja mais detalhes sobre este imóvel.';
  const keywords = property.seoKeywords || `${property.informacoesbasicas.nome}, ${property.localizacao.bairro}, ${property.localizacao.cidade}`;
  const imageUrl = property.midia?.[0] || '';

  return {
    title: `${title} | Oraora`,
    description,
    keywords,
    openGraph: {
      title: `${title} | Oraora`,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}


// A página principal que atua como roteador de layouts
export default async function BrokerPropertyDetailsPage({ params: { slug, id: propertyIdentifier } }: { params: { slug: string, id: string } }) {
  const broker = await getBrokerData(slug);
  const property = await getPropertyData(propertyIdentifier);

  if (!broker || !property || property.isVisibleOnSite === false) {
    notFound();
  }

  const similarProperties = await getSimilarProperties(property);

  // Lógica para escolher qual layout renderizar
  switch (broker.layoutId) {
    case 'urban-padrao':
        return <PropertyDetailsPage broker={broker} property={property} similarProperties={similarProperties} />;
    // Futuramente, outros layouts podem ser adicionados aqui
    default:
      // Renderiza o layout padrão se nenhum for selecionado ou se o ID for inválido
      return <PropertyDetailsPage broker={broker} property={property} similarProperties={similarProperties} />;
  }
}
