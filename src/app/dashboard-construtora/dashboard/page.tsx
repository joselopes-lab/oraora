'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Home, Users, Inbox, Eye, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';

interface Property {
    id: string;
    informacoesbasicas: {
        nome: string;
    },
    midia?: string[];
    views?: number;
    clicks?: number;
}

interface Lead {
    id: string;
    propertyId: string;
}

interface Counts {
    properties: number;
    brokers: number;
    leads: number;
    views: number;
    clicks: number;
}

interface PropertyEngagement {
    id: string;
    name: string;
    imageUrl?: string;
    brokerCount: number;
}

export default function ConstrutoraDashboardPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [isLoading, setIsLoading] = useState(true);
    const [counts, setCounts] = useState<Counts>({ properties: 0, brokers: 0, leads: 0, views: 0, clicks: 0 });
    const [topProperties, setTopProperties] = useState<PropertyEngagement[]>([]);
    
    useEffect(() => {
        if (loadingAuth || !user) return;
        
        const fetchDashboardData = async () => {
            setIsLoading(true);

            // 1. Get Builder's Properties
            const propertiesQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
            const propertiesSnapshot = await getDocs(propertiesQuery);
            const builderProperties = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
            const builderPropertyIds = builderProperties.map(p => p.id);
            
            const totalViews = builderProperties.reduce((sum, prop) => sum + (prop.views || 0), 0);
            const totalClicks = builderProperties.reduce((sum, prop) => sum + (prop.clicks || 0), 0);

            setCounts(prev => ({...prev, properties: builderProperties.length, views: totalViews, clicks: totalClicks }));

            if(builderPropertyIds.length === 0) {
                setIsLoading(false);
                return;
            }

            // 2. Get Leads count for these properties
            const leadsQuery = query(collection(db, 'leads'), where('propertyId', 'in', builderPropertyIds));
            const leadsSnapshot = await getDocs(leadsQuery);
            setCounts(prev => ({...prev, leads: leadsSnapshot.size}));

            // 3. Get Brokers who have these properties in their portfolio
            const brokersQuery = query(collection(db, 'users'), where('role', '==', 'Corretor'), where('portfolioPropertyIds', 'array-contains-any', builderPropertyIds));
            const brokersSnapshot = await getDocs(brokersQuery);

            const propertyBrokerCounts: Record<string, number> = {};
            builderPropertyIds.forEach(id => propertyBrokerCounts[id] = 0);
            let totalBrokers = 0;

            brokersSnapshot.forEach(doc => {
                const brokerData = doc.data();
                const portfolio: string[] = brokerData.portfolioPropertyIds || [];
                
                let hasBuilderProperty = false;
                portfolio.forEach(propId => {
                    if (builderPropertyIds.includes(propId)) {
                        propertyBrokerCounts[propId]++;
                        hasBuilderProperty = true;
                    }
                });
                if(hasBuilderProperty) totalBrokers++;
            });

            setCounts(prev => ({...prev, brokers: totalBrokers}));

            const engagementData: PropertyEngagement[] = builderProperties.map(prop => ({
                id: prop.id,
                name: prop.informacoesbasicas.nome,
                imageUrl: prop.midia?.[0],
                brokerCount: propertyBrokerCounts[prop.id] || 0,
            })).sort((a,b) => b.brokerCount - a.brokerCount).slice(0, 5);

            setTopProperties(engagementData);

            setIsLoading(false);
        }

        fetchDashboardData();

    }, [user, loadingAuth]);
    
    if (isLoading || loadingAuth) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                {/* <LayoutDashboard className="h-10 w-10 mt-2"/> */}
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Dashboard</h1>
                    <p className="font-light text-[23px] text-black">Bem-vindo(a) de volta!</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Imóveis</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.properties}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Corretores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.brokers}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.leads}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.views}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.clicks}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Imóveis com mais Engajamento</CardTitle>
                        <CardDescription>Seus imóveis na carteira de mais corretores.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topProperties.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topProperties.map((prop) => (
                                    <Card key={prop.id} className="flex items-center p-4 gap-4">
                                         <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                                            {prop.imageUrl && <Image src={prop.imageUrl} alt={prop.name} fill className="object-cover"/>}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold line-clamp-2">{prop.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4"/>
                                                <span>{prop.brokerCount} {prop.brokerCount === 1 ? 'corretor' : 'corretores'}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-8">Nenhum imóvel na carteira de corretores.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
