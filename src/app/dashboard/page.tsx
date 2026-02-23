
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useDoc, useFirebase, useMemoFirebase, useUser, addDocumentNonBlocking, setDocumentNonBlocking as setDocNonBlocking } from "@/firebase";
import Link from "next/link";
import { doc, collection, query, where, writeBatch, setDoc, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { format, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, isBefore, isEqual, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import GoalForm from "./financeiro/components/goal-form";
import TransactionForm, { TransactionFormData } from "./financeiro/components/transaction-form";
import TransactionDetail from "./financeiro/components/transaction-detail";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/firebase/auth-provider";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import EventForm, { EventFormData } from './agenda/components/event-form';
import { cn } from "@/lib/utils";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useRouter } from "next/navigation";


type UserProfile = {
    userType: 'admin' | 'broker' | 'constructor';
    planId?: string;
    personaIds?: string[];
};

type BrokerProfile = {
    slug: string;
    monthlyGoals?: { [key: string]: number };
};

type Property = {
    id: string;
};

type Portfolio = {
  propertyIds: string[];
}

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
    installments?: number;
    totalValue?: number;
    installmentNumber?: number;
    groupId?: string;
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

const getStatusBadgeClass = (status: string) => {
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


// This is the main dashboard page, rendered within the layout.
export default function DashboardPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('Bom dia');
  
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

  // --- Data fetching for property usage ---
  const planDocRef = useMemoFirebase(
    () => (firestore && userProfile?.planId ? doc(firestore, 'plans', userProfile.planId) : null),
    [firestore, userProfile]
  );
  const { data: planData, isLoading: isPlanLoading } = useDoc<{ propertyLimit?: number }>(planDocRef);

  const brokerPropertiesQuery = useMemoFirebase(
    () => (isReady && user ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [isReady, user, firestore]
  );
  const { data: brokerProperties, isLoading: areBrokerPropsLoading } = useCollection<{id: string}>(brokerPropertiesQuery);

  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
  const [arePortfolioPropertiesLoading, setArePortfolioPropertiesLoading] = useState(true);

  const portfolioDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'portfolios', user.uid) : null),
    [user, firestore]
  );
  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);

  // New query for active properties
  const activePropertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true)) : null),
    [firestore]
  );
  const { data: activeProperties, isLoading: areActivePropertiesLoading } = useCollection<Property>(activePropertiesQuery);

  // --- New Logic for Financial Data ---
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
          return t.type === 'receita' && tDate >= monthStart && tDate <= monthEnd;
        })
        .reduce((acc, curr) => acc + curr.value, 0);
  
      data.push({ month: monthName, revenue: monthlyRevenue });
    }
    return data;
  }, [allTransactions]);
  
  const { totalRevenue, revenuePercentageChange } = useMemo(() => {
    if (!allTransactions) return { totalRevenue: 0, revenuePercentageChange: 0 };
  
    const currentDate = new Date();
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
  
    const prevMonthDate = subMonths(currentDate, 1);
    const prevMonthStart = startOfMonth(prevMonthDate);
    const prevMonthEnd = endOfMonth(prevMonthDate);
  
    const currentMonthRevenue = allTransactions
      .filter(t => t.type === 'receita' && parseISO(t.date) >= currentMonthStart && parseISO(t.date) <= currentMonthEnd)
      .reduce((acc, curr) => acc + curr.value, 0);
    
    const prevMonthRevenue = allTransactions
      .filter(t => t.type === 'receita' && parseISO(t.date) >= prevMonthStart && parseISO(t.date) <= prevMonthEnd)
      .reduce((acc, curr) => acc + curr.value, 0);
  
    const percentageChange = prevMonthRevenue === 0 
      ? (currentMonthRevenue > 0 ? 100 : 0) 
      : ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
  
    return { totalRevenue: currentMonthRevenue, revenuePercentageChange: percentageChange };
  }, [allTransactions]);
  
  const chartConfig = {
    revenue: {
      label: "Receita",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  // --- Logic to save event from modal ---
  const clientsQuery = useMemoFirebase(
    () => {
      // 1. Só roda se o perfil do usuário já carregou
      if (!isReady || !user || !userProfile) return null;
  
      // 2. Se for Admin, vê tudo
      if (userProfile.userType === 'admin') {
        return query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'), limit(50));
      }
  
      // 3. Se for Broker, OBRIGATORIAMENTE usa o where('brokerId')
      if (userProfile.userType === 'broker') {
        return query(
          collection(firestore, 'leads'), 
          where('brokerId', '==', user.uid), // <--- O SEGREDO ESTÁ AQUI
          orderBy('createdAt', 'desc') // Se usar order, precisa de index composto
        );
      }
  
      return null;
    },
    [isReady, user, userProfile, firestore]
  );
  const { data: clients, isLoading: areClientsLoading } = useCollection<Lead>(clientsQuery);

  const today = format(new Date(), 'yyyy-MM-dd');
  const eventsQuery = useMemoFirebase(
    () => {
      if (isReady && user && userProfile?.userType === 'broker') {
        return query(
          collection(firestore, 'events'),
          where('brokerId', '==', user.uid),
          where('date', '>=', today),
          orderBy('date'),
          orderBy('time'),
          limit(4)
        );
      }
      return null;
    },
    [isReady, user, userProfile, firestore, today]
  );
  const { data: upcomingEvents, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const brokerMetricsDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'corretorMetrics', user.uid) : null),
    [firestore, user]
  );
  const { data: brokerMetrics, isLoading: areMetricsLoading } = useDoc<BrokerMetrics>(brokerMetricsDocRef);

  // New query for proposal leads
  const proposalLeadsQuery = useMemoFirebase(
    () => (
        // Só busca se estiver pronto, logado E for corretor
        isReady && user && userProfile?.userType === 'broker' 
        ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid), where('status', '==', 'proposal')) 
        : null
    ),
    [isReady, user, userProfile, firestore]
  );
  const { data: proposalLeads, isLoading: areProposalLeadsLoading } = useCollection<Lead>(proposalLeadsQuery);
  
  const AVERAGE_COMMISSION = 25000; // Placeholder for average commission ticket
  const leadsInProposalCount = proposalLeads?.length || 0;
  const conversionRate = brokerMetrics?.conversionRate || 0; // Use the value from brokerMetrics
  const revenueForecast = leadsInProposalCount * (conversionRate / 100) * AVERAGE_COMMISSION;

  // New query for recent leads
  const recentLeadsQuery = useMemoFirebase(
    () => {
      if (isReady && user && userProfile?.userType === 'broker') {
        return query(
          collection(firestore, 'leads'),
          where('brokerId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
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
    //deleteDocumentNonBlocking(eventDocRef);

    toast({
        title: "Tarefa Excluída!",
        description: "O evento foi removido da sua agenda.",
    });

    setSelectedEvent(null);
    setIsDeleteAlertOpen(false);
    setIsEventDetailOpen(false); // Close the detail modal too
  };


  const handleSaveEvent = async (data: EventFormData) => {
    if (!user || !firestore) return;
    
    try {
        await addDocumentNonBlocking(collection(firestore, 'events'), {
            ...data,
            brokerId: user.uid,
        });
        toast({
            title: 'Tarefa Salva!',
            description: 'Seu compromisso foi adicionado à agenda.',
        });
        setIsModalOpen(false);
    } catch (error) {
        console.error("Error adding event: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar a tarefa. Tente novamente.',
        });
    }
  };

  const handleTaskCompletion = (taskId: string, completed: boolean) => {
    if (!user || !firestore) return;
    const taskRef = doc(firestore, 'events', taskId);
    setDocNonBlocking(taskRef, { completed: completed }, { merge: true });
    toast({
      title: completed ? "Tarefa Concluída!" : "Tarefa Reaberta!",
      description: "O status da sua tarefa foi atualizado."
    })
  };
  
  useEffect(() => {
      const fetchPortfolioProperties = async () => {
          if (!firestore || !portfolio) {
              setPortfolioProperties([]);
              setArePortfolioPropertiesLoading(false);
              return;
          }

          const propertyIds = portfolio.propertyIds || [];
          if (propertyIds.length === 0) {
              setPortfolioProperties([]);
              setArePortfolioPropertiesLoading(false);
              return;
          }
          
          setArePortfolioPropertiesLoading(true);
          const propertiesData: Property[] = [];
          const propertiesRef = collection(firestore, 'properties');

          for (let i = 0; i < propertyIds.length; i += 30) {
              const batch = propertyIds.slice(i, i + 30);
              if (batch.length > 0) {
                  const q = query(propertiesRef, where('__name__', 'in', batch));
                  const propertiesSnap = await getDocs(q);
                  propertiesSnap.forEach(doc => {
                      propertiesData.push({ id: doc.id, ...doc.data() } as Property);
                  });
              }
          }
          setPortfolioProperties(propertiesData);
          setArePortfolioPropertiesLoading(false);
      };

      if (!isPortfolioLoading) {
          fetchPortfolioProperties();
      }
  }, [firestore, portfolio, isPortfolioLoading]);

  const isUsageLoading = !isReady || isPlanLoading || areBrokerPropsLoading || isPortfolioLoading || arePortfolioPropertiesLoading;
  
  const propertyLimit = planData?.propertyLimit;
  const avulsoCount = brokerProperties?.length || 0;
  const portfolioCount = portfolioProperties?.length || 0;
  const totalPropertyCount = avulsoCount + portfolioCount;
  const usagePercentage = (propertyLimit && propertyLimit > 0) ? (totalPropertyCount / propertyLimit) * 100 : 0;
  // --- End data fetching ---

  useEffect(() => {
    setCurrentDate(format(new Date(), "dd 'de' MMM, yyyy", { locale: ptBR }));
    
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }

  }, []);
  
  const isPageLoading = !isReady || isBrokerLoading || areActivePropertiesLoading || areTransactionsLoading || areClientsLoading || areEventsLoading || areMetricsLoading || areProposalLeadsLoading || areRecentLeadsLoading;

  const getBadgeClasses = (type: string) => {
    const details = eventTypeDetails[type];
    if (!details) return 'bg-gray-100 text-gray-800 border-gray-200';
    const colorName = details.color.replace('bg-', '').replace('-500', '');
    return `bg-${colorName}-100 text-${colorName}-800 border-${colorName}-200`;
  };

  return (
    <AlertDialog>
      <div className="w-full max-w-7xl mx-auto">
        <div className="relative w-full bg-white rounded-xl shadow-soft border border-primary/40 overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/30 transition-all duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-1">
            <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-5 p-5">
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-secondary shadow-sm shrink-0 border border-primary-hover/20">
                <span className="material-symbols-outlined text-[26px]">
                  campaign
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-secondary tracking-tight">
                    Aumente Suas Vendas com Insights de IA
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-white uppercase tracking-wider">
                    Novo Recurso
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                  Nosso novo motor de IA analisa automaticamente os padrões de
                  interação para destacar seus prospects mais promissores. Comece
                  a fechar negócios mais rápido hoje.
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto flex items-center gap-3 px-5 pb-5 md:pb-0 md:pr-5">
              <Button
                variant="ghost"
                className="flex-1 md:flex-none h-10 px-4"
              >
                Dispensar
              </Button>
              <Button className="flex-1 md:flex-none h-10 px-5">
                Experimente Agora
                <span className="material-symbols-outlined text-[18px] ml-2">
                  arrow_forward
                </span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {greeting}, {user?.displayName?.split(' ')[0] || 'usuário'}.
            </h2>
            <p className="text-gray-500 mt-1 text-base">
              Aqui está sua visão geral diária para{" "}
              <span className="text-foreground font-semibold">{currentDate}</span>.
            </p>
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
            <Button variant="outline">Exportar Relatório</Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <span className="material-symbols-outlined text-[18px] mr-2">
                    add_task
                  </span>
                  Adicionar Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>Cadastrar Nova Tarefa</DialogTitle>
                        <DialogDescription>Preencha os detalhes abaixo para agendar um novo compromisso.</DialogDescription>
                    </VisuallyHidden>
                </DialogHeader>
                 <EventForm 
                    onSave={handleSaveEvent} 
                    onCancel={() => setIsModalOpen(false)}
                    clients={clients || []}
                 />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-700">
                  <span className="material-symbols-outlined">person</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Total de Leads</p>
            </CardHeader>
            <CardContent>
              { isPageLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                  <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
                    {brokerMetrics?.totalLeads || 0}
                  </h3>
              )}
              <p className="text-xs text-gray-400 mt-2">no funil</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
              <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
                          <span className="material-symbols-outlined">handshake</span>
                      </div>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Negócios Fechados</p>
              </CardHeader>
              <CardContent>
                  { isPageLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                      <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
                        {brokerMetrics?.totalClosed || 0}
                      </h3>
                  )}
                  <p className="text-xs text-gray-400 mt-2">histórico total</p>
              </CardContent>
          </Card>
          <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
                  <span className="material-symbols-outlined">percent</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Taxa de Conversão</p>
            </CardHeader>
            <CardContent>
               {isPageLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                  <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
                    {(brokerMetrics?.conversionRate || 0).toFixed(1)}%
                  </h3>
               )}
              <p className="text-xs text-gray-400 mt-2">desde o início</p>
            </CardContent>
          </Card>

           <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-700">
                    <span className="material-symbols-outlined">show_chart</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium">Previsão de Receita</p>
              </CardHeader>
              <CardContent>
                {isPageLoading || areProposalLeadsLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                  <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
                    {revenueForecast.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  próximos 30 dias (estimativa)
                </p>
              </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-border-subtle flex flex-col lg:flex-row overflow-hidden mb-8">
            <div className="w-full lg:w-72 bg-secondary p-6 flex flex-col relative shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <h3 className="text-white text-lg font-bold tracking-tight">Agenda do Corretor</h3>
                        <p className="text-gray-400 text-xs mt-1">Planejamento diário</p>
                        <div className="mt-8">
                            <div className="text-5xl font-bold text-primary tracking-tighter">{format(new Date(), 'dd')}</div>
                            <div className="text-xl font-medium text-white capitalize">{format(new Date(), 'MMMM', { locale: ptBR })}</div>
                            <div className="text-sm text-gray-400 mt-1">{format(new Date(), "eeee'-feira'", { locale: ptBR })}</div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Compromissos</span>
                                <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded">{upcomingEvents?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                    <Button asChild className="mt-8 w-full h-10 rounded-lg bg-primary hover:bg-primary-hover text-secondary text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                        <Link href="/dashboard/agenda">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            <span>Ver Agenda Completa</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-white">
                    <div className="flex gap-6">
                        <button className="text-sm font-bold text-secondary border-b-2 border-primary pb-0.5">Hoje</button>
                        <button className="text-sm font-medium text-gray-500 hover:text-secondary transition-colors">Amanhã</button>
                        <button className="text-sm font-medium text-gray-500 hover:text-secondary transition-colors">Esta Semana</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-secondary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-secondary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-border-subtle bg-white flex-1 overflow-y-auto">
                    {isPageLoading ? (
                        <div className="p-6 text-center text-sm text-gray-500">Carregando tarefas...</div>
                    ) : upcomingEvents && upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => {
                            const typeDetail = eventTypeDetails[event.type];
                            const clientName = event.clientId ? clientNameMap.get(event.clientId) : null;
                            const badgeClasses = getBadgeClasses(event.type);
                            return (
                                <div key={event.id} className="flex group hover:bg-gray-50 transition-colors relative">
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", typeDetail.color)}></div>
                                    <div className="w-24 p-4 border-r border-border-subtle flex flex-col items-center justify-center text-center">
                                        <span className="text-sm font-bold text-secondary">{event.time}</span>
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={cn("text-xs font-bold uppercase", badgeClasses)}>{typeDetail.label}</Badge>
                                        </div>
                                        <h4 className="text-base font-bold text-secondary">{event.title}</h4>
                                        {event.description && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{event.description}</p>}
                                    </div>
                                    {clientName && (
                                        <div className="p-4 flex items-center">
                                            <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white" title={clientName}>
                                                {clientName.charAt(0)}
                                            </div>
                                        </div>
                                    )}
                                    <div className="pr-6 pl-2 flex items-center">
                                        <button className="text-gray-300 hover:text-primary transition-colors" onClick={() => { setSelectedEvent(event); setIsEventDetailOpen(true); }}>
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-10 text-center text-sm text-gray-400">Nenhuma tarefa para hoje.</div>
                    )}
                </div>
            </div>
        </div>
        <Card className="shadow-soft overflow-hidden">
          <CardHeader>
             <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">Consultas Recentes</CardTitle>
              <Button asChild variant="link" className="text-sm p-0 h-auto text-primary">
                <Link href="/dashboard/leads">Ver Todos os Leads</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Lead</TableHead>
                  <TableHead>Imóvel de Interesse</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPageLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : recentLeads && recentLeads.length > 0 ? (
                  recentLeads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-foreground flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {lead.name}
                      </TableCell>
                      <TableCell>{lead.propertyInterest || 'Não especificado'}</TableCell>
                      <TableCell><ClientSideDate date={lead.createdAt.toDate()} /></TableCell>
                      <TableCell><Badge variant="outline" className={cn("font-bold", getStatusBadgeClass(lead.status))}>{lead.status}</Badge></TableCell>
                      <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                             <Link href={`/dashboard/clientes/${lead.id}`}>
                                <span className="material-symbols-outlined">more_vert</span>
                             </Link>
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        Nenhum lead encontrado ainda.
                      </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent>
            {selectedEvent && (
                <>
                <DialogHeader>
                    <DialogTitle>{selectedEvent.title}</DialogTitle>
                    <DialogDescription>
                        {selectedEvent.description || 'Nenhuma descrição fornecida.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-lg text-gray-500">calendar_month</span>
                        <span className="font-medium">{format(parseISO(selectedEvent.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                        {selectedEvent.time && <span className="text-gray-500 font-medium">às {selectedEvent.time}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-lg text-gray-500">{eventTypeDetails[selectedEvent.type]?.icon}</span>
                        <span className="font-medium">{eventTypeDetails[selectedEvent.type]?.label}</span>
                    </div>
                    {selectedEvent.clientId && clientNameMap.get(selectedEvent.clientId) && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-lg text-gray-500">person</span>
                            <span className="font-medium">{clientNameMap.get(selectedEvent.clientId)}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Excluir</Button>
                    </AlertDialogTrigger>
                    <Button asChild>
                        <Link href={`/dashboard/agenda/${selectedEvent.id}`}>Ver Detalhes</Link>
                    </Button>
                </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

    </AlertDialog>
  );
}
