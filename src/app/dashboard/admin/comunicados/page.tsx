'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useAuthContext } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Announcement = {
  id: string;
  title: string;
  content: string;
  recipients: string[];
  status: 'sent' | 'scheduled' | 'draft';
  scheduledAt: string | null;
  createdAt: Timestamp;
  authorId: string;
  viewCount: number;
};

export default function ComunicadosPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const announcementsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null),
    [firestore, user]
  );

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  const handleCreateAnnouncement = async () => {
    if (!user || !firestore) return;
    if (!title || !content || recipients.length === 0) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha o título, conteúdo e selecione ao menos um destinatário.' });
      return;
    }

    const scheduledAt = scheduleMode === 'scheduled' ? `${scheduledDate}T${scheduledTime}` : null;
    const status = scheduleMode === 'scheduled' ? 'scheduled' : 'sent';

    const newAnnouncement = {
      title,
      content,
      recipients,
      status,
      scheduledAt,
      createdAt: serverTimestamp(),
      authorId: user.uid,
      viewCount: 0,
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'announcements'), newAnnouncement);
      toast({ title: 'Sucesso!', description: scheduleMode === 'now' ? 'Comunicado enviado com sucesso.' : 'Comunicado agendado com sucesso.' });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar comunicado:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o comunicado.' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setRecipients([]);
    setScheduledDate('');
    setScheduledTime('');
    setScheduleMode('now');
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'announcements', id));
    toast({ title: 'Excluído', description: 'O comunicado foi removido do histórico.' });
  };

  const toggleRecipient = (role: string) => {
    setRecipients(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const stats = useMemo(() => {
    if (!announcements) return { total: 0, reach: 0, views: 0 };
    const total = announcements.length;
    const views = announcements.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
    return { total, reach: total * 100, views }; // Mock reach calculation
  }, [announcements]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">Campanhas e Avisos</h1>
          <p className="text-slate-600 text-base font-normal">Gerencie e envie comunicados importantes para sua rede de contatos.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="cursor-pointer flex items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-slate-900 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined font-bold">add_circle</span>
              <span>Criar Novo Aviso</span>
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 max-w-2xl border-none bg-transparent shadow-none gap-0">
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>Criar Novo Aviso</DialogTitle>
              </DialogHeader>
            </VisuallyHidden>
            
            <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Criar Novo Aviso</h3>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Título do Aviso</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input w-full rounded-xl border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary transition-all px-4 h-12 text-sm" 
                    placeholder="Ex: Atualização de Tabela Q4" 
                    type="text"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Destinatários</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        checked={recipients.includes('broker')}
                        onChange={() => toggleRecipient('broker')}
                        className="rounded text-primary focus:ring-primary border-slate-300 h-5 w-5 cursor-pointer" type="checkbox"
                      />
                      <span className="text-sm text-slate-600 font-medium group-hover:text-primary transition-colors">Corretores</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        checked={recipients.includes('constructor')}
                        onChange={() => toggleRecipient('constructor')}
                        className="rounded text-primary focus:ring-primary border-slate-300 h-5 w-5 cursor-pointer" type="checkbox"
                      />
                      <span className="text-sm text-slate-600 font-medium group-hover:text-primary transition-colors">Construtoras</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Conteúdo do Aviso</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-textarea w-full rounded-xl border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary transition-all resize-none p-4 text-sm" 
                    placeholder="Digite aqui a mensagem que será enviada..." 
                    rows={6}
                  ></textarea>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Agendamento</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      onClick={() => setScheduleMode('now')}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-sm font-bold",
                        scheduleMode === 'now' 
                          ? "border-primary bg-primary/5 text-slate-900" 
                          : "border-slate-100 bg-transparent text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">send</span>
                      Enviar agora
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setScheduleMode('scheduled')}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-sm font-bold",
                        scheduleMode === 'scheduled' 
                          ? "border-primary bg-primary/5 text-slate-900" 
                          : "border-slate-100 bg-transparent text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">calendar_today</span>
                      Agendar data/hora
                    </button>
                  </div>

                  {scheduleMode === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Envio</label>
                        <input 
                          type="date" 
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="form-input w-full rounded-xl border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary transition-all px-4 h-12 text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hora de Envio</label>
                        <input 
                          type="time" 
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="form-input w-full rounded-xl border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary transition-all px-4 h-12 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-gray-50/30">
                <DialogClose asChild>
                  <button className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer">
                    Cancelar
                  </button>
                </DialogClose>
                <button 
                  onClick={handleCreateAnnouncement}
                  className="px-8 py-3 rounded-xl bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  {scheduleMode === 'now' ? 'Enviar Aviso' : 'Agendar Aviso'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Avisos Enviados</p>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </div>
          <p className="text-slate-900 text-3xl font-black">{stats.total}</p>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full w-fit">
            <span className="material-symbols-outlined text-xs font-bold">trending_up</span>
            <span>Histórico total</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Visualizações Totais</p>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
          </div>
          <p className="text-slate-900 text-3xl font-black">{stats.views}</p>
          <p className="text-slate-400 text-xs font-medium">Engajamento acumulado</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Alcance Estimado</p>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <p className="text-slate-900 text-3xl font-black">{stats.reach}</p>
          <p className="text-slate-400 text-xs">Pessoas impactadas</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Taxa de Abertura</p>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>ads_click</span>
          </div>
          <p className="text-slate-900 text-3xl font-black">78.5%</p>
          <p className="text-slate-400 text-xs">Média global</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <th className="px-6 py-4">Título do Aviso</th>
                <th className="px-6 py-4">Destinatários</th>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium italic">Carregando avisos...</td></tr>
              )}
              {!isLoading && announcements?.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-sm">{ann.title}</span>
                      <span className="text-slate-400 text-xs line-clamp-1 max-w-[300px]">{ann.content}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {ann.recipients.map(r => (
                        <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          {r === 'broker' ? 'Corretores' : 'Construtoras'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col text-sm text-slate-700">
                      <span>{ann.createdAt ? format(ann.createdAt.toDate(), "dd/MM/yyyy, HH:mm", { locale: ptBR }) : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      ann.status === 'sent' ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {ann.status === 'sent' ? 'Enviado' : 'Agendado'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setAnnouncementToDelete(ann)} 
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" 
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && announcements?.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">Nenhum comunicado cadastrado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comunicado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comunicado "{announcementToDelete?.title}" será removido permanentemente do histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (announcementToDelete) {
                  handleDelete(announcementToDelete.id);
                  setAnnouncementToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
