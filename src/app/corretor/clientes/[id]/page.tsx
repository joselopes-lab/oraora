'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Query, DocumentData, documentId, updateDoc, addDoc, Timestamp, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, Home, Loader2, Users, FileText, Share2, MessageSquare, Building, NotepadText, CalendarCheck, Handshake, Wallet, History, EyeOff, FilePen, Trash2, Bell } from 'lucide-react';
import { type Client } from '../page';
import { type Persona } from '@/app/dashboard/personas/page';
import { type Property } from '@/app/dashboard/properties/page';
import PropertyCard from '@/components/property-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FaWhatsapp } from 'react-icons/fa';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';


interface Note {
  id: string;
  text: string;
  createdAt: Timestamp;
}

type TaskType = 'Retorno ao cliente' | 'Reunião' | 'Lembrete' | 'Visita';
interface Task {
  id: string;
  type: TaskType;
  date: Timestamp;
  startTime: string;
  endTime: string;
  description: string;
  clientId: string;
  brokerId: string;
  createdAt: Timestamp;
}

const taskIcons: Record<TaskType, React.ElementType> = {
  'Reunião': Users,
  'Retorno ao cliente': Phone,
  'Lembrete': Bell,
  'Visita': Handshake,
};


export default function ClientDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [client, setClient] = useState<Client | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  
  // Note states
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isAllNotesSheetOpen, setIsAllNotesSheetOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [originalEditingNote, setOriginalEditingNote] = useState<Note | null>(null);
  const [updatedNoteText, setUpdatedNoteText] = useState('');
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [isDeleteNoteAlertOpen, setIsDeleteNoteAlertOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isNoteConfirmCloseOpen, setIsNoteConfirmCloseOpen] = useState(false);

  // Task states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isAllTasksSheetOpen, setIsAllTasksSheetOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [newTask, setNewTask] = useState<{
    type: TaskType;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
  }>({
    type: 'Retorno ao cliente',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [originalEditingTask, setOriginalEditingTask] = useState<Partial<Task> | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeleteTaskAlertOpen, setIsDeleteTaskAlertOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isTaskConfirmCloseOpen, setIsTaskConfirmCloseOpen] = useState(false);

  // Visit states
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [newVisit, setNewVisit] = useState({ date: '', time: '', location: '' });


  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const clientDocRef = doc(db, 'broker_clients', clientId);
        const clientDocSnap = await getDoc(clientDocRef);

        if (!clientDocSnap.exists()) {
          notFound();
          return;
        }
        
        const clientData = { id: clientDocSnap.id, ...clientDocSnap.data() } as Client;
        setClient(clientData);

        let propertiesQuery: Query<DocumentData>;

        if (clientData.type === 'Vendedor') {
          propertiesQuery = query(collection(db, 'properties'), where('sellerId', '==', clientData.id));
        } else { 
            if (clientData.personaId && clientData.personaId !== 'none') {
                const personaDocRef = doc(db, 'personas', clientData.personaId);
                const personaDocSnap = await getDoc(personaDocRef);
                if (personaDocSnap.exists()) {
                    setPersona({ id: personaDocSnap.id, ...personaDocSnap.data() } as Persona);
                }
                propertiesQuery = query(
                    collection(db, 'properties'),
                    where('isVisibleOnSite', '==', true),
                    where('personaIds', 'array-contains', clientData.personaId)
                );
            } else {
                 setProperties([]);
                 setIsLoading(false);
                 return;
            }
        }
        
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const propsData = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(propsData);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();

    const notesQuery = query(collection(db, 'broker_notes'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setNotes(notesData);
    }, (error) => {
        console.error("Erro ao carregar anotações:", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar anotações' });
    });
    
    const tasksQuery = query(collection(db, 'broker_tasks'), where('clientId', '==', clientId), orderBy('date', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
    }, (error) => {
        console.error("Erro ao carregar tarefas:", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar tarefas' });
    });


    return () => {
      unsubscribeNotes();
      unsubscribeTasks();
    };
  }, [clientId, toast]);
  
  const handleSelectProperty = (propertyId: string, isSelected: boolean) => {
    setSelectedProperties(prev => isSelected ? [...prev, propertyId] : prev.filter(id => id !== propertyId));
  };

  const openWhatsAppModal = () => {
    if (selectedProperties.length === 0 || !client?.phone) return;

    const baseUrl = window.location.origin;
    const links = selectedProperties.map(id => {
      const prop = properties.find(p => p.id === id);
      return prop ? `*${prop.informacoesbasicas.nome}*\n${baseUrl}/imoveis/${prop.slug || prop.id}` : '';
    }).filter(Boolean);

    const message = `Olá, ${client.name}! Conforme nossa conversa, aqui estão alguns imóveis que selecionei para você:\n\n${links.join('\n\n')}\n\nO que acha?`;
    setWhatsappMessage(message);
    setIsWhatsAppModalOpen(true);
  };
  
  const sendFinalWhatsAppMessage = () => {
    if (!client?.phone || !whatsappMessage) return;
    const whatsappNumber = `55${client.phone.replace(/\D/g, '')}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    setIsWhatsAppModalOpen(false);
  };
  
  const handleToggleVisibility = async (propertyId: string, isVisible: boolean) => {
    try {
      await updateDoc(doc(db, 'properties', propertyId), { isVisibleOnSite: isVisible });
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, isVisibleOnSite: isVisible } : p));
      toast({ title: 'Visibilidade Atualizada!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar.' });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !client) return;
    setIsSubmittingNote(true);
    try {
        await addDoc(collection(db, 'broker_notes'), {
            brokerId: client.brokerId,
            clientId: client.id,
            text: newNote,
            createdAt: Timestamp.now(),
        });
        toast({ title: 'Anotação salva com sucesso!' });
        setNewNote('');
        setIsNotesDialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao salvar anotação', description: error.message });
    } finally {
        setIsSubmittingNote(false);
    }
  };
  
  const formatDate = (timestamp: Timestamp | undefined, includeTime = true) => {
    if (!timestamp?.seconds) return 'Data inválida';
    const formatString = includeTime ? "dd/MM/yyyy 'às' HH:mm" : "dd/MM/yyyy";
    return format(new Date(timestamp.seconds * 1000), formatString, { locale: ptBR });
  };

  const openEditNoteDialog = (note: Note) => {
    setEditingNote(note);
    setUpdatedNoteText(note.text);
    setOriginalEditingNote(note);
    setIsEditNoteOpen(true);
  };

  const closeEditNoteDialog = () => {
    setIsEditNoteOpen(false);
    setEditingNote(null);
    setUpdatedNoteText('');
    setOriginalEditingNote(null);
  }

  const handleEditNoteDialogChange = (isOpen: boolean) => {
      if (!isOpen) {
          const hasChanges = editingNote && updatedNoteText !== editingNote.text;
          if (hasChanges) {
              setIsNoteConfirmCloseOpen(true);
          } else {
              closeEditNoteDialog();
          }
      } else {
          setIsEditNoteOpen(true);
      }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !updatedNoteText.trim()) return;
    setIsUpdatingNote(true);
    try {
      await updateDoc(doc(db, 'broker_notes', editingNote.id), { text: updatedNoteText });
      toast({ title: 'Anotação atualizada!' });
      closeEditNoteDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const openDeleteNoteAlert = (note: Note) => {
    setNoteToDelete(note);
    setIsDeleteNoteAlertOpen(true);
  };
  
  const closeDeleteNoteAlert = () => {
    setNoteToDelete(null);
    setIsDeleteNoteAlertOpen(false);
  }

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await deleteDoc(doc(db, 'broker_notes', noteToDelete.id));
      toast({ title: 'Anotação excluída' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } finally {
      closeDeleteNoteAlert();
    }
  };
  
  const handleTaskTypeChange = (type: TaskType) => {
    setNewTask(prev => ({ ...prev, type }));
  };

  const handleTaskInputChange = (field: keyof typeof newTask, value: string) => {
    setNewTask(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTask = async () => {
    if (!client || !newTask.date || !newTask.startTime || !newTask.endTime) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha data, hora de início e hora de término.' });
      return;
    }
    setIsSubmittingTask(true);
    try {
      const [year, month, day] = newTask.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      await addDoc(collection(db, 'broker_tasks'), {
        brokerId: client.brokerId,
        clientId: client.id,
        type: newTask.type,
        date: Timestamp.fromDate(date),
        startTime: newTask.startTime,
        endTime: newTask.endTime,
        description: newTask.description,
        createdAt: Timestamp.now(),
      });
      toast({ title: 'Tarefa salva com sucesso!' });
      setIsTaskDialogOpen(false);
      setNewTask({ type: 'Retorno ao cliente', date: '', startTime: '', endTime: '', description: '' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar tarefa', description: error.message });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !newVisit.date || !newVisit.time || !newVisit.location) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha data, hora e local da visita.' });
      return;
    }
    setIsSubmittingVisit(true);
    try {
      const [year, month, day] = newVisit.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      await addDoc(collection(db, 'broker_tasks'), {
        brokerId: client.brokerId,
        clientId: client.id,
        type: 'Visita',
        date: Timestamp.fromDate(date),
        startTime: newVisit.time,
        endTime: '', // Can be left empty or calculated
        description: `Visita agendada no local: ${newVisit.location}`,
        createdAt: Timestamp.now(),
      });
      toast({ title: 'Visita agendada com sucesso!' });
      setIsVisitDialogOpen(false);
      setNewVisit({ date: '', time: '', location: '' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao agendar visita', description: error.message });
    } finally {
      setIsSubmittingVisit(false);
    }
  };
  
  const renderTaskIcon = (taskType: TaskType) => {
    const Icon = taskIcons[taskType] || CalendarCheck;
    return <Icon className="h-4 w-4" />;
  };

  // Task Edit/Delete Functions
  const openEditTaskDialog = (task: Task) => {
    const taskDate = task.date.toDate();
    const formattedDate = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}`;
    const taskForEdit = { ...task, date: formattedDate as any };
    setEditingTask(taskForEdit);
    setOriginalEditingTask(JSON.parse(JSON.stringify(taskForEdit))); // Deep copy
    setIsEditTaskOpen(true);
  };

  const closeEditTaskDialog = () => {
    setIsEditTaskOpen(false);
    setEditingTask(null);
    setOriginalEditingTask(null);
  };

   const handleEditTaskDialogChange = (isOpen: boolean) => {
      if (!isOpen) {
          const hasChanges = JSON.stringify(editingTask) !== JSON.stringify(originalEditingTask);
          if (hasChanges) {
              setIsTaskConfirmCloseOpen(true);
          } else {
              closeEditTaskDialog();
          }
      } else {
          setIsEditTaskOpen(true);
      }
  };
  
  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask.id) return;
    setIsUpdatingTask(true);

    const { id, date, ...taskDataToUpdate } = editingTask;
    const [year, month, day] = (date as unknown as string).split('-').map(Number);
    const dateObject = new Date(year, month - 1, day);

    try {
      await updateDoc(doc(db, 'broker_tasks', id), {
        ...taskDataToUpdate,
        date: Timestamp.fromDate(dateObject),
      });
      toast({ title: 'Tarefa atualizada!' });
      closeEditTaskDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar tarefa', description: error.message });
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const openDeleteTaskAlert = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteTaskAlertOpen(true);
  };
  
  const closeDeleteTaskAlert = () => {
    setTaskToDelete(null);
    setIsDeleteTaskAlertOpen(false);
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteDoc(doc(db, 'broker_tasks', taskToDelete.id));
      toast({ title: 'Tarefa excluída' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir tarefa', description: error.message });
    } finally {
      closeDeleteTaskAlert();
    }
  };

  const otherTasks = tasks.filter(task => task.type !== 'Visita');
  const visits = tasks.filter(task => task.type === 'Visita');

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Carregando dados do cliente...</p></div>;
  }
  if (!client) {
    return <div className="text-center"><h2 className="text-2xl font-bold">Cliente não encontrado</h2><Link href="/corretor/dashboard" passHref><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para a lista</Button></Link></div>;
  }
  const isVendedor = client.type === 'Vendedor';

  return (
    <>
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/corretor/clientes" passHref><Button variant="outline" size="icon" className="h-9 w-9"><ArrowLeft className="h-5 w-5" /><span className="sr-only">Voltar</span></Button></Link>
            <h1 className="text-2xl font-bold">Detalhes do Atendimento</h1>
        </div>
      
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                  <div className='flex justify-between items-start'>
                    <div>
                      <CardTitle className="flex items-center gap-3 text-xl"><span>{client.name}</span></CardTitle>
                      <CardDescription>{client.phone || 'Telefone não informado'}</CardDescription>
                    </div>
                    <Badge variant="default">{client.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                   <div className='flex justify-between items-center'><span>Origem do atendimento</span><span className="font-semibold">Site da Imobiliária</span></div>
                   <div className='flex justify-between items-center'><span>Etapa do funil</span><span className="font-semibold">Visita</span></div>
                   <Button className="w-full mt-4" variant="outline"><Phone className="mr-2 h-4 w-4" /> Entrar em contato</Button>
                </CardContent>
            </Card>
            
            {!isVendedor && (<Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Perfil de busca</CardTitle></CardHeader><CardContent><Badge variant="secondary">{client.personaName || 'Persona não definida'}</Badge><p className="text-sm text-muted-foreground mt-4">Whatsapp Bot enviou uma mensagem</p></CardContent></Card>)}
        </div>

        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader><CardTitle>Nova atividade</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline" className="gap-2"><NotepadText className="h-4 w-4"/> Anotação</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Adicionar Anotação</DialogTitle><DialogDescription>Descreva o que aconteceu neste contato com o cliente.</DialogDescription></DialogHeader>
                            <div className="py-4 space-y-2"><Label htmlFor="new-note" className="sr-only">Anotação</Label><Textarea id="new-note" placeholder="Digite sua anotação aqui..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={5} /></div>
                            <DialogFooter><Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>Cancelar</Button><Button onClick={handleAddNote} disabled={isSubmittingNote || !newNote.trim()}>{isSubmittingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline" className="gap-2"><CalendarCheck className="h-4 w-4"/> Tarefa</Button></DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Criar Tarefa</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="flex gap-2">
                                    {(['Retorno ao cliente', 'Reunião', 'Lembrete'] as TaskType[]).map(type => (
                                        <Button key={type} type="button" variant={newTask.type === type ? 'default' : 'outline'} onClick={() => handleTaskTypeChange(type)}>{type}</Button>
                                    ))}
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Detalhes</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1"><Label htmlFor="task-date">Data *</Label><Input id="task-date" type="date" value={newTask.date} onChange={e => handleTaskInputChange('date', e.target.value)} /></div>
                                        <div className="space-y-1"><Label htmlFor="task-start">Hora de início *</Label><Input id="task-start" type="time" value={newTask.startTime} onChange={e => handleTaskInputChange('startTime', e.target.value)} /></div>
                                        <div className="space-y-1"><Label htmlFor="task-end">Hora de término *</Label><Input id="task-end" type="time" value={newTask.endTime} onChange={e => handleTaskInputChange('endTime', e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="space-y-1"><Label htmlFor="task-desc">Descrição</Label><Textarea id="task-desc" value={newTask.description} onChange={e => handleTaskInputChange('description', e.target.value)} /></div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleAddTask} disabled={isSubmittingTask}>{isSubmittingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2"><Handshake className="h-4 w-4"/> Visita</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agendar Visita</DialogTitle>
                          <DialogDescription>Marque uma visita para o cliente.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddVisit} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="visit-date">Data da visita</Label>
                            <Input id="visit-date" type="date" value={newVisit.date} onChange={(e) => setNewVisit(p => ({...p, date: e.target.value}))} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="visit-time">Hora da visita</Label>
                            <Input id="visit-time" type="time" value={newVisit.time} onChange={(e) => setNewVisit(p => ({...p, time: e.target.value}))} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="visit-location">Local</Label>
                            <Input id="visit-location" value={newVisit.location} onChange={(e) => setNewVisit(p => ({...p, location: e.target.value}))} placeholder="Endereço do imóvel ou local de encontro" required />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsVisitDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmittingVisit}>
                                {isSubmittingVisit ? <Loader2 className="animate-spin" /> : "Agendar Visita"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="gap-2" disabled><Wallet className="h-4 w-4"/> Proposta</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><NotepadText className="h-5 w-5 text-primary" />Anotações</CardTitle></CardHeader>
                    <CardContent>
                        {notes.length > 0 ? (
                            <div className="space-y-2">
                                {notes.slice(0, 3).map(note => (
                                    <div key={note.id} className="text-xs border-b pb-1">
                                        <p className="font-semibold flex items-center gap-2">
                                            <NotepadText className="h-4 w-4"/>
                                            {formatDate(note.createdAt)}
                                        </p>
                                        <p className="text-muted-foreground line-clamp-2">{note.text}</p>
                                    </div>
                                ))}
                                {notes.length > 3 && (
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsAllNotesSheetOpen(true)}>Ver todas as anotações</Button>
                                )}
                            </div>
                        ) : (<p className="text-xs text-muted-foreground text-center py-2">Nenhuma anotação.</p>)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" />Tarefas</CardTitle></CardHeader>
                    <CardContent>
                        {otherTasks.length > 0 ? (
                            <div className="space-y-2">
                                {otherTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="text-xs border-b pb-1">
                                        <p className="font-semibold flex items-center gap-2">{renderTaskIcon(task.type)} {task.type} - {formatDate(task.date, false)}</p>
                                        <p className="text-muted-foreground line-clamp-2">{task.description}</p>
                                    </div>
                                ))}
                                {otherTasks.length > 3 && (
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsAllTasksSheetOpen(true)}>Ver todas as tarefas</Button>
                                )}
                            </div>
                        ) : (<p className="text-xs text-muted-foreground text-center py-2">Nenhuma tarefa.</p>)}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" />Visitas Agendadas</CardTitle></CardHeader>
                    <CardContent>
                        {visits.length > 0 ? (
                            <div className="space-y-2">
                                {visits.slice(0, 3).map(task => (
                                    <div key={task.id} className="text-xs border-b pb-1">
                                        <p className="font-semibold flex items-center gap-2">{renderTaskIcon(task.type)} {formatDate(task.date, false)} às {task.startTime}</p>
                                        <p className="text-muted-foreground line-clamp-2">{task.description}</p>
                                    </div>
                                ))}
                                {visits.length > 3 && (
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsAllTasksSheetOpen(true)}>Ver todas as visitas</Button>
                                )}
                            </div>
                        ) : (<p className="text-xs text-muted-foreground text-center py-2">Nenhuma visita.</p>)}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">{isVendedor ? <Building /> : <Home />}<CardTitle>{isVendedor ? 'Imóveis deste Vendedor' : 'Imóveis de Interesse'}</CardTitle></div>
                    {!isVendedor && selectedProperties.length > 0 && (<Button onClick={openWhatsAppModal} disabled={!client.phone}><FaWhatsapp className="mr-2 h-5 w-5"/>Compartilhar</Button>)}
                  </div>
                   <CardDescription className="pt-2">{isVendedor ? `Imóveis avulsos cadastrados para ${client.name}.` : (persona ? `Selecione os imóveis que correspondem ao perfil "${persona.name}" para compartilhar.` : 'Nenhuma persona foi definida para este cliente.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {properties.length > 0 ? (<div className="space-y-4">{properties.map(prop => (<div key={prop.id} className="relative group">{!isVendedor && (<div className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1"><Checkbox id={`prop-${prop.id}`} onCheckedChange={(checked) => handleSelectProperty(prop.id, !!checked)} checked={selectedProperties.includes(prop.id)} className="h-6 w-6"/></div>)}<Label htmlFor={isVendedor ? undefined :`prop-${prop.id}`} className={isVendedor ? '' : 'cursor-pointer'}><PropertyCard property={prop} layout="horizontal" variant={isVendedor ? 'portfolio' : 'default'} hideClientActions onToggleVisibility={isVendedor ? (id, isVisible) => handleToggleVisibility(id, isVisible) : undefined} isPubliclyVisible={prop.isVisibleOnSite}/></Label></div>))}</div>) : (<div className="h-24 text-center flex items-center justify-center bg-muted/50 rounded-lg"><p className="text-muted-foreground">{isVendedor ? 'Nenhum imóvel avulso vinculado a este vendedor.' : 'Nenhum imóvel compatível encontrado.'}</p></div>)}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>

    <Sheet open={isAllNotesSheetOpen} onOpenChange={setIsAllNotesSheetOpen}>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col">
            <SheetHeader>
                <SheetTitle>Todas as Anotações de {client.name}</SheetTitle>
                <SheetDescription>Histórico completo de anotações, da mais recente para a mais antiga.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-grow my-4">
                <div className="space-y-4 pr-6">
                    {notes.length > 0 ? (
                        notes.map(note => (
                            <div key={note.id} className="text-sm border-b pb-4 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <NotepadText className="h-4 w-4" />
                                        <p>{formatDate(note.createdAt)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditNoteDialog(note)}><FilePen className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteNoteAlert(note)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <p className="text-foreground mt-1 whitespace-pre-wrap">{note.text}</p>
                            </div>
                        ))
                    ) : (<p className="text-sm text-muted-foreground text-center py-8">Nenhuma anotação registrada.</p>)}
                </div>
            </ScrollArea>
             <SheetFooter className="mt-auto pt-4 border-t bg-background">
                <Button variant="outline" onClick={() => setIsAllNotesSheetOpen(false)}>Fechar</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>

    <Sheet open={isAllTasksSheetOpen} onOpenChange={setIsAllTasksSheetOpen}>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col">
            <SheetHeader>
                <SheetTitle>Todas as Tarefas de {client.name}</SheetTitle>
                <SheetDescription>Histórico completo de tarefas, da mais recente para a mais antiga.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-grow my-4">
                <div className="space-y-4 pr-6">
                    {tasks.length > 0 ? (
                        tasks.map(task => (
                            <div key={task.id} className="text-sm border-b pb-4 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 font-semibold text-primary">
                                            {renderTaskIcon(task.type)}
                                            <p>{task.type}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{formatDate(task.date, false)} das {task.startTime} às {task.endTime}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTaskDialog(task)}><FilePen className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteTaskAlert(task)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                {task.description && <p className="text-foreground mt-2 pl-6 whitespace-pre-wrap">{task.description}</p>}
                            </div>
                        ))
                    ) : (<p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa registrada.</p>)}
                </div>
            </ScrollArea>
             <SheetFooter className="mt-auto pt-4 border-t bg-background">
                <Button variant="outline" onClick={() => setIsAllTasksSheetOpen(false)}>Fechar</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
    
    <Dialog open={isEditNoteOpen} onOpenChange={handleEditNoteDialogChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Anotação</DialogTitle></DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="edit-note-text" className="sr-only">Texto da anotação</Label>
                <Textarea id="edit-note-text" value={updatedNoteText} onChange={(e) => setUpdatedNoteText(e.target.value)} rows={6}/>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => handleEditNoteDialogChange(false)}>Cancelar</Button>
                <Button onClick={handleUpdateNote} disabled={isUpdatingNote}>{isUpdatingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Salvar Alterações</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog open={isDeleteNoteAlertOpen} onOpenChange={setIsDeleteNoteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita e irá deletar a anotação permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteNoteAlert}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

     <AlertDialog open={isNoteConfirmCloseOpen} onOpenChange={setIsNoteConfirmCloseOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
                <AlertDialogDescription>
                    Você tem alterações não salvas. Se sair, seu progresso será perdido.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsNoteConfirmCloseOpen(false)}>Continuar Editando</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    setIsNoteConfirmCloseOpen(false);
                    closeEditNoteDialog();
                }}>Sair e Descartar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    <Dialog open={isEditTaskOpen} onOpenChange={handleEditTaskDialogChange}>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
                 <div className="flex gap-2">
                    {(['Retorno ao cliente', 'Reunião', 'Lembrete', 'Visita'] as TaskType[]).map(type => (
                        <Button key={type} type="button" variant={editingTask?.type === type ? 'default' : 'outline'} onClick={() => setEditingTask(prev => prev ? ({ ...prev, type }) : null)}>{type}</Button>
                    ))}
                </div>
                <div>
                    <h4 className="font-medium mb-2">Detalhes</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1"><Label>Data *</Label><Input type="date" value={editingTask?.date as unknown as string || ''} onChange={e => setEditingTask(p => p ? ({ ...p, date: e.target.value as any }) : null)} /></div>
                        <div className="space-y-1"><Label>Hora de início *</Label><Input type="time" value={editingTask?.startTime || ''} onChange={e => setEditingTask(p => p ? ({ ...p, startTime: e.target.value }) : null)} /></div>
                        <div className="space-y-1"><Label>Hora de término *</Label><Input type="time" value={editingTask?.endTime || ''} onChange={e => setEditingTask(p => p ? ({ ...p, endTime: e.target.value }) : null)} /></div>
                    </div>
                </div>
                <div className="space-y-1"><Label>Descrição</Label><Textarea value={editingTask?.description || ''} onChange={e => setEditingTask(p => p ? ({ ...p, description: e.target.value }) : null)} /></div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => handleEditTaskDialogChange(false)}>Cancelar</Button>
                <Button onClick={handleUpdateTask} disabled={isUpdatingTask}>{isUpdatingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar Alterações</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
     <AlertDialog open={isTaskConfirmCloseOpen} onOpenChange={setIsTaskConfirmCloseOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
                <AlertDialogDescription>
                    Você tem alterações não salvas. Se sair, seu progresso será perdido.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsTaskConfirmCloseOpen(false)}>Continuar Editando</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    setIsTaskConfirmCloseOpen(false);
                    closeEditTaskDialog();
                }}>Sair e Descartar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={isDeleteTaskAlertOpen} onOpenChange={setIsDeleteTaskAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita e irá deletar a tarefa permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteTaskAlert}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isWhatsAppModalOpen} onOpenChange={setIsWhatsAppModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Mensagem do WhatsApp</DialogTitle><DialogDescription>Revise e edite a mensagem antes de enviar para {client.name}.</DialogDescription></DialogHeader>
            <div className="py-4"><Textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} rows={10}/></div>
            <DialogFooter><Button variant="outline" onClick={() => setIsWhatsAppModalOpen(false)}>Cancelar</Button><Button onClick={sendFinalWhatsAppMessage}><FaWhatsapp className="mr-2 h-4 w-4" />Enviar</Button></DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
