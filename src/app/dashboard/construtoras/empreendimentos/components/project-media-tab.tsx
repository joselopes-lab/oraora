'use client';

import { useState } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProjectMediaServer } from '../actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle, AlertCircle, Upload, Trash2, Image as ImageIcon, Sparkles, Loader2, Plus } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

interface ProjectMediaTabProps {
  project: {
    id: string;
    midia?: string[];
  };
}

const CATEGORIES = [
  { id: 'fachada', label: 'Fachada', description: 'Imagens externas e volumetria' },
  { id: 'lazer', label: 'Lazer', description: 'Áreas comuns, piscina, academia' },
  { id: 'decorado', label: 'Decorado', description: 'Fotos do apartamento modelo' },
  { id: 'plantas', label: 'Plantas', description: 'Plantas baixas e diagramas' },
  { id: 'obra', label: 'Obra', description: 'Evolução e estágio atual da construção' },
  { id: 'perspectivas', label: 'Perspectivas', description: 'Renders e ilustrações artísticas' },
  { id: 'outros', label: 'Outros', description: 'Documentos e mídias gerais' },
];

export default function ProjectMediaTab({ project }: ProjectMediaTabProps) {
  const { user } = useUser();
  const { storage } = useFirebase();
  const { toast } = useToast();

  const [mediaList, setMediaList] = useState<string[]>(project.midia || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const path = `projects/${project.id}/media`;
        const url = await uploadFile(storage, path, file, (progress) => {
          setUploadProgress(Math.round(((i / totalFiles) * 100) + (progress / totalFiles)));
        });
        newUrls.push(url);
      }

      const updated = [...mediaList, ...newUrls];
      setMediaList(updated);
      setIsDirty(true);
      toast({ title: 'Upload concluído!', description: `${newUrls.length} arquivo(s) adicionado(s) com sucesso.` });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message || 'Falha ao enviar arquivo.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const updated = [...mediaList, manualUrl.trim()];
    setMediaList(updated);
    setManualUrl('');
    setIsDirty(true);
  };

  const handleRemoveMedia = (index: number) => {
    const updated = mediaList.filter((_, i) => i !== index);
    setMediaList(updated);
    setIsDirty(true);
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updated = [...mediaList];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setMediaList(updated);
    setDraggedIndex(null);
    setIsDirty(true);
    toast({ title: 'Ordem atualizada', description: 'A posição da mídia foi alterada.' });
  };

  const handleSetFeatured = (index: number) => {
    if (index === 0) return;
    const updated = [...mediaList];
    const [item] = updated.splice(index, 1);
    updated.unshift(item);
    setMediaList(updated);
    setIsDirty(true);
    toast({ title: 'Imagem de Destaque Atualizada', description: 'Esta imagem agora é a capa principal do empreendimento.' });
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await updateProjectMediaServer(project.id, {
        midia: mediaList,
        idToken,
      });

      setIsDirty(false);
      toast({ title: 'Salvo com sucesso!', description: 'A galeria de mídia foi atualizada.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-xs sticky top-4 z-10">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4" /> Alterações não salvas
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Todas as alterações salvas
            </div>
          )}
          <span className="text-xs text-slate-400 font-mono ml-4">({mediaList.length} mídias cadastradas)</span>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Upload Dropzone Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" /> Acervo Visual do Empreendimento
          </CardTitle>
          <CardDescription>
            Faça upload das imagens oficiais do lançamento. Estas mídias ficarão vinculadas diretamente ao projeto e serão utilizadas na publicação e distribuição para os corretores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-all relative">
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleFileUpload} 
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="max-w-sm mx-auto space-y-3 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 text-sm">
                  {isUploading ? 'Enviando arquivos...' : 'Arraste imagens ou clique para selecionar'}
                </p>
                <p className="text-xs text-slate-500">PNG, JPG, WEBP de alta resolução suportados</p>
              </div>
            </div>
            {isUploading && (
              <div className="mt-4 max-w-xs mx-auto space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-slate-500 font-mono">{uploadProgress}%</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t flex gap-2 max-w-xl">
            <Input 
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Ou cole o link direto da imagem (https://...)"
            />
            <Button type="button" variant="secondary" onClick={handleAddManualUrl}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Galeria de Mídias Vinculadas ({mediaList.length})</CardTitle>
          <CardDescription>Visualização das imagens cadastradas para este empreendimento.</CardDescription>
        </CardHeader>
        <CardContent>
          {mediaList.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed rounded-xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Nenhuma mídia cadastrada ainda.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Faça o upload da fachada, áreas de lazer e perspectivas para enriquecer a apresentação do projeto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaList.map((url, index) => {
                const isFeatured = index === 0;
                return (
                  <div 
                    key={index} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`group relative rounded-xl overflow-hidden border bg-card shadow-sm transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${isFeatured ? 'ring-2 ring-primary border-primary' : 'border-border'} ${draggedIndex === index ? 'opacity-40 border-dashed border-primary' : ''}`}
                  >
                    <div className="relative aspect-video sm:aspect-square w-full overflow-hidden bg-secondary">
                      <img 
                        src={url} 
                        alt={`Mídia ${index + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      {isFeatured && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="bg-primary text-primary-foreground font-semibold text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            ★ Capa / Destaque
                          </span>
                        </div>
                      )}
                      <span className="absolute top-2 right-2 z-10 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-sm">
                        ⠿ #{index + 1}
                      </span>
                    </div>

                    <div className="p-3 bg-card border-t border-border flex items-center justify-between gap-1">
                      <div className="text-[11px] text-muted-foreground font-medium truncate">
                        {isFeatured ? 'Capa principal' : 'Arraste para ordenar'}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isFeatured && (
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="h-7 text-[10px] px-2"
                            onClick={() => handleSetFeatured(index)}
                          >
                            Definir Capa
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMedia(index)}
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
