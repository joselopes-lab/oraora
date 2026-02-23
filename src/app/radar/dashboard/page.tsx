
'use client';
import { useAuthContext, useFirebase, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, collection, doc, query, where, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel";
import { useRouter } from 'next/navigation';
import EventForm, { EventFormData } from '@/app/dashboard/agenda/components/event-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

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

type Persona = {
  id: string;
  name: string;
}

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
export default function RadarDashboardPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('Bom dia');
  
  const { firestore } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const personaId = userProfile?.personaIds?.[0];

  const personaDocRef = useMemoFirebase(
    () => (firestore && personaId ? doc(firestore, 'personas', personaId) : null),
    [firestore, personaId]
  );
  const { data: persona, isLoading: isPersonaLoading } = useDoc<Persona>(personaDocRef);

  const recommendedPropertiesQuery = useMemoFirebase(
    () => (firestore && personaId ? query(collection(firestore, 'properties'), where('personaIds', 'array-contains', personaId)) : null),
    [firestore, personaId]
  );
  const { data: recommendedProperties, isLoading: arePropertiesLoading } = useCollection<Property>(recommendedPropertiesQuery);
  
  const brokerPropertiesQuery = useMemoFirebase(
    () => (firestore && personaId ? query(collection(firestore, 'brokerProperties'), where('personaIds', 'array-contains', personaId)) : null),
    [firestore, personaId]
  );
  const { data: recommendedBrokerProperties, isLoading: areBrokerPropertiesLoading } = useCollection<Property>(brokerPropertiesQuery);

  const allRecommendedProperties = useMemo(() => {
    const all = [...(recommendedProperties || []), ...(recommendedBrokerProperties || [])];
    const unique = new Map();
    all.forEach(p => unique.set(p.id, p));
    return Array.from(unique.values());
  }, [recommendedProperties, recommendedBrokerProperties]);

  const newOpportunities = useMemo(() => allRecommendedProperties.slice(0, 4), [allRecommendedProperties]);
  
  const radarListDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'radarLists', user.uid) : null),
      [user, firestore]
  );
  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];
  
  const [recommendedCurrentPage, setRecommendedCurrentPage] = useState(1);
  const recommendedItemsPerPage = 8;

  const recommendedTotalPages = useMemo(() => {
      return Math.ceil(allRecommendedProperties.length / recommendedItemsPerPage);
  }, [allRecommendedProperties.length, recommendedItemsPerPage]);

  const paginatedRecommendedProperties = useMemo(() => {
      return allRecommendedProperties.slice(
          (recommendedCurrentPage - 1) * recommendedItemsPerPage,
          recommendedCurrentPage * recommendedItemsPerPage
      );
  }, [allRecommendedProperties, recommendedCurrentPage, recommendedItemsPerPage]);

  const handleRecommendedPageChange = (page: number) => {
      if (page >= 1 && page <= recommendedTotalPages) {
          setRecommendedCurrentPage(page);
          const element = document.getElementById('recommended-section');
          if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
          }
      }
  };


  const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        router.push('/radar');
        return;
    }

    if (!firestore) return;

    const docRef = doc(firestore, 'radarLists', user.uid);
    
    if (savedPropertyIds.includes(propertyId)) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido do Radar!", description: "O imóvel foi removido da sua lista." });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Adicionado ao Radar!", description: "O imóvel foi salvo na sua lista de oportunidades." });
    }
  };

  const isLoading = !isReady || isPersonaLoading || arePropertiesLoading || areBrokerPropertiesLoading;

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
  
  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
  
    const dataAsString = Array.isArray(quartosData)
        ? quartosData.join(' ')
        : String(quartosData);
  
    const numbers = dataAsString.match(/\d+/g);
    
    if (!numbers || numbers.length === 0) {
        const trimmedString = dataAsString.trim();
        return trimmedString ? trimmedString : 'N/A';
    }

    const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
    
    if (uniqueNumbers.length === 0) return 'N/A';
    if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
    
    const last = uniqueNumbers.pop();
    return `${uniqueNumbers.join(', ')} e ${last}`;
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-neutral-dark">{greeting}, {user?.displayName?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500">Encontramos novas oportunidades baseadas no seu perfil hoje.</p>
        </div>
        <div className="bg-neutral-light p-4 pr-6 rounded-2xl flex items-center gap-4 border border-gray-100">
          <div className="size-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Seu Perfil Atual</div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-neutral-dark">{isLoading ? 'Carregando...' : (persona?.name || 'Não definido')}</span>
              <Link className="text-xs font-bold text-primary bg-neutral-dark px-2 py-0.5 rounded hover:bg-black transition-colors" href="/radar/dashboard/personas">EDITAR</Link>
            </div>
          </div>
        </div>
      </div>
      <section className="mb-12">
        <Carousel>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    Novas Oportunidades
                </h2>
                <div className="flex gap-2">
                    <CarouselPrevious className="static -translate-y-0 size-8 border-gray-200" />
                    <CarouselNext className="static -translate-y-0 size-8 border-gray-200" />
                </div>
            </div>
            <CarouselContent className="-ml-4">
            {isLoading ? Array.from({length: 3}).map((_, i) => (
                <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Skeleton className="min-w-[340px] aspect-[16/10] rounded-3xl" />
                </CarouselItem>
            )) : newOpportunities.map((property: Property) => (
                <CarouselItem key={property.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Link href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} target="_blank" className="block min-w-[340px] group relative bg-neutral-dark rounded-3xl overflow-hidden aspect-[16/10]">
                        <Image alt={property.informacoesbasicas.nome} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" src={property.midia?.[0] || `https://picsum.photos/seed/${property.id}/340/212`} fill/>
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-transparent to-transparent"></div>
                        <div className="absolute top-4 left-4">
                            <span className="bg-primary text-neutral-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Compatibilidade: 98%</span>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="text-white font-bold text-lg mb-1">{property.informacoesbasicas.nome}</div>
                            <div className="text-gray-300 text-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {property.localizacao.bairro}, {property.localizacao.cidade}
                            </div>
                        </div>
                        <div className="absolute bottom-6 right-6 size-10 bg-primary rounded-full flex items-center justify-center shadow-glow">
                            <span className="material-symbols-outlined text-neutral-dark">arrow_forward</span>
                        </div>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
      </section>
      <section id="recommended-section">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">
                Imóveis Recomendados {persona?.name && <span className="text-primary">para {persona.name}</span>}
            </h2>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Filtrar por:</span>
                <select className="text-sm font-semibold border-none bg-neutral-light rounded-lg focus:ring-primary focus:ring-1 py-1 pr-8 pl-3">
                    <option>Maior Match</option>
                    <option>Menor Preço</option>
                    <option>Recentes</option>
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
             Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100"><Skeleton className="h-[450px] w-full"/></div>
             ))
          ) : paginatedRecommendedProperties.length > 0 ? (
            paginatedRecommendedProperties.map((property: Property) => {
             const isSaved = savedPropertyIds.includes(property.id);
             return (
                <Link href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} target="_blank" key={property.id} className="group block bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-soft transition-all duration-300">
                    <div className="relative aspect-square">
                        <Image alt={property.informacoesbasicas.nome} className="w-full h-full object-cover" src={property.midia?.[0] || `https://picsum.photos/seed/grid/400/400`} width={400} height={400}/>
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                           <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("size-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors", isSaved ? "text-primary" : "text-gray-400 hover:text-primary")}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: isSaved ? "'FILL' 1" : ""}}>radar</span>
                            </button>
                        </div>
                        <div className="absolute bottom-4 left-4">
                            <div className="bg-primary/90 backdrop-blur text-neutral-dark text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                98% MATCH
                            </div>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-neutral-dark group-hover:text-primary transition-colors truncate">{property.informacoesbasicas.nome}</h3>
                            <span className="font-bold text-neutral-dark">{property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {property.localizacao.bairro}, {property.localizacao.cidade}
                        </p>
                        <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <span className="material-symbols-outlined text-[18px]">bed</span>
                                <span className="text-xs font-medium">{formatQuartos(property.caracteristicasimovel?.quartos)} Dorms</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <span className="material-symbols-outlined text-[18px]">straighten</span>
                                <span className="text-xs font-medium">{property.caracteristicasimovel?.tamanho}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                                <span className="text-xs font-medium">{property.caracteristicasimovel?.vagas} Vagas</span>
                            </div>
                        </div>
                    </div>
                </Link>
            )
            })
          ) : (
             <div className="col-span-full text-center py-20">
                <p>Nenhum imóvel recomendado encontrado para sua persona.</p>
             </div>
          )}
        </div>
        {recommendedTotalPages > 1 && (
            <div className="mt-12 flex justify-center">
                <nav className="flex items-center gap-2">
                    <button onClick={() => handleRecommendedPageChange(recommendedCurrentPage - 1)} disabled={recommendedCurrentPage === 1} className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                     {Array.from({ length: recommendedTotalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => handleRecommendedPageChange(page)}
                            className={`flex items-center justify-center size-10 rounded-full border border-gray-200 font-medium transition-all ${recommendedCurrentPage === page ? 'bg-primary text-black font-bold shadow-md' : 'bg-white text-text-muted hover:bg-gray-100 hover:border-gray-300'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button onClick={() => handleRecommendedPageChange(recommendedCurrentPage + 1)} disabled={recommendedCurrentPage === recommendedTotalPages} className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-text-main hover:bg-black hover:text-white hover:border-black transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </nav>
            </div>
        )}
      </section>
    </>
  );
}

    