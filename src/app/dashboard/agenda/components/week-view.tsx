
'use client';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Event = {
  id: string;
  brokerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  duration?: string; // in minutes
  type: 'reuniao' | 'visita' | 'tarefa' | 'particular' | 'outro';
  description?: string;
};

const eventTypeStyles: { [key: string]: string } = {
  reuniao: 'bg-blue-50 border-l-2 border-blue-500 text-blue-700',
  visita: 'bg-secondary/10 border-l-2 border-secondary text-text-main',
  tarefa: 'bg-yellow-50 border-l-2 border-yellow-400 text-yellow-800',
  particular: 'bg-purple-50 border-l-2 border-purple-500 text-purple-700',
  outro: 'bg-gray-100 border-l-2 border-gray-400 text-gray-700',
};


const calculateEventPosition = (time: string, duration: string | undefined) => {
    const [hour, minute] = time.split(':').map(Number);
    const top = (hour - 8) * 60 + minute; // assuming grid starts at 8am, 1px per minute
    const height = duration ? parseInt(duration) : 60; // default to 60 mins
    return { top, height };
};


export function WeekView({ currentDate, events }: { currentDate: Date, events: Event[] }) {
  const weekStartsOn = 0; // 0 for Sunday
  const startOfView = startOfWeek(currentDate, { weekStartsOn });
  const days = eachDayOfInterval({ start: startOfView, end: endOfWeek(currentDate, { weekStartsOn }) });
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  return (
    <>
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-gray-100">
        <div className="p-4 border-r border-gray-50"></div>
        {days.map((day) => (
          <div key={day.toString()} className={cn("p-3 text-center border-r border-gray-50", isToday(day) && "bg-primary/5")}>
            <span className="block text-xs font-semibold text-text-secondary uppercase">{format(day, 'E', { locale: ptBR })}</span>
            <span className={cn("block text-lg font-bold text-text-main", isToday(day) && "flex items-center justify-center mx-auto size-7 bg-secondary text-white rounded-full text-sm font-bold shadow-glow mt-1")}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto relative">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] relative min-h-[720px]">
          {/* Time Gutter */}
          <div className="border-r border-gray-100 bg-white sticky left-0 z-10">
            {timeSlots.map(time => (
                 <div key={time} className="h-[60px] relative">
                    <span className="absolute -top-2.5 right-2 text-xs text-text-secondary">{time}</span>
                </div>
            ))}
          </div>
          {/* Main Grid */}
          <div className="col-span-7 grid grid-cols-7 relative">
             {/* Background Lines */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {timeSlots.map(time => <div key={time} className="h-[60px] border-b border-gray-50 border-dashed w-full"></div>)}
            </div>
             <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                {days.map(day => <div key={day.toISOString()} className={cn("border-r border-gray-50 h-full", isToday(day) && "bg-primary/5")}></div>)}
             </div>
             {/* Events */}
             {days.map((day, dayIndex) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = events.filter(e => e.date === dayKey);
                return (
                    <div key={dayKey} className={`relative h-full col-start-${dayIndex + 1}`}>
                        {dayEvents.filter(e => e.time).map(event => {
                           const { top, height } = calculateEventPosition(event.time!, event.duration);
                           return (
                             <Link href={`/dashboard/agenda/${event.id}`} key={event.id} className={`week-event ${eventTypeStyles[event.type] || eventTypeStyles.outro} pointer-events-auto cursor-pointer`} style={{ top: `${top}px`, height: `${height}px` }}>
                                <div className="font-bold text-[11px] mb-0.5">{event.title}</div>
                                {event.description && <div className="text-[10px] opacity-80">{event.description}</div>}
                            </Link>
                           )
                        })}
                    </div>
                )
             })}
          </div>
        </div>
      </div>
    </>
  );
}
