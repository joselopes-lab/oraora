
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useAuthContext, setDocumentNonBlocking } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { arrayRemove, arrayUnion, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';


type UserProfile = {
    userType: 'admin' | 'broker' | 'constructor';
    planId?: string;
    personaIds?: string[];
};

type BrokerProfile = {
    slug: string;
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
      estado: string;
    };
    midia: string[];
    caracteristicasimovel: {
      tipo: string;
      quartos?: string[] | string;
      tamanho?: string;
      vagas?: string;
    };
    personaIds?: string[];
};

type RadarList = {
  propertyIds: string[];
};

export default function RadarDashboardPage() {
    const { user, userProfile, isReady } = useAuthContext();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [sortBy, setSortBy] = useState('match_desc');
    const [currentDate, setCurrentDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const selectedPersonaId = userProfile?.personaIds?.[0];

    const personaDocRef = useMemoFirebase(
      () => (firestore && selectedPersonaId ? doc(firestore, 'personas', selectedPersonaId) : null),
      [firestore, selectedPersonaId]
    );
    const { data: selectedPersona, isLoading: isPersonaLoading } = useDoc<{ name: string }>(personaDocRef);

    // Query for properties that match the user's selected persona, or all properties if no persona is selected
    const opportunitiesQuery = useMemoFirebase(
      () => {
        if (!firestore) return null;
        const propertiesRef = collection(firestore, 'properties');
        if (selectedPersonaId) {
            return query(propertiesRef, where('personaIds', 'array-contains', selectedPersonaId), where('isVisibleOnSite', '==', true));
        }
        // If no persona, show all visible properties.
        return query(propertiesRef, where('isVisibleOnSite', '==', true));
      },
      [firestore, selectedPersonaId]
    );
    const { data: opportunities, isLoading: areOpportunitiesLoading } = useCollection<Property>(opportunitiesQuery);
    
    const radarListDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'radarLists', user.uid) : null),
        [user, firestore]
    );

    const { data: radarList } = useDoc<RadarList>(radarListDocRef);
    const savedPropertyIds = radarList?.propertyIds || [];

    const sortedOpportunities = useMemo(() => {
      if (!opportunities) return [];

      const sorted = [...opportunities];

      switch (sortBy) {
          case 'price_asc':
              sorted.sort((a, b) => (a.informacoesbasicas.valor || Infinity) - (b.informacoesbasicas.valor || Infinity));
              break;
          case 'price_desc':
              sorted.sort((a, b) => (b.informacoesbasicas.valor || 0) - (a.informacoesbasicas.valor || 0));
              break;
          case 'recent':
              // This is a placeholder as there's no timestamp. We can reverse the array as an approximation.
              sorted.reverse();
              break;
          case 'match_desc':
          default:
              // The default order from Firestore is assumed to be by match.
              break;
      }
      return sorted;
  }, [opportunities, sortBy]);

    const totalPages = useMemo(() => {
        if (!sortedOpportunities) return 1;
        return Math.ceil(sortedOpportunities.length / itemsPerPage);
    }, [sortedOpportunities, itemsPerPage]);

    const paginatedOpportunities = useMemo(() => {
        if (!sortedOpportunities) return [];
        return sortedOpportunities.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [sortedOpportunities, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
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
    
    const handleDisablePersona = async () => {
      if (!user || !firestore) return;
  
      const userDocRef = doc(firestore, 'users', user.uid);
      try {
        await setDocumentNonBlocking(userDocRef, { personaIds: [] }, { merge: true });
        toast({
          title: "Persona Desativada!",
          description: "Você agora verá todos os imóveis recomendados.",
        });
      } catch (error) {
        console.error("Error disabling persona:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível desativar a persona.",
        });
      }
    };

    const isLoading = !isReady || areOpportunitiesLoading || isPersonaLoading;

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

    useEffect(() => {
      setCurrentDate(format(new Date(), "dd 'de' MMM, yyyy", { locale: ptBR }));
    }, []);

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-neutral-dark">Olá, {user?.displayName?.split(' ')[0]}! 👋</h1>
                    <p className="text-gray-500">Encontramos novas oportunidades baseadas no seu perfil hoje.</p>
                </div>
                <div className="bg-neutral-light p-4 pr-6 rounded-2xl flex items-center gap-4 border border-gray-100">
                    <div className="size-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Seu Perfil Atual</div>
                        <div className="flex items-center gap-3">
                            {isLoading ? (
                                <Skeleton className="h-6 w-32" />
                            ) : (
                                <span className="font-bold text-neutral-dark">{selectedPersona?.name || 'Geral (Todos os Imóveis)'}</span>
                            )}
                            <Link className="text-xs font-bold text-primary bg-neutral-dark px-2 py-0.5 rounded hover:bg-black transition-colors" href="/radar/dashboard/personas">
                                {selectedPersonaId ? 'EDITAR' : 'DEFINIR'}
                            </Link>
                            {selectedPersonaId && (
                                <button onClick={handleDisablePersona} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors" title="Desativar Persona">
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        Novas Oportunidades para Você
                    </h2>
                    <div className="flex gap-2">
                        <button className="size-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-neutral-light transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="size-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-neutral-light transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                   {isLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="min-w-[340px] h-[212px] rounded-3xl" />
                     ))
                   ) : sortedOpportunities && sortedOpportunities.length > 0 ? (
                        sortedOpportunities.map(opp => (
                        <Link href={`/imoveis/${opp.informacoesbasicas.slug || opp.id}`} key={opp.id} className="min-w-[340px] group relative bg-neutral-dark rounded-3xl overflow-hidden aspect-[16/10]">
                            <Image alt={opp.informacoesbasicas.nome} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" src={opp.midia?.[0] || `https://picsum.photos/seed/${opp.id}/400/250`} width={400} height={250} />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-transparent to-transparent"></div>
                            <div className="absolute top-4 left-4">
                                <span className="bg-primary text-neutral-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">98% Match</span>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="text-white font-bold text-lg mb-1">{opp.informacoesbasicas.nome}</div>
                                <div className="text-gray-300 text-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    {opp.localizacao.bairro}, {opp.localizacao.cidade}
                                </div>
                            </div>
                            <button className="absolute bottom-6 right-6 size-10 bg-primary rounded-full flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined text-neutral-dark">arrow_forward</span>
                            </button>
                        </Link>
                    ))
                   ) : (
                    <div className="w-full text-center py-10 text-gray-500">
                        <p>Nenhuma oportunidade encontrada para seu perfil. <Link href="/radar/dashboard/personas" className="text-primary font-bold underline">Altere sua persona.</Link></p>
                    </div>
                   )}
                </div>
            </section>
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold">Imóveis Recomendados para sua persona</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Filtrar por:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px] text-sm font-semibold border-gray-200 bg-neutral-light rounded-lg focus:ring-primary focus:ring-1">
                                <SelectValue placeholder="Ordenar por..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="match_desc">Maior Match</SelectItem>
                                <SelectItem value="price_asc">Menor Preço</SelectItem>
                                <SelectItem value="price_desc">Maior Preço</SelectItem>
                                <SelectItem value="recent">Mais Recentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="flex bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-soft">
                                <Skeleton className="w-1/3 min-w-[200px] aspect-[4/3]" />
                                <div className="p-5 flex-1 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="pt-4 border-t mt-4 space-y-3">
                                        <Skeleton className="h-4 w-full" />
                                        <div className="flex justify-between">
                                            <Skeleton className="h-8 w-24" />
                                            <Skeleton className="size-9 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {paginatedOpportunities?.map(rec => {
                     const isSaved = savedPropertyIds.includes(rec.id);
                     return (
                        <Link href={`/imoveis/${rec.informacoesbasicas.slug || rec.id}`} key={rec.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-soft transition-all duration-300 flex">
                            <div className="relative w-1/3 min-w-[200px] aspect-[4/3] overflow-hidden">
                                <Image alt={rec.informacoesbasicas.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={rec.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/300'} fill />
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-neutral-dark group-hover:text-primary transition-colors truncate pr-8">{rec.informacoesbasicas.nome}</h3>
                                        {rec.informacoesbasicas.valor && <span className="font-bold text-neutral-dark whitespace-nowrap">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.informacoesbasicas.valor)}</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        {rec.localizacao.bairro}, {rec.localizacao.cidade}
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-gray-100 space-y-3">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">bed</span> {formatQuartos(rec.caracteristicasimovel.quartos)} Dorms</span>
                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">straighten</span> {rec.caracteristicasimovel.tamanho}</span>
                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">directions_car</span> {rec.caracteristicasimovel.vagas} Vagas</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="bg-primary/20 text-neutral-dark text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                                            90% MATCH
                                        </div>
                                        <button onClick={(e) => handleRadarClick(e, rec.id)} className={cn("size-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors shadow-sm", isSaved && "text-primary bg-primary/20")}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>radar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                   )})}
                </div>
                )}
                 {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                variant="outline"
                            >
                                Anterior
                            </Button>
                            <span className="text-sm font-medium text-gray-500">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                variant="outline"
                            >
                                Próxima
                            </Button>
                        </div>
                    </div>
                )}
                 <div className="bg-white rounded-2xl p-6 text-center my-8 border border-gray-100 shadow-soft mt-12">
                    <h3 className="text-xl font-bold text-neutral-dark mb-2">Quer falar com um especialista que entende exatamente seu perfil?</h3>
                    <p className="text-gray-500 mb-6 max-w-lg mx-auto">Nossos corretores parceiros estão prontos para encontrar o imóvel ideal para você, baseado na sua persona.</p>
                    <Button>
                        <span className="material-symbols-outlined mr-2">support_agent</span>
                        Falar com um Especialista
                    </Button>
                </div>
            </section>
        </>
    )

    
}

    