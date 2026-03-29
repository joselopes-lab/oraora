'use client';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ClientDetailView from '../components/client-detail-view';
import { useEffect, useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

const ClientSideDate = ({ date }: { date: Date }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        setFormattedDate(date.toLocaleDateString('pt-BR'));
    }, [date]);

    return <>{formattedDate || '...'}</>;
}

type Note = {
    id: string;
    text: string;
    createdAt: string;
    authorId: string;
    authorName: string;
};

type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    clientType?: 'comprador' | 'vendedor';
    propertyInterest?: string;
    source?: string;
    status: string;
    createdAt: Timestamp;
    address?: {
        street?: string;
        city?: string;
        state?: string;
    };
    potentialValue?: number;
    personaIds?: string[];
    notes?: Note[];
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
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
  caracteristicasimovel: {
      tamanho?: string;
  };
};

type Journey = {
    id: string;
    clientId: string;
    propertyIds: string[];
    propertyId?: string;
};

type BrokerProfile = {
    slug: string;
};

type Portfolio = {
    propertyIds: string[];
};

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();

    const leadDocRef = useMemoFirebase(
      () => (firestore && id && user?.uid ? doc(firestore, 'leads', id as string) : null),
      [firestore, id, user?.uid]
    );

    const brokerDocRef = useMemoFirebase(
        () => (firestore && user?.uid ? doc(firestore, 'brokers', user.uid) : null),
        [firestore, user?.uid]
    );
    const { data: brokerProfile } = useDoc<BrokerProfile>(brokerDocRef);

    const { data: client, isLoading } = useDoc<Lead>(leadDocRef);
    
    const personasQuery = useMemoFirebase(
      () => (firestore && client?.personaIds && client.personaIds.length > 0
          ? query(collection(firestore, 'personas'), where('__name__', 'in', client.personaIds))
          : null),
      [firestore, client?.personaIds]
    );
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    // --- REFINED AI RECOMMENDATIONS LOGIC ---
    
    // 1. Fetch Broker's own properties (avulsos) that match persona
    const avulsoRecommendedQuery = useMemoFirebase(
        () => (firestore && user?.uid && client?.personaIds && client.personaIds.length > 0
            ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid), where('personaIds', 'array-contains-any', client.personaIds))
            : null),
        [firestore, user?.uid, client?.personaIds]
    );
    const { data: avulsoRecommended, isLoading: isAvulsoRecLoading } = useCollection<Property>(avulsoRecommendedQuery);

    // 2. Fetch Broker's portfolio ID's
    const portfolioDocRef = useMemoFirebase(
        () => (firestore && user?.uid ? doc(firestore, 'portfolios', user.uid) : null),
        [firestore, user?.uid]
    );
    const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);

    // 3. Fetch all properties from 'properties' collection that match persona
    const allGlobalRecommendedQuery = useMemoFirebase(
        () => (firestore && client?.personaIds && client.personaIds.length > 0
            ? query(collection(firestore, 'properties'), where('personaIds', 'array-contains-any', client.personaIds))
            : null),
        [firestore, client?.personaIds]
    );
    const { data: allGlobalRecommended, isLoading: isGlobalRecLoading } = useCollection<Property>(allGlobalRecommendedQuery);

    // 4. Combine and Filter: only include global properties that are in the broker's portfolio + all avulsos
    const recommendedProperties = useMemo(() => {
        const portfolioIds = portfolio?.propertyIds || [];
        const filteredPortfolioProps = (allGlobalRecommended || []).filter(p => portfolioIds.includes(p.id));
        const combined = [...filteredPortfolioProps, ...(avulsoRecommended || [])];
        
        // Remove duplicates just in case
        const unique = new Map();
        combined.forEach(p => unique.set(p.id, p));
        return Array.from(unique.values());
    }, [allGlobalRecommended, avulsoRecommended, portfolio]);

    // --- END REFINED AI RECOMMENDATIONS LOGIC ---

    // --- Fetch Journey Data to get selected properties ---
    const journeysQuery = useMemoFirebase(
        () => (firestore && id && user?.uid ? query(collection(firestore, 'journeys'), where('clientId', '==', id), where('brokerId', '==', user.uid), limit(1)) : null),
        [firestore, id, user?.uid]
    );
    const { data: journeys } = useCollection<Journey>(journeysQuery);
    const journey = journeys?.[0];

    const propertyIds = useMemo(() => {
        const ids = journey?.propertyIds || [];
        if (journey?.propertyId && !ids.includes(journey.propertyId)) {
            ids.push(journey.propertyId);
        }
        return ids;
    }, [journey]);

    const linkedPropertiesQuery = useMemoFirebase(
      () => (firestore && propertyIds.length > 0 ? query(collection(firestore, 'properties'), where('__name__', 'in', propertyIds.slice(0, 30))) : null),
      [firestore, propertyIds]
    );
    const { data: linkedPropsFromInventory, isLoading: isInventoryLoading } = useCollection<Property>(linkedPropertiesQuery);

    const linkedBrokerPropertiesQuery = useMemoFirebase(
      () => (firestore && propertyIds.length > 0 ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user?.uid), where('__name__', 'in', propertyIds.slice(0, 30))) : null),
      [firestore, propertyIds, user?.uid]
    );
    const { data: linkedPropsFromAvulso, isLoading: isAvulsoLoading } = useCollection<Property>(linkedBrokerPropertiesQuery);

    const linkedProperties = useMemo(() => {
        const combined = [...(linkedPropsFromInventory || []), ...(linkedPropsFromAvulso || [])];
        const unique = new Map();
        combined.forEach(p => unique.set(p.id, p));
        return propertyIds.map(pid => unique.get(pid)).filter(Boolean) as Property[];
    }, [linkedPropsFromInventory, linkedPropsFromAvulso, propertyIds]);


    if (isLoading || arePersonasLoading || isGlobalRecLoading || isAvulsoRecLoading || isPortfolioLoading || isAuthLoading || isInventoryLoading || isAvulsoLoading) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p className="text-center text-slate-400 py-20 italic">Carregando dossiê do cliente...</p>
             </main>
        )
    }

    if (!client) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p className="text-center text-slate-400 py-20 italic">Cliente não encontrado ou você não tem permissão para vê-lo.</p>
             </main>
        )
    }


    return (
        <>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/clientes" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dossiê do Cliente</h1>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm ml-10">
                        <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                        <span>ID: #{client.id.substring(0, 6)}</span>
                        <span className="mx-1">•</span>
                        <span>Cadastrado em <ClientSideDate date={client.createdAt.toDate()} /></span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button asChild className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                        <Link href={`/dashboard/clientes/editar/${client.id}`}>
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                            Editar Cliente
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <div className="relative h-32 w-32 rounded-full border-4 border-primary/20 overflow-hidden bg-slate-100 flex-shrink-0">
                            <Image 
                                src={`https://i.pravatar.cc/150?u=${client.id}`} 
                                alt={client.name} 
                                fill 
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{client.name}</h2>
                                <p className="text-slate-500 font-medium">{client.email} • {client.phone}</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <Badge variant="outline" className="px-4 py-1.5 rounded-lg border-primary/30 bg-primary/5 text-green-700 font-bold uppercase tracking-wider text-[10px]">
                                    {client.clientType || 'Comprador'}
                                </Badge>
                                <Badge variant="outline" className={cn("px-4 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[10px]", getStatusBadgeClass(client.status))}>
                                    Status: {client.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Ticket Médio</span>
                                    <span className="text-lg font-bold">{client.potentialValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }) || 'R$ 850.000,00'}</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Interesse</span>
                                    <span className="text-lg font-bold truncate block">{client.propertyInterest || 'Apartamento'}</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Origem</span>
                                    <span className="text-lg font-bold">{client.source || 'Site'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ClientDetailView 
                    client={client} 
                    personas={personas || []} 
                    recommendedProperties={recommendedProperties} 
                    linkedProperties={linkedProperties}
                    brokerSlug={brokerProfile?.slug}
                />
            </div>
        </>
    );
}

function getStatusBadgeClass(status: string) {
    switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'qualified': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'proposal': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'converted': return 'bg-green-100 text-green-800 border-green-200';
        case 'lost': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}
