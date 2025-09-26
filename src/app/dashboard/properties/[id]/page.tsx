
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type Property } from '../page';
import PropertyDetailClient from './property-detail-client';

interface Builder {
  id: string;
  name: string;
}

async function getPropertyData(propertyId: string): Promise<{ property: Property | null, builder: Builder | null }> {
  if (!propertyId) return { property: null, builder: null };

  try {
    const propertyDocRef = doc(db, 'properties', propertyId);
    const propertyDocSnap = await getDoc(propertyDocRef);

    if (!propertyDocSnap.exists()) {
      return { property: null, builder: null };
    }

    const propData = { id: propertyDocSnap.id, ...propertyDocSnap.data() } as Property;
    let builderData: Builder | null = null;

    if (propData.builderId) {
      const builderDocRef = doc(db, 'builders', propData.builderId);
      const builderDocSnap = await getDoc(builderDocRef);
      if (builderDocSnap.exists()) {
        builderData = { id: builderDocSnap.id, ...builderDocSnap.data() } as Builder;
      }
    }
    
    return { property: propData, builder: builderData };

  } catch (error) {
    console.error("Erro ao buscar dados do imóvel:", error);
    return { property: null, builder: null };
  }
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const { property, builder } = await getPropertyData(params.id);

  if (!property) {
    notFound();
  }
  
  // We need to serialize the data because it will be passed from a Server Component to a Client Component.
  const plainProperty = JSON.parse(JSON.stringify(property));
  const plainBuilder = builder ? JSON.parse(JSON.stringify(builder)) : null;

  return <PropertyDetailClient property={plainProperty} builder={plainBuilder} />;
}
