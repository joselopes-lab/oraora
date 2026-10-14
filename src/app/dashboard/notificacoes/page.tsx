
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuthContext, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, limit, doc, updateDoc } from 'firebase/firestore';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, normalizeDate } from '@/lib/utils';
import { Zap, MessageCircle, Bell, ChevronRight, UserPlus, Building, Info } from 'lucide-react';
import { NotificationModel } from '@/lib/notifications/types';

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

type UnifiedNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  link?: string;
  read: boolean;
  isAnnouncement: boolean;
  sourceType?: string;
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

  // Query para Comunicados Globais (Broadcasts)
  const announcementsQuery = useMemoFirebase(
    () => {
      if (!firestore || !userProfile || !user) return null;
      return query(
        collection(firestore, 'announcements'),
        where('recipients', 'array-contains-any', [userProfile.userType, user.uid]),
        where('status', '==', 'sent'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    },
    [firestore, userProfile, user?.uid]
  );

  const { data: announcements, isLoading: isAnnouncementsLoading } = useCollection<Announcement>(announcementsQuery);

  // Query para Notificações Privadas do Usuário
  const notificationsQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(
        collection(firestore, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    },
    [firestore, user?.uid]
  );

  const { data: notifications, isLoading: isNotificationsLoading } = useCollection<NotificationModel>(notificationsQuery);

  // Unificar e filtrar notificações
  const unifiedNotifications = useMemo(() => {
    const all: UnifiedNotification[] = [];

    // Adicionar anúncios
    if (announcements) {
      announcements.forEach(ann => {
        all.push({
          id: ann.id,
          title: ann.title,
          message: ann.content,
          type: ann.type,
          createdAt: normalizeDate(ann.createdAt) || new Date(),
          link: ann.relatedId ? `/dashboard/solicitacoes-rede/${ann.relatedId}` : undefined,
          read: ann.id === lastReadId || (announcements[0]?.id !== ann.id && lastReadId !== null), 
          isAnnouncement: true,
        });
      });
    }

    // Adicionar notificações privadas
    if (notifications) {
      notifications.forEach(notif => {
        all.push({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          createdAt: normalizeDate(notif.createdAt) || new Date(),
          link: notif.link,
          read: notif.read,
          isAnnouncement: false,
          sourceType: notif.sourceType,
        });
      });
    }

    // Ordenar por data
    const sorted = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Filtrar por busca e categoria
    return sorted.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           n.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === 'Não lidas') {
          return !n.read;
      }
      
      if (activeFilter === 'Rede OraOra') {
          return n.type === 'rede_oraora';
      }

      if (activeFilter === 'Leads') {
          return n.type === 'new_lead';
      }

      if (activeFilter === 'Projetos') {
          return n.type === 'admin_project' || n.type === 'constructor_project';
      }

      return true;
    });
  }, [announcements, notifications, searchTerm, activeFilter, lastReadId]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: UnifiedNotification[] } = {
      'Hoje': [],
      'Ontem': [],
      'Anteriores': []
    };

    unifiedNotifications.forEach(n => {
      if (isToday(n.createdAt)) {
        groups['Hoje'].push(n);
      } else if (isYesterday(n.createdAt)) {
        groups['Ontem'].push(n);
      } else {
        groups['Anteriores'].push(n);
      }
    });

    return groups;
  }, [unifiedNotifications]);

  const handleRead = async (notification: UnifiedNotification) => {
    if (notification.isAnnouncement) {
        if (announcements && notification.id === announcements[0].id) {
            localStorage.setItem('last_read_announcement', notification.id);
            setLastReadId(notification.id);
        }
    } else if (!notification.read && firestore) {
        try {
            const docRef = doc(firestore, 'notifications', notification.id);
            await updateDoc(docRef, { read: true });
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }
  };

  const getIconForType = (n: UnifiedNotification) => {
      if (n.type === 'new_lead') return <UserPlus className="size-5" />;
      if (n.type === 'admin_project' || n.type === 'constructor_project') return <Building className="size-5" />;
      if (n.type === 'rede_oraora') return <Zap className="size-5" />;
      if (n.type === 'system') return <Info className="size-5" />;
      return <MessageCircle className="size-5" />;
  };

  const getLabelForType = (type: string) => {
      switch(type) {
          case 'new_lead': return 'Novo Lead';
          case 'admin_project': return 'Novo Projeto';
          case 'constructor_project': return 'Novo Lançamento';
          case 'rede_oraora': return 'Rede OraOra';
          case 'system': return 'Sistema';
          default: return 'Comunicado';
      }
  };

  const isLoading = isAnnouncementsLoading || isNotificationsLoading;

  return (
    <div className="flex flex-col max-w-[960px] mx-auto w-full py-8 text-left">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6 px-4 md:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main text-3xl font-bold tracking-tight uppercase">Notificações</h1>
          <p className="text-text-secondary text-base font-normal">Gerencie todos os alertas e atualizações do sistema em tempo real.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 px-4 md:px-0">
        <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <Input 
              className="w-full h-12 pl-12 pr-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['Todas', 'Não lidas', 'Leads', 'Projetos', 'Rede OraOra'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "flex h-12 shrink-0 items-center justify-center px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
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

      <div className="space-y-10 px-4 md:px-0">
        {isLoading && (
          <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
            <Bell className="size-8 animate-bounce" />
            <p className="italic text-sm font-medium">Carregando suas notificações...</p>
          </div>
        )}
        
        {!isLoading && Object.entries(groupedNotifications).map(([title, items]) => (
          items.length > 0 && (
            <div key={title} className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">{title}</h3>
              {items.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleRead(n)}
                  className={cn(
                    "group flex items-start gap-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border-l-4 shadow-soft hover:shadow-md transition-all relative overflow-hidden cursor-pointer",
                    !n.read ? "border-primary" : "border-transparent opacity-80"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 size-12 rounded-xl flex items-center justify-center transition-colors",
                    !n.read ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}>
                    {getIconForType(n)}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <h4 className={cn(
                        "font-bold text-lg leading-tight uppercase tracking-tight",
                        !n.read ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
                      )}>{n.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {format(n.createdAt, "HH:mm")}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed max-w-2xl",
                      !n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-500 dark:text-slate-500"
                    )}>{n.message}</p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
                              {getLabelForType(n.type)}
                          </span>
                          {!n.read && (
                              <div className="size-2 rounded-full bg-primary shadow-glow animate-pulse"></div>
                          )}
                      </div>
                      {n.link && (
                          <Button asChild variant="link" className="p-0 h-auto text-primary-hover font-black text-[10px] uppercase tracking-widest gap-2">
                              <Link href={n.link}>
                                  Ver detalhes <ChevronRight className="size-3" />
                              </Link>
                          </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ))}

        {!isLoading && unifiedNotifications.length === 0 && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6">
            <span className="material-symbols-outlined text-6xl text-slate-200">notifications_off</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma notificação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
