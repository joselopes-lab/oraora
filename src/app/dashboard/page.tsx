'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDoc, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import Link from "next/link";
import { doc, collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isBefore, isEqual } from "date-fns";
import { ptBR } from "date-fns/locale";
import EventForm, { EventFormData } from './agenda/components/event-form';
import { cn } from "@/lib/utils";
import { useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking as setDocNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/firebase/auth-provider";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type UserProfile = {
    userType: 'admin' | 'broker' | 'constructor' | 'client';
    planId?: string;
    personaIds?: string[];
};

type BrokerProfile = {
    slug: string;
    monthlyGoals?: { [key: string]: number };
};

type Property = {
    id: string;
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

type Transaction = {
    id: string;
    description: string;
    date: string;
    status: string;
    value: number;
    categoryIcon: string;
    category: string;
    type: 'receita' | 'despesa';
    clientOrProvider?: string;
    notes?: string;
    brokerId: string;
    isRecurring?: boolean;
};

type Lead = {
  id: string;
  name: string;
  createdAt: Timestamp;
  status: string;
  propertyInterest?: string;
};

type Event = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'reuniao' | 'visita' | 'tarefa' | 'particular' | 'outro';
  completed?: boolean;
  clientId?: string;
  description?: string;
};

type BrokerMetrics = {
    totalLeads?: number;
    totalClosed?: number;
    conversionRate?: number;
    avgClosingTimeDays?: number;
};

const eventTypeDetails: { [key: string]: { label: string, color: string, icon: string } } = {
  reuniao: { label: 'Reunião', color: 'bg-purple-500', icon: 'groups' },
  visita: { label: 'Visita', color: 'bg-blue-500', icon: 'key' },
  tarefa: { label: 'Tarefa', color: 'bg-green-500', icon: 'check_box' },
  particular: { label: 'Particular', color: 'bg-amber-500', icon: 'person' },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: 'more_horiz' },
};

const ClientSideDate = ({ date, options }: { date: Date, options?: Intl.DateTimeFormatOptions }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(date.toLocaleDateString('pt-BR', options));
  }, [date, options]);

  return <>{formattedDate || '...'}</>;
};

export default function DashboardPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const [currentDateDisplay, setCurrentDateDisplay] = useState('');
  const [greeting, setGreeting] = useState('Bom dia');
  const [showAlert, setShowAlert] = useState(true);
  
  const { firestore } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const brokerDocRef = useMemoFirebase(
      () => (firestore && user && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user, userProfile]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);
  const isBroker = userProfile?.userType === 'broker';

  const transactionsQuery = useMemoFirebase(
    () => (isReady && user ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid)) : null),
    [isReady, user, firestore]
  );
  const { data: allTransactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const chartData = useMemo(() => {
    if (!allTransactions) return [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthName = format(date, 'MMM', { locale: ptBR });
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthlyRevenue = allTransactions
        .filter(t => {
          const tDate = parseISO(t.date);
          return tDate >= monthStart && tDate <= monthEnd && t.type === 'receita';
        })
        .reduce((acc, curr) => acc + curr.value, 0);
      data.push({ month: monthName, revenue: monthlyRevenue });
    }
    return data;
  }, [allTransactions]);
  
  const { totalRevenue, revenuePercentageChange } = useMemo(() => {
    if (!allTransactions) return { totalRevenue: 0, revenuePercentageChange: 0 };
    const dateNow = new Date();
    const currentMonthStart = startOfMonth(dateNow);
    const currentMonthEnd = endOfMonth(dateNow);
    const prevMonthDate = subMonths(dateNow, 1);
    const prevMonthStart = startOfMonth(prevMonthDate);
    const prevMonthEnd = endOfMonth(prevMonthDate);
    const currentMonthRevenue = allTransactions
      .filter(t => t.type === 'receita' && parseISO(t.date) >= currentMonthStart && parseISO(t.date) <= currentMonthEnd)
      .reduce((acc, curr) => acc + curr.value, 0);
    const prevMonthRevenue = allTransactions
      .filter(t => t.type === 'receita' && parseISO(t.date) >= prevMonthStart && parseISO(t.date) <= prevMonthEnd)
      .reduce((acc, curr) => acc + curr.value, 0);
    const percentageChange = prevMonthRevenue === 0 ? (currentMonthRevenue > 0 ? 100 : 0) : ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    return { totalRevenue: currentMonthRevenue, revenuePercentageChange: percentageChange };
  }, [allTransactions]);
  
  const chartConfig = {
    revenue: {
      label: "Receita",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const clientsQuery = useMemoFirebase(
    () => {
      if (!isReady || !user || !userProfile) return null;
      if (userProfile.userType === 'admin') return query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'), limit(50));
      if (userProfile.userType === 'broker') return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid), orderBy('createdAt', 'desc'));
      return null;
    },
    [isReady, user, userProfile, firestore]
  );
  const { data: clients, isLoading: areClientsLoading } = useCollection<Lead>(clientsQuery);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const eventsQuery = useMemoFirebase(
    () => {
      if (isReady && user && userProfile?.userType === 'broker') {
        return query(collection(firestore, 'events'), where('brokerId', '==', user.uid), where('date', '>=', todayStr), orderBy('date'), orderBy('time'), limit(4));
      }
      return null;
    },
    [isReady, user, userProfile, firestore, todayStr]
  );
  const { data: upcomingEvents, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  
  const brokerMetricsDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'corretorMetrics', user.uid) : null),
    [firestore, user]
  );
  const { data: brokerMetrics, isLoading: areMetricsLoading } = useDoc<BrokerMetrics>(brokerMetricsDocRef);

  const recentLeadsQuery = useMemoFirebase(
    () => {
      if (isReady && user && userProfile?.userType === 'broker') {
        return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
      }
      return null;
    },
    [isReady, user, userProfile, firestore]
  );
  const { data: recentLeads, isLoading: areRecentLeadsLoading } = useCollection<Lead>(recentLeadsQuery);

  const clientNameMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name]) || []), [clients]);

  const handleDeleteEvent = () => {
    if (!selectedEvent || !firestore) return;
    const eventDocRef = doc(firestore, 'events', selectedEvent.id);
    deleteDocumentNonBlocking(eventDocRef);
    toast({ title: "Tarefa Excluída!", description: "O evento foi removido da sua agenda." });
    setSelectedEvent(null);
    setIsEventDetailOpen(false); 
  };

  const handleSaveEvent = (data: EventFormData) => {
    if (!user || !firestore) return;
    addDocumentNonBlocking(collection(firestore, 'events'), { ...data, brokerId: user.uid });
    toast({ title: 'Tarefa Salva!', description: 'Seu compromisso foi adicionado à agenda.' });
    setIsModalOpen(false);
  };

  useEffect(() => {
    setCurrentDateDisplay(format(new Date(), "dd 'de' MMM, yyyy", { locale: ptBR }));
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);
  
  const isPageLoading = !isReady || isBrokerLoading || areTransactionsLoading || areClientsLoading || areEventsLoading || areMetricsLoading || areRecentLeadsLoading;

  if (isPageLoading) return <div className="p-10 text-center">Carregando painel...</div>;

  return (
    <>
      <div className="w-full max-w-7xl mx-auto">
          {showAlert && (
            <div className="relative w-full bg-white rounded-xl shadow-soft border border-primary/40 overflow-hidden group mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-1">
                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-5 p-5">
                  <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-secondary shadow-sm shrink-0 border border-primary-hover/20">
                    <span className="material-symbols-outlined text-[26px]">campaign</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-secondary tracking-tight">Aumente Suas Vendas com Insights de IA</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-white uppercase tracking-wider">Novo Recurso</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">Nosso novo motor de IA analisa automaticamente os padrões de interação para destacar seus prospects mais promissores.</p>
                  </div>
                </div>
                <div className="w-full md:w-auto flex items-center gap-3 px-5 pb-5 md:pb-0 md:pr-5">
                  <Button variant="ghost" className="flex-1 md:flex-none h-10 px-4 cursor-pointer" onClick={() => setShowAlert(false)}>Dispensar</Button>
                  <Button className="flex-1 md:flex-none h-10 px-5 cursor-pointer">Experimente Agora</Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">{greeting}, {user?.displayName?.split(' ')[0] || 'usuário'}.</h2>
              <p className="text-gray-500 mt-1 text-base">Aqui está sua visão geral diária para <span className="text-foreground font-semibold">{currentDateDisplay}</span>.</p>
            </div>
            <div className="flex gap-3">
               {isBroker && brokerProfile?.slug && (
                <Button asChild variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Link href={`/sites/${brokerProfile.slug}`} target="_blank">
                    <span className="material-symbols-outlined text-[18px] mr-2">public</span>
                    Ver meu Site
                  </Link>
                </Button>
              )}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button><span className="material-symbols-outlined text-[18px] mr-2">add_task</span>Adicionar Tarefa</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
                  <DialogHeader><VisuallyHidden><DialogTitle>Cadastrar Nova Tarefa</DialogTitle></VisuallyHidden></DialogHeader>
                   <EventForm onSave={handleSaveEvent} onCancel={() => setIsModalOpen(false)} clients={clients || []} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
              <CardHeader><p className="text-gray-500 text-sm font-medium">Total de Leads</p></CardHeader>
              <CardContent><h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">{brokerMetrics?.totalLeads || 0}</h3></CardContent>
            </Card>
            <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
                <CardHeader><p className="text-gray-500 text-sm font-medium">Negócios Fechados</p></CardHeader>
                <CardContent><h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">{brokerMetrics?.totalClosed || 0}</h3></CardContent>
            </Card>
            <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
              <CardHeader><p className="text-gray-500 text-sm font-medium">Taxa de Conversão</p></CardHeader>
              <CardContent><h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">{(brokerMetrics?.conversionRate || 0).toFixed(1)}%</h3></CardContent>
            </Card>
             <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
                <CardHeader><p className="text-gray-500 text-sm font-medium">Receita Mensal</p></CardHeader>
                <CardContent><h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-xl shadow-soft border border-border-subtle flex flex-col lg:flex-row overflow-hidden mb-8">
              <div className="w-full lg:w-72 bg-secondary p-6 flex flex-col relative shrink-0">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                          <h3 className="text-white text-lg font-bold tracking-tight">Agenda do Corretor</h3>
                          <div className="mt-8">
                              <div className="text-5xl font-bold text-primary tracking-tighter">{format(new Date(), 'dd')}</div>
                              <div className="text-xl font-medium text-white capitalize">{format(new Date(), 'MMMM', { locale: ptBR })}</div>
                          </div>
                      </div>
                      <Button asChild className="mt-8 w-full h-10 rounded-lg bg-primary hover:bg-primary-hover text-secondary text-sm font-bold flex items-center justify-center gap-2 transition-all">
                          <Link href="/dashboard/agenda">Ver Agenda Completa</Link>
                      </Button>
                  </div>
              </div>
              <div className="flex-1 flex flex-col divide-y divide-border-subtle bg-white overflow-y-auto">
                  {upcomingEvents && upcomingEvents.length > 0 ? (
                      upcomingEvents.map(event => {
                          const typeDetail = eventTypeDetails[event.type] || eventTypeDetails.outro;
                          const clientName = event.clientId ? clientNameMap.get(event.clientId) : null;
                          return (
                              <div key={event.id} className="flex group hover:bg-gray-50 transition-colors p-4 relative">
                                  <div className="w-20 text-center"><span className="text-sm font-bold text-secondary">{event.time}</span></div>
                                  <div className="flex-1 px-4">
                                      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", getBadgeClasses(event.type))}>{typeDetail.label}</Badge>
                                      <h4 className="text-base font-bold text-secondary mt-1">{event.title}</h4>
                                  </div>
                                  {clientName && <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-4">{clientName.charAt(0)}</div>}
                                  <button className="text-gray-300 hover:text-primary transition-colors cursor-pointer" onClick={() => { setSelectedEvent(event); setIsEventDetailOpen(true); }}>
                                      <span className="material-symbols-outlined">chevron_right</span>
                                  </button>
                              </div>
                          );
                      })
                  ) : (
                      <div className="p-10 text-center text-sm text-gray-400">Nenhuma tarefa para hoje.</div>
                  )}
              </div>
          </div>
          <Card className="shadow-soft overflow-hidden">
            <CardHeader>
               <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">Leads Recentes</CardTitle>
                <Button asChild variant="link" className="text-sm p-0 h-auto text-primary"><Link href="/dashboard/leads">Ver Todos</Link></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Nome do Lead</TableHead><TableHead>Interesse</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentLeads?.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium text-foreground flex items-center gap-3">
                          <Avatar className="size-8"><AvatarFallback>{lead.name.charAt(0)}</AvatarFallback></Avatar>
                          {lead.name}
                        </TableCell>
                        <TableCell>{lead.propertyInterest || 'N/A'}</TableCell>
                        <TableCell><ClientSideDate date={lead.createdAt.toDate()} /></TableCell>
                        <TableCell><Badge variant="outline" className={cn("font-bold", getBadgeClasses('outro'))}>{lead.status}</Badge></TableCell>
                        <TableCell className="text-right">
                            <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/clientes/${lead.id}`}><span className="material-symbols-outlined">more_vert</span></Link></Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
          <DialogContent>
              {selectedEvent && (
                  <>
                  <DialogHeader><DialogTitle>{selectedEvent.title}</DialogTitle><DialogDescription>{selectedEvent.description || 'Nenhuma descrição.'}</DialogDescription></DialogHeader>
                  <div className="py-4 space-y-2 text-sm">
                      <p><strong>Data:</strong> {format(parseISO(selectedEvent.date), "dd/MM/yyyy", { locale: ptBR })} {selectedEvent.time}</p>
                      <p><strong>Tipo:</strong> {eventTypeDetails[selectedEvent.type]?.label}</p>
                  </div>
                  <DialogFooter>
                      <Button variant="destructive" onClick={handleDeleteEvent}>Excluir</Button>
                      <Button asChild><Link href={`/dashboard/agenda/${selectedEvent.id}`}>Ver Detalhes</Link></Button>
                  </DialogFooter>
                  </>
              )}
          </DialogContent>
        </Dialog>
    </>
  );
}

function getBadgeClasses(type: string) {
    const details = eventTypeDetails[type] || eventTypeDetails.outro;
    const colorName = details.color.replace('bg-', '').replace('-500', '');
    return `bg-${colorName}-100 text-${colorName}-800 border-${colorName}-200`;
}
