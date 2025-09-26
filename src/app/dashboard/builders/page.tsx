
'use client';

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Loader2, Building2, PlusCircle, FilePen, Trash2, ImageOff, Download, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export interface Builder {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  state: string;
  city: string;
  instagram: string;
  phone: string;
  whatsapp: string;
  email: string;
  isVisibleOnSite: boolean;
}

const initialState: Omit<Builder, 'id'> = {
  name: '',
  logoUrl: '',
  address: '',
  state: '',
  city: '',
  instagram: '',
  phone: '',
  whatsapp: '',
  email: '',
  isVisibleOnSite: true,
};

const BUILDERS_PER_PAGE = 10;

export default function BuildersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allBuilders, setAllBuilders] = useState<Builder[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBuilder, setCurrentBuilder] = useState<Partial<Builder>>(initialState);
  
  // Form State
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Alert State
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [builderToDelete, setBuilderToDelete] = useState<Builder | null>(null);
  
  // Pagination and Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');


   useEffect(() => {
    async function handleUrlParams() {
      const editId = searchParams.get('edit');
      if (editId) {
        if (editId === 'new') {
          openDialog(null);
        } else {
          const docRef = doc(db, 'builders', editId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            openDialog({ id: docSnap.id, ...docSnap.data() } as Builder);
          }
        }
      }
    }
    handleUrlParams();
  }, [searchParams]);

  useEffect(() => {
    // Fetch builders from Firestore
    const unsubscribe = onSnapshot(collection(db, 'builders'), (snapshot) => {
        const buildersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder));
        setAllBuilders(buildersData);
        setIsLoadingData(false);
    }, (error) => {
        console.error("Erro ao buscar construtoras: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar construtoras', description: error.message });
        setIsLoadingData(false);
    });
    
    // Fetch states for the form
    async function loadStates() {
      setIsLoadingStates(true);
      const statesData = await getStates();
      setStates(statesData);
      setIsLoadingStates(false);
    }
    loadStates();

    return () => unsubscribe();
  }, [toast]);

  const filteredBuilders = useMemo(() => {
    return allBuilders
      .filter(builder => {
        const matchesState = selectedState === 'all' || builder.state === selectedState;
        const matchesSearch = builder.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesState && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allBuilders, searchTerm, selectedState]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredBuilders]);
  
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allBuilders.length };
    allBuilders.forEach(builder => {
      counts[builder.state] = (counts[builder.state] || 0) + 1;
    });
    return counts;
  }, [allBuilders]);


  const handleStateChange = async (stateAcronym: string, resetCity = true) => {
    setCurrentBuilder((prev) => ({ 
      ...prev, 
      state: stateAcronym, 
      ...(resetCity && { city: '' })
    }));
    
    setIsLoadingCities(true);
    setCities([]);
    if(stateAcronym){
      const citiesData = await getCitiesByState(stateAcronym);
      setCities(citiesData);
    }
    setIsLoadingCities(false);
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentBuilder((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: 'state' | 'city', value: string) => {
    if (id === 'state') {
        handleStateChange(value, true);
    } else {
        setCurrentBuilder(prev => ({...prev, [id]: value}));
    }
  }

  const openDialog = (builder: Builder | null = null) => {
    if (builder) {
        setIsEditing(true);
        setCurrentBuilder(builder);
        if(builder.state) {
            handleStateChange(builder.state, false);
        }
    } else {
        setIsEditing(false);
        setCurrentBuilder(initialState);
        setCities([]);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentBuilder({});
    router.push('/dashboard/builders');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentBuilder.name || !currentBuilder.state || !currentBuilder.city) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome, estado e cidade são obrigatórios.' });
      return;
    }
    
    setIsSubmitting(true);
    
    const builderData = { ...currentBuilder };
    delete builderData.id;

    try {
      if(isEditing && currentBuilder.id) {
        const builderRef = doc(db, 'builders', currentBuilder.id);
        await updateDoc(builderRef, builderData);
        toast({ title: 'Construtora Atualizada!', description: 'Os dados da construtora foram atualizados.' });
      } else {
        await addDoc(collection(db, 'builders'), { ...builderData, createdAt: new Date() });
        toast({ title: 'Construtora Salva!', description: 'A nova construtora foi cadastrada com sucesso.' });
      }
      closeDialog();
    } catch (error: any) {
      console.error("Error saving builder: ", error);
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteAlert = (builder: Builder) => {
    setBuilderToDelete(builder);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteBuilder = async () => {
    if (!builderToDelete) return;
    try {
      await deleteDoc(doc(db, 'builders', builderToDelete.id));
      toast({ title: 'Construtora Deletada', description: 'O registro foi removido com sucesso.' });
      setIsDeleteAlertOpen(false);
      setBuilderToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  const handleVisibilityToggle = async (builder: Builder) => {
    const builderRef = doc(db, 'builders', builder.id);
    try {
        await updateDoc(builderRef, { isVisibleOnSite: !builder.isVisibleOnSite });
        toast({
            title: 'Visibilidade Atualizada',
            description: `${builder.name} agora está ${!builder.isVisibleOnSite ? 'visível' : 'oculta'} no site.`
        })
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Falha na Atualização', description: 'Não foi possível alterar a visibilidade.' });
    }
  };

  const totalPages = Math.ceil(filteredBuilders.length / BUILDERS_PER_PAGE);
  const paginatedBuilders = filteredBuilders.slice(
      (currentPage - 1) * BUILDERS_PER_PAGE,
      currentPage * BUILDERS_PER_PAGE
  );

  return (
    <>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Construtoras por Estado</CardTitle>
                <CardDescription>Resumo de construtoras cadastradas em cada estado.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingData ? (
                    <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {states.filter(s => stateCounts[s.sigla]).map(state => (
                            <div key={state.id} className="p-4 border rounded-lg text-center">
                                <p className="font-bold text-2xl">{stateCounts[state.sigla]}</p>
                                <p className="text-sm text-muted-foreground">{state.nome}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                <Building2 />
                Construtoras Cadastradas ({filteredBuilders.length})
                </CardTitle>
                <CardDescription>Visualize, crie e gerencie as construtoras.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                 <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nome..." 
                        className="pl-8 w-full sm:w-auto"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Estados ({stateCounts.all || 0})</SelectItem>
                        {states.filter(s => stateCounts[s.sigla]).map(state => (
                            <SelectItem key={state.id} value={state.sigla}>
                                {state.nome} ({stateCounts[state.sigla]})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={() => openDialog()}>
                    <PlusCircle className="h-4 w-4" />
                    Cadastrar
                </Button>
            </div>
            </CardHeader>
            <CardContent>
            {isLoadingData ? (
                <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Visível no Site</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedBuilders.map((builder) => (
                            <TableRow key={builder.id}>
                                <TableCell>
                                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                        {builder.logoUrl ? (
                                            <Image src={builder.logoUrl} alt={builder.name} width={48} height={48} className="object-contain rounded-md" />
                                        ) : (
                                            <ImageOff className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                <Link href={`/dashboard/builders/${builder.id}`} className="hover:underline">
                                    {builder.name}
                                </Link>
                                </TableCell>
                                <TableCell>{builder.city} / {builder.state}</TableCell>
                                <TableCell>{builder.email || builder.phone}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={builder.isVisibleOnSite}
                                        onCheckedChange={() => handleVisibilityToggle(builder)}
                                        aria-label="Visibilidade no site"
                                    />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDialog(builder)}
                                    >
                                    <FilePen className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => openDeleteAlert(builder)}
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Deletar</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            </CardContent>
            {totalPages > 1 && (
            <CardFooter className="flex justify-center items-center gap-4 pt-6 border-t">
                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                </Button>
                <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                </span>
                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                >
                    Próxima
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
            )}
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) closeDialog(); }}>
          <DialogContent className="sm:max-w-3xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Construtora' : 'Cadastrar Nova Construtora'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Atualize os dados da construtora.' : 'Preencha os dados para cadastrar uma nova construtora.'}</DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Construtora</Label>
                        <Input id="name" value={currentBuilder.name || ''} onChange={handleInputChange} placeholder="Ex: Construções & Cia" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="logoUrl">URL do Logo</Label>
                        <Input id="logoUrl" value={currentBuilder.logoUrl || ''} onChange={handleInputChange} placeholder="https://exemplo.com/logo.png" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" value={currentBuilder.address || ''} onChange={handleInputChange} placeholder="Ex: Rua das Obras, 123" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Select onValueChange={(value) => handleSelectChange('state', value)} value={currentBuilder.state || ''} required disabled={isLoadingStates}>
                            <SelectTrigger id="state">
                                <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione um estado'} />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map((s) => (
                                <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Select onValueChange={(value) => handleSelectChange('city', value)} value={currentBuilder.city || ''} required disabled={!currentBuilder.state || isLoadingCities}>
                            <SelectTrigger id="city">
                                <SelectValue placeholder={
                                isLoadingCities ? 'Carregando...' :
                                !currentBuilder.state ? 'Selecione um estado' :
                                'Selecione uma cidade'
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map((c) => (
                                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" type="tel" value={currentBuilder.phone || ''} onChange={handleInputChange} placeholder="(99) 9999-9999" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input id="whatsapp" type="tel" value={currentBuilder.whatsapp || ''} onChange={handleInputChange} placeholder="(99) 99999-9999" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={currentBuilder.email || ''} onChange={handleInputChange} placeholder="contato@construtora.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input id="instagram" value={currentBuilder.instagram || ''} onChange={handleInputChange} placeholder="@construtora" />
                    </div>
                </div>

                 <div className="flex items-center space-x-2 pt-4">
                    <Switch id="isVisibleOnSite" checked={currentBuilder.isVisibleOnSite} onCheckedChange={(checked) => setCurrentBuilder(prev => ({...prev, isVisibleOnSite: checked}))} />
                    <Label htmlFor="isVisibleOnSite">Visível no site público</Label>
                 </div>

                <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}
                    </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente a construtora {' '}
              <strong>{builderToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBuilder} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
