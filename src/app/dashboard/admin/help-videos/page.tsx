'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useAuthContext } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type HelpVideoDoc = {
  id: string;
  title: string;
  description?: string;
  page: string;
  videoUrl: string;
  active: boolean;
  order: number;
  createdAt?: Timestamp;
};

const SYSTEM_PAGES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'clientes', label: 'Clientes & Leads' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'leads', label: 'Gestão de Leads' },
  { value: 'agenda', label: 'Agenda & Compromissos' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'oralink', label: 'Oralink (Bio & Contatos)' },
  { value: 'perfil', label: 'Meu Perfil' },
  { value: 'loja', label: 'Loja / Temas' },
  { value: 'suporte', label: 'Suporte & Tickets' },
  { value: 'construtoras', label: 'Construtoras' },
  { value: 'personas', label: 'Personas' },
  { value: 'propostas', label: 'Propostas' },
  { value: 'score', label: 'Score Imobiliário' },
  { value: 'sites', label: 'Editor de Sites' },
  { value: 'dominio', label: 'Domínio Personalizado' },
];

export default function AdminHelpVideosPage() {
  const { user, authLoading } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HelpVideoDoc | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<HelpVideoDoc | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [page, setPage] = useState('clientes');
  const [videoUrl, setVideoUrl] = useState('');
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState('0');

  const videosQuery = useMemoFirebase(
    () => {
      if (authLoading || !user || !firestore) return null;
      return query(collection(firestore, 'helpVideos'), orderBy('order', 'asc'));
    },
    [authLoading, user, firestore]
  );

  const { data: videos, isLoading } = useCollection<HelpVideoDoc>(videosQuery);

  const handleOpenCreate = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setPage('clientes');
    setVideoUrl('');
    setActive(true);
    setOrder('0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: HelpVideoDoc) => {
    setEditingVideo(v);
    setTitle(v.title);
    setDescription(v.description || '');
    setPage(v.page);
    setVideoUrl(v.videoUrl);
    setActive(v.active);
    setOrder(String(v.order || 0));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!firestore || !user) return;
    if (!title || !page || !videoUrl) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha o título, a página e a URL do vídeo.' });
      return;
    }

    const payload = {
      title,
      description,
      page,
      videoUrl,
      active,
      order: parseInt(order) || 0,
    };

    try {
      if (editingVideo) {
        await updateDocumentNonBlocking(doc(firestore, 'helpVideos', editingVideo.id), payload);
        toast({ title: 'Sucesso!', description: 'Vídeo atualizado com sucesso.' });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'helpVideos'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Sucesso!', description: 'Vídeo cadastrado com sucesso.' });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o vídeo.' });
    }
  };

  const handleDelete = (v: HelpVideoDoc) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'helpVideos', v.id));
    toast({ title: 'Excluído', description: 'Vídeo removido com sucesso.' });
    setVideoToDelete(null);
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10 max-w-7xl mx-auto w-full text-left">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Vídeos de Ajuda</h1>
          <p className="text-slate-600 text-base font-normal">Gerencie os tutoriais em vídeo exibidos em cada tela do sistema.</p>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="cursor-pointer flex items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-slate-900 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined font-bold">add</span>
          <span>Cadastrar Vídeo</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Ordem</th>
                <th className="py-4 px-6">Título</th>
                <th className="py-4 px-6">Página / Tela</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Carregando vídeos...</td>
                </tr>
              ) : videos?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Nenhum vídeo cadastrado ainda.</td>
                </tr>
              ) : (
                videos?.map((video) => (
                  <tr key={video.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">{video.order}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{video.title}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold uppercase">
                        {video.page}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${video.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {video.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(video)}
                        className="cursor-pointer inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setVideoToDelete(video)}
                        className="cursor-pointer inline-flex items-center justify-center p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="p-0 max-w-lg border-none bg-transparent shadow-none gap-0">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Editar Vídeo de Ajuda' : 'Cadastrar Vídeo de Ajuda'}</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>

          <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {editingVideo ? 'Editar Vídeo de Ajuda' : 'Cadastrar Vídeo de Ajuda'}
              </h3>
            </div>

            <div className="p-6 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Título do Vídeo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Como gerenciar clientes e leads"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 h-12 text-sm focus:border-primary focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Descrição Opcional</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções ou resumo sobre o vídeo..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-primary focus:ring-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Página / Tela Alvo</label>
                  <select
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 h-12 text-sm focus:border-primary focus:ring-primary outline-none transition-all cursor-pointer"
                  >
                    {SYSTEM_PAGES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} ({p.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 h-12 text-sm focus:border-primary focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">URL do Vídeo (YouTube / Embed)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 h-12 text-sm focus:border-primary focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Vídeo Ativo (visível para os usuários)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="cursor-pointer px-6 py-2.5 rounded-xl bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!videoToDelete} onOpenChange={() => setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vídeo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o vídeo &quot;{videoToDelete?.title}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => videoToDelete && handleDelete(videoToDelete)}
              className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
