
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { LayoutDashboard, Home, ExternalLink, Copy, Briefcase, FilePlus, Inbox, Users, Loader2, Calendar, NotepadText, Phone, Bell, Handshake, ArrowRight, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, onSnapshot, query, where, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type Client } from '../clientes/page';
import { type Banner } from '@/app/dashboard/banners/page';
import BannerDisplay from '@/components/banner-display';


function ShareableLink({ userId }: { userId: string }) {
    const { toast } = useToast();
    const [publicUrl, setPublicUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPublicUrl(`${window.location.origin}/corretor-publico/${userId}`);
        }
    }, [userId]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            toast({ title: 'Link Copiado!', description: 'O link do seu site público foi copiado para a área de transferência.' });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o link.' });
        });
    };
    
    if(!publicUrl) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Link do seu Site Público</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                    <Input id="public-url" value={publicUrl} readOnly className="bg-muted" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copiar link</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Compartilhe este link com seus clientes.
                </p>
            </CardContent>
        </Card>
    );
}

interface Counts {
    portfolio: number;
    avulso: number;
    leads: number;
    clients: number;
}

type TaskType = 'Retorno ao cliente' | 'Reunião' | 'Lembrete' | 'Visita';
interface Task {
  id: string;
  type: TaskType;
  date: Timestamp;
  startTime: string;
  endTime: string;
  description: string;
  clientId?: string;
  brokerId: string;
  createdAt: Timestamp;
}

interface Lead {
  id: string;
  name: string;
  createdAt: Timestamp;
  propertyName?: string;
}

const taskIcons: Record<TaskType, React.ElementType> = {
  'Reunião': Users,
  'Retorno ao cliente': Phone,
  'Lembrete': Bell,
  'Visita': Handshake,
};

const renderTaskIcon = (taskType: TaskType) => {
    const Icon = taskIcons[taskType] || Calendar;
    return <Icon className="h-5 w-5 text-primary" />;
};

export default function CorretorDashboardPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [counts, setCounts] = useState<Counts>({ portfolio: 0, avulso: 0, leads: 0, clients: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [clientsMap, setClientsMap] = useState<Map<string, Client>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [dashboardBanners, setDashboardBanners] = useState<Banner[]>([]);


  useEffect(() => {
    if (!user) {
        if (!loadingAuth) setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    setIsLoadingTasks(true);
    setIsLoadingLeads(true);

    const unsubscribers: (() => void)[] = [];

    // Counters
    unsubscribers.push(onSnapshot(doc(db, 'users', user.uid), (doc) => {
        const data = doc.data();
        setCounts(prev => ({...prev, portfolio: data?.portfolioPropertyIds?.length || 0}));
    }));
    unsubscribers.push(onSnapshot(query(collection(db, 'properties'), where('builderId', '==', user.uid)), (snapshot) => {
        setCounts(prev => ({...prev, avulso: snapshot.size}));
    }));
    unsubscribers.push(onSnapshot(query(collection(db, 'broker_leads'), where('brokerId', '==', user.uid)), (snapshot) => {
        setCounts(prev => ({...prev, leads: snapshot.size}));
    }));
    unsubscribers.push(onSnapshot(query(collection(db, 'broker_clients'), where('brokerId', '==', user.uid)), (snapshot) => {
        setCounts(prev => ({...prev, clients: snapshot.size}));
        setIsLoading(false);
    }));

    // Upcoming Tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tasksQuery = query(
        collection(db, 'broker_tasks'),
        where('brokerId', '==', user.uid),
        where('date', '>=', Timestamp.fromDate(today)),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc'),
        limit(5)
    );
    unsubscribers.push(onSnapshot(tasksQuery, async (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setUpcomingTasks(tasksData);

        const clientIds = [...new Set(tasksData.map(t => t.clientId).filter(Boolean))];
        if (clientIds.length > 0) {
            const clientsQuery = query(collection(db, 'broker_clients'), where('__name__', 'in', clientIds));
            const clientsSnapshot = await getDocs(clientsQuery);
            const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            const newClientsMap = new Map(clientsData.map(c => [c.id, c]));
            setClientsMap(newClientsMap);
        }
        setIsLoadingTasks(false);
    }));

    // Recent Leads
    const leadsQuery = query(
      collection(db, 'broker_leads'),
      where('brokerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    unsubscribers.push(onSnapshot(leadsQuery, (snapshot) => {
        const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        setRecentLeads(leadsData);
        setIsLoadingLeads(false);
    }));
    
    // Banners
    const bannersQuery = query(collection(db, 'banners'), where('location', '==', 'corretor_dashboard'), where('isActive', '==', true));
    unsubscribers.push(onSnapshot(bannersQuery, (snapshot) => {
        setDashboardBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
    }));

    return () => unsubscribers.forEach(unsub => unsub());

  }, [user, loadingAuth]);

  const formatDate = (date: Date, includeTime = false) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (isToday(date) && !includeTime) return 'Hoje';
    if (isTomorrow(date) && !includeTime) return 'Amanhã';

    const formatString = includeTime ? "dd/MM 'às' HH:mm" : "dd/MM";
    return format(date, formatString, { locale: ptBR });
  }

  return (
    <div className="space-y-6">
        <div className="flex items-start gap-4">
            <LayoutDashboard className="h-10 w-10 mt-2"/>
            <div>
                <h1 className="text-6xl font-thin tracking-tight">Dashboard</h1>
                <p className="font-light text-[23px] text-black">Bem-vindo(a) de volta, corretor!</p>
            </div>
        </div>
        
        <BannerDisplay banners={dashboardBanners} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl font-normal"><Calendar/> Próximos Agendamentos</CardTitle>
                        <CardDescription>Suas próximas 5 atividades agendadas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingTasks ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : upcomingTasks.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingTasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-lg capitalize">{formatDate(task.date.toDate())}</div>
                                            <div className="text-sm text-muted-foreground">{task.startTime}</div>
                                        </div>
                                        <div className="border-l pl-4 flex-grow">
                                            <div className="flex items-center gap-2 font-semibold">
                                                {renderTaskIcon(task.type)}
                                                <span>{task.type}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                            {task.clientId && (
                                                <div className="mt-2">
                                                    <Link href={`/corretor/clientes/${task.clientId}`} className="text-xs font-semibold text-primary hover:underline">
                                                        Ver Cliente: {clientsMap.get(task.clientId)?.name || '...'}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button asChild className="w-full mt-4 bg-black text-white hover:bg-black/80">
                                  <Link href="/corretor/agenda">
                                      Ver agenda completa <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>Nenhuma atividade agendada.</p>
                                 <Button asChild className="mt-4 bg-black text-white hover:bg-black/80">
                                  <Link href="/corretor/agenda">
                                      Criar nova atividade
                                  </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[26px] font-medium leading-none">Imóveis Carteira</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Briefcase className="absolute -right-2 -bottom-2 h-20 w-20 text-black/10" />
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-[44px] font-semibold">{counts.portfolio}</div>}
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[26px] font-medium leading-none">Imóveis Avulsos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FilePlus className="absolute -right-2 -bottom-2 h-20 w-20 text-black/10" />
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-[44px] font-semibold">{counts.avulso}</div>}
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-[26px] font-medium leading-none">Leads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Inbox className="absolute -right-2 -bottom-2 h-20 w-20 text-black/10" />
                           {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-[44px] font-semibold">{counts.leads}</div>}
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-[26px] font-medium leading-none">Clientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Users className="absolute -right-2 -bottom-2 h-20 w-20 text-black/10" />
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-[44px] font-semibold">{counts.clients}</div>}
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-normal text-2xl"><Inbox/> Leads Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingLeads ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : recentLeads.length > 0 ? (
                            <div className="space-y-3">
                                {recentLeads.map(lead => (
                                    <div key={lead.id} className="p-2 rounded-md hover:bg-muted/50">
                                        <p className="font-semibold">{lead.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(lead.createdAt.toDate(), true)} - {lead.propertyName || 'Contato Geral'}</p>
                                    </div>
                                ))}
                                <Button asChild className="w-full mt-4 bg-black text-white hover:bg-black/80">
                                    <Link href="/corretor/leads">Ver todos os leads <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-6"><p>Nenhum lead recente.</p></div>
                        )}
                    </CardContent>
                </Card>
                 {user && <ShareableLink userId={user.uid} />}
            </div>
        </div>
    </div>
  );
}



    