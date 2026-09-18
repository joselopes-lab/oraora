'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, StickyNote, Trash2, Edit2, Calendar, Bell, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getPrivatePropertyNotesServer,
  createPrivatePropertyNoteServer,
  updatePrivatePropertyNoteServer,
  deletePrivatePropertyNoteServer,
} from '../actions.server';

interface PrivateNote {
  id: string;
  title?: string;
  content: string;
  reminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PrivateNotesSection({ propertyId, isAvulso }: { propertyId?: string; isAvulso: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<PrivateNote | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formReminder, setFormReminder] = useState('');

  const loadNotes = useCallback(async () => {
    if (!propertyId || !isAvulso) return;
    try {
      setIsLoading(true);
      let idToken = undefined;
      if (user) {
        try { idToken = await user.getIdToken(); } catch (e) {}
      }
      const res = await getPrivatePropertyNotesServer(propertyId, idToken);
      if (res.success && res.notes) {
        setNotes(res.notes);
      }
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, isAvulso, user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  if (!isAvulso) return null;

  if (!propertyId) {
    return (
      <section className="bg-white rounded-xl border border-card-border shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="size-5 text-primary" />
          <h3 className="font-bold text-lg">Notas e Lembretes</h3>
        </div>
        <p className="text-xs text-text-secondary">
          Informações internas, visíveis somente para você. 
          <span className="block mt-1 font-medium text-amber-600">Salve o imóvel primeiro para poder cadastrar notas e lembretes privados.</span>
        </p>
      </section>
    );
  }

  const handleOpenNew = () => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormContent('');
    setFormReminder('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: PrivateNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title || '');
    setFormContent(note.content || '');
    setFormReminder(note.reminderAt ? new Date(note.reminderAt).toISOString().slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!formContent.trim()) {
      toast({ title: 'Atenção', description: 'O conteúdo da nota é obrigatório.', variant: 'destructive' });
      return;
    }
    try {
      setIsSaving(true);
      let idToken = undefined;
      if (user) {
        try { idToken = await user.getIdToken(); } catch (e) {}
      }

      if (editingNoteId) {
        const res = await updatePrivatePropertyNoteServer(
          propertyId,
          editingNoteId,
          { title: formTitle, content: formContent, reminderAt: formReminder || undefined },
          idToken
        );
        if (res.success) {
          toast({ title: 'Sucesso', description: 'Nota atualizada com sucesso.' });
          setIsModalOpen(false);
          loadNotes();
        } else {
          toast({ title: 'Erro', description: res.error || 'Erro ao atualizar nota.', variant: 'destructive' });
        }
      } else {
        const res = await createPrivatePropertyNoteServer(
          propertyId,
          { title: formTitle, content: formContent, reminderAt: formReminder || undefined },
          idToken
        );
        if (res.success) {
          toast({ title: 'Sucesso', description: 'Nota criada com sucesso.' });
          setIsModalOpen(false);
          loadNotes();
        } else {
          toast({ title: 'Erro', description: res.error || 'Erro ao criar nota.', variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar nota.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    try {
      let idToken = undefined;
      if (user) {
        try { idToken = await user.getIdToken(); } catch (e) {}
      }
      const res = await deletePrivatePropertyNoteServer(propertyId, noteToDelete.id, idToken);
      if (res.success) {
        toast({ title: 'Sucesso', description: 'Nota excluída com sucesso.' });
        setNoteToDelete(null);
        loadNotes();
      } else {
        toast({ title: 'Erro', description: res.error || 'Erro ao excluir nota.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao excluir nota.', variant: 'destructive' });
    }
  };

  return (
    <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-card-border bg-gray-50/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <StickyNote className="size-5 text-primary" />
            Notas e Lembretes
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">Informações internas, visíveis somente para você.</p>
        </div>
        <Button type="button" onClick={handleOpenNew} size="sm" className="font-bold gap-1">
          <Plus className="size-4" />
          Adicionar Nota
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-card-border rounded-xl bg-gray-50/30">
            <StickyNote className="size-10 text-text-secondary mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-text-main">Nenhuma nota adicionada ainda.</p>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Registre informações internas para consultar depois, como recados do proprietário, pendências ou histórico de negociação.
            </p>
            <Button type="button" onClick={handleOpenNew} variant="outline" size="sm" className="mt-4 font-bold">
              Criar primeira nota
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="p-4 rounded-xl border border-card-border bg-amber-50/30 dark:bg-slate-900 flex flex-col justify-between relative group shadow-sm w-full">
                <div>
                  {note.title && (
                    <h4 className="font-bold text-sm text-text-main mb-1 flex items-center justify-between">
                      {note.title}
                    </h4>
                  )}
                  <p className="text-xs text-text-main whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  
                  {note.reminderAt && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-1 rounded-md w-fit">
                      <Bell className="size-3.5" />
                      Lembrete: {new Date(note.reminderAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between text-[10px] text-text-secondary">
                  <span>Atualizado em {new Date(note.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 hover:bg-white rounded text-text-secondary hover:text-primary transition-colors"
                      title="Editar nota"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteToDelete(note)}
                      className="p-1.5 hover:bg-white rounded text-text-secondary hover:text-red-600 transition-colors"
                      title="Excluir nota"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNoteId ? 'Editar Nota' : 'Nova Nota / Lembrete'}</DialogTitle>
            <DialogDescription>
              Insira detalhes internos que ficarão visíveis apenas no seu painel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="noteTitle" className="text-xs font-bold">Título (Opcional)</Label>
              <Input
                id="noteTitle"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Ex: Recado do proprietário, Documentação..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="noteContent" className="text-xs font-bold">Conteúdo da Nota *</Label>
              <Textarea
                id="noteContent"
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Digite as observações, condições de negociação ou pendências..."
                rows={4}
                className="mt-1 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="noteReminder" className="text-xs font-bold flex items-center gap-1">
                <Calendar className="size-3.5" /> Lembrete de Retorno (Opcional)
              </Label>
              <Input
                id="noteReminder"
                type="datetime-local"
                value={formReminder}
                onChange={e => setFormReminder(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveNote} disabled={isSaving || !formContent.trim()} className="font-bold">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Salvar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmação Exclusão */}
      <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" /> Excluir Nota
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="outline" onClick={() => setNoteToDelete(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} className="font-bold">
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
