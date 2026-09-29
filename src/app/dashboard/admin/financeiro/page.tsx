'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFinanceMockData } from './mockData';
import { TrendingUp, Clock, Users, DollarSign, ArrowUpRight, ChevronRight, Eye } from 'lucide-react';

// TEMPORARY UI MOCK — replace with financial data source later

export default function AdminFinanceiroOverviewPage() {
  const [period, setPeriod] = useState('Este mês');

  const kpis = adminFinanceMockData.kpis;
  const evolution = adminFinanceMockData.revenueEvolution;
  const plans = adminFinanceMockData.revenueByPlan;
  const statusSummary = adminFinanceMockData.paymentStatusSummary;
  const recentPayments = adminFinanceMockData.payments.slice(0, 4);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">Pago</Badge>;
      case 'Pendente': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold">Pendente</Badge>;
      case 'Reembolsado': return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Reembolsado</Badge>;
      case 'Em disputa': return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold">Em disputa</Badge>;
      case 'Perdido': return <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold">Perdido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">Acompanhe a receita e os pagamentos do OraOra.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
          >
            <option value="Este mês">Este mês</option>
            <option value="Últimos 30 dias">Últimos 30 dias</option>
            <option value="Últimos 90 dias">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
        <Link href="/dashboard/admin/financeiro" className="pb-3 border-b-2 border-slate-900 text-slate-900">Visão Geral</Link>
        <Link href="/dashboard/admin/financeiro/pagamentos" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Pagamentos</Link>
        <Link href="/dashboard/admin/financeiro/clientes" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Clientes e Planos</Link>
      </div>

      {/* KPIs Line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Receita Recebida</span>
            <DollarSign className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(kpis.receitaRecebida)}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
            <ArrowUpRight className="size-3.5" /> +14.2% vs período anterior
          </div>
        </Card>

        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">A Receber</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(kpis.aReceber)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Boletos e pendências em aberto</p>
        </Card>

        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clientes Pagantes</span>
            <Users className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.clientesPagantes}</div>
          <p className="text-[11px] text-slate-400 mt-1">Assinaturas ativas na plataforma</p>
        </Card>

        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
            <TrendingUp className="size-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(kpis.ticketMedio)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Por cliente ativo</p>
        </Card>
      </div>

      {/* Main Evolution & Revenue by Plan Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receita Evolution */}
        <Card className="lg:col-span-2 p-6 border-slate-100 shadow-sm bg-white rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Evolução da Receita</h3>
                <p className="text-xs text-slate-500">Crescimento do faturamento bruto nos últimos meses (R$ mil)</p>
              </div>
            </div>
            {/* Visual Bar Chart Representation */}
            <div className="h-56 flex items-end justify-between gap-4 pt-8 px-2">
              {evolution.map((item, idx) => {
                const heightPercent = (item.value / 140000) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      R$ {item.value.toLocaleString()}
                    </div>
                    <div 
                      style={{ height: `${heightPercent}%` }} 
                      className="w-full bg-slate-900 rounded-t-xl group-hover:bg-slate-800 transition-all"
                    />
                    <span className="text-xs font-bold text-slate-600">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Receita por Plano & Status */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-100 shadow-sm bg-white rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Receita por Plano</h3>
            <p className="text-xs text-slate-500 mb-6">Distribuição percentual do faturamento</p>
            <div className="space-y-4">
              {plans.map((p, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800">{p.plan}</span>
                    <span className="text-slate-900">{p.value} ({p.share})</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full" style={{ width: p.share }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-slate-100 shadow-sm bg-white rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Status dos Pagamentos</h3>
            <p className="text-xs text-slate-500 mb-4">Visão geral do volume por estado</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Pagos</span>
                <span className="text-lg font-black text-emerald-600 mt-0.5">{statusSummary.pagos}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Pendentes</span>
                <span className="text-lg font-black text-amber-600 mt-0.5">{statusSummary.pendentes}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Reembolsados</span>
                <span className="text-lg font-black text-blue-600 mt-0.5">{statusSummary.reembolsados}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Em Disputa</span>
                <span className="text-lg font-black text-rose-600 mt-0.5">{statusSummary.emDisputa}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Últimos Pagamentos */}
      <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl bg-white">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Últimos Pagamentos</h3>
            <p className="text-xs text-slate-500">Transações recentes registradas na plataforma</p>
          </div>
          <Button asChild variant="outline" className="text-xs font-bold gap-1">
            <Link href="/dashboard/admin/financeiro/pagamentos">
              Ver todos os pagamentos <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Plano</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Valor</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Forma</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Data</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentPayments.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="font-bold text-slate-900">{p.clientName}</div>
                  <div className="text-xs text-slate-400">{p.clientEmail}</div>
                </TableCell>
                <TableCell className="font-medium text-slate-700">{p.planName}</TableCell>
                <TableCell className="font-black text-slate-900">{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{p.method}</span>
                </TableCell>
                <TableCell className="text-slate-500 text-xs font-medium">{p.date}</TableCell>
                <TableCell>{getStatusBadge(p.status)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm" className="text-xs font-bold gap-1 text-slate-700 hover:text-slate-900">
                    <Link href="/dashboard/admin/financeiro/pagamentos">
                      <Eye className="size-3.5" /> Detalhes
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
