'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createPriceTableServer, publishPriceTableVersionServer } from '../../tabelas.actions.server';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Constructor = {
  id: string;
  name: string;
  tenantId?: string;
};

type Property = {
  id: string;
  tenantId?: string;
  builderId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
  };
  valores?: {
    venda?: number;
  };
  localizacao: {
    cidade: string;
    bairro: string;
    unidade?: string;
    numero?: string;
  };
  caracteristicasimovel?: {
    tamanho?: string;
  };
};

type PriceTableItemInput = {
  propertyId: string;
  unidade: string;
  numero: string;
  torre: string;
  bloco: string;
  andar: string;
  area: number;
  price: number;
  status: string;
};

export default function ConstructorTabelasPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const constDocRef = useMemoFirebase(() => (firestore && id ? doc(firestore, 'constructors', id) : null), [firestore, id]);
  const { data: constructorData } = useDoc<Constructor>(constDocRef);

  const tenantId = constructorData?.tenantId || id;

  // Fetch properties belonging to this constructor/tenant
  const propertiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'properties'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: tenantProperties = [] } = useCollection<Property>(propertiesQuery);

  // Fetch price tables for this tenant
  const tablesQuery = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'priceTables'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: priceTables = [], isLoading: isTablesLoading } = useCollection<any>(tablesQuery);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTablePropertyId, setNewTablePropertyId] = useState('');

  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [activeTableForPublish, setActiveTableForPublish] = useState<any>(null);
  const [validFromDate, setValidFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [publishItems, setPublishItems] = useState<PriceTableItemInput[]>([]);

  // Fetch versions for selected table
  const versionsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTableId) return null;
    return collection(firestore, 'priceTables', selectedTableId, 'versions');
  }, [firestore, selectedTableId]);
  const { data: versions = [] } = useCollection<any>(versionsQuery);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName || !newTablePropertyId) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    try {
      await createPriceTableServer({
        tenantId,
        constructorId: id,
        propertyId: newTablePropertyId,
        name: newTableName,
      });
      toast({ title: 'Tabela criada com sucesso!' });
      setIsCreateTableOpen(false);
      setNewTableName('');
      setNewTablePropertyId('');
    } catch (err: any) {
      toast({ title: 'Erro ao criar tabela', description: err.message, variant: 'destructive' });
    }
  };

  const openPublishDialog = (table: any) => {
    setActiveTableForPublish(table);
    // Initialize items from tenant properties
    const initialItems: PriceTableItemInput[] = tenantProperties.map(p => ({
      propertyId: p.id,
      unidade: p.localizacao?.unidade || '',
      numero: p.localizacao?.numero || '',
      torre: '',
      bloco: '',
      andar: '',
      area: p.caracteristicasimovel?.tamanho ? parseFloat(p.caracteristicasimovel.tamanho.replace('m²', '').trim()) || 0 : 0,
      price: p.valores?.venda || 0,
      status: p.informacoesbasicas?.status || 'Disponível',
    }));
    setPublishItems(initialItems);
    setIsPublishOpen(true);
  };

  const handlePublishVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTableForPublish) return;
    try {
      await publishPriceTableVersionServer({
        priceTableId: activeTableForPublish.id,
        validFrom: validFromDate,
        items: publishItems,
      });
      toast({ title: 'Nova versão publicada com sucesso!' });
      setIsPublishOpen(false);
      setActiveTableForPublish(null);
    } catch (err: any) {
      toast({ title: 'Erro ao publicar versão', description: err.message, variant: 'destructive' });
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/dashboard/construtoras/${id}`} className="text-sm text-text-secondary hover:text-primary transition-colors">
              ← Voltar para Construtora
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">
            Tabelas de Preços — {constructorData?.name || 'Construtora'}
          </h1>
          <p className="text-text-secondary text-sm">Gerencie o versionamento de preços e histórico de unidades por empreendimento.</p>
        </div>
        <Dialog open={isCreateTableOpen} onOpenChange={setIsCreateTableOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined">add</span> Nova Tabela de Preços
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Tabela de Preços</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTable} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="name">Nome da Tabela</Label>
                <Input
                  id="name"
                  placeholder="Ex: Tabela Lançamento 2026"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="property">Imóvel / Produto Base</Label>
                <select
                  id="property"
                  className="w-full mt-1 border border-card-border rounded-lg p-2 text-sm bg-white"
                  value={newTablePropertyId}
                  onChange={e => setNewTablePropertyId(e.target.value)}
                  required
                >
                  <option value="">Selecione um imóvel/empreendimento...</option>
                  {tenantProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.informacoesbasicas.nome} ({p.localizacao.bairro}, {p.localizacao.cidade})
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" className="bg-primary text-white">Criar Tabela</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isTablesLoading ? (
        <div className="text-center py-12 text-text-secondary">Carregando tabelas de preços...</div>
      ) : priceTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-card-border p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">request_quote</span>
          <h3 className="text-lg font-bold text-text-main mb-1">Nenhuma tabela cadastrada</h3>
          <p className="text-text-secondary text-sm mb-6">Crie a primeira tabela de preços para esta construtora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tables List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-text-main">Tabelas Ativas</h2>
            {priceTables.map(table => (
              <div
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTableId === table.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-card-border bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={table.status === 'active' ? 'default' : 'secondary'}>{table.status}</Badge>
                  <span className="text-xs text-text-secondary">Ref: {table.id.substring(0, 6)}</span>
                </div>
                <h3 className="font-bold text-text-main text-base mb-1">{table.name}</h3>
                {table.minPrice ? (
                  <p className="text-sm font-bold text-primary">A partir de {formatCurrency(table.minPrice)}</p>
                ) : (
                  <p className="text-xs text-text-secondary italic">Sem versão publicada</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPublishDialog(table);
                    }}
                  >
                    Publicar Versão
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Versions & History */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            {!selectedTableId ? (
              <div className="text-center py-20 text-text-secondary">Selecione uma tabela ao lado para visualizar o histórico de versões.</div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-text-main mb-4">Histórico de Versões</h2>
                {versions.length === 0 ? (
                  <p className="text-text-secondary text-sm">Nenhuma versão publicada para esta tabela ainda.</p>
                ) : (
                  <div className="space-y-6">
                    {versions.map((ver: any) => (
                      <div key={ver.id} className="border border-card-border rounded-xl p-5 bg-gray-50/50">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-main">Versão #{ver.versionNumber}</span>
                            <Badge variant="outline">Vigência: {ver.validFrom}</Badge>
                          </div>
                          {ver.variationPercent !== null && ver.variationPercent !== undefined && (
                            <Badge className={ver.variationPercent >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                              {ver.variationPercent >= 0 ? `+${ver.variationPercent}%` : `${ver.variationPercent}%`} vs anterior
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm bg-white p-4 rounded-lg border border-card-border">
                          <div>
                            <span className="text-xs text-text-secondary block">Menor Preço</span>
                            <span className="font-bold text-primary text-base">{formatCurrency(ver.minPrice)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-text-secondary block">Maior Preço</span>
                            <span className="font-bold text-text-main">{formatCurrency(ver.maxPrice)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-text-secondary block">Preço Médio</span>
                            <span className="font-bold text-text-main">{formatCurrency(ver.avgPrice)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-text-secondary block">Média / m²</span>
                            <span className="font-bold text-text-main">{formatCurrency(ver.avgPricePerSquareMeter)}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Snapshot de Unidades ({ver.items?.length || 0})</h4>
                          <div className="max-h-48 overflow-y-auto border border-card-border rounded-lg bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-100 border-b border-card-border text-text-secondary">
                                <tr>
                                  <th className="p-2">Unidade / Ref</th>
                                  <th className="p-2">Área</th>
                                  <th className="p-2">Preço</th>
                                  <th className="p-2">Preço / m²</th>
                                  <th className="p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ver.items?.map((item: any, idx: number) => (
                                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-2 font-medium">{item.unidade || item.numero || item.propertyId.substring(0, 6)}</td>
                                    <td className="p-2">{item.area ? `${item.area} m²` : '-'}</td>
                                    <td className="p-2 font-bold text-primary">{formatCurrency(item.price)}</td>
                                    <td className="p-2">{item.pricePerSquareMeter ? formatCurrency(item.pricePerSquareMeter) : '-'}</td>
                                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{item.status || 'Disponível'}</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publish Version Dialog */}
      <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Nova Versão — {activeTableForPublish?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePublishVersion} className="space-y-6 mt-2">
            <div>
              <Label htmlFor="validFrom">Data de Vigência</Label>
              <Input
                id="validFrom"
                type="date"
                value={validFromDate}
                onChange={e => setValidFromDate(e.target.value)}
                required
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-text-main mb-2">Unidades e Preços desta Versão</h3>
              <div className="border border-card-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 border-b border-card-border text-text-secondary">
                    <tr>
                      <th className="p-2">Unidade</th>
                      <th className="p-2">Área (m²)</th>
                      <th className="p-2">Preço (R$)</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishItems.map((item, index) => (
                      <tr key={item.propertyId} className="border-b border-gray-100">
                        <td className="p-2 font-medium">{item.unidade || item.numero || `Imóvel #${index + 1}`}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 text-xs"
                            value={item.area}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setPublishItems(prev => prev.map((it, i) => i === index ? { ...it, area: val } : it));
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 text-xs font-bold text-primary"
                            value={item.price}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setPublishItems(prev => prev.map((it, i) => i === index ? { ...it, price: val } : it));
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            className="h-8 text-xs"
                            value={item.status}
                            onChange={e => {
                              const val = e.target.value;
                              setPublishItems(prev => prev.map((it, i) => i === index ? { ...it, status: val } : it));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-primary text-white">Publicar Versão</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
