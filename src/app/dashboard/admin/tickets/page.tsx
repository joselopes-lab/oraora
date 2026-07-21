'use client';
import Link from "next/link";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TicketForm, { TicketFormData } from "./components/ticket-form";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  title: string;
  clientName: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  agentName?: string;
  createdAt: string;
  status: 'Novo' | 'Em Andamento' | 'Aguardando Cliente' | 'Fechado';
};

type User = {
    id: string;
    username: string;
}

const getStatusVariant = (status: Ticket['status']) => {
  switch (status) {
    case 'Novo': return 'bg-blue-100 text-blue-800';
    case 'Em Andamento': return 'bg-yellow-100 text-yellow-800';
    case 'Aguardando Cliente': return 'bg-orange-100 text-orange-800';
    case 'Fechado': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100';
  }
};

export default function TicketsDashboardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const ticketsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'tickets')) : null),
      [firestore]
    );

    const { data: rawTickets, isLoading: areTicketsLoading } = useCollection<Ticket>(ticketsQuery);

    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users')) : null),
        [firestore]
    );
    const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

    const isLoading = areTicketsLoading || areUsersLoading;

    const sortedTickets = useMemo(() => {
        if (!rawTickets) return [];
        return [...rawTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [rawTickets]);

    const openTicketsCount = useMemo(() => sortedTickets.filter(t => t.status !== 'Fechado').length, [sortedTickets]);

    const handleSaveTicket = async (data: TicketFormData) => {
        if (!firestore) return;
        
        const selectedUser = users?.find(u => u.id === data.clientId);
        if (!selectedUser) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Cliente selecionado não é válido.',
            });
            return;
        }

        const ticketData = {
            ...data,
            clientName: selectedUser.username,
            status: 'Novo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await addDocumentNonBlocking(collection(firestore, 'tickets'), ticketData);
        toast({ title: "Ticket Criado!", description: `O ticket "${data.title}" foi aberto com sucesso.` });
        setIsModalOpen(false);
    };

    return (
        <div className="text-left animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                        <Link className="hover:text-primary transition-colors cursor-pointer" href="/dashboard">Painel</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-text-main">Gestão de Tickets</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight uppercase">Central de Suporte</h1>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                         <Button className="bg-secondary hover:bg-primary text-white hover:text-black font-bold h-11 px-6 rounded-xl shadow-glow transition-all flex items-center gap-2 cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Abrir Novo Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <VisuallyHidden>
                                <DialogTitle>Cadastrar Novo Ticket</DialogTitle>
                                <DialogDescription>Registro administrativo de chamado.</DialogDescription>
                            </VisuallyHidden>
                        </DialogHeader>
                        <TicketForm 
                            onSave={handleSaveTicket} 
                            onCancel={() => setIsModalOpen(false)} 
                            users={users || []}
                            isLoadingUsers={areUsersLoading}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card className="shadow-soft border-slate-100 bg-white">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abertos</p>
                        <h3 className="text-3xl font-black text-slate-900">{isLoading ? '...' : openTicketsCount}</h3>
                    </CardContent>
                </Card>
                <Card className="shadow-soft border-slate-100 bg-white">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Recebido</p>
                        <h3 className="text-3xl font-black text-slate-900">{isLoading ? '...' : sortedTickets.length}</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Ticket / Assunto</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Cliente</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Prioridade</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Responsável</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center p-12 text-slate-400 italic">Carregando tickets...</TableCell></TableRow>
                        ) : sortedTickets.map(ticket => (
                            <TableRow key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="pl-6 py-4">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{ticket.title}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {ticket.id.substring(0,6).toUpperCase()}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium text-sm">{ticket.clientName}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="border-none bg-slate-100 text-slate-600 font-black text-[9px] uppercase">
                                        {ticket.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-400 text-xs">{ticket.agentName || '---'}</TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn("border-none text-[9px] font-black uppercase px-2 py-0.5", getStatusVariant(ticket.status))}>
                                      {ticket.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button asChild variant="outline" size="sm" className="h-9 px-4 rounded-lg font-bold">
                                        <Link href={`/dashboard/admin/tickets/${ticket.id}`}>Gerenciar</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}