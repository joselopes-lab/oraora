'use client';

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home, PlusCircle, FilePen, Trash2, X, Upload, CheckCircle, XCircle, ImageOff, FilterX, ArrowLeft, ArrowRight, Sparkles, Eye, MousePointerClick, EyeOff, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getStates, type State, type City } from '@/services/location';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip"
import { Checkbox } from '@/components/ui/checkbox';
import { usePropertyActions } from '@/hooks/use-property-actions';
import PropertyDetailSheet from '@/components/property-detail-sheet';


interface Builder {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  state: string;
  city: string;
}

// Based on the provided JSON
export interface Property {
  id: string;
  slug: string;
  builderId: string;
  sellerId?: string; // Add this line
  isVisibleOnSite: boolean;
  views?: number;
  clicks?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  youtubeVideoUrl?: string;
  personaIds?: string[];
  detalhesAvulsos?: {
    sistemaVendas?: 'Não Informado' | 'Porteira Fechada' | 'Valor Padrão';
    anoConstrucao?: number;
    construtoraAvulsa?: string;
    disponivelVenda?: boolean;
    torre?: string;
    bloco?: string;
    andar?: string;
    numeroAndares?: number;
  };
  informacoesbasicas: {
    nome: string;
    slogan?: string;
    descricao: string;
    status?: string;
    previsaoentrega?: string;
    valor?: number;
  };
  localizacao: {
    googleMapsLink?: string;
    googleStreetViewLink?: string;
    cidade?: string;
    estado?: string;
    bairro?: string;
  };
  caracteristicasimovel: {
    tamanho?: string;
    tipo?: string;
    unidades: {
      quartos?: string[] | string;
      vagasgaragem?: string;
    };
  };
  areascomuns: string[];
  proximidades?: string[];
  statusobra: {
    contencao?: string;
    escavacao?: string;
    pavimentacao?: string;
    fundacao?: string;
    portasejanelas?: string;
    pintura?: string;
    fachada?: string;
    alvenaria?: string;
    revestimentointerno?: string;
    forroegesso?: string;
    loucasemetais?: string;
    estrutura?: string;
    instalacoes?: string;
    total?: string;
  };
  documentacao: {
    memorialdescritivo?: string;
    alvaraconstrucao?: string;
    bookimovel?: string;
    registroincorporacao?: string;
    tabelaprecos?: string;
  };
  midia: string[];
  contato: {
    construtora: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    redessociais?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
    };
  };
}

const PROPERTIES_PER_PAGE = 10;

export default function PropertiesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    selectedProperty, 
    isSheetOpen, 
    handleViewDetails, 
    setIsSheetOpen,
  } = usePropertyActions();

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterBuilder, setFilterBuilder] = useState('all');
  const [filterMissingPrice, setFilterMissingPrice] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // States for dynamic array inputs
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  
  // Price modal states
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [propertyToEditPrice, setPropertyToEditPrice] = useState<Property | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

   useEffect(() => {
    async function handleUrlParams() {
      const deleteId = searchParams.get('delete');
      const statusFilter = searchParams.get('status');
      const stateFilter = searchParams.get('estado');
      
      if (deleteId) {
        const propDoc = await getDoc(doc(db, 'properties', deleteId));
         if (propDoc.exists()) {
          const propData = { id: propDoc.id, ...propDoc.data() } as Property;
          openDeleteAlert(propData);
        }
      }
      
      if (statusFilter === 'inactive') {
        setFilterStatus('inactive');
      }
      if (stateFilter) {
        setFilterState(stateFilter);
      }
    }
    handleUrlParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setAllProperties(data);
        setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar imóveis: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar imóveis', description: error.message });
        setIsLoading(false);
    });

    const unsubscribeBuilders = onSnapshot(collection(db, 'builders'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder));
        setBuilders(data);
    });

    async function loadStates() {
      setIsLoadingStates(true);
      const statesData = await getStates();
      setStates(statesData);
      setIsLoadingStates(false);
    }
    loadStates();

    return () => {
      unsubscribeProps();
      unsubscribeBuilders();
    };
  }, [toast]);

  // Filtering Logic
  useEffect(() => {
      let result = allProperties;

      if (searchTerm) {
        result = result.filter(p => 
            p.informacoesbasicas.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterState && filterState !== 'all') {
          result = result.filter(p => p.localizacao.estado === filterState);
      }
      if (filterBuilder && filterBuilder !== 'all') {
          result = result.filter(p => p.builderId === filterBuilder);
      }
      if (filterMissingPrice) {
          result = result.filter(p => !p.informacoesbasicas.valor);
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') {
             result = result.filter(p => p.isVisibleOnSite === true);
        } else if (filterStatus === 'inactive') {
             result = result.filter(p => !p.isVisibleOnSite);
        }
      }
      setFilteredProperties(result);
  }, [searchTerm, filterState, filterBuilder, filterMissingPrice, filterStatus, allProperties]);

  const filteredBuildersForSelect = useMemo(() => {
    let filtered = builders;
    if (filterState && filterState !== 'all') {
        filtered = filtered.filter(b => b.state === filterState);
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [builders, filterState]);

  useEffect(() => {
    setCurrentPage(1); // Reset page only when filters change
  }, [searchTerm, filterState, filterBuilder, filterMissingPrice, filterStatus]);
  
  // Pagination Logic
  const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
  const paginatedProperties = useMemo(() => {
      const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
      const endIndex = startIndex + PROPERTIES_PER_PAGE;
      return filteredProperties.slice(startIndex, endIndex);
  }, [filteredProperties, currentPage]);


  const resetFilters = () => {
      setSearchTerm('');
      setFilterState('all');
      setFilterBuilder('all');
      setFilterMissingPrice(false);
      setFilterStatus('all');
      router.push('/dashboard/properties');
  };
  
  const openDeleteAlert = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeleteAlertOpen(true);
  };
  
  const closeDeleteAlert = () => {
    setPropertyToDelete(null);
    setIsDeleteAlertOpen(false);
    router.push('/dashboard/properties');
  }

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteDoc(doc(db, 'properties', propertyToDelete.id));
      toast({ title: 'Imóvel Deletado' });
      closeDeleteAlert();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

   const handleVisibilityToggle = async (property: Property) => {
    const propertyRef = doc(db, 'properties', property.id);
    const newVisibility = !property.isVisibleOnSite;
    try {
        await updateDoc(propertyRef, { isVisibleOnSite: newVisibility });
        setAllProperties(prevProps => 
            prevProps.map(p => 
                p.id === property.id ? { ...p, isVisibleOnSite: newVisibility } : p
            )
        );
        toast({
            title: 'Visibilidade Atualizada',
            description: `${property.informacoesbasicas.nome} agora está ${newVisibility ? 'visível' : 'oculto'} no site.`
        })
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Falha na Atualização', description: 'Não foi possível alterar a visibilidade.' });
    }
  };
  
  const getBuilderName = (builderId: string) => builders.find(b => b.id === builderId)?.name || 'Desconhecida';
  
  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return "Não definido";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const openPriceModal = (property: Property) => {
    setPropertyToEditPrice(property);
    setNewPrice(property.informacoesbasicas.valor?.toString() || '');
    setIsPriceModalOpen(true);
  };
  
  const handleSavePrice = async () => {
    if (!propertyToEditPrice) return;
    
    setIsSavingPrice(true);
    const propertyRef = doc(db, 'properties', propertyToEditPrice.id);
    const priceAsNumber = newPrice === '' ? null : Number(newPrice);
    
    try {
        await updateDoc(propertyRef, {
            'informacoesbasicas.valor': priceAsNumber,
        });
        
        setAllProperties(prevProps => 
            prevProps.map(p => 
                p.id === propertyToEditPrice.id 
                ? { ...p, informacoesbasicas: { ...p.informacoesbasicas, valor: priceAsNumber as number } }
                : p
            )
        );

        toast({ title: 'Preço Atualizado!', description: 'O valor do imóvel foi salvo.' });
        setIsPriceModalOpen(false);
        setPropertyToEditPrice(null);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Falha ao Salvar', description: 'Não foi possível atualizar o preço.' });
    } finally {
        setIsSavingPrice(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Home /> Imóveis</CardTitle>
            <CardDescription>Cadastre e gerencie os imóveis de cada construtora.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => router.push('?import=true')}>
              <Upload className="h-4 w-4" /> Importar Imóveis
            </Button>
            <Button size="sm" className="gap-1" onClick={() => router.push('/dashboard/properties/edit/new')}>
              <PlusCircle className="h-4 w-4" /> Cadastrar Imóvel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                  <div className="relative lg:col-span-2">
                      <Label htmlFor="search-name" className="sr-only">Buscar por nome</Label>
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          id="search-name"
                          placeholder="Buscar pelo nome do empreendimento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                      />
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs">Estado</Label>
                      <Select value={filterState} onValueChange={setFilterState} disabled={isLoadingStates}>
                          <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos os Estados</SelectItem>
                              {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs">Construtora</Label>
                      <Select value={filterBuilder} onValueChange={setFilterBuilder}>
                          <SelectTrigger><SelectValue placeholder="Filtrar por construtora..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todas as Construtoras</SelectItem>
                              {filteredBuildersForSelect.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs">Status no Site</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger><SelectValue placeholder="Filtrar por status..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="active">Ativos</SelectItem>
                              <SelectItem value="inactive">Inativos</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="flex items-center space-x-2 pt-5">
                        <Checkbox id="filter-missing-price" checked={filterMissingPrice} onCheckedChange={(checked) => setFilterMissingPrice(!!checked)} />
                        <Label htmlFor="filter-missing-price" className="text-sm font-normal">
                            Sem valor
                        </Label>
                    </div>
                  <Button variant="outline" onClick={resetFilters} className="col-start-1 lg:col-start-auto">
                      <FilterX className="mr-2 h-4 w-4"/>
                      Limpar Filtros
                  </Button>
              </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome do Imóvel</TableHead>
                  <TableHead>Métricas</TableHead>
                  <TableHead>Construtora</TableHead>
                  <TableHead>Visível</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProperties.length > 0 ? paginatedProperties.map((prop) => {
                  const featuredImage = prop.midia && prop.midia.length > 0 ? prop.midia[0] : null;
                  const hasSeo = prop.seoTitle && prop.seoDescription && prop.seoKeywords;
                  return (
                    <TableRow key={prop.id}>
                       <TableCell>
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            {featuredImage ? (
                              <Image 
                                src={featuredImage} 
                                alt={prop.informacoesbasicas.nome} 
                                width={64} 
                                height={64} 
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <ImageOff className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                           <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className={`h-2.5 w-2.5 rounded-full ${hasSeo ? 'bg-green-500' : 'bg-red-500'}`} />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{hasSeo ? 'SEO Preenchido' : 'SEO Pendente'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          <span onClick={() => handleViewDetails(prop)} className="cursor-pointer hover:underline">
                              {prop.informacoesbasicas.nome}
                          </span>
                        </div>
                         <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span>{formatPrice(prop.informacoesbasicas.valor)}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openPriceModal(prop)}>
                                <FilePen className="h-3 w-3" />
                                <span className="sr-only">Editar Preço</span>
                            </Button>
                          </div>
                      </TableCell>
                       <TableCell>
                          <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-sm">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  <span>{prop.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                  <span>{prop.clicks || 0}</span>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>{getBuilderName(prop.builderId)}</TableCell>
                      <TableCell>
                          <Switch
                            checked={prop.isVisibleOnSite}
                            onCheckedChange={() => handleVisibilityToggle(prop)}
                            aria-label="Visibilidade no site"
                          />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/properties/edit/${prop.id}`)}><FilePen className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(prop)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum imóvel encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                    <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                    </Button>
                    <span className="text-sm font-medium">
                        Página {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Próxima
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(isOpen) => { if (!isOpen) closeDeleteAlert()}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o imóvel {' '}
              <strong>{propertyToDelete?.informacoesbasicas.nome}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteAlert}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Edit Dialog */}
      <AlertDialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Editar Preço do Imóvel</AlertDialogTitle>
                  <AlertDialogDescription>
                      Alterando o valor para: <strong>{propertyToEditPrice?.informacoesbasicas.nome}</strong>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="price-input">Valor (R$)</Label>
                      <Input 
                          id="price-input" 
                          type="number" 
                          placeholder="Ex: 550000.00"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          disabled={isSavingPrice}
                      />
                       <p className="text-xs text-muted-foreground">Deixe em branco para remover o valor (exibirá "Sob consulta").</p>
                  </div>
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsPriceModalOpen(false)} disabled={isSavingPrice}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSavePrice} disabled={isSavingPrice}>
                      {isSavingPrice ? <Loader2 className="animate-spin" /> : "Salvar Preço"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {selectedProperty && (
        <PropertyDetailSheet
            property={selectedProperty}
            brokerId={''} 
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            source="admin-panel"
        />
       )}
    </>
  );
}
