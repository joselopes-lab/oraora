
'use client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useAuthContext } from "@/firebase";
import { doc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ClientSideDate = ({ dateString, options }: { dateString: string, options?: Intl.DateTimeFormatOptions }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    setFormattedDate(new Date(dateString).toLocaleString('pt-BR', options));
  }, [dateString, options]);

  // Return a placeholder or the formatted date
  return <>{formattedDate || '...'}</>;
};

type Comment = {
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  type: 'public' | 'internal';
};

type Attachment = {
  name: string;
  url: string;
  size: number;
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  agentId?: string;
  agentName?: string;
  status: 'Novo' | 'Em Andamento' | 'Aguardando Cliente' | 'Fechado';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  category: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  attachments?: Attachment[];
};

export default function TicketDetailPage() {
    const params = useParams();
    const { id } = params;
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthContext();
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState<'public' | 'internal'>('public');

    const ticketDocRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'tickets', id as string) : null),
        [firestore, id]
    );

    const { data: ticket, isLoading } = useDoc<Ticket>(ticketDocRef);

    const handleDelete = () => {
        if (!ticketDocRef) return;
        deleteDocumentNonBlocking(ticketDocRef);
        toast({ title: 'Ticket excluído!', description: 'O ticket foi removido com sucesso.' });
        router.push('/dashboard/admin/tickets');
    };
    
    const handleStatusChange = (newStatus: Ticket['status']) => {
        if (!ticketDocRef) return;
        setDocumentNonBlocking(ticketDocRef, { status: newStatus, updatedAt: new Date().toISOString() }, { merge: true });
        toast({ title: 'Status atualizado!', description: `O ticket agora está: ${newStatus}` });
    };
    
    const handleAddComment = async () => {
        if (!newComment.trim() || !user || !ticketDocRef || !ticket) return;

        const commentData: Comment = {
            author: user.displayName || 'Admin',
            authorId: user.uid,
            content: newComment,
            createdAt: new Date().toISOString(),
            type: commentType,
        };

        try {
            await setDocumentNonBlocking(ticketDocRef, { 
                comments: arrayUnion(commentData),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setNewComment('');
            toast({ title: "Resposta Enviada!", description: "Sua mensagem foi adicionada ao ticket." });
        } catch (error) {
            console.error("Erro ao adicionar comentário:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível enviar sua resposta." });
        }
    };


    if (isLoading) {
        return <div>Carregando ticket...</div>;
    }

    if (!ticket) {
        return <div>Ticket não encontrado.</div>;
    }

    return (
        <AlertDialog>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-secondary mb-3 font-medium">
                        <Link className="hover:text-primary transition-colors" href="/dashboard/admin/tickets">Tickets de Suporte</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-text-main">Detalhes do Ticket</span>
                    </nav>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded border border-gray-200">#{ticket.id.substring(0, 6).toUpperCase()}</span>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">{ticket.title}</h1>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="text-sm shadow-sm"><span className="material-symbols-outlined text-[18px]">edit</span><span className="hidden sm:inline">Editar Ticket</span></Button>
                    <Button variant="outline" className="text-sm shadow-sm"><span className="material-symbols-outlined text-[18px]">person_add</span><span className="hidden sm:inline">Atribuir</span></Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="outline" className="text-sm shadow-sm group-hover:border-gray-300">
                                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>Mudar Status<span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStatusChange('Em Andamento')}>Em Andamento</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange('Aguardando Cliente')}>Aguardando Cliente</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange('Fechado')} className="text-red-600 focus:bg-red-50 focus:text-red-600">Fechado</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                            Excluir Ticket
                        </Button>
                    </AlertDialogTrigger>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-text-secondary">description</span>
                            <h3 className="text-lg font-bold text-text-main">Descrição Detalhada do Problema</h3>
                        </div>
                        <div className="prose prose-sm text-text-main max-w-none leading-relaxed">
                            <p className="mb-4">{ticket.description}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-secondary">history</span>
                                <h3 className="text-lg font-bold text-text-main">Histórico de Interações</h3>
                            </div>
                            <span className="text-xs font-medium text-text-secondary bg-background-light px-2.5 py-1 rounded-full border border-gray-200">{ticket.comments?.length || 0} comentários</span>
                        </div>
                        <div className="space-y-8 mb-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                            {ticket.comments?.map((comment, index) => (
                                <div key={index} className="relative flex gap-4">
                                    <div className="relative z-10 shrink-0">
                                        <div className={`size-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white ring-1 ring-gray-100 ${comment.type === 'internal' ? 'bg-yellow-50 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {comment.author.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-bold text-text-main">{comment.author}</p>
                                            <span className="text-xs text-text-secondary"><ClientSideDate dateString={comment.createdAt} /></span>
                                        </div>
                                        <div className={`p-4 rounded-lg rounded-tl-none border text-sm text-text-main ${comment.type === 'internal' ? 'bg-yellow-50/50 border-yellow-100 italic' : 'bg-background-light border-gray-100'}`}>
                                            <p>{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-background-light p-1 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-secondary focus-within:border-transparent transition-all">
                            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} className="w-full bg-white rounded-lg p-4 text-sm text-text-main placeholder-gray-400 border-none focus:ring-0 resize-y min-h-[100px]" placeholder="Escreva um comentário público ou nota interna..."></Textarea>
                            <div className="flex items-center justify-between px-3 py-2 bg-background-light rounded-b-lg">
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-text-secondary hover:text-text-main hover:bg-gray-200 rounded-full transition-colors" title="Anexar arquivo"><span className="material-symbols-outlined text-[20px]">attach_file</span></button>
                                    <button className="p-2 text-text-secondary hover:text-text-main hover:bg-gray-200 rounded-full transition-colors" title="Formatação"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input onChange={(e) => setCommentType(e.target.checked ? 'internal' : 'public')} className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500" type="checkbox"/>
                                        <span className="text-xs font-medium text-text-secondary">Nota Interna</span>
                                    </label>
                                    <Button onClick={handleAddComment} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 shadow-lg">Enviar Resposta</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-5 pb-2 border-b border-gray-50">Detalhes do Ticket</h3>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-text-secondary block mb-1.5">Status</span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 w-fit">{ticket.status}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-text-secondary block mb-1.5">Prioridade</span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold border border-red-100 w-fit"><span className="material-symbols-outlined text-[14px]">priority_high</span> {ticket.priority}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5">Categoria</span>
                                <div className="flex items-center gap-2 bg-background-light p-2 rounded-lg border border-gray-100">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">dns</span>
                                    <span className="text-sm font-medium text-text-main">{ticket.category}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5">Data de Abertura</span>
                                <p className="text-sm font-medium text-text-main"><ClientSideDate dateString={ticket.createdAt} /></p>
                            </div>
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5">Última Atualização</span>
                                <p className="text-sm font-medium text-text-main"><ClientSideDate dateString={ticket.updatedAt} /></p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-5 pb-2 border-b border-gray-50">Pessoas Envolvidas</h3>
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs text-text-secondary block mb-2">Solicitante (Cliente)</span>
                                <div className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 hover:bg-background-light rounded-lg transition-colors">
                                    <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-200">{ticket.clientName.charAt(0)}</div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main group-hover:text-primary-hover transition-colors">{ticket.clientName}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-text-secondary block mb-2">Responsável (Agente)</span>
                                 <div className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 hover:bg-background-light rounded-lg transition-colors">
                                    <div className="size-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200"><span className="material-symbols-outlined text-gray-400 text-2xl m-2">person</span></div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main group-hover:text-primary-hover transition-colors">{ticket.agentName || 'Não atribuído'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Anexos</h3>
                            <button className="text-xs font-bold text-primary-hover hover:underline">Adicionar</button>
                        </div>
                        <div className="space-y-3">
                            {ticket.attachments?.map((file, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-secondary/30 hover:bg-background-light transition-all cursor-pointer group">
                                    <div className={`size-8 rounded flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-[18px]">attachment</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-text-main truncate group-hover:text-blue-500 transition-colors">{file.name}</p>
                                        <p className="text-[10px] text-text-secondary">{file.size} KB</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
             <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o ticket.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Sim, excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
