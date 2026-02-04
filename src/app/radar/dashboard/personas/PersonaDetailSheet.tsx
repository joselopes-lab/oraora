
'use client';

import PersonaDetailView from '@/app/dashboard/personas/components/persona-detail-view';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Persona = {
  id: string;
  name: string;
  occupation?: string;
  ageRange?: string;
  purchasingPower?: string;
  interests?: string[];
  mediaHabits?: string[];
  challenges?: string;
  narrative?: string;
  imageUrl?: string;
  propertyIds?: string[];
  propertyTypes?: string[];
  bedrooms?: string[];
  garageSpaces?: string[] | string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  description?: string;
  ticket?: string;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  },
  localizacao: {
    bairro: string;
    cidade: string;
  },
  midia: string[];
};

export default function PersonaDetailSheet({ persona }: { persona: Persona }) {
    const firestore = useFirestore();

    const compatiblePropertiesQuery = useMemoFirebase(
        () => (firestore && persona?.id ? query(collection(firestore, 'properties'), where('personaIds', 'array-contains', persona.id)) : null),
        [firestore, persona]
    );

    const { data: properties, isLoading } = useCollection<Property>(compatiblePropertiesQuery);

    if (isLoading) {
        return (
          <div className="p-8">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        );
    }

    // `canEdit` will be false for clients on the radar dashboard.
    return <PersonaDetailView persona={persona} properties={properties || []} canEdit={false} />;
}
