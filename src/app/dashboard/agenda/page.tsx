
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, writeBatch, setDoc } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, subDays, addDays } from 'date-fns';
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
    <div
      className={cn(
        "calendar-day bg-white min-h-[100px] md:min-h-[120px] p-2 flex flex-col gap-1 hover:bg-gray-50 transition-colors cursor-pointer group",
        !isCurrentMonth && "opacity-40"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium text-text-secondary group-hover:text-text-main",
          isCurrent &&
            "size-7 flex items-center justify-center rounded-full bg-primary text-text-main font-bold shadow-sm"
        )}
      >
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
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [visibleEventTypes, setVisibleEventTypes] = useState<string[]>(['reuniao', 'visita', 'tarefa', 'particular', 'outro']);
    const [isClient, setIsClient] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();
    const [hasCreatedDefaultEvents, setHasCreatedDefaultEvents] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const eventsQuery = useMemoFirebase(
      () => {
        if (user && firestore) {
          return query(collection(firestore, 'events'), where('brokerId', '==', user.uid))
        }
        return null;
      },
      [user, firestore]
    );

    const leadsQuery = useMemoFirebase(
      () => {
        if (user && firestore) {
          return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid));
        }
        return null;
      },
      [user, firestore]
    );

    const { data: events, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);
    const { data: clients, isLoading: areClientsLoading } = useCollection<Lead>(leadsQuery);
    
    useEffect(() => {
        if (!areEventsLoading && user && firestore && !hasCreatedDefaultEvents && events?.length === 0) {
            setHasCreatedDefaultEvents(true); // Prevent this from running again
            const batch = writeBatch(firestore);
            const defaultEvents = [
                { title: 'Reunião de Alinhamento', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', type: 'reuniao', description: 'Discutir novas estratégias.', brokerId: user.uid },
                { title: 'Visita Ap. Jardins', date: format(new Date(), 'yyyy-MM-dd'), time: '14:30', type: 'visita', description: 'Cliente: Sra. Maria', brokerId: user.uid },
                { title: 'Enviar Contratos', date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'), type: 'tarefa', description: 'Contrato do imóvel Ref: 123', brokerId: user.uid },
                { title: 'Almoço com Parceiro', date: format(subMonths(new Date(), 1), 'yyyy-MM-dd'), time: '12:00', type: 'particular', description: 'Restaurante Fogo de Chão', brokerId: user.uid },
            ];

            defaultEvents.forEach(event => {
                const eventRef = doc(collection(firestore, 'events'));
                batch.set(eventRef, event);
            });

            batch.commit().then(() => {
                toast({ title: 'Agenda Pronta!', description: 'Adicionamos alguns eventos de exemplo para você.' });
            }).catch(console.error);
        }
    }, [areEventsLoading, events, user, firestore, toast, hasCreatedDefaultEvents]);

    const isLoading = isUserLoading || areEventsLoading || areClientsLoading || !isClient;

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    
    const daysForMonthView = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth),
        end: endOfWeek(lastDayOfMonth),
    });
    
    const filteredEvents = useMemo(() => {
        return events?.filter(event => visibleEventTypes.includes(event.type)) || [];
    }, [events, visibleEventTypes]);

    const handlePrev = () => {
      if (viewMode === 'month') {
        setCurrentDate(prev => subMonths(prev, 1));
      } else if (viewMode === 'week') {
        setCurrentDate(prev => subDays(prev, 7));
      } else {
        setCurrentDate(prev => subDays(prev, 1));
      }
    };

    const handleNext = () => {
      if (viewMode === 'month') {
        setCurrentDate(prev => addMonths(prev, 1));
      } else if (viewMode === 'week') {
        setCurrentDate(prev => addDays(prev, 7));
      } else {
        setCurrentDate(prev => addDays(prev, 1));
      }
    };
    
    const eventsByDate = useMemo(() => {
        const grouped: { [key: string]: Event[] } = {};
        filteredEvents?.forEach(event => {
            const date = event.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });
        return grouped;
    }, [filteredEvents]);

    const todayEvents = eventsByDate[format(new Date(), 'yyyy-MM-dd')] || [];

    const handleSaveEvent = async (data: EventFormData) => {
        if (!user || !firestore) return;
        
        try {
            await addDocumentNonBlocking(collection(firestore, 'events'), {
                ...data,
                brokerId: user.uid,
            });
            toast({
                title: 'Tarefa Salva!',
                description: 'Seu compromisso foi adicionado à agenda.',
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding event: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar a tarefa. Tente novamente.',
            });
        }
    };


    const weekStartsOn = 0; // 0 for Sunday
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn });
    const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn });

    const weekEvents = useMemo(() => {
        if (!filteredEvents) return [];
        const start = format(startOfCurrentWeek, 'yyyy-MM-dd');
        const end = format(endOfCurrentWeek, 'yyyy-MM-dd');
        return filteredEvents.filter(e => e.date >= start && e.date <= end);
    }, [filteredEvents, startOfCurrentWeek, endOfCurrentWeek]);
    
    const dayEvents = useMemo(() => {
        if (!filteredEvents) return [];
        const currentDay = format(currentDate, 'yyyy-MM-dd');
        return filteredEvents.filter(e => e.date === currentDay);
    }, [filteredEvents, currentDate]);
    
    const renderHeaderDate = () => {
        if (viewMode === 'month') {
            return format(currentDate, 'MMMM yyyy', { locale: ptBR });
        }
        if (viewMode === 'week') {
            const startMonth = format(startOfCurrentWeek, 'MMM', { locale: ptBR });
            const endMonth = format(endOfCurrentWeek, 'MMM', { locale: ptBR });
            if (startMonth === endMonth) {
                return `${format(startOfCurrentWeek, 'd')} - ${format(endOfCurrentWeek, 'd \'de\' MMMM, yyyy', { locale: ptBR })}`;
            }
            return `${format(startOfCurrentWeek, 'd \'de\' MMM', { locale: ptBR })} - ${format(endOfCurrentWeek, 'd \'de\' MMM, yyyy', { locale: ptBR })}`;
        }
        if (viewMode === 'day') {
            return format(currentDate, "eeee, d 'de' MMMM", { locale: ptBR });
        }
    };
    
    const handleFilterChange = (type: string) => {
        setVisibleEventTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };


    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Agenda</h1>
                    <p className="text-text-secondary mt-1">Gerencie seus compromissos, visitas e tarefas diárias.</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-6 rounded-lg shadow-glow transition-all duration-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px]">add</span>
                        Cadastrar Tarefa
                    </Button>
                    <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                          <VisuallyHidden>
                              <DialogTitle>Cadastrar Nova Tarefa</DialogTitle>
                              <DialogDescription>Preencha os detalhes abaixo para agendar um novo compromisso.</DialogDescription>
                          </VisuallyHidden>
                      </DialogHeader>
                       <EventForm 
                          onSave={handleSaveEvent} 
                          onCancel={() => setIsModalOpen(false)}
                          clients={clients || []}
                       />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-text-main capitalize w-full text-center sm:text-left sm:w-auto">
                                {isLoading ? 'Carregando...' : renderHeaderDate()}
                            </h2>
                            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                                <button onClick={handlePrev} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-text-secondary hover:text-text-main transition-all">
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <button onClick={handleNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-text-secondary hover:text-text-main transition-all">
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                           <button onClick={() => setViewMode('month')} className={cn("px-3 py-1.5 text-xs", viewMode === 'month' ? 'font-bold bg-white shadow-sm rounded text-text-main' : 'font-medium text-text-secondary hover:text-text-main transition-colors')}>Mês</button>
                           <button onClick={() => setViewMode('week')} className={cn("px-3 py-1.5 text-xs", viewMode === 'week' ? 'font-bold bg-white shadow-sm rounded text-text-main' : 'font-medium text-text-secondary hover:text-text-main transition-colors')}>Semana</button>
                           <button onClick={() => setViewMode('day')} className={cn("px-3 py-1.5 text-xs", viewMode === 'day' ? 'font-bold bg-white shadow-sm rounded text-text-main' : 'font-medium text-text-secondary hover:text-text-main transition-colors')}>Dia</button>
                        </div>
                    </div>
                    {isLoading ? (
                      <div className="flex-1 flex items-center justify-center p-10 text-text-secondary">Carregando agenda...</div>
                    ) : (
                      <>
                        {viewMode === 'month' && (
                            <div className="p-6">
                                <div className="grid grid-cols-7 mb-4">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                        <div key={day} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">{day}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 border-t border-l border-gray-100 bg-gray-100 gap-px">
                                    {daysForMonthView.map(day => {
                                        const dayKey = format(day, 'yyyy-MM-dd');
                                        const dayEvents = eventsByDate[dayKey] || [];
                                        return <Day key={day.toISOString()} day={day} dayEvents={dayEvents} currentMonth={currentDate} />;
                                    })}
                                </div>
                            </div>
                        )}
                        {viewMode === 'week' && <WeekView currentDate={currentDate} events={weekEvents} />}
                        {viewMode === 'day' && <DayView currentDate={currentDate} events={dayEvents} />}
                      </>
                    )}
                </div>
                
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary">event_note</span>
                                Tarefas de Hoje
                            </h3>
                            <span className="text-xs font-medium text-text-secondary bg-gray-50 px-2 py-1 rounded">{format(new Date(), 'dd MMM', { locale: ptBR })}</span>
                        </div>
                        <div className="space-y-4">
                            {todayEvents.length > 0 ? todayEvents.map(event => {
                                 const style = getTailwindColor(event.type, event.completed);
                                 const eventTypeLabel = eventTypeStyles[event.type as keyof typeof eventTypeStyles]?.label || 'Evento';
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
                        <button className="w-full mt-6 py-2 border border-dashed border-gray-300 rounded-lg text-text-secondary text-sm font-medium hover:border-primary hover:text-text-main transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Adicionar tarefa rápida
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wide">Filtros & Legenda</h3>
                        <div className="space-y-3">
                            {Object.entries(eventTypeStyles).map(([key, { color, label }]) => (
                                <label key={key} className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-3 rounded-full bg-${color}-500`}></div>
                                        <span className="text-sm text-text-secondary group-hover:text-text-main transition-colors">{label}</span>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={visibleEventTypes.includes(key)}
                                        onChange={() => handleFilterChange(key)}
                                        className="form-checkbox text-secondary rounded border-gray-300 focus:ring-primary h-4 w-4"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

  