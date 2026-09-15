'use client';

import React, { use, useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { getConstructorLeadDetailAction } from '../actions.server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ConstructorLeadDetailPage({ params }: { params: Promise<{ id: string; leadId: string }> }) {
  const resolvedParams = use(params);
  const constructorId = resolvedParams.id;
  const leadId = resolvedParams.leadId;

  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<{ lead: any; statusHistory: any[]; properties: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (isUserLoading) return;
      if (!user) {
        setError('Usuário não autenticado.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const idToken = await user.getIdToken();
        const result = await getConstructorLeadDetailAction(constructorId, leadId, idToken);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar detalhes do cliente.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDetail();
  }, [user, isUserLoading, constructorId, leadId]);

  if (isUserLoading || isLoading) {
    return (
      <main className="py-12 px-4 md:px-10 max-w-[1440px] mx-auto w-full text-center">
        <div className="p-12 text-text-secondary animate-pulse">Carregando ficha do cliente...</div>
      </main>
    );
  }

  if (error || !data || !data.lead) {
    return (
      <main className="py-12 px-4 md:px-10 max-w-[1440px] mx-auto w-full space-y-6">
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100 space-y-4">
          <p className="text-red-600 font-semibold">{error || 'Cliente não encontrado ou acesso negado.'}</p>
          <div>
            <Button asChild variant="outline">
              <Link href={`/dashboard/construtoras/${constructorId}/leads`}>Voltar para Clientes</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const { lead, statusHistory, properties } = data;

  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'qualified': return 'outline';
      case 'proposal': return 'outline';
      case 'negotiation': return 'default';
      case 'closed': return 'default';
      case 'lost': return 'destructive';
      default: return 'outline';
    }
  };

  const translateStatus = (s: string) => {
    const map: Record<string, string> = {
      new: 'Novo',
      contacted: 'Em Contato',
      qualified: 'Qualificado',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      closed: 'Fechado / Ganho',
      lost: 'Perdido',
    };
    return map[s] || s;
  };

  const translatePurpose = (p: string) => {
    const map: Record<string, string> = {
      moradia: 'Moradia',
      investimento: 'Investimento',
      lazer: 'Lazer',
    };
    return map[p] || p || '-';
  };

  const translatePaymentMethod = (m: string) => {
    const map: Record<string, string> = {
      financiamento: 'Financiamento Bancário',
      a_vista: 'À Vista',
      parcelado: 'Parcelado Direto',
      consorcio: 'Consórcio',
    };
    return map[m] || m || '-';
  };

  const translateTimeline = (t: string) => {
    const map: Record<string, string> = {
      imediato: 'Imediato',
      '3_meses': 'Até 3 meses',
      '6_meses': 'Até 6 meses',
      'mais_6_meses': 'Mais de 6 meses',
    };
    return map[t] || t || '-';
  };

  const translateOrigin = (o: string) => {
    const map: Record<string, string> = {
      site: 'Site Institucional',
      portal: 'Portal / Parceria',
      plantao: 'Plantão de Vendas',
      indicacao: 'Indicação',
      outro: 'Outro',
    };
    return map[o] || o || '-';
  };

  return (
    <main className="py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full space-y-8">
      {/* 1. CABEÇALHO */}
      <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href={`/dashboard/construtoras/${constructorId}/leads`}>
                ← Voltar para Clientes
              </Link>
            </Button>
            <Badge variant={getStatusBadgeVariant(lead.status)} className="uppercase text-xs font-bold">
              {translateStatus(lead.status)}
            </Badge>
            {lead.dealStatus && (
              <Badge variant="outline" className="text-xs uppercase text-text-secondary">
                Deal: {lead.dealStatus}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-text-main">{lead.name || 'Cliente sem nome'}</h1>
          <div className="flex items-center gap-6 text-sm text-text-secondary flex-wrap">
            {lead.dealValue !== undefined && lead.dealValue > 0 && (
              <span className="flex items-center gap-1.5 font-semibold text-primary">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Valor do Negócio: {formatCurrency(lead.dealValue)}
              </span>
            )}
            {lead.createdAt && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                Cadastrado em: {formatDate(lead.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Ações Rápidas de Contato */}
        <div className="flex items-center gap-3 flex-wrap">
          {lead.whatsapp && (
            <a 
              href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              WhatsApp
            </a>
          )}
          {lead.phone && (
            <a 
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-main px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              Ligar
            </a>
          )}
          {lead.email && (
            <a 
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-main px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              E-mail
            </a>
          )}
        </div>
      </div>

      {/* Grid Principal (2 colunas desktop, 1 coluna mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Dados, Perfil de Compra e Atendimento (2 colunas de largura) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. DADOS DO CLIENTE */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Dados do Cliente
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Nome Completo</span>
                <p className="font-semibold text-text-main">{lead.name || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">CPF</span>
                <p className="font-semibold text-text-main">{lead.cpf || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">E-mail</span>
                <p className="font-semibold text-text-main">{lead.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Telefone / WhatsApp</span>
                <p className="font-semibold text-text-main">{lead.whatsapp || lead.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Data de Nascimento</span>
                <p className="font-semibold text-text-main">{lead.birthDate ? new Date(lead.birthDate).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Estado Civil</span>
                <p className="font-semibold text-text-main">{lead.maritalStatus ? lead.maritalStatus.charAt(0).toUpperCase() + lead.maritalStatus.slice(1) : '-'}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Profissão</span>
                <p className="font-semibold text-text-main">{lead.profession || '-'}</p>
              </div>
            </div>
          </div>

          {/* 3. PERFIL DE COMPRA */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">target</span>
                Perfil de Compra
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Finalidade</span>
                <p className="font-semibold text-text-main">{translatePurpose(lead.purpose)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Faixa de Valor</span>
                <p className="font-semibold text-text-main">{lead.dealValue ? formatCurrency(lead.dealValue) : (lead.priceRange || '-')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Forma de Pagamento</span>
                <p className="font-semibold text-text-main">{translatePaymentMethod(lead.paymentMethod)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Possui Imóvel?</span>
                <p className="font-semibold text-text-main">{lead.hasProperty ? 'Sim' : 'Não'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Pretende Financiar?</span>
                <p className="font-semibold text-text-main">{lead.intendsToFinance !== false ? 'Sim' : 'Não'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Previsão de Compra</span>
                <p className="font-semibold text-text-main">{translateTimeline(lead.purchaseTimeline)}</p>
              </div>
              {lead.desiredCharacteristics && (
                <div className="space-y-1 md:col-span-3">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Características Desejadas</span>
                  <p className="text-text-main bg-gray-50 p-3 rounded-xl border border-card-border">{lead.desiredCharacteristics}</p>
                </div>
              )}
              {lead.notes && (
                <div className="space-y-1 md:col-span-3">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Observações / Anotações</span>
                  <p className="text-text-main bg-gray-50 p-3 rounded-xl border border-card-border whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. IMÓVEIS DE INTERESSE */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apartment</span>
                Imóveis de Interesse
              </h2>
              <Badge variant="outline" className="text-xs font-semibold">
                {properties.length} imóvel(is) vinculado(s)
              </Badge>
            </div>

            {properties.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-card-border text-text-secondary text-sm">
                Nenhum imóvel específico vinculado como interesse deste cliente.
                {lead.propertyName && <p className="mt-1 text-xs font-medium text-text-main">Referência informada: {lead.propertyName}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {properties.map(prop => {
                  const title = prop.informacoesbasicas?.nome || prop.informacoesbasicas?.titulo || prop.title || prop.name || 'Imóvel';
                  const status = prop.informacoesbasicas?.status || prop.status || 'Disponível';
                  const price = prop.valores?.venda || prop.preco || prop.valor || 0;
                  const unit = prop.localizacao?.unidade || prop.localizacao?.numero || '';
                  const city = prop.localizacao?.cidade || '';
                  const neighborhood = prop.localizacao?.bairro || '';
                  const photo = prop.midia?.[0] || '';

                  return (
                    <div key={prop.id} className="p-4 rounded-xl border border-card-border bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="w-full sm:w-24 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-card-border">
                        {photo ? (
                          <Image src={photo} alt={title} width={96} height={96} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">Sem foto</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase">{status}</Badge>
                          <span className="text-xs text-text-secondary">Código: {prop.codigo || prop.id.substring(0, 6).toUpperCase()}</span>
                          {unit && <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">Unidade: {unit}</span>}
                        </div>
                        <h3 className="text-base font-bold text-text-main truncate">{title}</h3>
                        <p className="text-xs text-text-secondary truncate">{neighborhood}{neighborhood && city ? ', ' : ''}{city}</p>
                        <p className="text-sm font-bold text-primary mt-1">{price ? formatCurrency(price) : 'Sob consulta'}</p>
                      </div>
                      <div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/imoveis/${prop.id}`}>Ver Imóvel</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Coluna Direita: Resumo Comercial, Atendimento e Histórico (1 coluna de largura) */}
        <div className="space-y-8">

          {/* 6. RESUMO COMERCIAL */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Resumo Comercial
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-text-secondary">Status no Funil</span>
                <Badge variant={getStatusBadgeVariant(lead.status)} className="font-bold">
                  {translateStatus(lead.status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-text-secondary">Status do Deal</span>
                <span className="font-semibold text-text-main uppercase text-xs">{lead.dealStatus || 'Aberto'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-text-secondary">Valor do Negócio</span>
                <span className="font-bold text-primary">{formatCurrency(lead.dealValue)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-text-secondary">Imóvel de Interesse</span>
                <span className="font-medium text-text-main truncate max-w-[160px]">{lead.propertyName || (properties[0] ? (properties[0].informacoesbasicas?.nome || properties[0].title) : '-')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-text-secondary">Corretor Responsável</span>
                <span className="font-medium text-text-main">{lead.brokerId || 'Atendimento Direto'}</span>
              </div>
            </div>
          </div>

          {/* 5. ATENDIMENTO */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">support_agent</span>
                Atendimento
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Origem do Lead</span>
                <p className="font-semibold text-text-main">{translateOrigin(lead.leadOrigin)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Próxima Ação</span>
                <p className="font-semibold text-text-main bg-primary/5 p-3 rounded-xl border border-primary/20 text-primary">
                  {lead.nextAction || 'Nenhuma ação pendente'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Corretor</span>
                <p className="font-semibold text-text-main">{lead.brokerId || 'Direto / Imobiliária'}</p>
              </div>
            </div>
          </div>

          {/* 7. HISTÓRICO (Timeline) */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Histórico & Timeline
              </h2>
            </div>

            {statusHistory.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm bg-gray-50 rounded-xl border border-dashed border-card-border">
                Nenhum evento registrado no histórico deste lead.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-card-border">
                {statusHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative space-y-1">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-white ring-2 ring-primary/20" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-text-main">
                        {item.fromStatus ? `${translateStatus(item.fromStatus)} → ${translateStatus(item.toStatus || item.status)}` : (translateStatus(item.status || item.toStatus) || 'Atualização')}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {formatDate(item.changedAt || item.createdAt || item.date)}
                      </span>
                    </div>
                    {item.notes && <p className="text-xs text-text-secondary bg-gray-50 p-2 rounded-lg">{item.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
