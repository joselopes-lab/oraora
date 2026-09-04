'use client';

import { useCollection, useFirestore, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createPriceTableServer, getPriceTablesAdminServer, getPriceTableVersionsAdminServer, deletePriceTableAdminServer, getPriceTablePdfUrlServer } from '../../construtoras/tabelas.actions.server';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminTabelasPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [priceTables, setPriceTables] = useState<any[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<any | null>(null);

  const fetchPriceTables = async () => {
    if (!user) return;
    try {
      setIsTablesLoading(true);
      setTablesError(null);
      const idToken = await user.getIdToken();
      const res = await getPriceTablesAdminServer({ idToken });
      setPriceTables(res.tables);
    } catch (err: any) {
      console.error('[PRICE TABLES] ADMIN_FETCH_ERROR', err);
      setTablesError(err);
    } finally {
      setIsTablesLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      setPriceTables([]);
      setIsTablesLoading(false);
      return;
    }
    if (firestore) {
      fetchPriceTables();
    }
  }, [firestore, user, isUserLoading]);

  const constructorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'constructors') : null), [firestore]);
  const { data: constructorsRaw } = useCollection<any>(constructorsQuery);
  const constructors = constructorsRaw ?? [];

  const propertiesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'properties') : null), [firestore]);
  const { data: propertiesRaw } = useCollection<any>(propertiesQuery);
  const properties = propertiesRaw ?? [];

  // Filters state
  const [selectedConstructorId, setSelectedConstructorId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableConstructorId, setNewTableConstructorId] = useState('');
  const [newTablePropertyId, setNewTablePropertyId] = useState('');
  const [constructorSearchTerm, setConstructorSearchTerm] = useState('');
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Details / History Modal state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTableForDetails, setActiveTableForDetails] = useState<any>(null);
  const [tableVersions, setTableVersions] = useState<any[]>([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTableForDelete, setActiveTableForDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      setFileError('Apenas arquivos PDF são permitidos para tabelas de preços.');
      setSelectedFile(null);
      return;
    }

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError('O arquivo excede o limite máximo de 15MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTableConstructorId || !newTablePropertyId || !newTableName.trim() || !selectedFile) {
      toast({ title: 'Preencha todos os campos e selecione um PDF.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const idToken = await user.getIdToken();
      const selectedConstructor = constructors.find(c => c.id === newTableConstructorId);
      const tenantId = selectedConstructor?.tenantId || newTableConstructorId;

      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          await createPriceTableServer({
            idToken,
            tenantId,
            constructorId: newTableConstructorId,
            propertyId: newTablePropertyId,
            name: newTableName.trim(),
            file: {
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
              base64: base64Data,
            },
          });

          toast({ title: 'Tabela de preços cadastrada com sucesso!' });
          setIsCreateTableOpen(false);
          setNewTableName('');
          setNewTableConstructorId('');
          setNewTablePropertyId('');
          setSelectedFile(null);
          fetchPriceTables();
        } catch (err: any) {
          toast({ title: 'Erro ao criar tabela', description: err.message, variant: 'destructive' });
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        toast({ title: 'Erro ao ler arquivo', variant: 'destructive' });
        setIsUploading(false);
      };
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!activeTableForDelete || !user) return;
    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      await deletePriceTableAdminServer({ idToken, priceTableId: activeTableForDelete.id });
      toast({ title: 'Tabela excluída com sucesso.' });
      setIsDeleteOpen(false);
      setActiveTableForDelete(null);
      fetchPriceTables();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir tabela', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewPdf = async (table: any) => {
    console.log('[PRICE TABLE ADMIN DEBUG]', {
      tableId: table?.id,
      tableName: table?.name,
      hasSourceFile: !!table?.sourceFile,
      hasStoragePath: !!table?.sourceFile?.storagePath
    });
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      console.log('[PDF DEBUG] BEFORE SERVER ACTION', {
        priceTableId: table?.id
      });
      const res = await getPriceTablePdfUrlServer({ priceTableId: table.id, idToken });
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        toast({ title: 'Erro ao abrir PDF', description: res.error || 'Não foi possível gerar o link do documento.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const openDetailsModal = async (table: any) => {
    setActiveTableForDetails(table);
    setIsDetailsOpen(true);
    setIsVersionsLoading(true);
    setTableVersions([]);
    try {
      if (user) {
        const idToken = await user.getIdToken();
        const res = await getPriceTableVersionsAdminServer({ tableId: table.id, idToken });
        if (res.success) {
          setTableVersions(res.versions || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVersionsLoading(false);
    }
  };

  // Filtering tables
  const filteredTables = priceTables.filter(t => {
    if (selectedConstructorId && t.constructorId !== selectedConstructorId) return false;
    if (selectedPropertyId && t.propertyId !== selectedPropertyId) return false;
    if (selectedStatus && t.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(q);
      const constObj = constructors.find(c => c.id === t.constructorId);
      const constMatch = constObj?.name?.toLowerCase().includes(q);
      const propObj = properties.find(p => p.id === t.propertyId);
      const propName = (propObj?.informacoesbasicas?.nome || propObj?.basicInfo?.name || '').toLowerCase();
      if (!nameMatch && !constMatch && !propName.includes(q)) return false;
    }
    return true;
  });

  const filteredConstructorsForModal = constructors.filter(c => 
    c.name?.toLowerCase().includes(constructorSearchTerm.toLowerCase()) ||
    c.cnpj?.includes(constructorSearchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/admin" className="text-sm text-text-secondary hover:text-primary transition-colors">
              ← Voltar para Admin OraOra
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Tabelas de Preços</h1>
          <p className="text-text-secondary text-sm">Gerencie os documentos comerciais das construtoras e disponibilize-os aos corretores autorizados.</p>
        </div>
        <Dialog open={isCreateTableOpen} onOpenChange={setIsCreateTableOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-sm">add</span> Nova Tabela
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Tabela de Preços</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTable} className="space-y-4 mt-2">
              {(() => {
                const selectedConstructor = constructors.find(c => c.id === newTableConstructorId);
                const construtorasProperties = selectedConstructor
                  ? Array.from(
                      new Map(
                        properties
                          .filter(p =>
                            (selectedConstructor.tenantId && p.tenantId === selectedConstructor.tenantId) ||
                            (selectedConstructor.id && p.builderId === selectedConstructor.id)
                          )
                          .map(p => [p.id, p])
                      ).values()
                    )
                  : [];

                return (
                  <>
                    <div>
                      <Label htmlFor="constructor-search">Construtora</Label>
                      {selectedConstructor ? (
                        <div className="mt-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-sm text-emerald-900">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="material-symbols-outlined text-emerald-600 text-[18px]">business</span>
                            <span>{selectedConstructor.name}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-emerald-700 hover:bg-emerald-100 font-bold"
                            onClick={() => {
                              setNewTableConstructorId('');
                              setNewTablePropertyId('');
                              setConstructorSearchTerm('');
                            }}
                          >
                            Trocar
                          </Button>
                        </div>
                      ) : (
                        <div className="relative mt-1">
                          <div className="flex items-center border border-card-border rounded-lg bg-white px-3 py-2">
                            <span className="material-symbols-outlined text-text-secondary text-sm mr-2">search</span>
                            <input
                              id="constructor-search"
                              type="text"
                              placeholder="Digite para buscar uma construtora..."
                              className="w-full text-sm border-none outline-none bg-transparent placeholder:text-text-secondary"
                              value={constructorSearchTerm}
                              onChange={(e) => {
                                setConstructorSearchTerm(e.target.value);
                                setIsConstructorOpen(true);
                              }}
                              onFocus={() => setIsConstructorOpen(true)}
                            />
                          </div>

                          {isConstructorOpen && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-card-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredConstructorsForModal.length === 0 ? (
                                <div className="p-3 text-xs text-text-secondary text-center">Nenhuma construtora encontrada</div>
                              ) : (
                                filteredConstructorsForModal.map(c => (
                                  <div
                                    key={c.id}
                                    onClick={() => {
                                      setNewTableConstructorId(c.id);
                                      setNewTablePropertyId('');
                                      setIsConstructorOpen(false);
                                      setConstructorSearchTerm('');
                                    }}
                                    className="p-2.5 text-sm hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-none"
                                  >
                                    <span className="font-medium text-text-main">{c.name}</span>
                                    {c.cnpj && <span className="text-xs text-text-secondary">{c.cnpj}</span>}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="block">Imóvel / Empreendimento</Label>
                        {selectedConstructor && construtorasProperties.length > 0 && (
                          <span className="text-xs font-bold text-primary">{construtorasProperties.length} imóvel(is)</span>
                        )}
                      </div>
                      {!newTableConstructorId ? (
                        <p className="text-xs text-text-secondary italic bg-gray-50 p-3 rounded-lg border border-card-border">Selecione uma construtora para visualizar os imóveis.</p>
                      ) : construtorasProperties.length === 0 ? (
                        <p className="text-xs text-text-secondary italic bg-gray-50 p-3 rounded-lg border border-card-border">Nenhum imóvel encontrado para esta construtora.</p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {construtorasProperties.map(p => {
                            const isSelected = newTablePropertyId === p.id;
                            const propName = p.informacoesbasicas?.nome || p.basicInfo?.name || 'Imóvel sem nome';
                            const cidade = p.localizacao?.cidade || '';
                            return (
                              <div
                                key={p.id}
                                onClick={() => setNewTablePropertyId(p.id)}
                                className={`p-3 rounded-xl border text-sm cursor-pointer transition-all flex items-center justify-between ${
                                  isSelected ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-card-border bg-white hover:border-gray-300 text-text-main'
                                }`}
                              >
                                <div>
                                  <p className="font-bold">{propName}</p>
                                  {cidade && <p className="text-xs text-text-secondary">{cidade}</p>}
                                </div>
                                {isSelected && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">Nome da Tabela</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Tabela de Vendas - Agosto 2026"
                        value={newTableName}
                        onChange={e => setNewTableName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="table-file" className="block mb-1.5">Documento PDF da Tabela</Label>
                      {!selectedFile ? (
                        <div className="border-2 border-dashed border-card-border rounded-xl p-4 text-center hover:border-primary transition-colors bg-gray-50/50 cursor-pointer relative">
                          <input
                            id="table-file"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-text-secondary text-2xl">upload_file</span>
                            <p className="text-xs font-bold text-text-main">Clique para selecionar o PDF original</p>
                            <p className="text-[11px] text-text-secondary">Apenas arquivos PDF (Máx. 15MB)</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-white border border-card-border rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="material-symbols-outlined text-primary text-xl">description</span>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-text-main truncate">{selectedFile.name}</p>
                              <p className="text-xs text-text-secondary">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              setSelectedFile(null);
                              setFileError(null);
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                      {fileError && <p className="text-xs text-rose-600 mt-1">{fileError}</p>}
                    </div>

                    <DialogFooter className="mt-4">
                      <Button 
                        type="submit" 
                        className="bg-primary text-white font-bold"
                        disabled={!newTableConstructorId || !newTablePropertyId || !newTableName.trim() || !selectedFile || isUploading}
                      >
                        {isUploading ? 'Enviando PDF...' : 'Criar Tabela'}
                      </Button>
                    </DialogFooter>
                  </>
                );
              })()}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-card-border shadow-sm">
        <select
          className="border border-card-border rounded-xl p-2.5 text-sm bg-white text-text-main outline-none focus:border-primary"
          value={selectedConstructorId}
          onChange={e => setSelectedConstructorId(e.target.value)}
        >
          <option value="">Todas as Construtoras</option>
          {constructors.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="border border-card-border rounded-xl p-2.5 text-sm bg-white text-text-main outline-none focus:border-primary"
          value={selectedPropertyId}
          onChange={e => setSelectedPropertyId(e.target.value)}
        >
          <option value="">Todos os Empreendimentos</option>
          {properties.map(p => {
            const propName = p.informacoesbasicas?.nome || p.basicInfo?.name || p.id;
            return <option key={p.id} value={p.id}>{propName}</option>;
          })}
        </select>

        <select
          className="border border-card-border rounded-xl p-2.5 text-sm bg-white text-text-main outline-none focus:border-primary"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativa</option>
          <option value="inactive">Inativa</option>
        </select>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-3 text-text-secondary text-sm">search</span>
          <input
            type="text"
            placeholder="Buscar tabela..."
            className="w-full pl-9 pr-3 py-2.5 border border-card-border rounded-xl text-sm bg-white outline-none focus:border-primary text-text-main placeholder:text-text-secondary"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tables List */}
      {isTablesLoading ? (
        <div className="text-center py-16 text-text-secondary">Carregando tabelas de preços...</div>
      ) : tablesError ? (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center text-rose-800">
          <span className="material-symbols-outlined text-4xl text-rose-500 mb-3">error</span>
          <h3 className="text-lg font-bold mb-1">Não foi possível carregar as tabelas de preços.</h3>
          <p className="text-sm font-mono mt-2 bg-white/80 p-3 rounded-lg border border-rose-100 inline-block text-left">
            {tablesError.message}
          </p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-card-border p-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-text-secondary mb-3">request_quote</span>
          <h3 className="text-lg font-bold text-text-main mb-1">Nenhuma tabela de preços encontrada</h3>
          <p className="text-sm text-text-secondary">Tente ajustar os filtros ou cadastre um novo documento PDF.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-card-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-card-border text-text-secondary text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tabela</th>
                  <th className="p-4">Construtora</th>
                  <th className="p-4">Empreendimento</th>
                  <th className="p-4">Documento</th>
                  <th className="p-4">Atualização</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-text-main">
                {filteredTables.map(table => {
                  const constObj = constructors.find(c => c.id === table.constructorId);
                  const propObj = properties.find(p => p.id === table.propertyId);
                  const propName = propObj?.informacoesbasicas?.nome || propObj?.basicInfo?.name || 'Imóvel vinculado';
                  const hasPdf = !!table.sourceFile?.storagePath;
                  const updatedAt = table.updatedAt ? new Date(table.updatedAt).toLocaleDateString('pt-BR') : '-';

                  return (
                    <tr key={table.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-bold text-text-main">{table.name}</td>
                      <td className="p-4 text-text-secondary font-medium">{constObj?.name || 'Construtora'}</td>
                      <td className="p-4 text-text-secondary">{propName}</td>
                      <td className="p-4">
                        {hasPdf ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            📄 PDF anexado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-gray-100 px-2.5 py-1 rounded-full">
                            Sem PDF
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-text-secondary text-xs">{updatedAt}</td>
                      <td className="p-4">
                        <Badge variant={table.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {table.status === 'active' ? '🟢 Ativa' : table.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPdf && (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1 shadow-sm"
                              onClick={() => handleViewPdf(table)}
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span> Visualizar PDF
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-card-border"
                            onClick={() => openDetailsModal(table)}
                          >
                            Detalhes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            onClick={() => {
                              setActiveTableForDelete(table);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details & History Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Tabela de Preços</DialogTitle>
          </DialogHeader>
          {activeTableForDetails && (
            <div className="space-y-6 mt-2">
              <div className="bg-gray-50 border border-card-border rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-text-secondary block">Nome da Tabela</span>
                    <strong className="text-text-main">{activeTableForDetails.name}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary block">Status</span>
                    <Badge variant="outline">{activeTableForDetails.status}</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary block">Construtora</span>
                    <span className="text-text-main">{constructors.find(c => c.id === activeTableForDetails.constructorId)?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary block">Data de Cadastro</span>
                    <span className="text-text-main">{activeTableForDetails.createdAt ? new Date(activeTableForDetails.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                </div>

                {activeTableForDetails.sourceFile?.storagePath && (
                  <div className="pt-3 border-t border-card-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <span className="font-medium text-text-main">{activeTableForDetails.sourceFile.fileName || 'documento.pdf'}</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary text-white text-xs gap-1"
                      onClick={() => handleViewPdf(activeTableForDetails)}
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span> Visualizar PDF
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-main mb-3">Histórico / Versões Registradas</h3>
                {isVersionsLoading ? (
                  <p className="text-xs text-text-secondary text-center py-4">Carregando histórico...</p>
                ) : tableVersions.length === 0 ? (
                  <p className="text-xs text-text-secondary italic bg-gray-50 p-4 rounded-xl border border-card-border text-center">Nenhum registro histórico adicional nesta tabela.</p>
                ) : (
                  <div className="space-y-3">
                    {tableVersions.map((ver: any) => (
                      <div key={ver.id} className="border border-card-border rounded-xl p-3.5 bg-white flex items-center justify-between text-sm">
                        <div>
                          <p className="font-bold text-text-main">Versão #{ver.versionNumber || 1}</p>
                          <p className="text-xs text-text-secondary">Vigência a partir de: {ver.validFrom || '-'}</p>
                        </div>
                        <Badge variant="outline">{ver.items?.length || 0} itens</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir tabela de preços?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-text-secondary space-y-3">
            <p>
              Esta ação excluirá permanentemente a tabela <strong className="text-text-main">{activeTableForDelete?.name}</strong> e o arquivo PDF associado.
            </p>
            <p className="font-semibold text-rose-600">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteTable}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
