
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuthContext, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Zap, MessageCircle, CheckCircle2, Ban, Clock, Handshake } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  recipients: string[];
  status: 'sent' | 'scheduled' | 'draft';
  type: 'broadcast' | 'notification' | 'rede_oraora';
  relatedId?: string;
  createdAt: Timestamp;
};

export default function NotificacoesPage() {
  const { user, userProfile } = useAuthContext();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [lastReadId, setLastReadId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('last_read_announcement');
    if (saved) setLastReadId(saved);
  }, []);

  const announcementsQuery = useMemoFirebase(
    () => {
      if (!firestore || !userProfile || !user) return null;
      return query(
        collection(firestore, 'announcements'),
        where('recipients', 'array-contains-any', [userProfile.userType, user.uid]),
        where('status', '==', 'sent'),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, userProfile, user?.uid]
  );

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter(ann => {
      const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           ann.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === 'Não lidas') {
          return ann.id !== lastReadId && ann.id === announcements[0]?.id;
      }
      
      if (activeFilter === 'Rede OraOra') {
          return ann.type === 'rede_oraora';
      }

      return true;
    });
  }, [announcements, searchTerm, activeFilter, lastReadId]);

  const groupedAnnouncements = useMemo(() => {
    const groups: { [key: string]: Announcement[] } = {
      'Hoje': [],
      'Ontem': [],
      'Anteriores': []
    };

    filteredAnnouncements.forEach(ann => {
      const date = ann.createdAt.toDate();
      if (isToday(date)) {
        groups['Hoje'].push(ann);
      } else if (isYesterday(date)) {
        groups['Ontem'].push(ann);
      } else {
        groups['Anteriores'].push(ann);
      }
    });

    return groups;
  }, [filteredAnnouncements]);

  const handleRead = (id: string) => {
    if (announcements && id === announcements[0].id) {
        localStorage.setItem('last_read_announcement', id);
        setLastReadId(id);
    }
  };

  const getIconForType = (type: string) => {
      switch(type) {
          case 'rede_oraora': return <Zap className="size-5" />;
          default: return <MessageCircle className="size-5" />;
      }
  };

  return (
    <div className="flex flex-col max-w-[960px] mx-auto w-full py-8 text-left">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main text-3xl font-bold tracking-tight uppercase">Notificações</h1>
          <p className="text-text-secondary text-base font-normal">Gerencie todos os alertas e atualizações do sistema em tempo real.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <Input 
              className="w-full h-12 pl-12 pr-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
          {['Todas', 'Não lidas', 'Rede OraOra'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "flex h-12 shrink-0 items-center justify-center px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeFilter === filter 
                  ? "bg-primary text-slate-900 shadow-sm" 
                  : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-primary/50"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {isLoading && <p className="text-center text-slate-400 py-10 italic">Carregando notificações...</p>}
        
        {Object.entries(groupedAnnouncements).map(([title, items]) => (
          items.length > 0 && (
            <div key={title} className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">{title}</h3>
              {items.map((ann) => {
                const isUnread = lastReadId !== ann.id && ann.id === announcements?.[0]?.id;
                return (
                  <div 
                    key={ann.id} 
                    onClick={() => handleRead(ann.id)}
                    className={cn(
                      "group flex items-start gap-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border-l-4 shadow-soft hover:shadow-md transition-all relative overflow-hidden",
                      isUnread ? "border-primary" : "border-transparent opacity-80"
                    )}
                  >
                    <div className="flex-shrink-0 size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                      {getIconForType(ann.type)}
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight uppercase tracking-tight">{ann.title}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {format(ann.createdAt.toDate(), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">{ann.content}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
                                {ann.type === 'rede_oraora' ? 'Rede OraOra' : 'Sistema'}
                            </span>
                            {isUnread && (
                                <div className="size-2 rounded-full bg-primary shadow-glow animate-pulse"></div>
                            )}
                        </div>
                        {ann.relatedId && (
                            <Button asChild variant="link" className="p-0 h-auto text-primary-hover font-black text-[10px] uppercase tracking-widest gap-2">
                                <Link href={`/dashboard/solicitacoes-rede/${ann.relatedId}`}>
                                    Ver Solicitação <ChevronRight className="size-3" />
                                </Link>
                            </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ))}

        {!isLoading && filteredAnnouncements.length === 0 && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6">
            <span className="material-symbols-outlined text-6xl text-slate-200">notifications_off</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma notificação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
