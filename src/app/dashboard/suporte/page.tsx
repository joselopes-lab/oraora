'use client';
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useAuthContext } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import Link from "next/link";
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  title: string;
  status: 'Novo' | 'Em Andamento' | 'Aguardando Cliente' | 'Fechado';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  category: string;
  createdAt: string;
};

const getStatusVariant = (status: Ticket['status']) => {
  switch (status) {
    case 'Novo': return 'bg-blue-100 text-blue-800';
    case 'Em Andamento': return 'bg-yellow-100 text-yellow-800';
    case 'Aguardando Cliente': return 'bg-orange-100 text-orange-800';
    case 'Fechado': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100';
  }
};

const getPriorityVariant = (priority: Ticket['priority']) => {
  switch (priority) {
    case 'Baixa': return 'bg-green-100 text-green-800';
    case 'Média': return 'bg-yellow-100 text-yellow-800';
    case 'Alta': return 'bg-orange-100 text-orange-800';
    case 'Urgente': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100';
  }
};


export default function BrokerSupportPage() {
    const { user } = useAuthContext();
    const firestore = useFirestore();

    const ticketsQuery = useMemoFirebase(
      () => (firestore && user ? query(collection(firestore, 'tickets'), where('clientId', '==', user.uid)) : null),
      [firestore, user]
    );

    const { data: rawTickets, isLoading } = useCollection<Ticket>(ticketsQuery);

    const sortedTickets = useMemo(() => {
        if (!rawTickets) return [];
        return [...rawTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [rawTickets]);

    return (
        <div className="text-left animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight uppercase">Meus Tickets de Suporte</h1>
                    <p className="text-text-secondary mt-1">Acompanhe suas solicitações e veja as respostas da nossa equipe.</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary-hover text-slate-900 font-bold h-11 px-6 rounded-xl shadow-lg border-none">
                    <Link href="/dashboard/suporte/novo">
                        <span className="material-symbols-outlined mr-2">add</span>
                        Abrir Novo Ticket
                    </Link>
                </Button>
            </div>
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Título / Assunto</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Categoria</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Prioridade</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Aberto em</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center p-12 text-slate-400 italic">Carregando seus tickets...</TableCell></TableRow>
                        ) : sortedTickets.length > 0 ? (
                            sortedTickets.map(ticket => (
                                <TableRow key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-bold text-slate-900 pl-6">{ticket.title}</TableCell>
                                    <TableCell className="text-slate-500 text-xs font-medium">{ticket.category}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("border-none text-[10px] font-black uppercase px-2 py-0.5", getPriorityVariant(ticket.priority))}>
                                          {ticket.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={cn("border-none text-[10px] font-black uppercase px-2 py-0.5", getStatusVariant(ticket.status))}>
                                          {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-xs font-medium">
                                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button asChild variant="outline" size="sm" className="h-9 px-4 rounded-lg font-bold border-slate-200">
                                            <Link href={`/dashboard/suporte/${ticket.id}`}>
                                                Ver Detalhes
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-20 text-slate-400 italic">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-4xl opacity-20">confirmation_number</span>
                                        <p>Nenhum ticket encontrado.</p>
                                        <Link href="/dashboard/suporte/novo" className="text-primary font-bold hover:underline">Abrir meu primeiro chamado</Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}