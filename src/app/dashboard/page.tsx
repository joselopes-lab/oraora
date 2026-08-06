
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Users, 
  Target, 
  Rocket, 
  Handshake, 
  Mail, 
  MessageSquare,
  Zap,
  Smartphone,
  Globe,
  PlusCircle,
  BarChart3,
  Radar
} from "lucide-react";
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
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { doc, collection, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { useEffect, useState, useMemo, useContext } from "react";
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import EventForm, { EventFormData } from './agenda/components/event-form';
import { cn } from "@/lib/utils";
import { useCollection, addDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useOnboarding } from './DashboardCore';
import { useAuthContext } from "@/firebase/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

type BrokerProfile = {
    slug: string;
    monthlyGoals?: { [key: string]: number };
    onboardingCompleted?: boolean;
    logoUrl?: string;
    layoutId?: string;
    primaryColor?: string;
};

type Lead = {
  id: string;
  name: string;
  createdAt: Timestamp;
  status: string;
  propertyInterest?: string;
  propertyName?: string;
  email: string;
  phone: string;
  personaIds?: string[];
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
  journeyId?: string;
  propertyId?: string;
  propertySource?: 'properties' | 'brokerProperties';
};

type Property = {
  id: string;
  brokerId?: string;
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
  personaIds?: string[];
};

const eventTypeDetails: { [key: string]: { label: string, color: string, icon: string } } = {
  reuniao: { label: 'Reunião', color: 'bg-purple-500', icon: 'groups' },
  visita: { label: 'Visita', color: 'bg-blue-500', icon: 'key' },
  tarefa: { label: 'Tarefa', color: 'bg-green-500', icon: 'check_box' },
  particular: { label: 'Particular', color: 'bg-amber-500', icon: 'person' },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: 'more_horiz' },
};

type BrokerMetrics = {
    totalLeads?: number;
    totalClosed?: number;
    conversionRate?: number;
    avgClosingTimeDays?: number;
};

type LeadFunnelColumn = {
  id: string;
  title: string;
  color: string;
  order: number;
};

const ClientSideDate = ({ date, options }: { date: Date | null | undefined, options?: Intl.DateTimeFormatOptions }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      setFormattedDate(date.toLocaleDateString('pt-BR', options));
    }
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

export default function DashboardPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const [currentDateDisplay, setCurrentDateDisplay] = useState('');
  const [greeting, setGreeting] = useState('Bom dia');
  const [showAlert, setShowAlert] = useState(true);
  
  const { firestore } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { openOnboarding } = useOnboarding();

  const isBroker = userProfile?.userType === 'broker';

  // --- QUERIES ---

  const brokerDocRef = useMemoFirebase(
      () => (firestore && user?.uid && isBroker ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user?.uid, isBroker]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);

  const transactionsQuery = useMemoFirebase(
    () => (isReady && user?.uid && firestore ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid)) : null),
    [isReady, user?.uid, firestore]
  );
  const { data: allTransactions, isLoading: areTransactionsLoading } = useCollection(transactionsQuery);

  const clientsQuery = useMemoFirebase(
    () => {
      if (!isReady || !user?.uid || !userProfile?.userType || !firestore) return null;
      if (userProfile.userType === 'admin') return query(collection(firestore, 'leads'), limit(50));
      if (userProfile.userType === 'broker') return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid));
      return null;
    },
    [isReady, user?.uid, userProfile?.userType, firestore]
  );
  const { data: initialLeads, isLoading: areClientsLoading } = useCollection<Lead>(clientsQuery);

  const funnelColumnsQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid ? query(collection(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns')) : null),
    [isReady, firestore, user?.uid]
  );
  const { data: rawColumns, isLoading: areColumnsLoading } = useCollection<LeadFunnelColumn>(funnelColumnsQuery);

  const eventsQuery = useMemoFirebase(
    () => (isReady && user?.uid && isBroker && firestore ? query(collection(firestore, 'events'), where('brokerId', '==', user.uid)) : null),
    [isReady, user?.uid, isBroker, firestore]
  );
  const { data: initialEvents, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);

  // --- RADAR ENGINE (Supply Side) ---
  const globalPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore ? query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true)) : null),
    [isReady, firestore]
  );
  const { data: globalProperties, isLoading: areGlobalPropertiesLoading } = useCollection<Property>(globalPropertiesQuery);

  const partnerPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore ? query(collection(firestore, 'brokerProperties'), where('isVisibleOnSite', '==', true)) : null),
    [isReady, firestore]
  );
  const { data: partnerProperties, isLoading: arePartnerPropertiesLoading } = useCollection<Property>(partnerPropertiesQuery);

  // --- MEMOIZED DATA ---

  const columns = useMemo(() => {
    if (!rawColumns || rawColumns.length === 0) {
      return [
        { id: 'new', title: 'Novos', color: 'bg-blue-500', order: 1 },
        { id: 'contacted', title: 'Contato', color: 'bg-yellow-500', order: 2 },
        { id: 'qualified', title: 'Qualificados', color: 'bg-purple-500', order: 3 },
        { id: 'proposal', title: 'Proposta', color: 'bg-orange-500', order: 4 },
        { id: 'converted', title: 'Venda', color: 'bg-green-500', order: 5 },
      ];
    }
    return [...rawColumns].sort((a, b) => a.order - b.order);
  }, [rawColumns]);

  const funnelStats = useMemo(() => {
    if (!initialLeads) return [];
    return columns.map(col => ({
      ...col,
      count: initialLeads.filter(l => l.status === col.id).length
    }));
  }, [initialLeads, columns]);

  const clients = useMemo(() => {
      if (!initialLeads) return [];
      return [...initialLeads].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [initialLeads]);

  const upcomingEvents = useMemo(() => {
    if (!initialEvents) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    return [...initialEvents]
        .filter(event => event.date >= today)
        .sort((a, b) => (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')))
        .slice(0, 4);
  }, [initialEvents]);

  const { totalRevenue, revenuePercentageChange } = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return { totalRevenue: 0, revenuePercentageChange: 0 };
    const dateNow = new Date();
    const currentMonthStart = startOfMonth(dateNow);
    const currentMonthEnd = endOfMonth(dateNow);
    const prevMonthDate = subMonths(dateNow, 1);
    const prevMonthStart = startOfMonth(prevMonthDate);
    const prevMonthEnd = endOfMonth(prevMonthDate);

    const currentMonthRevenue = allTransactions
      .filter((t: any) => t.type === 'receita' && t.date && parseISO(t.date) >= currentMonthStart && parseISO(t.date) <= currentMonthEnd)
      .reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);

    const prevMonthRevenue = allTransactions
      .filter((t: any) => t.type === 'receita' && t.date && parseISO(t.date) >= prevMonthStart && parseISO(t.date) <= prevMonthEnd)
      .reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);

    const change = prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : (currentMonthRevenue > 0 ? 100 : 0);
    return { totalRevenue: currentMonthRevenue, revenuePercentageChange: change };
  }, [allTransactions]);

  // --- RADAR MATCH ENGINE ---
  const radarMatches = useMemo(() => {
    if (!initialLeads || (!globalProperties && !partnerProperties)) return [];
    
    // Get all unique persona IDs the broker is working with
    const activePersonaIds = new Set<string>();
    initialLeads.forEach(l => l.personaIds?.forEach(id => activePersonaIds.add(id)));
    
    if (activePersonaIds.size === 0) return [];

    const supply = [...(globalProperties || []), ...(partnerProperties || [])];
    const uniqueSupply = new Map();
    supply.forEach(p => {
        if (p.brokerId !== user?.uid) uniqueSupply.set(p.id, p);
    });

    return Array.from(uniqueSupply.values())
        .filter(p => p.personaIds?.some((pid: string) => activePersonaIds.has(pid)))
        .slice(0, 8);
  }, [initialLeads, globalProperties, partnerProperties, user?.uid]);

  const clientNameMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name]) || []), [clients]);

  // --- ACTIONS ---

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

  const isPageLoading = !isReady || (isBroker && isBrokerLoading) || areTransactionsLoading || areClientsLoading || areEventsLoading || areColumnsLoading;

  if (isPageLoading) return <div className="w-full max-w-7xl mx-auto p-10 space-y-8"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 text-left pb-20 px-4 md:px-10">
        
        {/* Personalized Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="text-left">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{greeting}, {user?.displayName?.split(' ')[0] || 'usuário'}.</h2>
                <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Sua imobiliária digital está <span className="text-green-600 font-bold uppercase tracking-widest text-[10px] md:text-xs bg-green-50 px-2 py-0.5 rounded ml-1">Online</span></p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                 <p className="hidden md:block text-right">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Data de hoje</span>
                    <span className="block text-sm font-black text-slate-900">{currentDateDisplay}</span>
                </p>
                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-11 md:h-12 px-6 rounded-xl font-bold bg-slate-900 text-white hover:bg-black shadow-lg shadow-black/10 transition-all flex items-center gap-2 w-full md:w-auto justify-center">
                            <PlusCircle className="size-5" />
                            Agendar Tarefa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
                        <DialogHeader><VisuallyHidden><DialogTitle>Cadastrar Nova Tarefa</DialogTitle></VisuallyHidden></DialogHeader>
                        <EventForm onSave={handleSaveEvent} onCancel={() => setIsModalOpen(false)} clients={clients || []} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* Onboarding Alert */}
        {isBroker && !brokerProfile?.onboardingCompleted && showAlert && (
            <div className="bg-primary p-6 rounded-2xl shadow-glow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Rocket className="size-32" /></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left space-y-1">
                        <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Ative seu Site com Inteligência Artificial</h3>
                        <p className="text-slate-900/80 font-medium">Finalize seu perfil para que nossa IA escreva os textos do seu site e gere autoridade imediata.</p>
                    </div>
                    <Button 
                        onClick={() => openOnboarding()}
                        className="bg-slate-950 text-white hover:bg-black px-10 h-12 rounded-xl font-bold border-none"
                    >
                        Iniciar Agora
                    </Button>
                </div>
            </div>
        )}

        {/* Action Center - Shortcuts to Best Features */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/mercado" className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-soft hover:border-primary transition-all flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                    <BarChart3 className="size-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary-hover transition-colors">Insights de Mercado</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Análise via IA</p>
                </div>
            </Link>
            <Link href="/dashboard/oralink" className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-soft hover:border-primary transition-all flex items-center gap-4">
                <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Smartphone className="size-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Cartão Oralink</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bio & Contatos</p>
                </div>
            </Link>
            <Link href="/dashboard/meu-site" className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-soft hover:border-primary transition-all flex items-center gap-4">
                <div className="size-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Globe className="size-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Gestão do Site</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Layout & Cores</p>
                </div>
            </Link>
            <Link href="/dashboard/radar-oportunidades" className="group bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl hover:border-primary transition-all flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Radar className="size-6" />
                </div>
                <div>
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">Radar de Rede</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fazer Parcerias</p>
                </div>
            </Link>
        </section>

        {/* Main Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default border-slate-100">
                <CardHeader className="pb-2"><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Total de Leads</p></CardHeader>
                <CardContent><h3 className="text-3xl font-black text-slate-900 tracking-tight">{initialLeads?.length || 0}</h3></CardContent>
            </Card>
            <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default border-slate-100">
                <CardHeader className="pb-2"><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Taxa de Conversão</p></CardHeader>
                <CardContent>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">14.8%</h3>
                    <p className="text-[10px] font-bold text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="size-3" /> +2% este mês</p>
                </CardContent>
            </Card>
            <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default border-slate-100">
                <CardHeader className="pb-2"><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Faturamento Mensal</p></CardHeader>
                <CardContent>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    <p className={cn("text-[10px] font-bold mt-1 flex items-center gap-1", revenuePercentageChange >= 0 ? "text-green-600" : "text-red-600")}>
                        {revenuePercentageChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {Math.abs(revenuePercentageChange).toFixed(1)}% vs mês ant.
                    </p>
                </CardContent>
            </Card>
             <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="size-16 text-primary fill-current" /></div>
                <CardHeader className="pb-2"><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Novas Oportunidades</p></CardHeader>
                <CardContent>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{radarMatches.length}</h3>
                    <p className="text-[10px] font-bold text-primary-hover mt-1">Matches detectados pela IA</p>
                </CardContent>
            </Card>
        </div>

        {/* Sales Pipeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span> Pipeline de Vendas
            </h3>
            <Button asChild variant="link" className="text-[10px] font-black uppercase text-primary-hover hover:underline p-0 h-auto">
              <Link href="/dashboard/leads">Gerenciar Funil</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {funnelStats.map((stage) => (
              <Link key={stage.id} href={`/dashboard/leads`} className="group">
                <Card className="shadow-soft border-slate-100 hover:border-primary transition-all overflow-hidden h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className={cn("size-8 rounded-lg flex items-center justify-center text-white shadow-sm", stage.color)}>
                        {stage.id === 'new' && <Users className="size-4" />}
                        {stage.id === 'contacted' && <MessageSquare className="size-4" />}
                        {stage.id === 'qualified' && <Target className="size-4" />}
                        {stage.id === 'proposal' && <Rocket className="size-4" />}
                        {stage.id === 'converted' && <Handshake className="size-4" />}
                      </div>
                      <span className="text-2xl font-black text-slate-900">{stage.count}</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stage.title}</p>
                      <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden mt-2">
                        <div className={cn("h-full transition-all duration-500", stage.color)} style={{ width: stage.count > 0 ? '100%' : '0%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Radar Matches Slider */}
        {radarMatches.length > 0 && (
            <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Zap className="size-4 text-primary fill-current" /> Oportunidades do Radar
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Imóveis da rede que combinam com as personas dos seus leads ativos.</p>
                    </div>
                    <Button asChild variant="link" className="text-[10px] font-black uppercase text-primary-hover hover:underline p-0 h-auto">
                        <Link href="/dashboard/radar-oportunidades">Ir para o Radar</Link>
                    </Button>
                </div>
                
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {radarMatches.map((prop) => (
                            <CarouselItem key={prop.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                <Link href={`/imoveis/${prop.informacoesbasicas.slug || prop.id}`} target="_blank" className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft hover:border-primary/50 transition-all">
                                    <div className="relative aspect-video overflow-hidden">
                                        <Image src={prop.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'} alt={prop.informacoesbasicas.nome} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-3 left-3 bg-primary text-slate-900 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg">98% Match</div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{prop.informacoesbasicas.nome}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-900">{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                            <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">arrow_forward</span>
                                        </div>
                                    </div>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden sm:block">
                        <CarouselPrevious className="-left-12 bg-white border-slate-100 shadow-soft" />
                        <CarouselNext className="-right-12 bg-white border-slate-100 shadow-soft" />
                    </div>
                </Carousel>
            </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Leads Table */}
            <div className="lg:col-span-8 space-y-4 text-left">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-slate-300"></span> Atividade Recente
                    </h3>
                    <Link className="text-[10px] font-black uppercase text-primary-hover hover:underline" href="/dashboard/clientes">Ver Carteira</Link>
                </div>
                <Card className="shadow-soft overflow-hidden border-slate-100">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 border-b border-slate-100">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Cliente</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Interesse</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-6">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients?.slice(0, 5).map(lead => (
                                    <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-9 border-2 border-white shadow-sm"><AvatarFallback className="bg-primary/10 text-green-700 font-bold text-xs">{lead.name.charAt(0)}</AvatarFallback></Avatar>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none mb-1">{lead.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase"><ClientSideDate date={lead.createdAt?.toDate()} options={{ day: '2-digit', month: 'short' }} /></p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 font-medium max-w-[200px] truncate">
                                            <div>{lead.propertyInterest || 'N/A'}</div>
                                            {lead.propertyName && (
                                                <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-primary uppercase">
                                                    <span className="material-symbols-outlined text-[12px]">apartment</span>
                                                    {lead.propertyName}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center"><Badge variant="outline" className={cn("font-bold text-[9px] uppercase tracking-tighter", getStatusBadgeClass(lead.status))}>{lead.status}</Badge></TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button asChild variant="ghost" size="icon" className="size-8 rounded-lg text-slate-300 hover:text-primary transition-colors"><Link href={`/dashboard/clientes/${lead.id}`}><span className="material-symbols-outlined">more_horiz</span></Link></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!clients || clients.length === 0) && (
                                    <TableRow><TableCell colSpan={4} className="text-center p-20 text-slate-400 italic">Nenhum lead registrado.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Agenda */}
            <div className="lg:col-span-4 space-y-4 text-left">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> Próximos Passos
                    </h3>
                    <Link className="text-[10px] font-black uppercase text-primary-hover hover:underline" href="/dashboard/agenda">Ver Agenda</Link>
                </div>
                <Card className="shadow-soft border-slate-100 bg-white">
                    <CardContent className="p-6 space-y-5">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => {
                                const clientName = event.clientId ? clientNameMap.get(event.clientId) : null;
                                const style = eventTypeDetails[event.type]?.color || 'bg-slate-400';
                                return (
                                    <Link key={event.id} href={`/dashboard/agenda/${event.id}`} className="flex gap-4 group transition-all">
                                        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl size-14 shrink-0 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{format(parseISO(event.date), 'MMM', { locale: ptBR })}</span>
                                            <span className="text-xl font-black text-slate-900 leading-none">{format(parseISO(event.date), 'dd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={cn("size-2 rounded-full shrink-0", style)}></div>
                                                <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{event.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-primary-hover uppercase tracking-widest">{event.time}</span>
                                                {clientName && <span className="text-[10px] text-slate-400 truncate uppercase font-bold">• {clientName}</span>}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center space-y-3">
                                <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto"><Mail className="size-6" /></div>
                                <p className="text-xs text-slate-400 font-medium">Sem compromissos agendados para os próximos dias.</p>
                            </div>
                        )}
                        <Button asChild variant="outline" className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 transition-all mt-4">
                            <Link href="/dashboard/agenda">Gerenciar Minha Agenda</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

