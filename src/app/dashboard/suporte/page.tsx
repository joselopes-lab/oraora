
'use client';
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useAuthContext } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Ticket = {
  id: string;
  title: string;
  status: 'Novo' | 'Em Andamento' | 'Aguardando Cliente' | 'Fechado';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  category: string;
  createdAt: Timestamp;
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
      () => (firestore && user ? query(collection(firestore, 'tickets'), where('clientId', '==', user.uid), orderBy('createdAt', 'desc')) : null),
      [firestore, user]
    );

    const { data: tickets, isLoading } = useCollection<Ticket>(ticketsQuery);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Meus Tickets de Suporte</h1>
                    <p className="text-text-secondary mt-1">Acompanhe suas solicitações e veja as respostas da nossa equipe.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/suporte/novo">
                        <span className="material-symbols-outlined mr-2">add</span>
                        Abrir Novo Ticket
                    </Link>
                </Button>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Título</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aberto em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow><TableCell colSpan={6} className="text-center p-6">Carregando seus tickets...</TableCell></TableRow>
                        )}
                        {!isLoading && tickets && tickets.length > 0 ? (
                            tickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">{ticket.title}</TableCell>
                                    <TableCell>{ticket.category}</TableCell>
                                    <TableCell>
                                        <Badge className={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                                    </TableCell>
                                    <TableCell>{ticket.createdAt.toDate().toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/suporte/${ticket.id}`}>
                                                Ver Ticket
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-10">
                                        <p className="font-semibold">Nenhum ticket encontrado.</p>
                                        <p className="text-sm text-gray-500">Clique em "Abrir Novo Ticket" para começar.</p>
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
