
'use client';

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home, PlusCircle, FilePen, Trash2, X, ImageOff, ArrowLeft, ArrowRight, Sparkles, UploadCloud } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { getStates, getCitiesByState, getNeighborhoodsByCity, type State, type City, type Neighborhood } from '@/services/location';
import { handleGeneratePropertySeo } from '@/app/dashboard/properties/actions';
import { type Property } from '@/app/dashboard/properties/page';
import { type Client } from '@/app/corretor/clientes/page';
import { usePropertyActions } from '@/hooks/use-property-actions';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';


const getInitialState = (): Omit<Property, 'id'> => ({
  builderId: '',
  sellerId: '',
  slug: '',
  isVisibleOnSite: true,
  views: 0,
  clicks: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  youtubeVideoUrl: '',
  personaIds: [],
  informacoesbasicas: { nome: '', descricao: '' },
  localizacao: { googleMapsLink: '', googleStreetViewLink: '', estado: '', cidade: '', bairro: '' },
  caracteristicasimovel: { unidades: { quartos: [] } },
  areascomuns: [],
  proximidades: [],
  statusobra: {},
  documentacao: {},
  midia: [],
  contato: { construtora: '' },
  detalhesAvulsos: {
    sistemaVendas: 'Não Informado',
    disponivelVenda: true,
  },
});

const PROPERTIES_PER_PAGE = 10;

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export default function AvulsoClientPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, propertyCount, propertyLimit } = useAuth();
  
  const { 
    selectedProperty, 
    isSheetOpen, 
    handleViewDetails, 
    setIsSheetOpen,
    PropertyDetailSheet
  } = usePropertyActions({ id: user?.uid || '', name: user?.displayName || '', email: user?.email || ''}, 'broker-panel');

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [sellerClients, setSellerClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Partial<Property>>(getInitialState());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [areaComumInput, setAreaComumInput] = useState('');
  
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);

  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    async function handleUrlParams() {
        const editId = searchParams.get('edit');
        if (editId) {
            const isLimitReached = propertyLimit !== null && propertyCount >= propertyLimit;
            
            if (editId === 'new') {
                 if (isLimitReached) {
                    toast({ variant: 'destructive', title: 'Limite Atingido', description: 'Você atingiu o limite de imóveis do seu plano.' });
                    router.push('/corretor/avulso');
                    return;
                }
                await openDialog(null);
            } else {
                const docRef = doc(db, 'properties', editId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    await openDialog({ id: docSnap.id, ...docSnap.data() } as Property);
                }
            }
        }
    }
    handleUrlParams();
  }, [searchParams, propertyCount, propertyLimit, toast, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }

    setIsLoading(true);
    const q = query(collection(db, 'properties'), where('builderId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setAllProperties(propsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar imóveis avulsos: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar imóveis' });
        setIsLoading(false);
    });

    const clientsQuery = query(collection(db, 'broker_clients'), where('brokerId', '==', user.uid), where('type', '==', 'Vendedor'));
    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setSellerClients(clientsData);
    });

    async function loadStates() {
      setIsLoadingStates(true);
      const statesData = await getStates();
      setStates(statesData);
      setIsLoadingStates(false);
    }
    loadStates();

    return () => {
        unsubscribe();
        unsubscribeClients();
    };
  }, [user, authLoading, router, toast]);

  const filteredSellerClients = useMemo(() => {
    if (!clientSearch) {
        return sellerClients;
    }
    return sellerClients.filter(client => 
        client.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [sellerClients, clientSearch]);

  const totalPages = Math.ceil(allProperties.length / PROPERTIES_PER_PAGE);
  const paginatedProperties = useMemo(() => {
      const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
      return allProperties.slice(startIndex, startIndex + PROPERTIES_PER_PAGE);
  }, [allProperties, currentPage]);

  const handleInputChange = (section: keyof Property, field: string, value: any) => {
    setCurrentProperty(prev => {
        const newState: Partial<Property> = { ...prev };
        if (section === 'youtubeVideoUrl' || section === 'slug' || section === 'sellerId') {
            (newState as any)[section] = value;
            return newState;
        }

        if (typeof newState[section] === 'object' && newState[section] !== null && !Array.isArray(newState[section])) {
            let processedValue = value;
            if (section === 'informacoesbasicas' && field === 'valor') {
                processedValue = value === '' ? null : Number(value);
            }
             if (section === 'informacoesbasicas' && field === 'nome' && !isEditing) {
                const newSlug = slugify(value);
                newState.slug = newSlug;
            }
            (newState[section] as any)[field] = processedValue;
        } else {
            (newState as any)[section] = value;
        }
        return newState;
    });
  };

  const handleLocationChange = (field: 'estado' | 'cidade' | 'bairro', value: string) => {
    setCurrentProperty(prev => ({ ...prev, localizacao: { ...prev?.localizacao, [field]: value } }));
  };

  const handleCityChange = async (cityName: string) => {
    handleLocationChange('cidade', cityName);
    handleLocationChange('bairro', '');
    setIsLoadingNeighborhoods(true);
    setNeighborhoods([]);
    if (cityName) {
        const selectedCity = cities.find(c => c.nome === cityName);
        if (selectedCity) {
            const neighborhoodsData = await getNeighborhoodsByCity(selectedCity.id, selectedCity.nome);
            setNeighborhoods(neighborhoodsData);
        }
    }
    setIsLoadingNeighborhoods(false);
  };

  const handleStateChange = async (stateAcronym: string) => {
    handleLocationChange('estado', stateAcronym);
    handleLocationChange('cidade', '');
    handleLocationChange('bairro', '');
    setIsLoadingCities(true);
    setCities([]);
    setNeighborhoods([]);
    if(stateAcronym){
      const citiesData = await getCitiesByState(stateAcronym);
      setCities(citiesData);
    }
    setIsLoadingCities(false);
  };
  
    const handleBedroomChange = (bedroom: string, isChecked: boolean) => {
    setCurrentProperty(prev => {
        const currentBedrooms = prev?.caracteristicasimovel?.unidades?.quartos || [];
        const newBedrooms = isChecked
            ? [...currentBedrooms, bedroom]
            : (currentBedrooms as string[]).filter(b => b !== bedroom);
        newBedrooms.sort();
        return {
            ...prev,
            caracteristicasimovel: {
                ...prev.caracteristicasimovel,
                unidades: { ...prev.caracteristicasimovel?.unidades, quartos: newBedrooms }
            }
        };
    });
  };

  const handleAddItemToArray = (field: 'areascomuns' | 'midia') => {
    if (field === 'areascomuns') {
        if (!areaComumInput.trim()) return;
        setCurrentProperty(prev => ({ ...prev, [field]: [...(prev[field] || []), areaComumInput] }));
        setAreaComumInput('');
    }
  };

  const handleRemoveItemFromArray = (field: 'areascomuns' | 'midia', index: number) => {
    setCurrentProperty(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
  };
  
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    setIsUploading(true);
    
    const files = Array.from(e.target.files);
    const tempPropertyId = currentProperty.id || `temp_${new Date().getTime()}`;

    try {
        const uploadPromises = files.map(file => {
            const path = `broker_properties/${user.uid}/${tempPropertyId}/${file.name}`;
            return uploadFile(file, path);
        });

        const downloadURLs = await Promise.all(uploadPromises);
        
        setCurrentProperty(prev => ({
            ...prev,
            midia: [...(prev.midia || []), ...downloadURLs]
        }));

        toast({ title: `${files.length} imagem(s) carregada(s) com sucesso!` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível carregar as imagens.' });
    } finally {
        setIsUploading(false);
    }
  };

  const openDialog = async (property: Property | null = null) => {
    if (property) {
      setIsEditing(true);
      const propertyForEdit = { ...getInitialState(), ...property };
      if (propertyForEdit.caracteristicasimovel?.unidades?.quartos && !Array.isArray(propertyForEdit.caracteristicasimovel.unidades.quartos)) {
        propertyForEdit.caracteristicasimovel.unidades.quartos = [propertyForEdit.caracteristicasimovel.unidades.quartos];
      }
      setCurrentProperty(propertyForEdit);
      if (propertyForEdit.localizacao?.estado) {
        await handleStateChange(propertyForEdit.localizacao.estado);
        if (propertyForEdit.localizacao.cidade) {
            await handleCityChange(propertyForEdit.localizacao.cidade);
        }
      }
    } else {
      setIsEditing(false);
      setCurrentProperty(getInitialState());
      setCities([]);
      setNeighborhoods([]);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentProperty({});
    setClientSearch('');
    router.push('/corretor/avulso');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !currentProperty.informacoesbasicas?.nome) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome do Imóvel é obrigatório.' });
      return;
    }
    setIsSubmitting(true);
    
    const propertyData: Partial<Property> = { 
        ...currentProperty,
        builderId: user.uid, // Always link to the broker
        contato: {
            ...currentProperty.contato,
            construtora: user.displayName || 'Corretor Independente'
        }
    };
    if (!propertyData.slug) propertyData.slug = slugify(propertyData.informacoesbasicas.nome);
    delete propertyData.id;

    try {
      if (isEditing && currentProperty.id) {
        await updateDoc(doc(db, 'properties', currentProperty.id), propertyData);
        toast({ title: 'Imóvel Atualizado!' });
      } else {
        await addDoc(collection(db, 'properties'), { ...propertyData, createdAt: Timestamp.now() });
        toast({ title: 'Imóvel Salvo!' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteAlert = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteDoc(doc(db, 'properties', propertyToDelete.id));
      toast({ title: 'Imóvel Deletado' });
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  const handleVisibilityToggle = async (property: Property) => {
    const propertyRef = doc(db, 'properties', property.id);
    const newVisibility = !property.isVisibleOnSite;
    try {
        await updateDoc(propertyRef, { isVisibleOnSite: newVisibility });
        toast({
            title: 'Visibilidade Atualizada',
            description: `${property.informacoesbasicas.nome} agora está ${newVisibility ? 'visível' : 'oculto'} no site.`
        })
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Falha na Atualização', description: 'Não foi possível alterar a visibilidade.' });
    }
  };
  
    const displayBedrooms = (bedrooms: string[] | string | undefined) => {
    if (Array.isArray(bedrooms)) {
      return bedrooms.join(', ');
    }
    return bedrooms || '';
  };
  
  const onGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    const result = await handleGeneratePropertySeo({
      nome: currentProperty.informacoesbasicas?.nome || '',
      tipo: currentProperty.caracteristicasimovel?.tipo || '',
      cidade: currentProperty.localizacao?.cidade || '',
      estado: currentProperty.localizacao?.estado || '',
      quartos: displayBedrooms(currentProperty.caracteristicasimovel?.unidades?.quartos),
      descricao: currentProperty.informacoesbasicas?.descricao || ''
    });
    if (result.success && result.data) {
        setCurrentProperty(prev => ({
            ...prev,
            seoTitle: result.data!.title,
            seoDescription: result.data!.description,
            seoKeywords: result.data!.keywords,
        }));
        toast({ title: "SEO Gerado!", description: "Os campos de SEO foram preenchidos." });
    } else {
        toast({ variant: 'destructive', title: 'Falha na Geração', description: result.error });
    }
    setIsGeneratingSeo(false);
  };
  
  if (authLoading || isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const propertyTypes = ["Apartamento", "Casa em Condomínio", "Casa", "Flat", "Terreno", "Sala Comercial", "Loja"];
  const bedroomOptions = ["1", "2", "3", "4", "5+"];
  const garageOptions = ["1", "2", "3", "4+"];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Home /> Imóveis Avulsos</CardTitle>
            <CardDescription>Cadastre e gerencie seus imóveis particulares.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome do Imóvel</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Visível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProperties.length > 0 ? paginatedProperties.map((prop) => (
                <TableRow key={prop.id} className="cursor-pointer" onClick={() => handleViewDetails(prop)}>
                  <TableCell>
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      {prop.midia?.[0] ? (<Image src={prop.midia[0]} alt={prop.informacoesbasicas.nome} width={64} height={64} className="object-cover rounded-md" />) : (<ImageOff className="h-6 w-6 text-muted-foreground" />)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                     {prop.informacoesbasicas.nome}
                  </TableCell>
                  <TableCell>{prop.localizacao.cidade} / {prop.localizacao.estado}</TableCell>
                  <TableCell><Switch checked={prop.isVisibleOnSite} onCheckedChange={() => handleVisibilityToggle(prop)} /></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); openDialog(prop)}}><FilePen className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => {e.stopPropagation(); openDeleteAlert(prop)}}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum imóvel avulso cadastrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex justify-center items-center gap-4 pt-6 border-t">
                <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
                <span className="text-sm font-medium">Página {currentPage} / {totalPages}</span>
                <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próxima<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
        )}
      </Card>
      
      {selectedProperty && user && (
        <PropertyDetailSheet
          property={selectedProperty}
          brokerId={user.uid}
          brokerWhatsApp={user.phoneNumber}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          source="broker-panel"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
             <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Imóvel Avulso' : 'Cadastrar Imóvel Avulso'}</DialogTitle>
                <DialogDescription>Preencha os dados do seu imóvel particular.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6">
              <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientSearch">Buscar Cliente Vendedor</Label>
                    <Input
                        id="clientSearch"
                        placeholder="Digite o nome do cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                    />
                    <Label htmlFor="sellerId" className="sr-only">Cliente Vendedor</Label>
                    <Select onValueChange={(value) => handleInputChange('sellerId', '', value)} value={currentProperty.sellerId || ''}>
                      <SelectTrigger id="sellerId"><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {filteredSellerClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Accordion type="multiple" className="w-full" defaultValue={['item-1', 'item-2']}>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Informações Básicas</AccordionTrigger>
                      <AccordionContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nome do Imóvel</Label><Input value={currentProperty.informacoesbasicas?.nome || ''} onChange={e => handleInputChange('informacoesbasicas', 'nome', e.target.value)} required /></div>
                        <div className="space-y-2"><Label>URL Amigável (slug)</Label><Input value={currentProperty.slug || ''} onChange={e => handleInputChange('slug', '', e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Descrição</Label><Textarea value={currentProperty.informacoesbasicas?.descricao || ''} onChange={e => handleInputChange('informacoesbasicas', 'descricao', e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={currentProperty.informacoesbasicas?.valor || ''} onChange={e => handleInputChange('informacoesbasicas', 'valor', e.target.value)} placeholder="Ex: 550000.00"/></div>
                        <div className="space-y-2"><Label>Status</Label><Input value={currentProperty.informacoesbasicas?.status || ''} onChange={e => handleInputChange('informacoesbasicas', 'status', e.target.value)} /></div>
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-2">
                        <AccordionTrigger>Localização</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                           <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2"><Label>Estado</Label><Select onValueChange={handleStateChange} value={currentProperty.localizacao?.estado || ''}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{states.map(s=><SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent></Select></div>
                              <div className="space-y-2"><Label>Cidade</Label><Select onValueChange={handleCityChange} value={currentProperty.localizacao?.cidade || ''} disabled={!currentProperty.localizacao?.estado}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{cities.map(c=><SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
                              <div className="space-y-2"><Label>Bairro</Label><Select onValueChange={value => handleLocationChange('bairro', value)} value={currentProperty.localizacao?.bairro || ''} disabled={!currentProperty.localizacao?.cidade}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{neighborhoods.map(n=><SelectItem key={n.id} value={n.nome}>{n.nome}</SelectItem>)}</SelectContent></Select></div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Características do Imóvel</AccordionTrigger>
                      <AccordionContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Tipo</Label><Select onValueChange={v => handleInputChange('caracteristicasimovel', 'tipo', v)} value={currentProperty.caracteristicasimovel?.tipo || ''}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{propertyTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Tamanho (m²)</Label><Input value={currentProperty.caracteristicasimovel?.tamanho || ''} onChange={e => handleInputChange('caracteristicasimovel', 'tamanho', e.target.value)} /></div>
                        <div className="md:col-span-2 space-y-2"><Label>Quartos</Label><div className="flex flex-wrap gap-x-6 gap-y-2">{bedroomOptions.map(o=><div key={o} className="flex items-center space-x-2"><Checkbox id={`bed-${o}`} checked={Array.isArray(currentProperty.caracteristicasimovel?.unidades?.quartos) && currentProperty.caracteristicasimovel.unidades.quartos.includes(o)} onCheckedChange={c=>handleBedroomChange(o, !!c)} /><Label htmlFor={`bed-${o}`} className="font-normal">{o}</Label></div>)}</div></div>
                        <div className="space-y-2"><Label>Vagas de Garagem</Label><Select onValueChange={v => handleInputChange('caracteristicasimovel', 'unidades', { ...currentProperty.caracteristicasimovel?.unidades, vagasgaragem: v })} value={currentProperty.caracteristicasimovel?.unidades?.vagasgaragem || ''}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{garageOptions.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-avulso">
                        <AccordionTrigger>Detalhes Adicionais (Avulso)</AccordionTrigger>
                        <AccordionContent className="grid md:grid-cols-2 gap-4 pt-4">
                             <div className="space-y-2">
                                <Label>Sistema de Vendas</Label>
                                <Select 
                                    value={currentProperty.detalhesAvulsos?.sistemaVendas || 'Não Informado'} 
                                    onValueChange={v => handleInputChange('detalhesAvulsos', 'sistemaVendas', v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Não Informado">Não Informado</SelectItem>
                                        <SelectItem value="Porteira Fechada">Porteira Fechada</SelectItem>
                                        <SelectItem value="Valor Padrão">Valor Padrão</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ano de Construção</Label>
                                <Input type="number" value={currentProperty.detalhesAvulsos?.anoConstrucao || ''} onChange={e => handleInputChange('detalhesAvulsos', 'anoConstrucao', e.target.value)} />
                            </div>
                            <div className="space-y-2"><Label>Construtora (se houver)</Label><Input value={currentProperty.detalhesAvulsos?.construtoraAvulsa || ''} onChange={e => handleInputChange('detalhesAvulsos', 'construtoraAvulsa', e.target.value)} /></div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch id="disponivelVenda" checked={currentProperty.detalhesAvulsos?.disponivelVenda ?? true} onCheckedChange={c => handleInputChange('detalhesAvulsos', 'disponivelVenda', c)} />
                                <Label htmlFor="disponivelVenda">Disponível para Venda</Label>
                            </div>
                             <div className="space-y-2"><Label>Torre</Label><Input value={currentProperty.detalhesAvulsos?.torre || ''} onChange={e => handleInputChange('detalhesAvulsos', 'torre', e.target.value)} /></div>
                             <div className="space-y-2"><Label>Bloco</Label><Input value={currentProperty.detalhesAvulsos?.bloco || ''} onChange={e => handleInputChange('detalhesAvulsos', 'bloco', e.target.value)} /></div>
                             <div className="space-y-2"><Label>Andar</Label><Input value={currentProperty.detalhesAvulsos?.andar || ''} onChange={e => handleInputChange('detalhesAvulsos', 'andar', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Número de Andares</Label><Input type="number" value={currentProperty.detalhesAvulsos?.numeroAndares || ''} onChange={e => handleInputChange('detalhesAvulsos', 'numeroAndares', e.target.value)} /></div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Mídia (Links de Imagens e Vídeo)</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-2"><Label>URL do Vídeo do YouTube</Label><Input value={currentProperty.youtubeVideoUrl || ''} onChange={e => handleInputChange('youtubeVideoUrl', '', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></div>
                        
                        <div className="space-y-2">
                          <Label>Upload de Imagens</Label>
                           <div className="p-4 border-2 border-dashed rounded-lg text-center">
                              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                              <Label htmlFor="image-upload" className="mt-2 block text-sm font-medium text-gray-700 cursor-pointer">
                                Arraste e solte ou clique para selecionar
                              </Label>
                              <Input id="image-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleFileUpload} disabled={isUploading}/>
                           </div>
                           {isUploading && <Progress value={50} className="w-full mt-2" />}
                        </div>

                        <div className="space-y-2">
                          <Label>Galeria de Imagens</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {currentProperty.midia?.map((item, index) => (
                              <div key={index} className="relative group aspect-square">
                                <Image src={item} alt={`Imagem ${index+1}`} fill sizes="25vw" className="object-cover rounded-md"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                   <Button type="button" size="icon" variant="destructive" onClick={() => handleRemoveItemFromArray('midia', index)}>
                                      <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-5">
                      <AccordionTrigger>SEO</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                         <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={onGenerateSeo} disabled={isGeneratingSeo}>{isGeneratingSeo ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2"/>}Gerar com IA</Button></div>
                        <div className="space-y-2"><Label>Meta Title</Label><Input value={currentProperty.seoTitle || ''} onChange={e => handleInputChange('seoTitle', '', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Meta Description</Label><Textarea value={currentProperty.seoDescription || ''} onChange={e => handleInputChange('seoDescription', '', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Palavras-chave</Label><Input value={currentProperty.seoKeywords || ''} onChange={e => handleInputChange('seoKeywords', '', e.target.value)} /></div>
                      </AccordionContent>
                    </AccordionItem>
                    <div className="flex items-center space-x-2 pt-4"><Switch id="isVisibleOnSite" checked={currentProperty.isVisibleOnSite} onCheckedChange={c=>handleInputChange('isVisibleOnSite', '', c)} /><Label htmlFor="isVisibleOnSite">Visível no site público</Label></div>
                  </Accordion>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t mt-auto">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita e irá deletar o imóvel <strong>{propertyToDelete?.informacoesbasicas.nome}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
