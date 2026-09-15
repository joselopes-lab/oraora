'use client';

import { useUser } from '@/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createPriceTableServer, getPriceTablePdfUrlServer, getConstructorTableFormDataServer, deleteConstructorPriceTableServer } from '../tabelas.actions.server';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ConstructorTabelasPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [priceTables, setPriceTables] = useState<any[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(true);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Fetch data
  const fetchData = async () => {
    if (!user) return;
    try {
      setIsTablesLoading(true);
      const idToken = await user.getIdToken();
      const data = await getConstructorTableFormDataServer(idToken);
      setPriceTables(data.priceTables);
      setProjects(data.projects);
      setProperties(data.properties);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados.', description: err.message, variant: 'destructive' });
    } finally {
      setIsTablesLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoading) return;
    fetchData();
  }, [user, isUserLoading]);

  const filteredProperties = useMemo(() => {
    if (!selectedProjectId) return [];
    return properties.filter(p => p.projectId === selectedProjectId);
  }, [properties, selectedProjectId]);

  // Form state
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [targetType, setTargetType] = useState<'project' | 'property'>('project');
  const [newTableName, setNewTableName] = useState('');
  const [newTablePropertyId, setNewTablePropertyId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTableName.trim() || !selectedFile) return;
    if (targetType === 'project' && !selectedProjectId) return;
    if (targetType === 'property' && !newTablePropertyId) return;

    setIsUploading(true);
    try {
      const idToken = await user.getIdToken();
      
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          await createPriceTableServer({
            idToken,
            targetType,
            projectId: targetType === 'project' ? selectedProjectId : undefined,
            propertyId: targetType === 'property' ? newTablePropertyId : undefined,
            name: newTableName.trim(),
            file: {
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
              base64: base64Data,
            },
          });
          toast({ title: 'Tabela cadastrada com sucesso!' });
          setIsCreateTableOpen(false);
          setNewTableName('');
          setNewTablePropertyId('');
          setSelectedFile(null);
          setSelectedProjectId('');
          setTargetType('project');
          fetchData();
      };
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const [tableToDelete, setTableToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTable = async () => {
    if (!user || !tableToDelete) return;
    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await deleteConstructorPriceTableServer({ tableId: tableToDelete.id, idToken });
      if (res.success) {
        toast({ title: 'Tabela excluída com sucesso.' });
        setTableToDelete(null);
        fetchData();
      } else {
        toast({ title: 'Erro ao excluir tabela', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewPdf = async (table: any) => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await getPriceTablePdfUrlServer({ priceTableId: table.id, idToken });
        if (res.success && res.url) {
          window.open(res.url, '_blank', 'noopener,noreferrer');
        } else {
          toast({ title: 'Erro ao abrir PDF', description: res.error, variant: 'destructive' });
        }
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      }
    };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold">Tabelas de Preços</h1>
            <p className="text-sm text-gray-500">Gerencie os documentos comerciais dos seus imóveis e empreendimentos.</p>
        </div>
        <Dialog open={isCreateTableOpen} onOpenChange={setIsCreateTableOpen}>
          <DialogTrigger asChild>
            <Button>+ Cadastrar tabela</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova tabela de preços</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateTable} className="space-y-4">
                <div>
                    <Label className="block mb-2 font-medium">Vincular tabela a</Label>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input 
                                type="radio" 
                                name="targetType" 
                                value="project" 
                                checked={targetType === 'project'} 
                                onChange={() => { 
                                    setTargetType('project'); 
                                    setNewTablePropertyId(''); 
                                }} 
                            />
                            Empreendimento
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input 
                                type="radio" 
                                name="targetType" 
                                value="property" 
                                checked={targetType === 'property'} 
                                onChange={() => { 
                                    setTargetType('property'); 
                                }} 
                            />
                            Imóvel
                        </label>
                    </div>
                </div>

                {targetType === 'project' && (
                    <div>
                        <Label>Empreendimento *</Label>
                        <select className="w-full border p-2 rounded" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">Selecione um empreendimento...</option>
                            {isTablesLoading ? (
                                <option value="" disabled>Carregando empreendimentos...</option>
                            ) : (projects && projects.length > 0) ? (
                                projects.map(p => <option key={p.id} value={p.id}>{p.name || 'Sem nome'}</option>)
                            ) : (
                                <option value="" disabled>Você ainda não possui empreendimentos cadastrados.</option>
                            )}
                        </select>
                    </div>
                )}

                {targetType === 'property' && (
                    <>
                        <div>
                            <Label>Empreendimento (Filtro)</Label>
                            <select className="w-full border p-2 rounded" value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); setNewTablePropertyId(''); }}>
                                <option value="">Selecione primeiro um empreendimento...</option>
                                {isTablesLoading ? (
                                    <option value="" disabled>Carregando...</option>
                                ) : (projects && projects.length > 0) ? (
                                    projects.map(p => <option key={p.id} value={p.id}>{p.name || 'Sem nome'}</option>)
                                ) : (
                                    <option value="" disabled>Nenhum empreendimento cadastrado.</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <Label>Imóvel *</Label>
                            <select className="w-full border p-2 rounded" value={newTablePropertyId} onChange={e => setNewTablePropertyId(e.target.value)} disabled={!selectedProjectId}>
                                <option value="">{selectedProjectId ? 'Selecione um imóvel...' : 'Selecione primeiro um empreendimento'}</option>
                                {selectedProjectId && filteredProperties.length === 0 ? (
                                    <option value="" disabled>Este empreendimento ainda não possui imóveis cadastrados.</option>
                                ) : (
                                    filteredProperties.map(p => <option key={p.id} value={p.id}>{p.informacoesbasicas?.nome || p.name || 'Sem nome'}</option>)
                                )}
                            </select>
                        </div>
                    </>
                )}

                <div>
                    <Label>Nome da tabela *</Label>
                    <Input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Ex: Tabela Vendas - Bloco A" />
                </div>
                <div>
                    <Label>Arquivo PDF *</Label>
                    <Input type="file" accept=".pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isUploading}>{isUploading ? 'Cadastrando...' : 'Cadastrar tabela'}</Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4">
        {isTablesLoading ? <p className="p-4">Carregando...</p> : priceTables.length === 0 ? <p className="p-4 text-gray-500">Nenhuma tabela cadastrada.</p> : (
            <div className="grid gap-4">
                {priceTables.map(t => {
                    const property = t.propertyId ? properties.find(p => p.id === t.propertyId) : null;
                    const project = t.projectId ? projects.find(p => p.id === t.projectId) : (property ? projects.find(p => p.id === property.projectId) : null);
                    const isProjectLevel = t.targetType === 'project' || (!t.targetType && !t.propertyId && t.projectId);
                    return (
                        <div key={t.id} className="border p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{t.name}</h3>
                                {isProjectLevel ? (
                                    <p className="text-sm text-gray-600">Empreendimento: {project?.name || 'N/A'}</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600">Empreendimento: {project?.name || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Imóvel: {property?.informacoesbasicas?.nome || property?.name || 'N/A'}</p>
                                    </>
                                )}
                                <p className="text-xs text-gray-400 mt-2">Data: {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : (typeof t.createdAt === 'string' ? new Date(t.createdAt).toLocaleDateString() : 'N/A')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleViewPdf(t)}>Visualizar PDF</Button>
                                <Button size="sm" variant="destructive" onClick={() => setTableToDelete(t)}>Excluir</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tabela de preços?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a tabela cadastrada. O arquivo PDF associado também poderá ser removido conforme a estrutura atual de armazenamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTable();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
