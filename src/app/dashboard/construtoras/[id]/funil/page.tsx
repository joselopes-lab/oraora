'use client';

import React, { use, useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { listConstructorLeadsAction, listConstructorPropertiesAction, updateConstructorLeadStatusAction } from '../leads/actions.server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ConstructorFunnelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const constructorId = resolvedParams.id;

  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [propertiesMap, setPropertiesMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (isUserLoading) return;
      if (!user) {
        setError('Usuário não autenticado.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const idToken = await user.getIdToken();
        const [leadsData, propertiesData] = await Promise.all([
          listConstructorLeadsAction(constructorId, idToken),
          listConstructorPropertiesAction(constructorId, idToken),
        ]);

        setLeads(leadsData || []);

        const map: Record<string, any> = {};
        if (Array.isArray(propertiesData)) {
          propertiesData.forEach(p => {
            map[p.id] = p;
          });
        }
        setPropertiesMap(map);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar funil de vendas.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, isUserLoading, constructorId]);

  if (isUserLoading || isLoading) {
    return (
      <main className="py-12 px-4 md:px-10 max-w-[1440px] mx-auto w-full text-center">
        <div className="p-12 text-text-secondary animate-pulse">Carregando Funil de Vendas...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-12 px-4 md:px-10 max-w-[1440px] mx-auto w-full space-y-6">
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100 space-y-4">
          <p className="text-red-600 font-semibold">{error}</p>
          <div>
            <Button asChild variant="outline">
              <Link href={`/dashboard/construtoras/${constructorId}`}>Voltar para o Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const columns = [
    { id: 'new', title: 'Novo', color: 'border-t-blue-500' },
    { id: 'contacted', title: 'Em Contato', color: 'border-t-indigo-500' },
    { id: 'qualified', title: 'Qualificado', color: 'border-t-purple-500' },
    { id: 'proposal', title: 'Proposta', color: 'border-t-amber-500' },
    { id: 'negotiation', title: 'Negociação', color: 'border-t-orange-500' },
    { id: 'closed', title: 'Fechado / Ganho', color: 'border-t-emerald-500' },
    { id: 'lost', title: 'Perdido', color: 'border-t-gray-400' },
  ];

  const totalLeads = leads.length;
  const totalFunilValue = leads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);

  const columnData = columns.map(col => {
    const colLeads = leads.filter(l => (l.status || 'new') === col.id);
    const colValue = colLeads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);
    return {
      ...col,
      leads: colLeads,
      count: colLeads.length,
      value: colValue,
    };
  });

  // Handlers para Drag & Drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (columnId: string) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);

    if (!leadId) return;

    // Encontrar lead atual
    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove) return;

    const previousStatus = leadToMove.status || 'new';
    if (previousStatus === targetStatus) return;

    // Otimistic UI Update
    const previousLeads = [...leads];
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status: targetStatus } : l))
    );

    try {
      if (!user) throw new Error('Usuário não autenticado.');
      const idToken = await user.getIdToken();
      await updateConstructorLeadStatusAction(constructorId, leadId, targetStatus, idToken);
      toast({
        title: 'Estágio atualizado',
        description: `Cliente movido com sucesso.`,
      });
    } catch (err: any) {
      // Rollback
      setLeads(previousLeads);
      toast({
        title: 'Erro ao atualizar estágio',
        description: err.message || 'Não foi possível mover o cliente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="py-8 px-4 md:px-8 max-w-[1700px] mx-auto w-full space-y-8">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href={`/dashboard/construtoras/${constructorId}`}>
                ← Voltar para Dashboard
              </Link>
            </Button>
            <Badge variant="outline" className="text-xs uppercase text-text-secondary tracking-wide">
              CRM Comercial
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Leads</h1>
          <p className="text-sm text-text-secondary">Arraste os cards entre as colunas para atualizar o estágio do pipeline comercial.</p>
        </div>

        {/* Indicadores Resumidos */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-50 border border-card-border px-5 py-3 rounded-xl text-center min-w-[130px]">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Clientes</span>
            <span className="text-xl font-bold text-text-main">{totalLeads}</span>
          </div>
          <div className="bg-slate-50 border border-card-border px-5 py-3 rounded-xl text-center min-w-[170px]">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Valor do Funil</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalFunilValue)}</span>
          </div>
          <div className="bg-slate-50 border border-card-border px-5 py-3 rounded-xl text-center min-w-[110px]">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Etapas</span>
            <span className="text-xl font-bold text-text-main">7</span>
          </div>
        </div>
      </div>

      {/* Container Kanban com largura fixa por coluna, rolagem horizontal isolada e suporte a Drag & Drop */}
      <div className="w-full overflow-x-auto pb-6 pt-2">
        <div className="flex items-start gap-6" style={{ width: 'max-content' }}>
          {columnData.map(col => {
            const isOver = dragOverColumn === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl border border-card-border border-t-4 ${col.color} ${
                  isOver ? 'bg-primary/5 border-primary ring-2 ring-primary/20' : 'bg-slate-50/60'
                } p-4 space-y-4 flex flex-col shadow-sm transition-all`}
                style={{ width: '300px', minWidth: '300px' }}
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex flex-col gap-1 pb-3 border-b border-card-border bg-white p-3 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-text-main">{col.title}</h3>
                    <span className="text-xs font-semibold bg-slate-100 text-text-secondary px-2 py-0.5 rounded-full">
                      {col.count}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-primary mt-1">
                    {formatCurrency(col.value)}
                  </div>
                </div>

                {/* Área de Cards */}
                <div className="space-y-3 min-h-[500px]">
                  {col.leads.length === 0 ? (
                    <div className="p-8 text-center text-xs text-text-secondary bg-white/60 rounded-xl border border-dashed border-card-border pointer-events-none">
                      Arraste clientes para cá ou nenhum cliente nesta etapa.
                    </div>
                  ) : (
                    col.leads.map(lead => {
                      const propertyIds = lead.propertyIds || [];
                      const firstPropId = propertyIds[0];
                      const firstProp = firstPropId ? propertiesMap[firstPropId] : null;
                      const propName = lead.propertyName || (firstProp ? (firstProp.informacoesbasicas?.nome || firstProp.title) : null);
                      const isDragging = draggingLeadId === lead.id;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={() => setDraggingLeadId(null)}
                          className={`cursor-grab active:cursor-grabbing ${
                            isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                          } transition-all`}
                        >
                          <Link
                            href={`/dashboard/construtoras/${constructorId}/leads/${lead.id}`}
                            onClick={(e) => {
                              // Se estiver arrastando, previne click acidental
                              if (draggingLeadId) e.preventDefault();
                            }}
                            className="block p-4 rounded-xl bg-white border border-card-border hover:shadow-md hover:border-primary/50 transition-all space-y-3 group relative shadow-2xl"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-text-main group-hover:text-primary transition-colors leading-snug">
                                {lead.name || 'Cliente sem nome'}
                              </h4>
                              {lead.dealStatus && lead.dealStatus !== 'open' && (
                                <span className="text-[10px] uppercase bg-slate-100 text-text-secondary px-1.5 py-0.5 rounded font-bold shrink-0">
                                  {lead.dealStatus}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5 text-xs text-text-secondary pt-1 border-t border-slate-100">
                              {(lead.whatsapp || lead.phone) && (
                                <div className="flex items-center gap-1.5 font-medium text-text-secondary">
                                  <span className="material-symbols-outlined text-[14px] text-text-secondary/70">call</span>
                                  <span>{lead.whatsapp || lead.phone}</span>
                                </div>
                              )}
                              {propName && (
                                <div className="flex items-center gap-1.5 font-medium text-text-main">
                                  <span className="material-symbols-outlined text-[14px] text-primary">apartment</span>
                                  <span className="line-clamp-1">{propName}</span>
                                </div>
                              )}
                              {propertyIds.length > 1 && (
                                <div className="text-[11px] text-primary font-medium pl-5">
                                  + {propertyIds.length - 1} imóvel(is) de interesse
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-extrabold text-primary text-[13px]">
                                {lead.dealValue ? formatCurrency(lead.dealValue) : 'R$ 0,00'}
                              </span>
                              <span className="text-[11px] font-medium text-text-secondary bg-slate-100 px-2 py-0.5 rounded">
                                {lead.brokerId ? 'Corretor' : 'Direto'}
                              </span>
                            </div>
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
