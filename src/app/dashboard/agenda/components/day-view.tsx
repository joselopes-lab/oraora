
'use client';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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


export function DayView({ currentDate, events }: { currentDate: Date, events: Event[] }) {

  return (
    <div className="p-6">
      <h3 className="font-bold text-lg mb-4">Compromissos para {format(currentDate, "d 'de' MMMM", { locale: ptBR })}</h3>
      <div className="space-y-4">
        {events.length > 0 ? events.map(event => (
          <Link href={`/dashboard/agenda/${event.id}`} key={event.id} className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
            <p className="font-bold">{event.time} - {event.title}</p>
            <p className="text-sm text-gray-600">{event.description}</p>
          </Link>
        )) : (
          <p className="text-gray-500">Nenhum compromisso para hoje.</p>
        )}
      </div>
    </div>
  );
}
