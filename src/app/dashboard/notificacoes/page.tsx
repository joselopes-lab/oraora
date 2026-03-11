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

type Announcement = {
  id: string;
  title: string;
  content: string;
  recipients: string[];
  status: 'sent' | 'scheduled' | 'draft';
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
      if (!firestore || !userProfile) return null;
      return query(
        collection(firestore, 'announcements'),
        where('recipients', 'array-contains', userProfile.userType),
        where('status', '==', 'sent'),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, userProfile]
  );

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter(ann => {
      const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           ann.content.toLowerCase().includes(searchTerm.toLowerCase());
      // No momento a entidade no Firestore não tem categoria, então filtramos apenas por busca
      return matchesSearch;
    });
  }, [announcements, searchTerm]);

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

  const handleMarkAllAsRead = () => {
    if (announcements && announcements.length > 0) {
      const latestId = announcements[0].id;
      localStorage.setItem('last_read_announcement', latestId);
      setLastReadId(latestId);
    }
  };

  const handleRead = (id: string) => {
    // Se for o mais recente, atualizamos o estado global de lidos
    if (announcements && id === announcements[0].id) {
        localStorage.setItem('last_read_announcement', id);
        setLastReadId(id);
    }
  };

  return (
    <div className="flex flex-col max-w-[960px] mx-auto w-full py-8">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-text-secondary text-base font-normal">Gerencie todos os alertas e atualizações do sistema em tempo real.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <Input 
              className="w-full h-12 pl-12 pr-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary"
              placeholder="Buscar notificações por título ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleMarkAllAsRead}
            className="flex items-center justify-center gap-2 px-4 h-12 rounded-xl bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-105 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">done_all</span>
            Marcar todas como lidas
          </Button>
          <Button variant="outline" className="flex items-center justify-center px-3 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-all">
            <span className="material-symbols-outlined">delete</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {['Todas', 'Leads', 'Financeiro', 'Sistema', 'Agenda'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "flex h-10 shrink-0 items-center justify-center px-5 rounded-full text-sm font-bold transition-all",
              activeFilter === filter 
                ? "bg-primary text-slate-900 shadow-sm" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-primary/50"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {isLoading && <p className="text-center text-slate-500 py-10">Carregando notificações...</p>}
        
        {Object.entries(groupedAnnouncements).map(([title, items]) => (
          items.length > 0 && (
            <div key={title} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{title}</h3>
              {items.map((ann) => {
                const isUnread = lastReadId !== ann.id && ann.id === announcements?.[0]?.id;
                return (
                  <div 
                    key={ann.id} 
                    onClick={() => handleRead(ann.id)}
                    className={cn(
                      "group flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 shadow-sm hover:shadow-md transition-all",
                      isUnread ? "border-primary" : "border-transparent opacity-80"
                    )}
                  >
                    <div className="flex-shrink-0 size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">campaign</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-slate-900 dark:text-slate-100 font-bold text-base">{ann.title}</h4>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {format(ann.createdAt.toDate(), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-slate-700 dark:text-primary uppercase tracking-wider">Comunicado</span>
                        {isUnread && (
                          <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_#8cf91f]"></div>
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
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">notifications_off</span>
            <p className="text-slate-500 font-medium">Nenhuma notificação encontrada.</p>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <button className="text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">
          Carregar mais notificações
          <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
        </button>
      </div>
    </div>
  );
}