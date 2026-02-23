
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useCollection, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, getDocs, limit } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';


type Note = {
  text: string;
  createdAt: string;
  author: string;
};

type Event = {
  id: string;
  brokerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  duration?: string; // in minutes
  type: 'reuniao' | 'visita' | 'tarefa' | 'particular' | 'outro';
  description?: string;
  location?: string;
  client?: string;
  clientId?: string;
  broker?: string;
  completed?: boolean;
  notes?: Note[];
};

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  propertyInterest: string;
  createdAt: string;
};


const eventTypeDetails: { [key: string]: { label: string, color: string, icon: string } } = {
  reuniao: { label: 'Reunião', color: 'bg-purple-500', icon: 'groups' },
  visita: { label: 'Visita', color: 'bg-blue-500', icon: 'key' },
  tarefa: { label: 'Tarefa', color: 'bg-green-500', icon: 'check_box' },
  particular: { label: 'Particular', color: 'bg-amber-500', icon: 'person' },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: 'more_horiz' },
};

const getTailwindColor = (type: string, completed?: boolean) => {
    if (completed) {
      return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-400' }
    }
    const colors: { [key: string]: { bg: string; border: string; text: string; } } = {
        reuniao: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
        visita: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
        tarefa: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
        particular: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' },
        outro: { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-700' },
    };
    return colors[type] || colors.outro;
}

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [noteToDeleteIndex, setNoteToDeleteIndex] = useState<number | null>(null);
    const [newNote, setNewNote] = useState('');

    const eventDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'events', id) : null),
      [firestore, id]
    );

    const { data: event, isLoading } = useDoc<Event>(eventDocRef);

    const todayEventsQuery = useMemoFirebase(
      () => {
        if (user && firestore) {
          return query(collection(firestore, 'events'), where('brokerId', '==', user.uid), where('date', '==', format(new Date(), 'yyyy-MM-dd')))
        }
        return null;
      },
      [user, firestore]
    );
    const { data: todayEvents, isLoading: areTodayEventsLoading } = useCollection<Event>(todayEventsQuery);
    
    // Query to find the client based on the name stored in the event
    const clientQuery = useMemoFirebase(
      () => {
        if (user && firestore && event) {
            const leadsCollection = collection(firestore, 'leads');
            if (event.clientId) {
                return query(leadsCollection, where('__name__', '==', event.clientId), limit(1));
            }
            if (event.client) { // Fallback for older events
                return query(leadsCollection, where('brokerId', '==', user.uid), where('name', '==', event.client), limit(1));
            }
        }
        return null;
      },
      [user, firestore, event]
    );
    const { data: clientData, isLoading: isClientLoading } = useCollection<Lead>(clientQuery);
    const client = clientData?.[0]; // Get the first match


    const handleDelete = async () => {
        if (!eventDocRef) return;
        setIsDeleting(true);
        
        deleteDocumentNonBlocking(eventDocRef);
        toast({
            title: 'Tarefa Excluída',
            description: 'O evento foi removido da sua agenda.',
        });
        router.push('/dashboard/agenda');
    };
    
    const handleStatusChange = (isCompleted: boolean) => {
      if (!eventDocRef) return;

      setDocumentNonBlocking(eventDocRef, { completed: isCompleted }, { merge: true });

      toast({
        title: `Tarefa ${isCompleted ? 'Concluída' : 'Reaberta'}!`,
        description: `O status do evento foi atualizado.`,
      });
    };
    
    const handleAddNote = () => {
      if (!newNote.trim() || !user || !eventDocRef || !event) return;
      
      const noteToAdd: Note = {
        text: newNote,
        createdAt: new Date().toISOString(),
        author: user.displayName || 'Usuário',
      };
      
      const updatedNotes = [...(event.notes || []), noteToAdd];
      setDocumentNonBlocking(eventDocRef, { notes: updatedNotes }, { merge: true });
      
      setNewNote('');
      toast({
        title: 'Nota Adicionada!',
        description: 'Sua observação foi salva no histórico.',
      });
    };
    
    const handleDeleteNote = () => {
        if (noteToDeleteIndex === null || !eventDocRef || !event?.notes) return;

        const updatedNotes = event.notes.filter((_, index) => index !== noteToDeleteIndex);
        setDocumentNonBlocking(eventDocRef, { notes: updatedNotes }, { merge: true });
        
        toast({
            title: 'Nota Removida!',
            description: 'A observação foi excluída do histórico.',
        });
        setNoteToDeleteIndex(null); // Close dialog
    };


    if (isLoading || isClientLoading) {
        return <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full"><p>Carregando detalhes da tarefa...</p></main>;
    }

    if (!event) {
        return <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full"><p>Tarefa não encontrada.</p></main>;
    }
    
    const details = eventTypeDetails[event.type] || eventTypeDetails.outro;

    const googleMapsUrl = event.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
      : '#';

    const eventDate = parseISO(event.date);


    return (
    <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
        <AlertDialog>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                    <Link className="hover:text-primary transition-colors" href="/dashboard/agenda">Agenda</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <span className="text-text-main">Detalhes da Tarefa</span>
                </nav>
                <h1 className="text-3xl font-bold text-text-main tracking-tight">Detalhes da Tarefa</h1>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.back()} className="bg-white border border-gray-200 hover:border-gray-300 text-text-secondary hover:text-text-main font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all duration-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Voltar
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className={cn(`h-1.5 w-full shadow-[0_0_10px_var(--tw-shadow-color)]`, event.completed ? 'bg-gray-300' : details.color)} style={{'--tw-shadow-color': event.completed ? '#d1d5db' : details.color}}></div>
                <div className="p-6 md:p-8">
                     <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <span className={cn(`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold`, event.completed ? 'bg-gray-100 text-gray-500' : `${getTailwindColor(event.type).bg} text-text-main border border-blue-500/30`)}>
                           <div className={cn(`size-2 rounded-full`, event.completed ? 'bg-gray-400' : details.color)}></div>
                            {details.label}
                        </span>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline" className="flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-200">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Excluir
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                        {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            <Button asChild className="group flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 bg-secondary text-white hover:text-black rounded-lg text-sm font-bold shadow-glow hover:shadow-lg transition-all transform hover:scale-[1.02]">
                                <Link href="#">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    <span className="text-white group-hover:text-black">Editar Tarefa</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="mb-8">
                        <h2 className={cn("text-2xl md:text-3xl font-bold text-text-main mb-3 leading-tight", event.completed && 'line-through text-gray-400')}>{event.title}</h2>
                        <p className="text-text-secondary text-lg leading-relaxed">{event.description}</p>
                    </div>
                    <div className="h-px bg-gray-100 w-full mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 mb-10">
                        <div className="flex items-start gap-4 group">
                            <div className="size-11 rounded-xl bg-gray-50 group-hover:bg-background-light border border-gray-100 flex items-center justify-center text-text-secondary transition-colors shrink-0">
                                <span className="material-symbols-outlined">calendar_month</span>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Data e Hora</p>
                                <p className="text-text-main font-bold text-base capitalize">{format(eventDate, "eeee, dd 'de' MMMM", { locale: ptBR })}</p>
                                <p className="text-text-secondary text-sm">{event.time}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4 group">
                            <div className="size-11 rounded-xl bg-gray-50 group-hover:bg-background-light border border-gray-100 flex items-center justify-center text-text-secondary transition-colors shrink-0">
                                <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Duração</p>
                                <p className="text-text-main font-bold text-base">{event.duration ? `${event.duration} minutos` : 'N/A'}</p>
                                <p className="text-text-secondary text-sm">Tempo padrão estimado</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4 group md:col-span-2 lg:col-span-1">
                            <div className="size-11 rounded-xl bg-gray-50 group-hover:bg-background-light border border-gray-100 flex items-center justify-center text-text-secondary transition-colors shrink-0">
                                <span className="material-symbols-outlined">location_on</span>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Localização</p>
                                <p className="text-text-main font-bold text-base">{event.location || 'Não especificado'}</p>
                                {event.location && (
                                <a className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline" href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                    <span className="material-symbols-outlined text-[14px]">map</span>
                                    Abrir no mapa
                                </a>
                                )}
                            </div>
                        </div>
                         <div className="flex items-start gap-4 group md:col-span-2 lg:col-span-1">
                            <div className="size-11 rounded-xl bg-gray-50 group-hover:bg-background-light border border-gray-100 flex items-center justify-center text-text-secondary transition-colors shrink-0">
                                <span className="material-symbols-outlined">flag</span>
                            </div>
                            <div>
                                 <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-2">Status da Tarefa</p>
                                 <label className="flex items-center gap-3 cursor-pointer group/check">
                                    <div className="relative flex items-center">
                                        <Checkbox 
                                          id="status" 
                                          checked={event.completed}
                                          onCheckedChange={handleStatusChange}
                                          className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-green-600 checked:bg-green-600 hover:border-green-600 focus:ring-0" 
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-text-main group-hover/check:text-green-600 transition-colors">Marcar como concluída</span>
                                </label>
                            </div>
                        </div>
                    </div>
                     <div className="bg-background-light border border-gray-200/60 rounded-xl p-6 mb-8">
                        <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600 text-[18px]">group</span>
                            Participantes Envolvidos
                        </h3>
                        <Sheet>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {event.client && (
                            <SheetTrigger asChild>
                                <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                    <Avatar className="size-12">
                                        <AvatarFallback className="text-blue-600 font-bold bg-blue-100 border border-blue-200">{event.client.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase mb-0.5">Cliente</p>
                                        <div className="text-text-main font-bold group-hover:text-blue-600 transition-colors">{event.client}</div>
                                        <p className="text-xs text-text-secondary">Interesse: Compra</p>
                                    </div>
                                    <span className="material-symbols-outlined ml-auto text-gray-300 group-hover:text-blue-600">open_in_new</span>
                                </div>
                            </SheetTrigger>
                            )}
                            {event.broker && (
                            <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                 <Avatar className="size-12">
                                    <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4Bd-j3fd8KmmbDFAJGjXzzgzHR6IXMjxYcmduuS0a_zbiX0pqFw4Ha3clelbTk9CKjdIj3cZnTxsxRVUYxue2A4NqKWTkCFNcQYVRtZmAXz0VIUCFe0xcsZuh6AHNBSQrKpGl7FBS8ELlJFj4q5cU1gu9mcUd4NmcM9nh1P2YQt7jL2kSdj99ZW0hJIdkKvA116f0sBXsGs4W3ohtXA6mTK1unXdqV3Bm8BDMzI_oLOHnRR7jJKtSFzB_xVbuJTiju-QRTF6PpBk" />
                                    <AvatarFallback>AS</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase mb-0.5">Corretor Responsável</p>
                                    <div className="text-text-main font-bold group-hover:text-blue-600 transition-colors">{event.broker}</div>
                                </div>
                                <span className="material-symbols-outlined ml-auto text-gray-300 group-hover:text-blue-600">open_in_new</span>
                            </div>
                            )}
                        </div>
                         <SheetContent className="w-full max-w-lg p-0 flex flex-col">
                            <SheetHeader>
                                <VisuallyHidden>
                                    <SheetTitle>Detalhes do Cliente</SheetTitle>
                                    <SheetDescription>Exibe os detalhes completos do cliente selecionado.</SheetDescription>
                                </VisuallyHidden>
                            </SheetHeader>
                            {client ? (
                                <>
                                <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-text-main">Detalhes do Cliente</h2>
                                        <SheetClose asChild>
                                            <button className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-text-main transition-colors">
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </SheetClose>
                                    </div>
                                </div>
                                <div className="flex-grow overflow-y-auto p-6 space-y-8 bg-background-light">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="size-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl border-4 border-white shadow-soft mb-4">
                                            {client.name.charAt(0)}
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-main">{client.name}</h3>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-blue-600/10 text-text-main text-xs font-bold border border-blue-600/30">
                                            <span className="size-1.5 rounded-full bg-blue-600"></span>
                                            Cliente Ativo
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href={`mailto:${client.email}`} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-600 hover:shadow-md transition-all group">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-600 mb-2">mail</span>
                                            <span className="text-xs text-text-secondary">E-mail</span>
                                            <span className="text-sm font-bold text-text-main truncate w-full text-center">{client.email}</span>
                                        </a>
                                        <a href={`tel:${client.phone}`} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-600 hover:shadow-md transition-all group">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-600 mb-2">call</span>
                                            <span className="text-xs text-text-secondary">Telefone / WhatsApp</span>
                                            <span className="text-sm font-bold text-text-main">{client.phone}</span>
                                        </a>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-600 text-[18px]">favorite</span>
                                            Interesses em Imóveis
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {client.propertyInterest.split(',').map(interest => (
                                                <span key={interest} className="px-3 py-1.5 rounded-lg bg-background-light border border-gray-200 text-xs font-medium text-text-main">{interest.trim()}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-600 text-[18px]">history</span>
                                            Histórico de Contato
                                        </h4>
                                        <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                                            <div className="relative">
                                                <div className="absolute -left-[19px] top-1.5 size-2.5 rounded-full bg-blue-600 border-2 border-white ring-1 ring-gray-100"></div>
                                                <p className="text-xs text-text-secondary font-medium mb-0.5">23 Out, 16:30</p>
                                                <p className="text-sm font-bold text-text-main">Confirmação de Visita</p>
                                                <p className="text-xs text-text-secondary mt-1">Via WhatsApp (Roberto Almeida)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-glow hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                        <Link href={`/dashboard/clientes/editar/${client.id}`}>
                                            Ver Perfil Completo
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </Link>
                                    </Button>
                                </div>
                                </>
                            ) : (
                                <div className="p-6 text-center">
                                    <p>Cliente não encontrado ou detalhes não disponíveis.</p>
                                </div>
                            )}
                        </SheetContent>
                        </Sheet>
                    </div>
                     <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400">notes</span>
                                Notas e Observações
                            </h3>
                        </div>
                         <div className="space-y-4 mb-6">
                            {event.notes?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((note, index) => (
                                <div key={index} className="flex gap-3 group">
                                    <Avatar className="size-8">
                                         <AvatarFallback>{note.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-text-main">{note.author}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-text-secondary">{format(new Date(note.createdAt), "dd MMM, HH:mm", { locale: ptBR })}</span>
                                                 <AlertDialogTrigger asChild>
                                                    <button onClick={() => setNoteToDeleteIndex(index)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </AlertDialogTrigger>
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-secondary">{note.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <textarea 
                              className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 text-sm text-text-main placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all resize-none h-24" 
                              placeholder="Adicione uma nota rápida sobre esta tarefa..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            ></textarea>
                            <div className="absolute bottom-3 right-3">
                                <button onClick={handleAddNote} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newNote.trim()}>
                                    <span className="material-symbols-outlined text-[14px]">send</span> Salvar Nota
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
          </div>
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">event_note</span>
                            Tarefas de Hoje
                        </h3>
                        <span className="text-xs font-medium text-text-secondary bg-gray-50 px-2 py-1 rounded">{format(new Date(), 'dd MMM', { locale: ptBR })}</span>
                    </div>
                    <div className="space-y-4">
                        {areTodayEventsLoading && <p className="text-sm text-text-secondary text-center py-4">Carregando tarefas...</p>}
                        {!areTodayEventsLoading && todayEvents && todayEvents.length > 0 ? todayEvents.map(event => {
                             const style = getTailwindColor(event.type, event.completed);
                             const eventTypeLabel = eventTypeDetails[event.type as keyof typeof eventTypeDetails]?.label || 'Evento';
                            return (
                                <Link key={event.id} href={`/dashboard/agenda/${event.id}`} className="flex gap-4 group cursor-pointer">
                                    <div className="flex flex-col items-center">
                                        <span className={cn("text-xs font-bold", event.completed ? 'text-gray-400 line-through' : 'text-text-main')}>{event.time || ''}</span>
                                        <div className="h-full w-px bg-gray-200 mt-1 group-hover:bg-primary transition-colors"></div>
                                    </div>
                                    <div className={cn(`flex-1 rounded-lg p-3 hover:shadow-md transition-all border border-transparent hover:border-gray-100 hover:bg-white relative overflow-hidden`, style.bg, event.completed && 'bg-gray-50')}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.border.replace('border-', 'bg-')}`}></div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={cn(`text-[10px] font-bold uppercase tracking-wider`, style.text)}>{eventTypeLabel}</span>
                                            <span className="material-symbols-outlined text-gray-400 text-[16px]">more_vert</span>
                                        </div>
                                        <h4 className={cn("text-sm font-bold text-text-main leading-tight mb-1", event.completed && 'line-through text-gray-500')}>{event.title}</h4>
                                        {event.description && <p className={cn("text-xs text-text-secondary truncate", event.completed && 'line-through')}>{event.description}</p>}
                                    </div>
                                </Link>
                            )
                        }) : (
                            <p className="text-sm text-text-secondary text-center py-4">Nenhuma tarefa para hoje.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir Nota?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A nota será removida permanentemente do histórico desta tarefa.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setNoteToDeleteIndex(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
                    Sim, excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </main>
    )
}

  