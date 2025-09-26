
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, UserPlus, FilePen, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { type Persona } from '@/app/dashboard/personas/page';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  personaId?: string;
  personaName?: string;
  brokerId: string;
}

const initialState: Omit<Client, 'id' | 'brokerId'> = {
  name: '',
  email: '',
  phone: '',
  personaId: 'none',
  personaName: 'Nenhuma',
};

export default function CorretorClientesPage() {
  const { toast } = useToast();
  const [user, loadingAuth] = useAuthState(auth);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loadingAuth || !user) return;

    // Fetch clients for the current broker
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

    // Fetch available personas
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

  const openDialog = () => {
    setCurrentClient(initialState);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentClient.name || !currentClient.email || !user) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e email são obrigatórios.' });
      return;
    }
    setIsSubmitting(true);

    const selectedPersona = personas.find(p => p.id === currentClient.personaId);

    try {
      await addDoc(collection(db, 'broker_clients'), {
        ...currentClient,
        personaName: selectedPersona?.name || 'Nenhuma',
        brokerId: user.uid,
        createdAt: new Date(),
      });
      toast({ title: 'Cliente Salvo!', description: 'O novo cliente foi cadastrado.' });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAuth || isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UserPlus /> Meus Clientes</CardTitle>
            <CardDescription>Cadastre e gerencie seus clientes e imóveis de interesse.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={openDialog}>
            <PlusCircle className="h-4 w-4" />
            Cadastrar Cliente
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
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
                  <TableCell>{client.personaName || 'Não definida'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon"><FilePen className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
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
                    <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                    <DialogDescription>Preencha os dados para cadastrar um novo cliente em sua carteira.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Cliente</Label>
                        <Input id="name" value={currentClient.name} onChange={e => setCurrentClient(p => ({...p, name: e.target.value}))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={currentClient.email} onChange={e => setCurrentClient(p => ({...p, email: e.target.value}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" type="tel" value={currentClient.phone} onChange={e => setCurrentClient(p => ({...p, phone: e.target.value}))} />
                        </div>
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
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Cliente'}
                    </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </>
  );
}
