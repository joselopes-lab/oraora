'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useAuthContext } from '@/firebase';
import { collection, query, where, doc, writeBatch, setDoc, orderBy } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, subMonths, addMonths, startOfWeek, endOfWeek, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EventForm, { EventFormData } from './components/event-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { WeekView } from './components/week-view';
import { DayView } from './components/day-view';
import Link from 'next/link';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';


type Event = {
    id: string;
    brokerId: string;
    title: string;
    date: string; // YYYY-MM-DD
    time?: string;
    type: 'reuniao' | 'visita' | 'tarefa' | 'particular' | 'outro';
    description?: string;
    completed?: boolean;
    clientId?: string;
    journeyId?: string;
    propertyId?: string;
    propertySource?: 'properties' | 'brokerProperties';
};

type Lead = {
    id: string;
    name: string;
}

const eventTypeStyles = {
    reuniao: { color: 'purple', label: 'Reunião' },
    visita: { color: 'blue', label: 'Visita' },
    tarefa: { color: 'green', label: 'Tarefa' },
    particular: { color: 'amber', label: 'Particular' },
    outro: { color: 'gray', label: 'Outro' },
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

const Day = ({ day, dayEvents, currentMonth: month }: { day: Date; dayEvents: Event[], currentMonth: Date }) => {
  const isCurrent = isToday(day);
  const isCurrentMonth = isSameMonth(day, month);

  return (
    <div className={cn("calendar-day bg-white min-h-[100px] md:min-h-[120px] p-2 flex flex-col gap-1 hover:bg-gray-50 transition-colors cursor-pointer group", !isCurrentMonth && "opacity-40")}>
      <span className={cn("text-sm font-medium text-text-secondary group-hover:text-text-main", isCurrent && "size-7 flex items-center justify-center rounded-full bg-primary text-text-main font-bold shadow-sm")}>
        {format(day, "d")}
      </span>
      <div className="flex flex-col gap-1">
        {dayEvents.map((event) => {
          const style = getTailwindColor(event.type, event.completed);
          return (
            <Link key={event.id} href={`/dashboard/agenda/${event.id}`} className={cn(`w-full block ${style.bg} border-l-2 ${style.border} rounded-sm px-1.5 py-0.5 truncate`, event.completed && 'opacity-60')}>
              <span className={cn(`text-[10px] font-bold ${style.text} block truncate`, event.completed && 'line-through')}>
                {event.time && `${event.time} `}
                {event.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};


export default function AgendaPage() {
    const { user, isUserLoading, isReady, userProfile } = useAuthContext();
    const firestore = useFirestore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [visibleEventTypes, setVisibleEventTypes] = useState<string[]>(['reuniao', 'visita', 'tarefa', 'particular', 'outro']);
    const [isClient, setIsClient] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();
    
    useEffect(() => { setIsClient(true); }, []);

    const eventsQuery = useMemoFirebase(
      () => {
        if (!isReady || !user?.uid || !firestore || !userProfile) return null;
        return query(collection(firestore, 'events'), where('brokerId', '==', user.uid))
      },
      [isReady, user?.uid, firestore, userProfile?.userType]
    );

    const leadsQuery = useMemoFirebase(
      () => {
        if (!isReady || !user?.uid || !firestore || !userProfile) return null;
        return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid));
      },
      [isReady, user?.uid, firestore, userProfile?.userType]
    );

    const { data: events, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);
    const { data: clients, isLoading: areClientsLoading } = useCollection<Lead>(leadsQuery);
    
    const isLoading = isUserLoading || areEventsLoading || areClientsLoading || !isClient;

    const daysForMonthView = useMemo(() => {
        const first = startOfMonth(currentDate);
        const last = endOfMonth(currentDate);
        return eachDayOfInterval({
            start: startOfWeek(first),
            end: endOfWeek(last),
        });
    }, [currentDate]);
    
    const filteredEvents = useMemo(() => {
        return events?.filter(event => visibleEventTypes.includes(event.type)) || [];
    }, [events, visibleEventTypes]);

    const handlePrev = () => {
      if (viewMode === 'month') setCurrentDate(prev => subMonths(prev, 1));
      else if (viewMode === 'week') setCurrentDate(prev => subDays(prev, 7));
      else setCurrentDate(prev => subDays(prev, 1));
    };

    const handleNext = () => {
      if (viewMode === 'month') setCurrentDate(prev => addMonths(prev, 1));
      else if (viewMode === 'week') setCurrentDate(prev => addDays(prev, 7));
      else setCurrentDate(prev => addDays(prev, 1));
    };
    
    const eventsByDate = useMemo(() => {
        const grouped: { [key: string]: Event[] } = {};
        filteredEvents?.forEach(event => {
            const date = event.date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(event);
        });
        return grouped;
    }, [filteredEvents]);

    const todayEvents = eventsByDate[format(new Date(), 'yyyy-MM-dd')] || [];

    const handleSaveEvent = async (data: EventFormData) => {
        if (!user || !firestore) return;
        try {
            await addDocumentNonBlocking(collection(firestore, 'events'), { ...data, brokerId: user.uid });
            toast({ title: 'Tarefa Salva!', description: 'Seu compromisso foi adicionado à agenda.' });
            setIsModalOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar' });
        }
    };

    const startOfCurrentWeek = startOfWeek(currentDate);
    const endOfCurrentWeek = endOfWeek(currentDate);
    const weekEvents = filteredEvents.filter(e => e.date >= format(startOfCurrentWeek, 'yyyy-MM-dd') && e.date <= format(endOfCurrentWeek, 'yyyy-MM-dd'));
    const dayEvents = filteredEvents.filter(e => e.date === format(currentDate, 'yyyy-MM-dd'));
    
    const renderHeaderDate = () => {
        if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: ptBR });
        if (viewMode === 'week') return `${format(startOfCurrentWeek, 'd')} - ${format(endOfCurrentWeek, 'd \'de\' MMMM, yyyy', { locale: ptBR })}`;
        return format(currentDate, "eeee, d 'de' MMMM", { locale: ptBR });
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 text-left">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                        <Link className="hover:text-primary transition-colors" href="/dashboard">Painel</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-text-main">Agenda</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Agenda</h1>
                    <p className="text-text-secondary mt-1">Gerencie seus compromissos e visitas diárias.</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-secondary hover:bg-primary text-white hover:text-black font-bold h-11 px-6 rounded-lg shadow-glow transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">add</span>
                        Cadastrar Tarefa
                    </Button>
                    <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
                      <DialogHeader><VisuallyHidden><DialogTitle>Cadastrar Tarefa</DialogTitle></VisuallyHidden></DialogHeader>
                       <EventForm onSave={handleSaveEvent} onCancel={() => setIsModalOpen(false)} clients={clients || []} />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border border-gray-100 flex flex-col text-left">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-text-main capitalize">{isLoading ? '...' : renderHeaderDate()}</h2>
                            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                                <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded text-text-secondary cursor-pointer"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                                <button onClick={handleNext} className="p-1.5 hover:bg-white rounded text-text-secondary cursor-pointer"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
                            </div>
                        </div>
                        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                           <button onClick={() => setViewMode('month')} className={cn("px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer", viewMode === 'month' ? 'font-bold bg-white shadow-sm' : 'text-text-secondary')}>Mês</button>
                           <button onClick={() => setViewMode('week')} className={cn("px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer", viewMode === 'week' ? 'font-bold bg-white shadow-sm' : 'text-text-secondary')}>Semana</button>
                           <button onClick={() => setViewMode('day')} className={cn("px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer", viewMode === 'day' ? 'font-bold bg-white shadow-sm' : 'text-text-secondary')}>Dia</button>
                        </div>
                    </div>
                    {!isLoading && (
                      <>
                        {viewMode === 'month' && <div className="p-6"><div className="grid grid-cols-7 mb-4">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (<div key={day} className="text-center text-xs font-semibold text-text-secondary uppercase">{day}</div>))}</div><div className="grid grid-cols-7 border-t border-l border-gray-100 bg-gray-100 gap-px">{daysForMonthView.map(day => (<Day key={day.toISOString()} day={day} dayEvents={eventsByDate[format(day, 'yyyy-MM-dd')] || []} currentMonth={currentDate} />))}</div></div>}
                        {viewMode === 'week' && <WeekView currentDate={currentDate} events={weekEvents} />}
                        {viewMode === 'day' && <DayView currentDate={currentDate} events={dayEvents} />}
                      </>
                    )}
                </div>
                <div className="space-y-6 text-left">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2 mb-6 border-b pb-4">Tarefas de Hoje</h3>
                        <div className="space-y-4">
                            {todayEvents.length > 0 ? todayEvents.map(event => {
                                 const style = getTailwindColor(event.type, event.completed);
                                return (
                                    <Link key={event.id} href={`/dashboard/agenda/${event.id}`} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <span className={cn("text-xs font-bold", event.completed ? 'text-gray-400' : 'text-text-main')}>{event.time || ''}</span>
                                            <div className="h-full w-px bg-gray-200 mt-1"></div>
                                        </div>
                                        <div className={cn(`flex-1 rounded-lg p-3 border-l-4 relative`, style.bg, style.border.replace('border-', 'border-l-'))}>
                                            <h4 className={cn("text-sm font-bold text-text-main mb-1", event.completed && 'line-through')}>{event.title}</h4>
                                            {event.description && <p className="text-xs text-text-secondary truncate">{event.description}</p>}
                                        </div>
                                    </Link>
                                )
                            }) : <p className="text-sm text-text-secondary text-center py-4">Nenhuma tarefa para hoje.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
