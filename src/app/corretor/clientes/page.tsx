
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, UserPlus, FilePen, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { type Persona } from '@/app/dashboard/personas/page';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Comprador' | 'Vendedor';
  personaId?: string;
  personaName?: string;
  brokerId: string;
}

const initialState: Omit<Client, 'id' | 'brokerId'> = {
  name: '',
  email: '',
  phone: '',
  type: 'Comprador',
  personaId: 'none',
  personaName: 'Nenhuma',
};

export default function CorretorClientesPage() {
  const { toast } = useToast();
  const [user, loadingAuth] = useAuthState(auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
        openDialog(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (loadingAuth || !user) return;

    const clientsQuery = query(collection(db, 'broker_clients'), where('brokerId', '==', user.uid));
    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar clientes: ", error);
      toast({ variant: 'destructive', title: 'Falha ao carregar clientes' });
      setIsLoading(false);
    });

    const personasQuery = query(collection(db, 'personas'));
    const unsubscribePersonas = onSnapshot(personasQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona));
        setPersonas(data);
    });

    return () => {
        unsubscribeClients();
        unsubscribePersonas();
    };
  }, [user, loadingAuth, toast]);

  const openDialog = (client: Client | null = null) => {
    if (client) {
        setIsEditing(true);
        setCurrentClient(client);
    } else {
        setIsEditing(false);
        setCurrentClient(initialState);
    }
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentClient({});
    router.push('/corretor/clientes'); // Limpa a URL
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentClient.name || !currentClient.email || !user) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e email são obrigatórios.' });
      return;
    }
    setIsSubmitting(true);

    const selectedPersona = personas.find(p => p.id === currentClient.personaId);
    
    const clientData: Omit<Client, 'id'> = {
        name: currentClient.name,
        email: currentClient.email,
        phone: currentClient.phone || '',
        type: currentClient.type || 'Comprador',
        personaId: currentClient.personaId || 'none',
        personaName: selectedPersona?.name || 'Nenhuma',
        brokerId: user.uid,
    };

    try {
      if (isEditing && currentClient.id) {
        const clientRef = doc(db, 'broker_clients', currentClient.id);
        await updateDoc(clientRef, clientData);
        toast({ title: 'Cliente Atualizado!' });
      } else {
        await addDoc(collection(db, 'broker_clients'), { ...clientData, createdAt: new Date() });
        toast({ title: 'Cliente Salvo!' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openDeleteAlert = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteDoc(doc(db, 'broker_clients', clientToDelete.id));
      toast({ title: 'Cliente Deletado' });
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  if (loadingAuth || isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
        <div className="flex items-start gap-4">
            <UserPlus className="h-10 w-10 mt-2"/>
            <div>
                <h1 className="text-6xl font-thin tracking-tight">Meus Clientes</h1>
                <p className="font-light text-[23px] text-black">Cadastre e gerencie seus clientes e imóveis de interesse.</p>
            </div>
        </div>
        <div className="text-right">
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
                <PlusCircle className="h-4 w-4" />
                Cadastrar Cliente
            </Button>
        </div>
        <Card>
            <CardContent className="pt-6">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {clients.length > 0 ? clients.map((client) => (
                    <TableRow key={client.id}>
                    <TableCell className="font-medium">
                        <Link href={`/corretor/clientes/${client.id}`} className="hover:underline">
                            {client.name}
                        </Link>
                    </TableCell>
                    <TableCell>{client.email}<br/><span className="text-xs text-muted-foreground">{client.phone}</span></TableCell>
                    <TableCell>{client.type}</TableCell>
                    <TableCell>{client.personaName || 'Não definida'}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(client)}><FilePen className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(client)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Você ainda não cadastrou nenhum cliente.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Atualize os dados do cliente.' : 'Preencha os dados para cadastrar um novo cliente.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Cliente</Label>
                        <Input id="name" value={currentClient.name || ''} onChange={e => setCurrentClient(p => ({...p, name: e.target.value}))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={currentClient.email || ''} onChange={e => setCurrentClient(p => ({...p, email: e.target.value}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" type="tel" value={currentClient.phone || ''} onChange={e => setCurrentClient(p => ({...p, phone: e.target.value}))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo do Cliente</Label>
                             <Select value={currentClient.type || 'Comprador'} onValueChange={v => setCurrentClient(p => ({...p, type: v as 'Comprador' | 'Vendedor'}))}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Comprador">Comprador</SelectItem>
                                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="personaId">Persona do Cliente</Label>
                            <Select value={currentClient.personaId || 'none'} onValueChange={v => setCurrentClient(p => ({...p, personaId: v}))}>
                                <SelectTrigger><SelectValue placeholder="Selecione um perfil"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma</SelectItem>
                                    {personas.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Salvar Alterações' : 'Salvar Cliente')}
                    </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita e irá deletar o cliente <strong>{clientToDelete?.name}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
