'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, Timestamp, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Users, ShieldCheck, Home, Inbox, Loader2, Building2, UserPlus, PlusCircle, Upload, EyeOff } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStates, type State } from '@/services/location';
import { type Property } from './properties/page';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';


interface Counts {
  users: number;
  roles: number;
  properties: number;
  leads: number;
  builders: number;
  brokers: number;
}

interface LeadData {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const { panelUserType } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({ users: 0, roles: 0, properties: 0, leads: 0, builders: 0, brokers: 0 });
  const [leadChartData, setLeadChartData] = useState<LeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statePropertyCounts, setStatePropertyCounts] = useState<Record<string, number>>({});
  const [inactiveStatePropertyCounts, setInactiveStatePropertyCounts] = useState<Record<string, number>>({});
  const [allStates, setAllStates] = useState<State[]>([]);

  useEffect(() => {
    if (panelUserType === 'construtora') {
      router.push('/dashboard-construtora/dashboard');
    }
  }, [panelUserType, router]);

  useEffect(() => {
    const fetchStates = async () => {
        const statesData = await getStates();
        setAllStates(statesData);
    };
    fetchStates();

    const unsubscribers = [
      onSnapshot(collection(db, 'users'), (snapshot) => {
        setCounts(prev => ({ ...prev, users: snapshot.size }));
      }),
      onSnapshot(collection(db, 'roles'), (snapshot) => {
        setCounts(prev => ({ ...prev, roles: snapshot.size }));
      }),
      onSnapshot(collection(db, 'properties'), (snapshot) => {
        const propertiesData = snapshot.docs.map(doc => doc.data() as Property);
        
        // Filter for active properties before counting by state
        const activeProperties = propertiesData.filter(p => p.isVisibleOnSite === true);
        const inactiveProperties = propertiesData.filter(p => !p.isVisibleOnSite);
        
        const activeCountsByState = activeProperties.reduce((acc, property) => {
            const state = property.localizacao?.estado;
            if (state) {
                acc[state] = (acc[state] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const inactiveCountsByState = inactiveProperties.reduce((acc, property) => {
            const state = property.localizacao?.estado;
            if (state) {
                acc[state] = (acc[state] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        setStatePropertyCounts(activeCountsByState);
        setInactiveStatePropertyCounts(inactiveCountsByState);
        setCounts(prev => ({ ...prev, properties: activeProperties.length }));
      }),
       onSnapshot(collection(db, 'builders'), (snapshot) => {
        setCounts(prev => ({ ...prev, builders: snapshot.size }));
      }),
       onSnapshot(collection(db, 'brokers'), (snapshot) => {
        setCounts(prev => ({ ...prev, brokers: snapshot.size }));
      }),
       onSnapshot(collection(db, 'leads'), (snapshot) => {
        setCounts(prev => ({ ...prev, leads: snapshot.size }));
      }),
    ];

    const fetchLeadData = async () => {
        const today = new Date();
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'leads'),
            where('createdAt', '>=', Timestamp.fromDate(last7Days))
        );

        const querySnapshot = await getDocs(q);
        const leads = querySnapshot.docs.map(doc => doc.data());

        const dailyCounts: { [key: string]: number } = {};
        for(let i=0; i<7; i++) {
            const date = new Date(last7Days);
            date.setDate(date.getDate() + i);
            const formattedDate = format(date, 'dd/MM');
            dailyCounts[formattedDate] = 0;
        }

        leads.forEach(lead => {
            const leadDate = (lead.createdAt as Timestamp).toDate();
            const formattedDate = format(leadDate, 'dd/MM');
            if(dailyCounts.hasOwnProperty(formattedDate)) {
                 dailyCounts[formattedDate]++;
            }
        });

        const chartData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
        setLeadChartData(chartData);
    }
    
    fetchLeadData();
    const timer = setTimeout(() => setIsLoading(false), 500);

    return () => {
        unsubscribers.forEach(unsub => unsub());
        clearTimeout(timer);
    };
  }, []);

  const getStateName = (acronym: string) => {
    return allStates.find(s => s.sigla === acronym)?.nome || acronym;
  }

  if (panelUserType === 'construtora') {
     return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Redirecionando para o seu painel...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Painel</h1>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Button asChild size="sm">
            <Link href="/dashboard/properties?edit=new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Imóvel
            </Link>
          </Button>
           <Button asChild size="sm" variant="outline">
            <Link href="/cadastro-corretor" target="_blank">
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar Corretor
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/builders?edit=new">
              <Building2 className="mr-2 h-4 w-4" />
              Cadastrar Construtora
            </Link>
          </Button>
           <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/properties?import=true">
              <Upload className="mr-2 h-4 w-4" />
              Importar Imóveis
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Imóveis Ativos</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{counts.properties}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Construtoras</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{counts.builders}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corretores</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{counts.brokers}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Recebidos</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{counts.leads}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{counts.users}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funções Definidas</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{counts.roles}</div>}
          </CardContent>
        </Card>
      </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Imóveis Ativos por Estado</CardTitle>
                    <CardDescription>Resumo de imóveis ativos em cada estado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(statePropertyCounts).sort(([, a], [, b]) => b - a).map(([state, count]) => (
                                <div key={state} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{getStateName(state)}</span>
                                    <span className="text-sm font-semibold">{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><EyeOff className="h-5 w-5"/> Imóveis Inativos por Estado</CardTitle>
                    <CardDescription>Imóveis que não estão visíveis no site.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(inactiveStatePropertyCounts).sort(([, a], [, b]) => b - a).map(([state, count]) => (
                                <Link key={state} href={`/dashboard/properties?status=inactive&estado=${state}`} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-md -m-2">
                                    <span className="text-sm font-medium">{getStateName(state)}</span>
                                    <span className="text-sm font-semibold">{count}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
       </div>
       <div>
            <Card>
                <CardHeader>
                <CardTitle>Leads Recebidos (Últimos 7 Dias)</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={leadChartData}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            allowDecimals={false}
                        />
                        <Tooltip 
                            cursor={{fill: 'hsl(var(--secondary))'}}
                            contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                </CardContent>
            </Card>
       </div>
    </div>
  );
}
