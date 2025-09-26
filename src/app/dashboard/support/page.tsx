
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, LifeBuoy, MoreHorizontal, CheckCircle, Clock, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TicketStatus = 'Aberto' | 'Em andamento' | 'Fechado';

interface Ticket {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: Timestamp;
}

const statusOptions: { value: TicketStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'Aberto', label: 'Aberto', icon: <Clock className="h-4 w-4 mr-2" /> },
    { value: 'Em andamento', label: 'Em andamento', icon: <Loader2 className="h-4 w-4 mr-2 animate-spin" /> },
    { value: 'Fechado', label: 'Fechado', icon: <CheckCircle className="h-4 w-4 mr-2" /> },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      setTickets(ticketsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching tickets: ", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar tickets' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    const ticketRef = doc(db, 'tickets', ticketId);
    try {
      await updateDoc(ticketRef, { status });
      toast({ title: "Status do Ticket Atualizado!" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erro", description: error.message });
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return 'Data inválida';
    return format(new Date(timestamp.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  const getStatusVariant = (status: TicketStatus) => {
    switch(status) {
        case 'Aberto': return 'destructive';
        case 'Em andamento': return 'secondary';
        case 'Fechado': return 'default';
        default: return 'outline';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LifeBuoy /> Tickets de Suporte</CardTitle>
        <CardDescription>Gerencie as solicitações de suporte enviadas pelo site.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                        <p>{ticket.name}</p>
                        <p className="text-xs text-muted-foreground">{ticket.email}</p>
                        {ticket.phone && <p className="text-xs text-muted-foreground">{ticket.phone}</p>}
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DialogTrigger asChild>
                                    <DropdownMenuItem>Ver Mensagem</DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Alterar Status</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {statusOptions.map(option => (
                                            <DropdownMenuItem key={option.value} onClick={() => handleStatusChange(ticket.id, option.value)} disabled={ticket.status === option.value}>
                                                {option.icon}
                                                {option.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{ticket.subject}</DialogTitle>
                                <DialogDescription>
                                    Enviado por: {ticket.name} ({ticket.email}) em {formatDate(ticket.createdAt)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                                {ticket.message}
                            </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum ticket de suporte encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
