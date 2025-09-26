
'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, PlusCircle, FilePen, Trash2, X } from 'lucide-react';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface BrokerLocation {
    state: string;
    city: string;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  locations: BrokerLocation[];
}

const initialState: Omit<Broker, 'id'> = {
  name: '',
  email: '',
  whatsapp: '',
  locations: [],
};

export default function BrokersPage() {
  const { toast } = useToast();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBroker, setCurrentBroker] = useState<Partial<Broker>>(initialState);
  
  // Form State
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Alert State
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [brokerToDelete, setBrokerToDelete] = useState<Broker | null>(null);

  useEffect(() => {
    // Fetch brokers from Firestore
    const unsubscribe = onSnapshot(collection(db, 'brokers'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broker));
        setBrokers(data);
        setIsLoadingData(false);
    }, (error) => {
        console.error("Erro ao buscar corretores: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar corretores', description: error.message });
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
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentBroker((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddLocation = () => {
    if (!selectedState || !selectedCity) {
        toast({ variant: 'destructive', title: 'Seleção inválida', description: 'Por favor, selecione um estado e uma cidade.' });
        return;
    }
    const newLocation = { state: selectedState, city: selectedCity };
    const currentLocations = currentBroker.locations || [];

    // Evitar duplicados
    if (currentLocations.some(loc => loc.state === newLocation.state && loc.city === newLocation.city)) {
        toast({ variant: 'destructive', title: 'Localização já adicionada' });
        return;
    }

    setCurrentBroker(prev => ({ ...prev, locations: [...currentLocations, newLocation] }));
  };
  
  const handleRemoveLocation = (index: number) => {
     setCurrentBroker(prev => ({
        ...prev,
        locations: (prev.locations || []).filter((_, i) => i !== index),
     }));
  }
  
  const openDialog = (broker: Broker | null = null) => {
    if (broker) {
        setIsEditing(true);
        setCurrentBroker(broker);
    } else {
        setIsEditing(false);
        setCurrentBroker(initialState);
    }
    setSelectedState('');
    setSelectedCity('');
    setCities([]);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentBroker({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentBroker.name || !currentBroker.email || !currentBroker.whatsapp || !currentBroker.locations || currentBroker.locations.length === 0) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Preencha nome, email, WhatsApp e adicione ao menos uma cidade.' });
      return;
    }
    
    setIsSubmitting(true);
    
    const brokerData = { ...currentBroker };
    delete brokerData.id;

    try {
      if(isEditing && currentBroker.id) {
        const brokerRef = doc(db, 'brokers', currentBroker.id);
        await updateDoc(brokerRef, brokerData);
        toast({ title: 'Corretor Atualizado!', description: 'Os dados do corretor foram atualizados.' });
      } else {
        await addDoc(collection(db, 'brokers'), { ...brokerData, createdAt: new Date() });
        toast({ title: 'Corretor Salvo!', description: 'O novo corretor foi cadastrado com sucesso.' });
      }
      closeDialog();
    } catch (error: any) {
      console.error("Error saving broker: ", error);
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteAlert = (broker: Broker) => {
    setBrokerToDelete(broker);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteBroker = async () => {
    if (!brokerToDelete) return;
    try {
      await deleteDoc(doc(db, 'brokers', brokerToDelete.id));
      toast({ title: 'Corretor Deletado', description: 'O registro foi removido com sucesso.' });
      setIsDeleteAlertOpen(false);
      setBrokerToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus />
              Corretores
            </CardTitle>
            <CardDescription>Visualize, crie e gerencie os corretores parceiros.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => openDialog()}>
            <PlusCircle className="h-4 w-4" />
            Cadastrar Corretor
          </Button>
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
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Cidades Atendidas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {brokers.map((broker) => (
                        <TableRow key={broker.id}>
                            <TableCell className="font-medium">
                               <Link href={`/dashboard/brokers/${broker.id}`} className="hover:underline">
                                {broker.name}
                               </Link>
                            </TableCell>
                            <TableCell>{broker.email}<br/><span className="text-xs text-muted-foreground">{broker.whatsapp}</span></TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-sm">
                                    {broker.locations.map((loc, index) => (
                                        <Badge key={`${loc.state}-${loc.city}-${index}`} variant="secondary">{loc.city} - {loc.state}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDialog(broker)}
                                >
                                  <FilePen className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openDeleteAlert(broker)}
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
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Corretor' : 'Cadastrar Novo Corretor'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Atualize os dados do corretor.' : 'Preencha os dados para cadastrar.'}</DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Nome do Corretor</Label>
                            <Input id="name" value={currentBroker.name || ''} onChange={handleInputChange} placeholder="Ex: João da Silva" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input id="whatsapp" type="tel" value={currentBroker.whatsapp || ''} onChange={handleInputChange} placeholder="(99) 99999-9999" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={currentBroker.email || ''} onChange={handleInputChange} placeholder="contato@corretor.com" required/>
                    </div>
                   
                    <div className="space-y-4 rounded-lg border p-4">
                        <Label>Cidades de Atuação</Label>
                        <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="state" className="text-xs">Estado</Label>
                                <Select onValueChange={handleStateChange} value={selectedState} required disabled={isLoadingStates}>
                                    <SelectTrigger id="state">
                                        <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map((s) => (
                                        <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="city" className="text-xs">Cidade</Label>
                                <Select onValueChange={setSelectedCity} value={selectedCity} required disabled={!selectedState || isLoadingCities}>
                                    <SelectTrigger id="city">
                                        <SelectValue placeholder={
                                        isLoadingCities ? 'Carregando...' : 'Selecione'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((c) => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" size="sm" onClick={handleAddLocation}>Adicionar</Button>
                        </div>
                        <div className="space-y-2">
                            {currentBroker.locations?.map((loc, index) => (
                                <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                                    <span>{loc.city} - {loc.state}</span>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveLocation(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
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
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o corretor {' '}
              <strong>{brokerToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBroker} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
