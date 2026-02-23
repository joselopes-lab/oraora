
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
import { TableRow, TableCell } from "@/components/ui/table";

type Ticket = {
  id: string;
  title: string;
  clientName: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  agentName?: string;
  createdAt: string;
  status: 'Novo' | 'Em Andamento' | 'Aguardando Cliente' | 'Fechado';
};

// Add User type
type User = {
    id: string;
    username: string;
}


export default function TicketsDashboardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const ticketsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'tickets')) : null),
      [firestore]
    );

    const { data: tickets, isLoading: areTicketsLoading } = useCollection<Ticket>(ticketsQuery);

    // Fetch users
    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users')) : null),
        [firestore]
    );
    const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

    const isLoading = areTicketsLoading || areUsersLoading;


    const openTickets = useMemo(() => tickets?.filter(t => t.status !== 'Fechado').length || 0, [tickets]);
    const newTicketsToday = useMemo(() => {
        if (!tickets) return 0;
        const today = new Date().toISOString().split('T')[0];
        return tickets.filter(t => t.createdAt.startsWith(today) && t.status === 'Novo').length;
    }, [tickets]);
    const closedThisMonth = useMemo(() => {
         if (!tickets) return 0;
        const currentMonth = new Date().toISOString().substring(0, 7);
        return tickets.filter(t => t.status === 'Fechado' && t.createdAt.startsWith(currentMonth)).length;
    }, [tickets]);

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
            clientName: selectedUser.username, // Get clientName from the selected user
            status: 'Novo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await addDocumentNonBlocking(collection(firestore, 'tickets'), ticketData);
        toast({ title: "Ticket Criado!", description: `O ticket "${data.title}" foi aberto com sucesso.` });
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                        <a className="hover:text-primary transition-colors" href="#">Dashboard</a>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-text-main">Tickets de Suporte</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Visão Geral de Tickets</h1>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                         <Button className="bg-secondary hover:bg-primary-hover text-secondary-foreground font-bold py-2.5 px-6 rounded-lg shadow-glow hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-[1.02]">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Abrir Novo Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <VisuallyHidden>
                                <DialogTitle>Cadastrar Novo Ticket</DialogTitle>
                                <DialogDescription>
                                    Preencha o formulário abaixo para registrar um novo chamado. Assegure-se de fornecer todos os detalhes necessários para um atendimento eficiente.
                                </DialogDescription>
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
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">confirmation_number</span>
                        </div>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Tickets Abertos</p>
                    <h3 className="text-3xl font-bold text-text-main">{isLoading ? '...' : openTickets}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-secondary/20 text-text-main flex items-center justify-center">
                            <span className="material-symbols-outlined">new_releases</span>
                        </div>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Novos Tickets (Hoje)</p>
                    <h3 className="text-3xl font-bold text-text-main">{isLoading ? '...' : newTicketsToday}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Fechados no Mês</p>
                    <h3 className="text-3xl font-bold text-text-main">{isLoading ? '...' : closedThisMonth}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">timer</span>
                        </div>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Tempo Médio Resposta</p>
                    <h3 className="text-3xl font-bold text-text-main">2h 15m</h3>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input className="w-full pl-10 pr-4 py-2 bg-background-light border-transparent focus:bg-white border focus:border-secondary rounded-lg text-sm text-text-main placeholder-gray-400 focus:ring-0 transition-all" placeholder="Buscar por ticket, cliente ou ID..." type="text" />
                </div>
                <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0">
                    <select className="bg-white border border-gray-200 text-text-secondary text-sm rounded-lg focus:ring-secondary focus:border-secondary block p-2 px-3 min-w-[140px] cursor-pointer hover:border-gray-300">
                        <option>Status: Todos</option>
                        <option>Novo</option>
                        <option>Em Andamento</option>
                        <option>Aguardando</option>
                        <option>Resolvido</option>
                    </select>
                    <select className="bg-white border border-gray-200 text-text-secondary text-sm rounded-lg focus:ring-secondary focus:border-secondary block p-2 px-3 min-w-[140px] cursor-pointer hover:border-gray-300">
                        <option>Prioridade: Todas</option>
                        <option>Alta</option>
                        <option>Média</option>
                        <option>Baixa</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 bg-background-light hover:bg-gray-100 text-text-main rounded-lg text-sm font-bold border border-gray-200 transition-colors whitespace-nowrap">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                        Filtros
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background-light border-b border-gray-100">
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Ticket / Assunto</th>
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Cliente</th>
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Prioridade</th>
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Responsável</th>
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Data Abertura</th>
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="p-5 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading && (
                                <TableRow><TableCell colSpan={7} className="text-center p-6">Carregando tickets...</TableCell></TableRow>
                            )}
                            {!isLoading && tickets?.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer">
                                <td className="p-5">
                                    <Link href={`/dashboard/admin/tickets/${ticket.id}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                            <div>
                                                <p className="font-bold text-text-main text-sm">{ticket.title}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">ID: {ticket.id.substring(0,6)}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{ticket.clientName.charAt(0)}</div>
                                        <span className="text-sm font-medium text-text-main">{ticket.clientName}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                                        ticket.priority === 'Alta' || ticket.priority === 'Urgente' ? 'bg-red-50 text-red-600 border-red-100' :
                                        ticket.priority === 'Média' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <span className="text-sm text-text-secondary">{ticket.agentName || 'Não atribuído'}</span>
                                </td>
                                <td className="p-5">
                                    <p className="text-sm font-medium text-text-main">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        ticket.status === 'Novo' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        ticket.status === 'Em Andamento' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <Link href={`/dashboard/admin/tickets/${ticket.id}`} className="text-gray-400 hover:text-secondary transition-colors">
                                        <span className="material-symbols-outlined">navigate_next</span>
                                    </Link>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
                    <p className="text-xs text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{tickets?.length || 0}</span> de <span className="font-bold text-text-main">{tickets?.length || 0}</span> tickets</p>
                    <div className="flex items-center gap-2">
                        <button className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 hover:text-text-main transition-all disabled:opacity-50">
                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        </button>
                        <button className="size-8 rounded-lg bg-secondary text-white font-bold text-xs shadow-glow">1</button>
                        <button className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 hover:text-text-main transition-all text-xs font-medium">2</button>
                        <button className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 hover:text-text-main transition-all text-xs font-medium">3</button>
                        <button className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 hover:text-text-main transition-all">
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
