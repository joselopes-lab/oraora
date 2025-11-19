
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, addDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Users, Phone, Bell, Handshake, FilterX, PlusCircle, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { format, getYear, getMonth, getDate, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type Client } from '../clientes/page';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';


type TaskType = 'Retorno ao cliente' | 'Reunião' | 'Lembrete' | 'Visita';
interface Task {
  id: string;
  type: TaskType;
  date: Timestamp;
  startTime: string;
  endTime: string;
  description: string;
  clientId?: string;
  brokerId: string;
  createdAt: Timestamp;
}

const TASKS_PER_PAGE = 5;

const taskIcons: Record<TaskType, React.ElementType> = {
  'Reunião': Users,
  'Retorno ao cliente': Phone,
  'Lembrete': Bell,
  'Visita': Handshake,
};

const renderTaskIcon = (taskType: TaskType) => {
    const Icon = taskIcons[taskType] || CalendarIcon;
    return <Icon className="h-5 w-5" />;
};

const areDatesEqualIgnoringTime = (date1: Date, date2: Date) => {
    if (!date1 || !date2) return false;
    return getYear(date1) === getYear(date2) &&
           getMonth(date1) === getMonth(date2) &&
           getDate(date1) === getDate(date2);
}

export default function AgendaPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [clientsMap, setClientsMap] = useState<Map<string, Client>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [clientNow, setClientNow] = useState(new Date());

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setClientNow(new Date());
    }, []);
    
    // States for new task dialog
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [selectedClientForTask, setSelectedClientForTask] = useState<Client | null | 'particular'>(null);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
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

    const formatDateGroup = (date: Date) => {
        const today = new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (areDatesEqualIgnoringTime(date, today)) return 'Hoje';
        if (areDatesEqualIgnoringTime(date, tomorrow)) return 'Amanhã';
        return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    }

    useEffect(() => {
        if (!user) {
            if (!loadingAuth) setIsLoading(false);
            return;
        }

        const tasksQuery = query(collection(db, 'broker_tasks'), where('brokerId', '==', user.uid), orderBy('date', 'asc'));
        const unsubscribeTasks = onSnapshot(tasksQuery, async (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(tasksData);

            const clientIds = [...new Set(tasksData.map(t => t.clientId).filter(Boolean))];
            if (clientIds.length > 0) {
                 const clientsQuery = query(collection(db, 'broker_clients'), where('__name__', 'in', clientIds));
                 const clientsSnapshot = await getDocs(clientsQuery);
                 const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
                 const newClientsMap = new Map(clientsData.map(c => [c.id, c]));
                 setClientsMap(newClientsMap);
            }
            
            setIsLoading(false);
        });
        
        const clientsQuery = query(collection(db, 'broker_clients'), where('brokerId', '==', user.uid));
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setAllClients(clientsData);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeClients();
        };
    }, [user, loadingAuth]);
    
    const taskDays = useMemo(() => {
        return tasks.map(task => task.date.toDate());
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        if (selectedDate) {
            return tasks.filter(task => {
                const taskDate = task.date.toDate();
                return areDatesEqualIgnoringTime(taskDate, selectedDate);
            });
        }
        return tasks;
    }, [tasks, selectedDate]);
    
     useEffect(() => {
        setCurrentPage(1);
    }, [filteredTasks]);

    const groupedTasks = useMemo(() => {
        const groups: { [key: string]: Task[] } = {};
        
        filteredTasks.forEach(task => {
            const dateKey = task.date.toDate().toISOString().split('T')[0];
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(task);
        });
        
        for (const dateKey in groups) {
            groups[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
        }

        return groups;
    }, [filteredTasks]);
    
    const paginatedTaskGroups = useMemo(() => {
        if (selectedDate) {
            return Object.entries(groupedTasks);
        }
        const entries = Object.entries(groupedTasks);
        const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
        
        let taskCount = 0;
        let paginatedEntries: [string, Task[]][] = [];
        for (const entry of entries) {
            if (taskCount >= startIndex && paginatedEntries.flat(2).length < TASKS_PER_PAGE) {
                paginatedEntries.push(entry);
            }
            taskCount += entry[1].length;
            if (paginatedEntries.flat(2).length >= TASKS_PER_PAGE) break;
        }
        return paginatedEntries;
    }, [groupedTasks, currentPage, selectedDate]);

    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);

    const resetSelection = () => {
        setSelectedDate(undefined);
    };
    
    const filteredClients = useMemo(() => {
        return allClients.filter(client => 
            client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
        );
    }, [allClients, clientSearchTerm]);
    
    const handleTaskTypeChange = (type: TaskType) => {
        setNewTask(prev => ({ ...prev, type }));
    };

    const handleTaskInputChange = (field: keyof typeof newTask, value: string) => {
        setNewTask(prev => ({ ...prev, [field]: value }));
    };
    
    const handleAddTask = async () => {
        if (!user || !selectedClientForTask || !newTask.date || !newTask.startTime || !newTask.endTime) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Selecione um cliente ou particular e preencha data, hora de início e término.' });
            return;
        }
        setIsSubmittingTask(true);
        try {
            const [year, month, day] = newTask.date.split('-').map(Number);
            const date = new Date(Date.UTC(year, month - 1, day));

            const taskData: any = {
                brokerId: user.uid,
                type: newTask.type,
                date: Timestamp.fromDate(date),
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                description: newTask.description,
                createdAt: Timestamp.now(),
            };

            if (selectedClientForTask !== 'particular') {
                taskData.clientId = selectedClientForTask.id;
            }

            await addDoc(collection(db, 'broker_tasks'), taskData);
            toast({ title: 'Tarefa salva com sucesso!' });
            setIsTaskDialogOpen(false);
            resetTaskForm();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar tarefa', description: error.message });
        } finally {
            setIsSubmittingTask(false);
        }
    };
    
    const resetTaskForm = () => {
        setSelectedClientForTask(null);
        setClientSearchTerm('');
        setNewTask({
            type: 'Retorno ao cliente',
            date: '',
            startTime: '',
            endTime: '',
            description: '',
        });
    };
    
    const closeTaskDialog = (isOpen: boolean) => {
        if (!isOpen) {
            resetTaskForm();
        }
        setIsTaskDialogOpen(isOpen);
    };
    
    const getDialogDescription = () => {
      if (selectedClientForTask === 'particular') {
        return 'Nova atividade particular';
      }
      if (selectedClientForTask) {
        return `Nova atividade para ${selectedClientForTask.name}`;
      }
      return 'Selecione o cliente para quem deseja criar uma atividade ou crie uma atividade particular.';
    }

    if (isLoading || loadingAuth) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                 <div className="flex items-start gap-4">
                    <CalendarIcon className="h-10 w-10 mt-2"/>
                    <div>
                        <h1 className="text-6xl font-thin tracking-tight">Minha Agenda</h1>
                        <p className="font-light text-[23px] text-black">Suas tarefas e visitas agendadas.</p>
                    </div>
                </div>
                 <Dialog open={isTaskDialogOpen} onOpenChange={closeTaskDialog}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Atividade
                        </Button>
                    </DialogTrigger>
                     <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Nova Atividade</DialogTitle>
                            <DialogDescription>
                               {getDialogDescription()}
                            </DialogDescription>
                        </DialogHeader>
                        {!selectedClientForTask ? (
                            <div className="py-4 space-y-4">
                                <div className="flex justify-center">
                                    <Button variant="secondary" onClick={() => setSelectedClientForTask('particular')}>
                                        Criar Atividade Particular
                                    </Button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Ou</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Buscar cliente por nome ou email..."
                                        className="pl-8"
                                        value={clientSearchTerm}
                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="h-60">
                                    <div className="space-y-2">
                                        {filteredClients.map(client => (
                                            <div 
                                                key={client.id}
                                                className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                                                onClick={() => setSelectedClientForTask(client)}
                                            >
                                                <div>
                                                    <p className="font-medium">{client.name}</p>
                                                    <p className="text-xs text-muted-foreground">{client.email}</p>
                                                </div>
                                                <Button variant="outline" size="sm">Selecionar</Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div className="flex gap-2 flex-wrap">
                                    {(['Retorno ao cliente', 'Reunião', 'Lembrete', 'Visita'] as TaskType[]).map(type => (
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
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSelectedClientForTask(null)}>Trocar</Button>
                                    <Button onClick={handleAddTask} disabled={isSubmittingTask}>{isSubmittingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar Atividade</Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Card className="lg:col-span-1">
                    <CardContent className="p-2">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="w-full"
                            locale={ptBR}
                            modifiers={{ scheduled: taskDays }}
                            modifiersClassNames={{
                                scheduled: 'bg-primary/20 rounded-full',
                            }}
                            classNames={{
                                day_today: "bg-primary text-primary-foreground",
                            }}
                        />
                         <div className="p-4 border-t">
                            <Button variant="outline" className="w-full" onClick={resetSelection}>
                               <FilterX className="h-4 w-4 mr-2"/>
                               Limpar seleção
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    {paginatedTaskGroups.length > 0 ? (
                        paginatedTaskGroups.map(([date, taskGroup]) => (
                            <div key={date}>
                                <h2 className="text-xl font-bold mb-4 capitalize">{formatDateGroup(new Date(date + 'T00:00:00'))}</h2>
                                <div className="space-y-4">
                                    {taskGroup.map(task => (
                                        <Card key={task.id}>
                                            <CardContent className="p-4 flex items-start gap-4">
                                                <div className="p-3 bg-muted rounded-full">
                                                    {renderTaskIcon(task.type)}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold">{task.type}</p>
                                                        <p className="text-sm font-medium">{task.startTime} - {task.endTime}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                    <div className="mt-2 text-sm">
                                                        {task.clientId ? (
                                                            <>
                                                            Cliente: {' '}
                                                            <Link href={`/corretor/clientes/${task.clientId}`} className="font-semibold text-primary hover:underline">
                                                                {clientsMap.get(task.clientId)?.name || '...'}
                                                            </Link>
                                                            </>
                                                        ) : (
                                                            <span className="font-semibold text-muted-foreground">Atividade Particular</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">Nenhuma atividade encontrada</h3>
                                <p className="text-muted-foreground">{selectedDate ? 'Não há tarefas para o dia selecionado.' : 'Nenhuma tarefa agendada.'}</p>
                            </CardContent>
                        </Card>
                    )}
                    {!selectedDate && totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-4">
                            <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                            </Button>
                            <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
                            <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                Próxima <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

    

    