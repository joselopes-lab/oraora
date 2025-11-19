
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, FilePen, Trash2, X, Users, ImageOff, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';

export interface Persona {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: {
    priceMax?: number;
    priceMin?: number;
    bedrooms?: string[];
    garageSpots?: string[];
    propertyTypes?: string[];
    locations?: { state: string; city: string; }[];
    commonAreas?: string[];
  }
}

const getInitialState = (): Omit<Persona, 'id'> => ({
  name: '',
  description: '',
  imageUrl: '',
  criteria: {
    bedrooms: [],
    garageSpots: [],
    propertyTypes: [],
    locations: [],
    commonAreas: [],
  }
});

const defaultPersonas = [
  {
    name: "Investidor Visionário",
    description: "Busca imóveis de alto padrão com alto potencial de valorização, em regiões promissoras, visando revenda ou aluguel de longo prazo. Foca em empreendimentos bem localizados, com infraestrutura completa e segurança.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 900000,
      priceMax: 2500000,
      propertyTypes: ["Casa em Condomínio", "Apartamento"],
      bedrooms: ["3", "4", "5+"],
      garageSpots: ["2", "3", "4+"],
      commonAreas: ["Academia", "Piscina", "Salão de Festas", "Espaço Gourmet", "Quadra Esportiva", "Churrasqueira"],
      locations: [],
    }
  },
  {
    name: "Família Premium",
    description: "Casais com filhos que priorizam espaço, segurança e lazer completo. Buscam condomínios fechados com infraestrutura para todas as idades.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 1000000,
      priceMax: 2800000,
      propertyTypes: ["Casa em Condomínio"],
      bedrooms: ["4", "5+"],
      garageSpots: ["2", "3", "4+"],
      commonAreas: ["Academia", "Piscina", "Playground", "Brinquedoteca", "Quadra Esportiva", "Churrasqueira", "Espaço Gourmet"],
      locations: [],
    }
  },
  {
    name: "Casal Jovem Aspiracional",
    description: "Jovens casados sem filhos que buscam imóveis modernos, com lazer e infraestrutura de qualidade, próximos a centros comerciais e de entretenimento.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 500000,
      priceMax: 1200000,
      propertyTypes: ["Apartamento", "Casa em Condomínio"],
      bedrooms: ["2", "3"],
      garageSpots: ["1", "2"],
      commonAreas: ["Academia", "Piscina", "Espaço Gourmet", "Salão de Festas"],
      locations: [],
    }
  },
  {
    name: "Solteiro Urbano",
    description: "Profissional solteiro ou divorciado que valoriza praticidade, localização estratégica e áreas comuns para lazer e networking.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 350000,
      priceMax: 900000,
      propertyTypes: ["Apartamento", "Flat"],
      bedrooms: ["1", "2"],
      garageSpots: ["1"],
      commonAreas: ["Academia", "Piscina", "Salão de Festas", "Espaço Gourmet"],
      locations: [],
    }
  },
  {
    name: "Aposentado Conforto",
    description: "Comprador maduro que busca tranquilidade, segurança e conforto, preferindo locais com fácil acesso a serviços essenciais e lazer próximo.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 600000,
      priceMax: 1500000,
      propertyTypes: ["Casa", "Apartamento", "Casa em Condomínio"],
      bedrooms: ["2", "3"],
      garageSpots: ["2"],
      commonAreas: ["Academia", "Piscina", "Espaço Gourmet", "Churrasqueira"],
      locations: [],
    }
  },
  {
    name: "Comprador de Luxo",
    description: "Cliente exigente que busca exclusividade, alto padrão de acabamento, segurança máxima e infraestrutura premium.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 1500000,
      priceMax: 5000000,
      propertyTypes: ["Casa em Condomínio", "Apartamento"],
      bedrooms: ["4", "5+"],
      garageSpots: ["3", "4+"],
      commonAreas: ["Academia", "Piscina", "Salão de Festas", "Espaço Gourmet", "Quadra Esportiva", "Churrasqueira"],
      locations: [],
    }
  },
  {
    name: "Investidor Comercial",
    description: "Focado em imóveis para uso empresarial ou locação comercial, buscando áreas estratégicas com grande fluxo e potencial de valorização.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 500000,
      priceMax: 3000000,
      propertyTypes: ["Sala Comercial", "Loja", "Terreno"],
      bedrooms: [],
      garageSpots: ["1", "2", "3"],
      commonAreas: [],
      locations: [],
    }
  },
  {
    name: "Família Econômica",
    description: "Família que busca imóvel seguro e confortável, mas com custo acessível, priorizando funcionalidade e boa relação custo-benefício.",
    imageUrl: 'https://placehold.co/400x225.png',
    criteria: {
      priceMin: 300000,
      priceMax: 800000,
      propertyTypes: ["Casa", "Apartamento"],
      bedrooms: ["2", "3"],
      garageSpots: ["1", "2"],
      commonAreas: ["Playground", "Salão de Festas", "Churrasqueira"],
      locations: [],
    }
  }
];

const bedroomOptions = ["1", "2", "3", "4", "5+"];
const garageOptions = ["1", "2", "3", "4+"];
const propertyTypes = ["Apartamento", "Casa em Condomínio", "Casa", "Flat", "Terreno", "Sala Comercial", "Loja"];
const commonAreasOptions = ["Academia", "Piscina", "Salão de Festas", "Espaço Gourmet", "Brinquedoteca", "Playground", "Quadra Esportiva", "Churrasqueira"];

export default function PersonasPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Partial<Persona>>(getInitialState());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

  // Location states for form
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    async function handleUrlParams() {
      const editId = searchParams.get('edit');
      const deleteId = searchParams.get('delete');
      if (editId === 'new') {
        openDialog(null);
      } else if (editId) {
        const docRef = doc(db, 'personas', editId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          openDialog({ id: docSnap.id, ...docSnap.data() } as Persona);
        }
      } else if (deleteId) {
        const docRef = doc(db, 'personas', deleteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          openDeleteAlert({ id: docSnap.id, ...docSnap.data() } as Persona);
        }
      }
    }
    handleUrlParams();
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'personas'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona));
        setPersonas(data);
        setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar personas: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar personas' });
        setIsLoading(false);
    });
    
    async function loadStates() {
      setIsLoadingStates(true);
      const statesData = await getStates();
      setStates(statesData);
      setIsLoadingStates(false);
    }
    loadStates();

    return () => unsubscribe();
  }, [toast]);
  
  const handleSeedPersonas = async () => {
    setIsSeeding(true);
    try {
        const personasCollection = collection(db, 'personas');
        const existingPersonasSnapshot = await getDocs(query(personasCollection));
        const existingNames = new Set(existingPersonasSnapshot.docs.map(doc => doc.data().name));
        
        let addedCount = 0;
        for (const persona of defaultPersonas) {
            if (!existingNames.has(persona.name)) {
                await addDoc(personasCollection, persona);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            toast({ title: "Personas Adicionadas!", description: `${addedCount} novas personas foram cadastradas.` });
        } else {
            toast({ title: "Nenhuma persona nova", description: "Todas as personas padrão já estavam cadastradas." });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Falha ao popular personas', description: error.message });
    } finally {
        setIsSeeding(false);
    }
  };

  const handleStateChange = async (stateAcronym: string) => {
    setSelectedState(stateAcronym);
    setSelectedCity('');
    setIsLoadingCities(true);
    setCities([]);
    if(stateAcronym){
      const citiesData = await getCitiesByState(stateAcronym);
      setCities(citiesData);
    }
    setIsLoadingCities(false);
  };

  const handleAddLocation = () => {
    if (!selectedState || !selectedCity) return;
    const newLocation = { state: selectedState, city: selectedCity };
    const currentLocations = currentPersona.criteria?.locations || [];
    if (!currentLocations.some(loc => loc.state === newLocation.state && loc.city === newLocation.city)) {
        setCurrentPersona(prev => ({
            ...prev,
            criteria: { ...prev.criteria, locations: [...currentLocations, newLocation] }
        }));
    }
  };

  const handleRemoveLocation = (index: number) => {
    setCurrentPersona(prev => ({
        ...prev,
        criteria: { ...prev.criteria, locations: (prev.criteria?.locations || []).filter((_, i) => i !== index) }
    }));
  };
  
  const handleCheckboxChange = (field: 'bedrooms' | 'garageSpots' | 'propertyTypes' | 'commonAreas', value: string) => {
    setCurrentPersona(prev => {
        const currentValues = prev.criteria?.[field] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        return { ...prev, criteria: { ...prev.criteria, [field]: newValues } };
    });
  };

  const openDialog = (persona: Persona | null = null) => {
    if (persona) {
      setIsEditing(true);
      setCurrentPersona(persona);
    } else {
      setIsEditing(false);
      setCurrentPersona(getInitialState());
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    router.push('/dashboard/personas');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPersona.name) {
      toast({ variant: 'destructive', title: 'O nome da persona é obrigatório.' });
      return;
    }
    setIsSubmitting(true);
    
    const personaData: Partial<Persona> = { ...currentPersona };
    delete personaData.id;

    try {
      if (isEditing && currentPersona.id) {
        await updateDoc(doc(db, 'personas', currentPersona.id), personaData);
        toast({ title: 'Persona Atualizada!' });
      } else {
        await addDoc(collection(db, 'personas'), personaData);
        toast({ title: 'Persona Salva!' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteAlert = (persona: Persona) => {
    setPersonaToDelete(persona);
    setIsDeleteAlertOpen(true);
  };

  const closeDeleteAlert = () => {
    setPersonaToDelete(null);
    setIsDeleteAlertOpen(false);
    router.push('/dashboard/personas');
  }

  const handleDelete = async () => {
    if (!personaToDelete) return;
    try {
      await deleteDoc(doc(db, 'personas', personaToDelete.id));
      toast({ title: 'Persona Deletada' });
      closeDeleteAlert();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users /> Personas</CardTitle>
            <CardDescription>Crie e gerencie perfis de compradores para filtrar imóveis.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={handleSeedPersonas} disabled={isSeeding}>
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Popular com Dados Iniciais
            </Button>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
                <PlusCircle className="h-4 w-4" /> Cadastrar Persona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <Card key={persona.id} className="overflow-hidden flex flex-col group">
                    <Link href={`/dashboard/personas/${persona.id}`} className="block">
                      <div className="relative aspect-video bg-muted flex items-center justify-center">
                          {persona.imageUrl ? (
                              <Image src={persona.imageUrl} alt={persona.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform" />
                          ): (
                              <ImageOff className="h-10 w-10 text-muted-foreground"/>
                          )}
                      </div>
                    </Link>
                  <CardHeader>
                    <CardTitle>
                        <Link href={`/dashboard/personas/${persona.id}`} className="hover:text-primary">
                            {persona.name}
                        </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 h-10">{persona.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2 mt-auto">
                     <Button variant="outline" size="sm" className="w-full" onClick={() => openDialog(persona)}><FilePen className="mr-2 h-4 w-4"/> Editar</Button>
                     <Button variant="destructive" size="sm" className="w-full" onClick={() => openDeleteAlert(persona)}><Trash2 className="mr-2 h-4 w-4"/> Excluir</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) closeDialog(); }}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
             <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Persona' : 'Nova Persona'}</DialogTitle>
                <DialogDescription>Preencha os dados e critérios para a persona.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 space-y-6 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome da Persona</Label>
                        <Input value={currentPersona.name || ''} onChange={e => setCurrentPersona(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                        <Label>URL da Imagem</Label>
                        <Input value={currentPersona.imageUrl || ''} onChange={e => setCurrentPersona(p => ({ ...p, imageUrl: e.target.value }))} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea value={currentPersona.description || ''} onChange={e => setCurrentPersona(p => ({ ...p, description: e.target.value }))} />
                </div>

                <h3 className="text-lg font-semibold border-t pt-4">Critérios de Busca</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Preço Mínimo (R$)</Label>
                        <Input type="number" value={currentPersona.criteria?.priceMin || ''} onChange={e => setCurrentPersona(p => ({ ...p, criteria: { ...p.criteria, priceMin: Number(e.target.value) }}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Preço Máximo (R$)</Label>
                        <Input type="number" value={currentPersona.criteria?.priceMax || ''} onChange={e => setCurrentPersona(p => ({ ...p, criteria: { ...p.criteria, priceMax: Number(e.target.value) }}))} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Tipos de Imóvel</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {propertyTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2"><Checkbox id={`type-${type}`} checked={currentPersona.criteria?.propertyTypes?.includes(type)} onCheckedChange={() => handleCheckboxChange('propertyTypes', type)} /><Label htmlFor={`type-${type}`} className="font-normal">{type}</Label></div>
                    ))}
                    </div>
                </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Quartos</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {bedroomOptions.map(opt => (
                                <div key={`bed-${opt}`} className="flex items-center space-x-2"><Checkbox id={`bed-${opt}`} checked={currentPersona.criteria?.bedrooms?.includes(opt)} onCheckedChange={() => handleCheckboxChange('bedrooms', opt)} /><Label htmlFor={`bed-${opt}`} className="font-normal">{opt}</Label></div>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Vagas de Garagem</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {garageOptions.map(opt => (
                                <div key={`grg-${opt}`} className="flex items-center space-x-2"><Checkbox id={`grg-${opt}`} checked={currentPersona.criteria?.garageSpots?.includes(opt)} onCheckedChange={() => handleCheckboxChange('garageSpots', opt)} /><Label htmlFor={`grg-${opt}`} className="font-normal">{opt}</Label></div>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4 rounded-lg border p-4">
                    <Label>Localizações</Label>
                    <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1.5"><Label className="text-xs">Estado</Label><Select onValueChange={handleStateChange} value={selectedState}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent></Select></div>
                        <div className="flex-1 space-y-1.5"><Label className="text-xs">Cidade</Label><Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedState}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
                        <Button type="button" size="sm" onClick={handleAddLocation}>Adicionar</Button>
                    </div>
                    <div className="space-y-2">
                        {currentPersona.criteria?.locations?.map((loc, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md"><span>{loc.city} - {loc.state}</span><Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveLocation(index)}><X className="h-4 w-4" /></Button></div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Áreas Comuns</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonAreasOptions.map(area => (
                        <div key={area} className="flex items-center space-x-2"><Checkbox id={`area-${area}`} checked={currentPersona.criteria?.commonAreas?.includes(area)} onCheckedChange={() => handleCheckboxChange('commonAreas', area)} /><Label htmlFor={`area-${area}`} className="font-normal">{area}</Label></div>
                    ))}
                    </div>
                </div>

            </div>
            <DialogFooter className="pt-4 border-t mt-auto">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(isOpen) => { if (!isOpen) closeDeleteAlert()}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita e irá deletar a persona permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteAlert}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
