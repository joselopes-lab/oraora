
'use client';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ClientDetailView from '../components/client-detail-view';
import { useEffect, useState } from 'react';

type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    clientType?: 'comprador' | 'vendedor';
    propertyInterest?: string;
    source?: string;
    status: string;
    createdAt: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
    };
    personaIds?: string[];
};

type Persona = {
    id: string;
    name: string;
    icon: string;
    iconBackgroundColor: string;
}

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    cidade: string;
    bairro: string;
  };
  midia: string[];
};

type BrokerProfile = {
    slug: string;
};

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();

    const leadDocRef = useMemoFirebase(
      () => (firestore && id && user ? doc(firestore, 'leads', id as string) : null),
      [firestore, id, user]
    );

    const brokerDocRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'brokers', user.uid) : null),
        [firestore, user]
    );
    const { data: brokerProfile } = useDoc<BrokerProfile>(brokerDocRef);

    const { data: client, isLoading } = useDoc<Lead>(leadDocRef);
    
    const personasQuery = useMemoFirebase(
      () => (firestore && client?.personaIds && client.personaIds.length > 0
          ? query(collection(firestore, 'personas'), where('__name__', 'in', client.personaIds))
          : null),
      [firestore, client]
    );
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const recommendedPropertiesQuery = useMemoFirebase(
      () => (firestore && client?.personaIds && client.personaIds.length > 0
          ? query(collection(firestore, 'properties'), where('personaIds', 'array-contains-any', client.personaIds))
          : null),
      [firestore, client]
    );
    const { data: recommendedProperties, isLoading: arePropertiesLoading } = useCollection<Property>(recommendedPropertiesQuery);

    const linkedPropertiesQuery = useMemoFirebase(
      () => (firestore && id ? query(collection(firestore, 'brokerProperties'), where('clientId', '==', id)) : null),
      [firestore, id]
    );
    const { data: linkedProperties, isLoading: areLinkedPropertiesLoading } = useCollection<Property>(linkedPropertiesQuery);


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">Ativo</span>;
            case 'contacted':
                return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-200 uppercase tracking-wider">Em Contato</span>;
            // Add other statuses here
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 uppercase tracking-wider">{status}</span>;
        }
    }


    if (isLoading || arePersonasLoading || arePropertiesLoading || isAuthLoading || areLinkedPropertiesLoading) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Carregando dados do cliente...</p>
             </main>
        )
    }

    if (!client) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Cliente não encontrado ou você não tem permissão para vê-lo.</p>
             </main>
        )
    }


    return (
        <>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">{client.name}</h1>
                        {getStatusBadge(client.status)}
                        {client.clientType && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wider">
                                {client.clientType}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                        <span>ID: #{client.id.substring(0, 6)}</span>
                        <span className="mx-1">•</span>
                        <span>Cadastrado em {new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.back()} className="bg-white border border-gray-200 text-text-secondary hover:text-text-main font-medium py-2.5 px-5 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        Voltar
                    </Button>
                    <Button asChild className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                        <Link href={`/dashboard/clientes/editar/${client.id}`}>
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                            Editar Cliente
                        </Link>
                    </Button>
                </div>
            </div>
            <ClientDetailView 
                client={client} 
                personas={personas || []} 
                recommendedProperties={recommendedProperties || []} 
                linkedProperties={linkedProperties || []}
                brokerSlug={brokerProfile?.slug}
            />
        </>
    );
}
