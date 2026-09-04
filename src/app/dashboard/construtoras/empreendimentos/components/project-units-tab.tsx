'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { savePropertyServer, deletePropertyServer } from '@/app/dashboard/imoveis/actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Search, CheckCircle2, Clock, XCircle, DollarSign, Maximize2, Bed, Bath, Car, Trash2, Edit, ExternalLink, Layers } from 'lucide-react';
import Link from 'next/link';

interface ProjectUnitsTabProps {
  project: {
    id: string;
    builderId: string;
    name: string;
  };
  units: any[];
}

export default function ProjectUnitsTab({ project, units: initialUnits }: ProjectUnitsTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>(initialUnits || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTorre, setFilterTorre] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipologia, setFilterTipologia] = useState('all');

  // Modal State for Quick Add Unit
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [unitName, setUnitName] = useState('');
  const [torre, setTorre] = useState('Torre A');
  const [andar, setAndar] = useState('1');
  const [tipologia, setTipologia] = useState('Apartamento');
  const [areaUtil, setAreaUtil] = useState('60');
  const [quartos, setQuartos] = useState('2');
  const [suites, setSuites] = useState('1');
  const [vagas, setVagas] = useState('1');
  const [preco, setPreco] = useState('450000');
  const [status, setStatus] = useState('Disponível');

  // Statistics
  const totalUnits = units.length;
  const availableUnits = units.filter(u => (u.status || u.disponibilidade || 'Disponível') === 'Disponível').length;
  const reservedUnits = units.filter(u => (u.status || u.disponibilidade) === 'Reservado').length;
  const soldUnits = units.filter(u => (u.status || u.disponibilidade) === 'Vendido').length;

  const towers = Array.from(new Set(units.map(u => u.torre || u.bloco).filter(Boolean)));
  const tipologias = Array.from(new Set(units.map(u => u.tipologia || u.informacoesbasicas?.tipo).filter(Boolean)));

  const filteredUnits = units.filter(u => {
    const name = (u.informacoesbasicas?.nome || u.nome || '').toLowerCase();
    const t = u.torre || u.bloco || '';
    const stat = u.status || u.disponibilidade || 'Disponível';
    const tipo = u.tipologia || u.informacoesbasicas?.tipo || '';

    const matchesSearch = name.includes(searchQuery.toLowerCase()) || (u.numero || '').toString().includes(searchQuery);
    const matchesTorre = filterTorre === 'all' || t === filterTorre;
    const matchesStatus = filterStatus === 'all' || stat === filterStatus;
    const matchesTipologia = filterTipologia === 'all' || tipo === filterTipologia;

    return matchesSearch && matchesTorre && matchesStatus && matchesTipologia;
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tenantId: project.builderId,
        builderId: project.builderId,
        projectId: project.id,
        isVisibleOnSite: false,
        informacoesbasicas: {
          nome: unitName || `Unidade ${andar}01 - ${torre}`,
          tipo: tipologia,
          slug: `${project.name}-${torre}-${unitName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
        torre,
        bloco: torre,
        andar: Number(andar),
        tipologia,
        caracteristicas: {
          areaUtil: Number(areaUtil),
          quartos: Number(quartos),
          suites: Number(suites),
          vagas: Number(vagas),
        },
        preco: Number(preco),
        valores: {
          venda: Number(preco),
        },
        status,
        disponibilidade: status,
      };

      const res = await savePropertyServer('properties', null, payload, user.uid);
      if (res.success && res.id) {
        toast({ title: 'Unidade cadastrada!', description: 'A unidade foi adicionada ao estoque do empreendimento.' });
        setUnits([...units, { id: res.id, ...payload }]);
        setIsAddOpen(false);
        // Reset form
        setUnitName('');
        setPreco('450000');
      } else {
        throw new Error(res.message || 'Erro ao salvar unidade.');
      }
    } catch (e: any) {
      toast({ title: 'Erro ao cadastrar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta unidade do estoque?')) return;
    try {
      const res = await deletePropertyServer('properties', id);
      if (res.success) {
        setUnits(units.filter(u => u.id !== id));
        toast({ title: 'Unidade removida', description: 'O estoque foi atualizado.' });
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Gestão de Estoque e Unidades
          </h3>
          <p className="text-sm text-slate-600">
            Unidades vinculadas diretamente ao empreendimento <span className="font-semibold text-slate-900">{project.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Unidade
          </Button>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Cadastrar Unidade no Empreendimento</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)}>×</Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="unitName">Nome / Identificação</Label>
                    <Input id="unitName" value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="Ex: Apto 101" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="torre">Torre / Bloco</Label>
                    <Input id="torre" value={torre} onChange={e => setTorre(e.target.value)} placeholder="Ex: Torre A" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="andar">Andar</Label>
                    <Input id="andar" type="number" value={andar} onChange={e => setAndar(e.target.value)} placeholder="1" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tipologia">Tipologia</Label>
                    <Input id="tipologia" value={tipologia} onChange={e => setTipologia(e.target.value)} placeholder="Apartamento" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Disponível">Disponível</SelectItem>
                        <SelectItem value="Reservado">Reservado</SelectItem>
                        <SelectItem value="Vendido">Vendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="areaUtil">Área (m²)</Label>
                    <Input id="areaUtil" type="number" value={areaUtil} onChange={e => setAreaUtil(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quartos">Quartos</Label>
                    <Input id="quartos" type="number" value={quartos} onChange={e => setQuartos(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="suites">Suítes</Label>
                    <Input id="suites" type="number" value={suites} onChange={e => setSuites(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vagas">Vagas</Label>
                    <Input id="vagas" type="number" value={vagas} onChange={e => setVagas(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="preco">Preço de Venda (R$)</Label>
                  <Input id="preco" type="number" value={preco} onChange={e => setPreco(e.target.value)} required />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white">
                    {isSubmitting ? 'Salvando...' : 'Salvar Unidade'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Unidades</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalUnits}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Disponíveis</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{availableUnits}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Reservadas</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{reservedUnits}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Vendidas</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{soldUnits}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar unidade..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select value={filterTorre} onValueChange={setFilterTorre}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Torre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Torres</SelectItem>
                {towers.map((t: any) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Reservado">Reservado</SelectItem>
                <SelectItem value="Vendido">Vendido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTipologia} onValueChange={setFilterTipologia}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipologia" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Tipologias</SelectItem>
                {tipologias.map((tp: any) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Units Table / Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Lista de Unidades ({filteredUnits.length})</CardTitle>
          <CardDescription>Estoque detalhado e status comercial de cada unidade.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUnits.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed rounded-xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Nenhuma unidade encontrada.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cadastre novas unidades utilizando o botão acima para preencher o estoque deste empreendimento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Unidade</th>
                    <th className="py-3 px-4">Torre / Bloco</th>
                    <th className="py-3 px-4">Andar</th>
                    <th className="py-3 px-4">Tipologia</th>
                    <th className="py-3 px-4">Área Útil</th>
                    <th className="py-3 px-4">Configuração</th>
                    <th className="py-3 px-4">Preço (R$)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {filteredUnits.map((u) => {
                    const name = u.informacoesbasicas?.nome || u.nome || 'Unidade';
                    const torreBloco = u.torre || u.bloco || '-';
                    const andarNum = u.andar !== undefined ? `${u.andar}º` : '-';
                    const tipo = u.tipologia || u.informacoesbasicas?.tipo || '-';
                    const area = u.caracteristicas?.areaUtil || u.areaUtil || '-';
                    const q = u.caracteristicas?.quartos || u.quartos || 0;
                    const s = u.caracteristicas?.suites || u.suites || 0;
                    const v = u.caracteristicas?.vagas || u.vagas || 0;
                    const precoVal = u.preco || u.valores?.venda || 0;
                    const stat = u.status || u.disponibilidade || 'Disponível';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{name}</td>
                        <td className="py-3 px-4">{torreBloco}</td>
                        <td className="py-3 px-4">{andarNum}</td>
                        <td className="py-3 px-4">{tipo}</td>
                        <td className="py-3 px-4">{area} m²</td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {q}q / {s}suítes / {v}v
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {precoVal ? Number(precoVal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob consulta'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stat === 'Disponível' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            stat === 'Reservado' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {stat}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Link href={`/dashboard/imoveis/${u.id}/editar`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" title="Editar Unidade">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600" 
                            onClick={() => handleDeleteUnit(u.id)}
                            title="Remover Unidade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
