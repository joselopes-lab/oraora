'use client';

import { useState } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProjectMaterialsServer } from '../actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Trash2, ExternalLink, Save, CheckCircle, AlertCircle, Loader2, Plus, FileSpreadsheet, Video, BookOpen } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  url: string;
  size?: number;
  type?: string;
  updatedAt: string;
}

interface ProjectMaterialsTabProps {
  project: {
    id: string;
    materiais?: MaterialItem[];
  };
}

const CATEGORIES = [
  { id: 'Apresentação Comercial', label: 'Apresentação Comercial' },
  { id: 'Book', label: 'Book do Empreendimento' },
  { id: 'Tabela de Preços', label: 'Tabela de Preços' },
  { id: 'Plantas', label: 'Plantas e Implantação' },
  { id: 'Memorial Descritivo', label: 'Memorial Descritivo' },
  { id: 'Vídeos', label: 'Vídeos e Tours' },
  { id: 'Outros', label: 'Outros Materiais' },
];

export default function ProjectMaterialsTab({ project }: ProjectMaterialsTabProps) {
  const { user } = useUser();
  const { storage } = useFirebase();
  const { toast } = useToast();

  const [materiais, setMateriais] = useState<MaterialItem[]>(project.materiais || []);
  const [selectedCategory, setSelectedCategory] = useState('Apresentação Comercial');
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newItems: MaterialItem[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const path = `projects/${project.id}/materials`;
        const url = await uploadFile(storage, path, file, (progress) => {
          setUploadProgress(Math.round(((i / totalFiles) * 100) + (progress / totalFiles)));
        });

        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          category: selectedCategory,
          url,
          size: file.size,
          type: file.type || 'application/octet-stream',
          updatedAt: new Date().toISOString(),
        });
      }

      const updated = [...materiais, ...newItems];
      setMateriais(updated);
      setIsDirty(true);
      toast({ title: 'Upload concluído!', description: `${newItems.length} material(is) adicionado(s).` });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message || 'Falha ao enviar arquivo.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualUrl.trim()) {
      toast({ title: 'Atenção', description: 'Preencha o nome e a URL do material.', variant: 'destructive' });
      return;
    }

    const newItem: MaterialItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: manualName.trim(),
      category: selectedCategory,
      url: manualUrl.trim(),
      type: 'external/link',
      updatedAt: new Date().toISOString(),
    };

    setMateriais([...materiais, newItem]);
    setManualName('');
    setManualUrl('');
    setIsDirty(true);
    toast({ title: 'Material adicionado!', description: 'Link externo incluído com sucesso.' });
  };

  const handleDelete = (id: string) => {
    const updated = materiais.filter(m => m.id !== id);
    setMateriais(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await updateProjectMaterialsServer(project.id, {
        materiais,
        idToken,
      });

      setIsDirty(false);
      toast({ title: 'Salvo com sucesso!', description: 'Os materiais comerciais foram atualizados.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tabela de Preços': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'Vídeos': return <Video className="w-5 h-5 text-rose-600" />;
      case 'Book': return <BookOpen className="w-5 h-5 text-indigo-600" />;
      default: return <FileText className="w-5 h-5 text-blue-600" />;
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
          <span className="text-xs text-slate-400 font-mono ml-4">({materiais.length} materiais cadastrados)</span>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Upload & Category Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Adicionar Material Comercial
          </CardTitle>
          <CardDescription>
            Selecione a categoria do material antes de fazer o upload ou colar o link externo. Estes arquivos serão disponibilizados aos corretores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="category-select">Categoria do Material</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* File Upload Dropzone */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-all relative flex flex-col items-center justify-center">
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload} 
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <p className="font-semibold text-slate-800 text-sm">
                  {isUploading ? 'Enviando...' : `Upload para "${selectedCategory}"`}
                </p>
                <p className="text-xs text-slate-500">PDFs, planilhas, apresentações e vídeos</p>
              </div>
              {isUploading && (
                <div className="mt-3 w-full max-w-xs space-y-1">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-xs text-slate-500 font-mono">{uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Manual URL Form */}
            <form onSubmit={handleAddManualUrl} className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border">
              <p className="text-sm font-semibold text-slate-800">Ou adicione por link externo</p>
              <div className="space-y-1">
                <Label className="text-xs">Nome do Material</Label>
                <Input 
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)} 
                  placeholder="Ex: Apresentação Interativa Google Drive" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL do Link</Label>
                <Input 
                  value={manualUrl} 
                  onChange={e => setManualUrl(e.target.value)} 
                  placeholder="https://..." 
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full gap-2 text-xs">
                <Plus className="w-4 h-4" /> Adicionar Link Externo
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Materiais Cadastrados ({materiais.length})</CardTitle>
          <CardDescription>Relação de arquivos e links comerciais organizados por categoria.</CardDescription>
        </CardHeader>
        <CardContent>
          {materiais.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed rounded-xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Nenhum material comercial cadastrado.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Faça o upload de apresentações, tabelas de preço e books para auxiliar os corretores nas vendas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {CATEGORIES.map(cat => {
                const catItems = materiais.filter(m => m.category === cat.id);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat.id} className="space-y-2">
                    <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 px-1">
                      {cat.label} ({catItems.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {catItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border bg-white hover:bg-slate-50/80 transition-colors shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              {getCategoryIcon(item.category)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                                <span>Atualizado em {new Date(item.updatedAt).toLocaleDateString('pt-BR')}</span>
                                {item.size && <span>• {(item.size / (1024 * 1024)).toFixed(2)} MB</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-700">
                                <ExternalLink className="w-3.5 h-3.5" /> Abrir
                              </Button>
                            </a>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              onClick={() => handleDelete(item.id)}
                              title="Remover material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
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
