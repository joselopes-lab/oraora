
'use client';
import { useParams } from 'next/navigation';
import PersonaDetailView from '../components/persona-detail-view';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, query, collection, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

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

type User = {
  userType: 'admin' | 'broker' | 'constructor';
};


type Property = {
  id: string;
  builderId: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
};

export default function PersonaDetailPage() {
  const params = useParams();
  const { id: personaId } = params as { id: string };
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const personaDocRef = useMemoFirebase(
    () => (firestore && personaId ? doc(firestore, 'personas', personaId) : null),
    [firestore, personaId]
  );
  
  const { data: personaData, isLoading: isPersonaLoading } = useDoc<Persona>(personaDocRef);

  const compatiblePropertiesQuery = useMemoFirebase(
    () => (firestore && personaId ? query(collection(firestore, 'properties'), where('personaIds', 'array-contains', personaId)) : null),
    [firestore, personaId]
  );

  const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(compatiblePropertiesQuery);


  const isLoading = isPersonaLoading || arePropertiesLoading || isUserLoading || isProfileLoading;
  const canEdit = userProfile?.userType === 'admin';

  if (isLoading) {
    return <div className="p-10">Carregando detalhes da persona...</div>;
  }

  if (!personaData) {
    return <div className="p-10">Persona não encontrada.</div>;
  }

  return <PersonaDetailView persona={personaData} properties={properties || []} canEdit={!!canEdit} />;
}
