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
  Radar,
  Building2,
  FileText,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  ExternalLink,
  Check,
  Loader2,
  X,
  AlertCircle
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
import { useRouter } from "next/navigation";
import { doc, collection, query, where, orderBy, limit, Timestamp, arrayUnion, runTransaction, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import EventForm, { EventFormData } from './agenda/components/event-form';
import { cn, normalizeDate } from "@/lib/utils";
import { useCollection, setDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useOnboarding } from './DashboardCore';
import { useAuthContext } from "@/firebase/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { CartorioService } from "@/services/cartorioService";
import { ensureAgencyServer, AgencyClientDTO, AgencyMemberClientDTO } from "./imobiliaria/actions.server";
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
  brokerId?: string;
  network?: {
    published: boolean;
    status: string;
  };
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
  constructorId?: string;
  builderId?: string;
  createdByRole?: string;
  createdAt?: any;
  publishedAt?: any;
  isVisibleOnSite?: boolean;
  informacoesbasicas?: {
    nome?: string;
    status?: string;
    valor?: number;
    slug?: string;
    descricao?: string;
    quartos?: string | string[];
    tamanho?: string;
  };
  localizacao?: {
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  midia?: string[];
  personaIds?: string[];
};

type Portfolio = {
  propertyIds: string[];
};

const eventTypeDetails: { [key: string]: { label: string, color: string, icon: string } } = {
  reuniao: { label: 'Reunião', color: 'bg-purple-500', icon: 'groups' },
  visita: { label: 'Visita', color: 'bg-blue-500', icon: 'key' },
  tarefa: { label: 'Tarefa', color: 'bg-green-500', icon: 'check_box' },
  particular: { label: 'Particular', color: 'bg-amber-500', icon: 'person' },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: 'more_horiz' },
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
  const { user, userProfile, isReady, authLoading } = useAuthContext();
  const [currentDateDisplay, setCurrentDateDisplay] = useState('');
  const [greeting, setGreeting] = useState('Bom dia');
  const [showAlert, setShowAlert] = useState(true);
  
  const { firestore } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { openOnboarding } = useOnboarding();

  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);

  const [cartorioProcesses, setCartorioProcesses] = useState<any[]>([]);
  const [isCartorioLoading, setIsCartorioLoading] = useState(true);
  const [cartorioError, setCartorioError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && userProfile) {
      if (userProfile.userType === 'constructor' || userProfile.userType === 'construtora') {
        const constructorId = userProfile.tenantId || userProfile.uid;
        if (constructorId) {
          router.replace(`/dashboard/construtoras/${constructorId}`);
        }
      }
    }
  }, [isReady, userProfile, router]);

  const [agencyData, setAgencyData] = useState<AgencyClientDTO | null>(null);
  const [agencyMembers, setAgencyMembers] = useState<AgencyMemberClientDTO[]>([]);
  const [isAgencyLoading, setIsAgencyLoading] = useState(true);

  useEffect(() => {
    if (!isReady || authLoading || !user || !userProfile || userProfile?.userType !== 'imobiliaria') return;

    async function initializeAgency() {
      try {
        setIsAgencyLoading(true);
        const idToken = await user.getIdToken();

        console.info('[AGENCY AUTH TRACE]', {
          hasUser: !!user,
          hasToken: !!idToken,
          userType: userProfile?.userType
        });

        // Chamada única com ID Token explícito para inicializar/garantir a imobiliária server-side
        const result = await ensureAgencyServer(idToken);
        if (result.success) {
          setAgencyData(result.agency);
          setAgencyMembers(result.members);
        }
      } catch (err: any) {
        console.error('[IMOBILIARIA INIT ERROR]', err);
      } finally {
        setIsAgencyLoading(false);
      }
    }

    initializeAgency();
  }, [isReady, authLoading, user, userProfile]);

  if (isReady && userProfile && userProfile.userType === 'imobiliaria') {
    if (isAgencyLoading) {
      return (
        <div className="flex-grow flex items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin text-slate-400" />
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto py-10 px-6 space-y-8 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Building2 className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Imobiliária</span>
                <span className="text-xs font-semibold text-slate-400">Status: {agencyData?.status === 'active' ? 'Ativa' : 'Pendente'}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{agencyData?.name || 'Imobiliária'}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Fundação Organizacional • ID: {agencyData?.id}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col text-xs space-y-1">
            <span className="text-slate-400 font-medium">Usuário Conectado</span>
            <span className="font-bold text-slate-900">{userProfile.username || user?.email}</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">Papel: Proprietário (Owner)</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Equipe da Imobiliária</h2>
              <p className="text-xs text-slate-500">Membros vinculados à organização (Owner, Gestores e Corretores).</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">{agencyMembers.length} membro(s)</span>
              <Button asChild size="sm" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold">
                <Link href="/dashboard/imobiliaria/equipe">
                  Gerenciar Equipe
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyMembers.map((member) => (
              <div key={member.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                    {(userProfile.username || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{userProfile.username || user?.email}</div>
                    <div className="text-xs text-slate-400 font-mono">UID: {member.userId}</div>
                  </div>
                </div>
                <Badge className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isBroker = userProfile?.userType === 'broker';

  // --- QUERIES ---

  const brokerDocRef = useMemoFirebase(
      () => (firestore && user?.uid && isBroker ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user?.uid, isBroker]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);

  const planDocRef = useMemoFirebase(
      () => (firestore && isBroker && userProfile?.planId ? doc(firestore, 'plans', userProfile.planId) : null),
      [firestore, isBroker, userProfile?.planId]
  );
  const { data: planData } = useDoc<{ name?: string; price?: number; trialDays?: number; type?: string }>(planDocRef);

  const portfolioDocRef = useMemoFirebase(
      () => (firestore && user?.uid && isBroker ? doc(firestore, 'portfolios', user.uid) : null),
      [firestore, user?.uid, isBroker]
  );
  const { data: portfolioDoc } = useDoc<Portfolio>(portfolioDocRef);

  const isAlreadyInPortfolio = useMemo(() => {
      if (!selectedProperty || !portfolioDoc?.propertyIds) return false;
      return portfolioDoc.propertyIds.includes(selectedProperty.id);
  }, [selectedProperty, portfolioDoc]);

  const handleAddToPortfolio = async () => {
      if (!firestore || !user?.uid || !selectedProperty) return;
      try {
          setIsAddingToPortfolio(true);
          await setDocumentNonBlocking(
              doc(firestore, 'portfolios', user.uid),
              { propertyIds: arrayUnion(selectedProperty.id) },
              { merge: true }
          );
          toast({
              title: "Empreendimento adicionado à sua carteira.",
              description: "O imóvel já está disponível em sua vitrine."
          });
      } catch (error) {
          toast({
              variant: 'destructive',
              title: "Erro ao adicionar",
              description: "Não foi possível atualizar sua carteira."
          });
      } finally {
          setIsAddingToPortfolio(false);
      }
  };

  const trialInfo = useMemo(() => {
    if (!userProfile || !isBroker) return null;
    const { planStatus, trialEndsAt } = userProfile;
    if (planStatus === 'active' && !trialEndsAt) {
      return { type: 'active', message: 'Seu plano está ativo', isExpired: false, isExpiringToday: false, daysRemaining: 0, formattedDate: '', alertLevel: 'normal' };
    }
    if (!trialEndsAt) {
      return { type: 'unconfigured', message: 'Período de acesso não configurado.', isExpired: false, isExpiringToday: false, daysRemaining: 0, formattedDate: '', alertLevel: 'normal' };
    }
    const end = typeof trialEndsAt.toDate === 'function' ? trialEndsAt.toDate() : new Date(trialEndsAt);
    const now = new Date();
    const isExpired = end.getTime() <= now.getTime();
    const diffTime = end.getTime() - now.getTime();
    const isExpiringToday = !isExpired && diffTime < 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = format(end, "dd/MM/yyyy", { locale: ptBR });
    const daysRemaining = diffDays > 0 ? diffDays : 0;

    let alertLevel = 'normal';
    if (isExpired) alertLevel = 'expired';
    else if (isExpiringToday || daysRemaining <= 2) alertLevel = 'urgent';
    else if (daysRemaining <= 7) alertLevel = 'warning';

    return { type: 'trial', daysRemaining, formattedDate, isExpired, isExpiringToday, alertLevel };
  }, [userProfile, isBroker]);

  const transactionsQuery = useMemoFirebase(
    () => (isReady && user?.uid && firestore && isBroker ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid)) : null),
    [isReady, user?.uid, firestore, isBroker]
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
    () => (isReady && firestore && user?.uid && isBroker ? query(collection(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns')) : null),
    [isReady, firestore, user?.uid, isBroker]
  );
  const { data: rawColumns, isLoading: areColumnsLoading } = useCollection<LeadFunnelColumn>(funnelColumnsQuery);

  const eventsQuery = useMemoFirebase(
    () => (isReady && user?.uid && isBroker && firestore ? query(collection(firestore, 'events'), where('brokerId', '==', user.uid)) : null),
    [isReady, user?.uid, isBroker, firestore]
  );
  const { data: initialEvents, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);

  // Network Requests query (Solicitações da Rede)
  const networkQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid && isBroker ? query(collection(firestore, 'leads'), where('network.published', '==', true), where('network.status', '==', 'open')) : null),
    [isReady, user?.uid, firestore, isBroker]
  );
  const { data: networkLeads } = useCollection<Lead>(networkQuery);

  // Fetch cartorio processes securely via CartorioService API
  useEffect(() => {
    async function fetchCartorio() {
      if (!user?.uid) return;
      try {
        setIsCartorioLoading(true);
        setCartorioError(null);
        const cartorioService = CartorioService.getInstance();
        const list = await cartorioService.listBrokerProcesses(user.uid);
        setCartorioProcesses(list || []);
      } catch (err) {
        setCartorioError('Não foi possível carregar os processos.');
        setCartorioProcesses([]);
      } finally {
        setIsCartorioLoading(false);
      }
    }
    if (isReady && user?.uid) {
      fetchCartorio();
    }
  }, [isReady, user?.uid]);

  // --- STRICT CONSTRUCTOR INVENTORY SUPPLY (Novos Imóveis para Vender) ---
  const globalPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore ? query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true), limit(50)) : null),
    [isReady, firestore]
  );
  const { data: globalProperties } = useCollection<Property>(globalPropertiesQuery);

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
      return [...initialLeads].sort((a, b) => {
          const dateA = normalizeDate(a.createdAt);
          const dateB = normalizeDate(b.createdAt);
          const timeA = dateA ? dateA.getTime() : Date.now();
          const timeB = dateB ? dateB.getTime() : Date.now();
          return timeB - timeA;
      });
  }, [initialLeads]);

  const upcomingEvents = useMemo(() => {
    if (!initialEvents) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    return [...initialEvents]
        .filter(event => event.date >= today)
        .sort((a, b) => (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')))
        .slice(0, 4);
  }, [initialEvents]);

  // Attention counters
  const newLeadsCount = useMemo(() => {
    if (!initialLeads) return 0;
    return initialLeads.filter(l => l.status === 'new').length;
  }, [initialLeads]);

  const networkRequestsCount = useMemo(() => {
    if (!networkLeads) return 0;
    return networkLeads.filter(l => l.brokerId !== user?.uid).length;
  }, [networkLeads, user?.uid]);

  // Active processes = total retrieved from API
  const activeProcessesCount = useMemo(() => cartorioProcesses.length, [cartorioProcesses]);

  // Attention processes = subset of active processes needing action
  const attentionProcessesCount = useMemo(() => {
    return cartorioProcesses.filter(p => p.status === 'pending' || p.status === 'documento_rejeitado' || p.status === 'aguardando_acao' || p.status === 'rascunho').length;
  }, [cartorioProcesses]);

  const upcomingAgendaCount = useMemo(() => upcomingEvents.length, [upcomingEvents]);

  // STRICTLY CONSTRUCTOR INVENTORY WITH FAIL-SAFE NORMALIZATION
  const newPropertiesForSale = useMemo(() => {
    if (!globalProperties) return [];
    const supply = globalProperties.filter(p => {
        const hasConstructorLink = Boolean(p.builderId || p.constructorId);
        const isNotBrokerAvulso = !p.brokerId;
        const isPublished = p.isVisibleOnSite === true;
        return hasConstructorLink && isNotBrokerAvulso && isPublished;
    });

    const uniqueSupply = new Map();
    supply.forEach(p => uniqueSupply.set(p.id, p));

    return Array.from(uniqueSupply.values())
        .sort((a, b) => {
            const timeA = normalizeDate(a.publishedAt || a.createdAt)?.getTime() || 0;
            const timeB = normalizeDate(b.publishedAt || b.createdAt)?.getTime() || 0;
            return timeB - timeA;
        })
        .slice(0, 6)
        .map(prop => {
            const name = prop.informacoesbasicas?.nome || (prop as any).name || (prop as any).title || 'Empreendimento';
            const bairro = prop.localizacao?.bairro || (prop as any).endereco?.bairro || (prop as any).bairro || '';
            const cidade = prop.localizacao?.cidade || (prop as any).endereco?.cidade || (prop as any).cidade || '';
            
            let locationStr = '';
            if (bairro && cidade) locationStr = `${bairro}, ${cidade}`;
            else if (cidade) locationStr = cidade;
            else if (bairro) locationStr = bairro;

            const rawVal = prop.informacoesbasicas?.valor ?? (prop as any).valor ?? (prop as any).price ?? 0;
            const numericVal = Number(rawVal);
            const priceStr = !isNaN(numericVal) && numericVal > 0 
                ? numericVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }) 
                : 'Consulte valores';

            const image = prop.midia?.[0] || (prop as any).images?.[0] || (prop as any).image || 'https://picsum.photos/seed/prop/400/300';
            const slug = prop.informacoesbasicas?.slug || (prop as any).slug || prop.id;

            return {
                ...prop,
                normalizedName: name,
                normalizedLocation: locationStr,
                normalizedPrice: priceStr,
                normalizedImage: image,
                normalizedUrl: `/imoveis/${slug}`
            };
        });
  }, [globalProperties]);

  const clientNameMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name]) || []), [clients]);

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
    <div className="w-full max-w-7xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-500 text-left pb-20 px-4 md:px-10">
        
        {/* Top: Welcome Header & Quick Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="text-left space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentDateDisplay}</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{greeting}, {user?.displayName?.split(' ')[0] || 'corretor'}.</h2>
                <p className="text-slate-500 text-sm font-medium">Sua central operacional está <span className="text-emerald-600 font-bold uppercase tracking-wider text-[11px] bg-emerald-50 px-2 py-0.5 rounded ml-1">Online</span></p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <Button asChild className="h-11 px-5 rounded-xl font-bold bg-slate-900 text-white hover:bg-black shadow-sm transition-all text-xs flex items-center gap-2">
                    <Link href="/dashboard/clientes/nova">
                        <Plus className="size-4" /> Cadastrar cliente
                    </Link>
                </Button>
                <Button asChild className="h-11 px-5 rounded-xl font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm transition-all text-xs flex items-center gap-2">
                    <Link href="/dashboard/avulso/novo">
                        <Building2 className="size-4 text-slate-600" /> Cadastrar imóvel
                    </Link>
                </Button>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-11 px-5 rounded-xl font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm transition-all text-xs flex items-center gap-2">
                            <CalendarIcon className="size-4 text-slate-600" /> Agendar tarefa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
                        <DialogHeader><VisuallyHidden><DialogTitle>Cadastrar Nova Tarefa</DialogTitle></VisuallyHidden></DialogHeader>
                        <EventForm onSave={handleSaveEvent} onCancel={() => setIsModalOpen(false)} clients={clients || []} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* Compact Plan / Trial Alert */}
        {isBroker && trialInfo && trialInfo.alertLevel !== 'normal' && (
            <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-medium",
                trialInfo.alertLevel === 'expired' ? "bg-red-50 border-red-200 text-red-900" :
                trialInfo.alertLevel === 'urgent' ? "bg-amber-50 border-amber-200 text-amber-900" :
                "bg-blue-50 border-blue-200 text-blue-900"
            )}>
                <div className="flex items-center gap-2.5">
                    <Zap className="size-4 shrink-0" />
                    <span><strong>Aviso de Plano:</strong> {trialInfo.isExpired ? 'Seu período gratuito terminou.' : `${trialInfo.daysRemaining} dias restantes no seu plano ${planData?.name || 'Trial'}.`}</span>
                </div>
                <Button onClick={() => router.push('/dashboard/planos')} size="sm" className="h-8 font-bold text-xs bg-slate-900 text-white hover:bg-black">
                    Gerenciar Plano
                </Button>
            </div>
        )}

        {/* Onboarding Alert */}
        {isBroker && !brokerProfile?.onboardingCompleted && showAlert && (
            <div className="bg-primary p-6 rounded-2xl shadow-glow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Rocket className="size-32" /></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left space-y-1">
                        <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Ative seu Site com Inteligência Artificial</h3>
                        <p className="text-slate-900/80 font-medium">Finalize seu perfil para que nossa IA escreva os textos do seu site e gere autoridade imediata.</p>
                    </div>
                    <Button onClick={() => openOnboarding()} className="bg-slate-950 text-white hover:bg-black px-10 h-12 rounded-xl font-bold border-none">
                        Iniciar Agora
                    </Button>
                </div>
            </div>
        )}

        {/* ================= PRECISA DA SUA ATENÇÃO ================= */}
        <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span> Precisa da sua atenção
                </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Leads Recebidos */}
                <Card className="border-slate-100 shadow-soft hover:border-slate-300 transition-all bg-white">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Leads Recebidos</span>
                            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Users className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{newLeadsCount}</div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{newLeadsCount === 1 ? 'Novo lead aguardando contato' : `${newLeadsCount} novos leads no funil`}</p>
                        </div>
                        <Link href="/dashboard/leads" className="text-xs font-bold text-slate-900 hover:text-primary flex items-center gap-1 pt-2 border-t border-slate-50">
                            Ver leads <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Solicitações da Rede */}
                <Card className="border-slate-100 shadow-soft hover:border-slate-300 transition-all bg-white">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Solicitações da Rede</span>
                            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                <Radar className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{networkRequestsCount}</div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{networkRequestsCount === 1 ? 'Demanda aberta na rede' : `${networkRequestsCount} demandas abertas`}</p>
                        </div>
                        <Link href="/dashboard/solicitacoes-rede" className="text-xs font-bold text-slate-900 hover:text-primary flex items-center gap-1 pt-2 border-t border-slate-50">
                            Ver solicitações <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Processos Cartoriais */}
                <Card className="border-slate-100 shadow-soft hover:border-slate-300 transition-all bg-white">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Processos Cartoriais</span>
                            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <FileText className="size-4" />
                            </div>
                        </div>
                        <div>
                            {cartorioError ? (
                                <div className="text-xs font-bold text-red-600 pt-1">{cartorioError}</div>
                            ) : (
                                <>
                                    <div className="text-3xl font-black text-slate-900">{isCartorioLoading ? '...' : activeProcessesCount}</div>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        {isCartorioLoading ? 'Carregando...' : attentionProcessesCount > 0 
                                            ? `${attentionProcessesCount} precisam da sua atenção` 
                                            : 'Nenhuma pendência no momento'}
                                    </p>
                                </>
                            )}
                        </div>
                        <Link href="/dashboard/cartorio?tab=processos" className="text-xs font-bold text-slate-900 hover:text-primary flex items-center gap-1 pt-2 border-t border-slate-50">
                            Ver processos <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Próximos Compromissos */}
                <Card className="border-slate-100 shadow-soft hover:border-slate-300 transition-all bg-white">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Próximos Passos</span>
                            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <CalendarIcon className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{upcomingAgendaCount}</div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{upcomingAgendaCount === 0 ? 'Sem compromissos próximos' : 'Compromissos agendados'}</p>
                        </div>
                        <Link href="/dashboard/agenda" className="text-xs font-bold text-slate-900 hover:text-primary flex items-center gap-1 pt-2 border-t border-slate-50">
                            Ver agenda <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* ================= PIPELINE DE VENDAS ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary"></span> Pipeline de Vendas
            </h3>
            <Button asChild variant="link" className="text-xs font-bold text-slate-600 hover:text-slate-900 p-0 h-auto">
              <Link href="/dashboard/leads">Gerenciar Funil completo</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {funnelStats.map((stage) => (
              <Link key={stage.id} href={`/dashboard/leads`} className="group">
                <Card className="shadow-soft border-slate-100 hover:border-slate-300 transition-all overflow-hidden h-full bg-white">
                  <CardContent className="p-4 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start">
                      <div className={cn("size-7 rounded-lg flex items-center justify-center text-white shadow-sm", stage.color)}>
                        {stage.id === 'new' && <Users className="size-3.5" />}
                        {stage.id === 'contacted' && <MessageSquare className="size-3.5" />}
                        {stage.id === 'qualified' && <Target className="size-3.5" />}
                        {stage.id === 'proposal' && <Rocket className="size-3.5" />}
                        {stage.id === 'converted' && <Handshake className="size-3.5" />}
                      </div>
                      <span className="text-2xl font-black text-slate-900">{stage.count}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stage.title}</p>
                      <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden mt-1.5">
                        <div className={cn("h-full transition-all duration-500", stage.color)} style={{ width: stage.count > 0 ? '100%' : '0%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= NOVOS IMÓVEIS PARA VENDER ================= */}
        <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500"></span> Novos imóveis para vender
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Últimos imóveis e empreendimentos disponibilizados pelas construtoras.</p>
                </div>
                <Button asChild variant="link" className="text-xs font-bold text-slate-600 hover:text-slate-900 p-0 h-auto">
                    <Link href="/dashboard/minha-carteira">Ver todos</Link>
                </Button>
            </div>
            
            {newPropertiesForSale.length > 0 ? (
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {newPropertiesForSale.map((prop) => (
                            <CarouselItem key={prop.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                <div 
                                    onClick={() => setSelectedProperty(prop)}
                                    className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col"
                                >
                                    <div className="relative aspect-video overflow-hidden bg-slate-100 shrink-0">
                                        <Image src={prop.normalizedImage} alt={prop.normalizedName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                        <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">Novo</div>
                                    </div>
                                    <div className="p-4 space-y-1 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-xs text-slate-900 truncate uppercase tracking-tight">{prop.normalizedName}</h4>
                                            {prop.normalizedLocation ? (
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{prop.normalizedLocation}</p>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">—</p>
                                            )}
                                        </div>
                                        <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-2">
                                            <span className="text-xs font-black text-slate-900">{prop.normalizedPrice}</span>
                                            <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">Ver Quick View</span>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden sm:block">
                        <CarouselPrevious className="-left-12 bg-white border-slate-100 shadow-soft" />
                        <CarouselNext className="-right-12 bg-white border-slate-100 shadow-soft" />
                    </div>
                </Carousel>
            ) : (
                <Card className="border-slate-100 shadow-soft bg-white p-8 text-center text-slate-400 text-xs">
                    Nenhum novo imóvel de construtora disponível no momento.
                </Card>
            )}
        </section>

        {/* ================= QUICK VIEW SHEET / DRAWER ================= */}
        <Sheet open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 bg-white flex flex-col justify-between">
                {selectedProperty && (
                    <>
                        <div className="space-y-6 pb-28">
                            {/* Image Header with Close button */}
                            <div className="relative aspect-video w-full bg-slate-100">
                                <Image src={selectedProperty.normalizedImage} alt={selectedProperty.normalizedName} fill className="object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest shadow-md">Novo</div>
                            </div>

                            <div className="px-6 space-y-6">
                                <SheetHeader className="space-y-1 text-left p-0">
                                    <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">{selectedProperty.normalizedName}</SheetTitle>
                                    {selectedProperty.normalizedLocation && (
                                        <SheetDescription className="text-xs font-bold uppercase text-slate-500">
                                            {selectedProperty.normalizedLocation}
                                        </SheetDescription>
                                    )}
                                </SheetHeader>

                                {/* Price Box */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Valor</span>
                                        <span className="text-xl font-black text-slate-900">{selectedProperty.normalizedPrice}</span>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold gap-1">
                                        <Link href={selectedProperty.normalizedUrl} target="_blank">
                                            Ver completo <ExternalLink className="size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                                
                                {/* Commercial Info Range (New Request) */}
                                {(selectedProperty.informacoesbasicas?.tamanho || selectedProperty.informacoesbasicas?.quartos) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedProperty.informacoesbasicas?.tamanho && (
                                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-soft">
                                                <div className="flex items-center gap-2 mb-1.5 text-slate-400">
                                                    <ArrowRight className="size-3 rotate-[135deg]" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Metragem</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">{selectedProperty.informacoesbasicas.tamanho}</span>
                                            </div>
                                        )}
                                        {selectedProperty.informacoesbasicas?.quartos && (
                                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-soft">
                                                <div className="flex items-center gap-2 mb-1.5 text-slate-400">
                                                    <Users className="size-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Quartos</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">{selectedProperty.informacoesbasicas.quartos}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Description */}
                                {selectedProperty.informacoesbasicas?.descricao && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Sobre o Empreendimento</h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">{selectedProperty.informacoesbasicas.descricao}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4 shadow-lg">
                            <Button 
                                variant="outline" 
                                onClick={() => setSelectedProperty(null)}
                                className="h-12 rounded-xl font-bold text-xs px-6"
                            >
                                Fechar
                            </Button>
                            <Button
                                disabled={isAlreadyInPortfolio || isAddingToPortfolio}
                                onClick={handleAddToPortfolio}
                                className={cn(
                                    "flex-1 h-12 rounded-xl font-bold text-xs gap-2 shadow-sm",
                                    isAlreadyInPortfolio ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-primary text-slate-900 hover:bg-primary-hover"
                                )}
                            >
                                {isAddingToPortfolio ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" /> Adicionando...
                                    </>
                                ) : isAlreadyInPortfolio ? (
                                    <>
                                        <Check className="size-4 text-emerald-600" /> ✓ Na minha carteira
                                    </>
                                ) : (
                                    <>
                                        <Plus className="size-4" /> Adicionar à minha carteira
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>

        {/* ================= ATALHOS / ÁREAS SECUNDÁRIAS ================= */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Atalhos Operacionais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/mercado" className="group bg-white p-4 rounded-xl border border-slate-100 shadow-soft hover:border-slate-300 transition-all flex items-center gap-3.5">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                        <BarChart3 className="size-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-slate-900">Insights de Mercado</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Análise via IA</p>
                    </div>
                </Link>
                <Link href="/dashboard/oralink" className="group bg-white p-4 rounded-xl border border-slate-100 shadow-soft hover:border-slate-300 transition-all flex items-center gap-3.5">
                    <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Smartphone className="size-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-slate-900">Cartão Oralink</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Bio & Contatos</p>
                    </div>
                </Link>
                <Link href="/dashboard/meu-site" className="group bg-white p-4 rounded-xl border border-slate-100 shadow-soft hover:border-slate-300 transition-all flex items-center gap-3.5">
                    <div className="size-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Globe className="size-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-slate-900">Gestão do Site</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Layout & Cores</p>
                    </div>
                </Link>
                <Link href="/dashboard/radar-oportunidades" className="group bg-white p-4 rounded-xl border border-slate-100 shadow-soft hover:border-slate-300 transition-all flex items-center gap-3.5">
                    <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Radar className="size-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-slate-900">Radar de Rede</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Parcerias e Ofertas</p>
                    </div>
                </Link>
            </div>
        </section>

    </div>
  );
}
