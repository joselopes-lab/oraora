
'use client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useAuthContext } from "@/firebase";
import { doc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

type Comment = {
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  type: 'public' | 'internal';
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  agentName?: string;
  status: 'Novo' | 'Em Andamento' | 'Aguardando Cliente' | 'Fechado';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  category: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
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

export default function BrokerTicketDetailPage() {
    const params = useParams();
    const { id } = params;
    const firestore = useFirestore();
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [newComment, setNewComment] = useState('');

    const ticketDocRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'tickets', id as string) : null),
        [firestore, id]
    );

    const { data: ticket, isLoading } = useDoc<Ticket>(ticketDocRef);

    const handleAddComment = async () => {
        if (!newComment.trim() || !user || !ticketDocRef) return;

        const commentData: Comment = {
            author: user.displayName || 'Usuário',
            authorId: user.uid,
            content: newComment,
            createdAt: new Date().toISOString(),
            type: 'public', // Comments from brokers are always public
        };

        try {
            await setDocumentNonBlocking(ticketDocRef, { comments: arrayUnion(commentData), updatedAt: new Date().toISOString() }, { merge: true });
            setNewComment('');
            toast({ title: "Resposta Enviada!", description: "Sua mensagem foi adicionada ao ticket." });
        } catch (error) {
            console.error("Erro ao adicionar comentário:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível enviar sua resposta." });
        }
    };

    if (isLoading) return <div>Carregando ticket...</div>;
    if (!ticket) return <div>Ticket não encontrado.</div>;
    if (ticket.clientId !== user?.uid) return <div>Acesso negado.</div>;

    const publicComments = ticket.comments?.filter(c => c.type === 'public') || [];

    return (
        <div>
            <nav className="flex items-center gap-2 text-xs text-text-secondary mb-3 font-medium">
                <Link className="hover:text-primary transition-colors" href="/dashboard/suporte">Meus Tickets</Link>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span className="text-text-main">Detalhes do Ticket</span>
            </nav>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded border border-gray-200">#{ticket.id.substring(0, 6).toUpperCase()}</span>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">{ticket.title}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-text-secondary">description</span>
                            <h3 className="text-lg font-bold text-text-main">Descrição do Problema</h3>
                        </div>
                        <p className="text-text-main leading-relaxed">{ticket.description}</p>
                    </div>
                     <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <h3 className="text-lg font-bold text-text-main mb-4">Histórico de Respostas</h3>
                        <div className="space-y-6">
                            {publicComments.map((comment, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">{comment.author.charAt(0)}</div>
                                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-text-main">{comment.author}</span>
                                            <span className="text-xs text-text-secondary">{new Date(comment.createdAt).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            {publicComments.length === 0 && (
                                <p className="text-sm text-center text-gray-500 py-4">Nenhuma resposta ainda. Nossa equipe responderá em breve.</p>
                            )}
                        </div>
                         <div className="mt-6 pt-6 border-t border-gray-100">
                             <h4 className="text-base font-bold mb-2">Adicionar uma Resposta</h4>
                             <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Digite sua mensagem aqui..." rows={4} />
                             <Button onClick={handleAddComment} className="mt-4">Enviar Resposta</Button>
                         </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                         <div className="space-y-5">
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-semibold uppercase">Status</span>
                                <Badge className={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                            </div>
                             <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-semibold uppercase">Prioridade</span>
                                <Badge className={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                            </div>
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-semibold uppercase">Categoria</span>
                                <p className="text-sm font-medium text-text-main">{ticket.category}</p>
                            </div>
                             <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-semibold uppercase">Aberto em</span>
                                <p className="text-sm font-medium text-text-main">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
                            </div>
                             <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-semibold uppercase">Última Atualização</span>
                                <p className="text-sm font-medium text-text-main">{new Date(ticket.updatedAt).toLocaleString('pt-BR')}</p>
                            </div>
                         </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Agente Responsável</h3>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                {ticket.agentName ? ticket.agentName.charAt(0) : '?'}
                            </div>
                             <div>
                                <p className="text-sm font-bold text-text-main">{ticket.agentName || 'Não atribuído'}</p>
                                <p className="text-xs text-text-secondary">Equipe de Suporte Oraora</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
