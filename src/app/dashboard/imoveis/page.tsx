'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  useAuthContext,
  setDocumentNonBlocking
} from '@/firebase';
import {
  collection,
  query,
  doc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Building2,
  Loader2,
  BookmarkPlus,
  BookmarkCheck,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

const ALL_BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
  informacoesbasicas?: {
    nome?: string;
    status?: string;
    valor?: number;
    salePrice?: number;
    slug?: string;
  };
  basicInfo?: {
    title?: string;
  };
  title?: string;
  nome?: string;
  localizacao?: {
    cidade?: string;
    estado?: string;
    bairro?: string;
  };
  location?: {
    city?: string;
    state?: string;
  };
  midia?: string[];
  media?: string[];
};

type Constructor = {
  id: string;
  name: string;
};

type Portfolio = {
  propertyIds?: string[];
};

export default function ImoveisPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedState]);

  // Fetch constructor properties
  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties')) : null),
    [firestore]
  );
  const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);

  // Fetch constructors to display names
  const constructorsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'constructors')) : null),
    [firestore]
  );
  const { data: constructors } = useCollection<Constructor>(constructorsQuery);

  // Fetch broker portfolio to track added properties
  const portfolioDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'portfolios', user.uid) : null),
    [firestore, user]
  );
  const { data: portfolioDoc, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);

  const constructorMap = useMemo(() => {
    if (!constructors) return {};
    return constructors.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as Record<string, string>);
  }, [constructors]);

  const portfolioSet = useMemo(() => {
    return new Set(portfolioDoc?.propertyIds || []);
  }, [portfolioDoc]);

  const getPropertyName = (p: Property) => {
    return p.informacoesbasicas?.nome || p.basicInfo?.title || p.title || p.nome || 'Imóvel sem título';
  };

  const getPropertyLocation = (p: Property) => {
    if (p.localizacao) {
      const city = p.localizacao.cidade || '';
      const state = p.localizacao.estado || '';
      return city && state ? `${city}, ${state}` : city || state || 'Localização não informada';
    }
    if (p.location) {
      const city = p.location.city || '';
      const state = p.location.state || '';
      return city && state ? `${city}, ${state}` : city || state || 'Localização não informada';
    }
    return 'Localização não informada';
  };

  const getPropertyImage = (p: Property) => {
    return p.midia?.[0] || p.media?.[0] || 'https://placehold.co/400x300?text=Sem+Foto';
  };

  const handleTogglePortfolio = async (property: Property) => {
    if (!firestore || !user?.uid) {
      toast({
        title: "Atenção",
        description: "Você precisa estar conectado para adicionar imóveis à sua carteira.",
        variant: "destructive"
      });
      return;
    }

    const inPortfolio = portfolioSet.has(property.id);
    const portfolioRef = doc(firestore, 'portfolios', user.uid);
    const propName = getPropertyName(property);

    try {
      if (inPortfolio) {
        await setDocumentNonBlocking(portfolioRef, { propertyIds: arrayRemove(property.id) }, { merge: true });
        toast({
          title: "Removido da Carteira",
          description: `"${propName}" foi removido da sua carteira.`
        });
      } else {
        await setDocumentNonBlocking(portfolioRef, { propertyIds: arrayUnion(property.id) }, { merge: true });
        toast({
          title: "Adicionado à Carteira",
          description: `"${propName}" foi adicionado à sua carteira de exibição!`
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua carteira.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (propertyToDelete && firestore) {
      try {
        await deleteDoc(doc(firestore, 'properties', propertyToDelete.id));
        toast({
          title: 'Imóvel excluído',
          description: `O imóvel "${getPropertyName(propertyToDelete)}" foi removido com sucesso.`,
        });
      } catch (error) {
        toast({
          title: 'Erro ao excluir imóvel',
          description: 'Ocorreu um erro ao tentar remover o imóvel. Tente novamente.',
          variant: 'destructive',
        });
      }
      setPropertyToDelete(null);
    }
  };

  const availableStates = useMemo(() => {
    const propertyStateCounts: Record<string, number> = {};

    if (properties) {
      properties.forEach((p) => {
        const rawState = (p.localizacao?.estado || p.location?.state || '').trim();
        if (rawState) {
          propertyStateCounts[rawState] = (propertyStateCounts[rawState] || 0) + 1;
        }
      });
    }

    const optionsMap = new Map<string, { value: string; label: string; count: number }>();

    ALL_BRAZILIAN_STATES.forEach(({ uf, name }) => {
      let count = 0;
      Object.entries(propertyStateCounts).forEach(([rawState, c]) => {
        const rLower = rawState.toLowerCase();
        if (rLower === uf.toLowerCase() || rLower === name.toLowerCase()) {
          count += c;
        }
      });

      optionsMap.set(uf, {
        value: uf,
        label: count > 0 ? `${name} (${uf}) • ${count} ${count === 1 ? 'imóvel' : 'imóveis'}` : `${name} (${uf})`,
        count,
      });
    });

    Object.entries(propertyStateCounts).forEach(([rawState, count]) => {
      const rawLower = rawState.toLowerCase();
      const isStandard = ALL_BRAZILIAN_STATES.some(
        (s) => s.uf.toLowerCase() === rawLower || s.name.toLowerCase() === rawLower
      );
      if (!isStandard) {
        optionsMap.set(rawState, {
          value: rawState,
          label: `${rawState} • ${count} ${count === 1 ? 'imóvel' : 'imóveis'}`,
          count,
        });
      }
    });

    return Array.from(optionsMap.values());
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    return properties.filter((p) => {
      const name = getPropertyName(p).toLowerCase();
      const location = getPropertyLocation(p).toLowerCase();
      const constructorName = (constructorMap[p.builderId || ''] || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        name.includes(search) ||
        location.includes(search) ||
        constructorName.includes(search);

      let matchesState = true;
      if (selectedState) {
        const selLower = selectedState.toLowerCase().trim();
        const rawState = (p.localizacao?.estado || p.location?.state || '').toLowerCase().trim();

        const matchedStandard = ALL_BRAZILIAN_STATES.find(
          (s) => s.uf.toLowerCase() === selLower || s.name.toLowerCase() === selLower
        );

        if (matchedStandard) {
          const ufLower = matchedStandard.uf.toLowerCase();
          const nameLower = matchedStandard.name.toLowerCase();
          matchesState =
            rawState === ufLower ||
            rawState === nameLower ||
            rawState.includes(ufLower) ||
            rawState.includes(nameLower);
        } else {
          matchesState = rawState === selLower || rawState.includes(selLower);
        }
      }

      return matchesSearch && matchesState;
    });
  }, [properties, searchTerm, selectedState, constructorMap]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProperties.length / ITEMS_PER_PAGE));
  }, [filteredProperties]);

  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  const isLoading = !isReady || arePropertiesLoading || isPortfolioLoading;

  if (isLoading) {
    return (
      <div className="p-10 text-center italic text-slate-400 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <Loader2 className="animate-spin size-8 text-primary" />
        <p className="text-sm font-medium">Carregando imóveis de construtoras...</p>
      </div>
    );
  }

  const isBroker = userProfile?.userType === 'broker' || !userProfile?.userType;
  const isAdminOrConstructor = userProfile?.userType === 'admin' || userProfile?.userType === 'constructor';

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1 uppercase">Imóveis de Construtoras</h1>
          <p className="text-slate-500">
            Explore os lançamentos e empreendimentos disponíveis para adicionar à sua carteira de vendas.
          </p>
        </div>
        {isAdminOrConstructor && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-sm">
            <Link href="/dashboard/imoveis/nova">
              <Plus className="mr-2 size-4" />
              Cadastrar Imóvel
            </Link>
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Search className="size-4 text-primary" />
          Filtros de Busca
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input
                className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-slate-400"
                placeholder="Buscar por nome do empreendimento, cidade ou construtora..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer font-medium"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">Todos os Estados</option>
              {availableStates.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="px-6 py-4 font-bold uppercase text-[10px]">Empreendimento</TableHead>
              <TableHead className="px-6 py-4 font-bold uppercase text-[10px]">Construtora</TableHead>
              <TableHead className="px-6 py-4 font-bold uppercase text-[10px]">Status</TableHead>
              <TableHead className="px-6 py-4 font-bold uppercase text-[10px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProperties.length > 0 ? (
              paginatedProperties.map((p) => {
                const inPortfolio = portfolioSet.has(p.id);
                const constructorName = p.builderId ? (constructorMap[p.builderId] || 'Construtora Parceira') : 'Construtora';
                const status = p.informacoesbasicas?.status || 'Lançamento';

                return (
                  <TableRow key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                          <Image
                            src={getPropertyImage(p)}
                            alt={getPropertyName(p)}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase tracking-tight">{getPropertyName(p)}</p>
                          <p className="text-slate-400 text-xs">{getPropertyLocation(p)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Building2 className="size-3 text-slate-400" />
                        {constructorName}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        status === 'Lançamento' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isBroker && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePortfolio(p)}
                            className={inPortfolio 
                              ? "border-emerald-300 text-black bg-emerald-50 hover:bg-emerald-100 font-bold rounded-xl h-9 text-xs gap-1.5 shadow-sm"
                              : "border-slate-300 text-black bg-white hover:bg-slate-100 font-bold rounded-xl h-9 text-xs gap-1.5 shadow-sm"
                            }
                          >
                            {inPortfolio ? (
                              <>
                                <BookmarkCheck className="size-3.5 text-black" />
                                <span className="text-black font-bold">Na Carteira</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="size-3.5 text-black" />
                                <span className="text-black font-bold">Adicionar à Carteira</span>
                              </>
                            )}
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="icon" className="size-9 text-slate-400 hover:text-primary rounded-xl">
                          <Link href={`/dashboard/imoveis/${p.id}`} title="Ver Detalhes">
                            <ExternalLink size={16} />
                          </Link>
                        </Button>
                        {isAdminOrConstructor && (
                          <>
                            <Button asChild variant="ghost" size="icon" className="size-9 text-slate-400 hover:text-primary rounded-xl">
                              <Link href={`/dashboard/imoveis/editar/${p.id}`} title="Editar">
                                <Edit size={16} />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 text-slate-400 hover:text-red-500 rounded-xl"
                              onClick={() => setPropertyToDelete(p)}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <Building className="size-10 text-slate-300" />
                    <p className="font-bold text-slate-700 text-base">Nenhum imóvel de construtora encontrado</p>
                    <p className="text-xs text-slate-400">
                      {searchTerm ? 'Tente alterar os termos da sua busca.' : 'Novos imóveis cadastrados por construtoras parceiras aparecerão aqui.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredProperties.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
          <p className="text-xs font-semibold text-slate-500">
            Exibindo <span className="text-slate-900 font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="text-slate-900 font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProperties.length)}</span> de <span className="text-slate-900 font-bold">{filteredProperties.length}</span> imóveis
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-9 px-3 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 gap-1"
            >
              <ChevronLeft className="size-3.5" />
              Anterior
            </Button>
            <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-9 px-3 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 gap-1"
            >
              Próxima
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!propertyToDelete} onOpenChange={() => setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e removerá o imóvel &quot;{getPropertyName(propertyToDelete || {})}&quot; do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

