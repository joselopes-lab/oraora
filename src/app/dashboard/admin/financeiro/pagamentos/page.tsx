'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { adminFinanceMockData, MockPayment } from '../mockData';
import { Search, Filter, Eye, ArrowLeft, Download, Calendar } from 'lucide-react';

// TEMPORARY UI MOCK — replace with financial data source later

export default function AdminFinanceiroPagamentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [methodFilter, setMethodFilter] = useState('Todos');
  const [selectedPayment, setSelectedPayment] = useState<MockPayment | null>(null);

  const payments = adminFinanceMockData.payments;

  const filteredPayments = payments.filter(p => {
    const matchesSearch = !searchTerm || 
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'Todos' || p.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

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
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/admin/financeiro" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="size-3.5" /> Voltar à Visão Geral
            </Link>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pagamentos</h1>
          <p className="text-sm text-slate-500 mt-1">Consulte e acompanhe os pagamentos realizados no OraOra.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs font-bold gap-2">
            <Download className="size-4" /> Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
        <Link href="/dashboard/admin/financeiro" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Visão Geral</Link>
        <Link href="/dashboard/admin/financeiro/pagamentos" className="pb-3 border-b-2 border-slate-900 text-slate-900">Pagamentos</Link>
        <Link href="/dashboard/admin/financeiro/clientes" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Clientes e Planos</Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente, e-mail ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Todos">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Reembolsado">Reembolsado</option>
              <option value="Em disputa">Em disputa</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Forma:</span>
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Todos">Todas</option>
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Boleto">Boleto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl bg-white">
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
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                  Nenhum pagamento encontrado com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p) => (
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedPayment(p)}
                      className="text-xs font-bold gap-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Eye className="size-3.5" /> Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Payment Detail Sheet / Drawer */}
      <Sheet open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-8 bg-white">
          {selectedPayment && (
            <div className="space-y-8">
              <SheetHeader className="space-y-2 text-left p-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">{selectedPayment.id}</span>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <SheetTitle className="text-2xl font-black text-slate-900">Detalhes do Pagamento</SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  Registro histórico de transação processada na plataforma.
                </SheetDescription>
              </SheetHeader>

              {/* Resumo */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Resumo Financeiro</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Valor Total</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(selectedPayment.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Forma de Pagamento</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedPayment.method}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">Data e Hora</div>
                    <div className="text-sm font-medium text-slate-800 mt-0.5">{selectedPayment.dateTime}</div>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Cliente</div>
                <div className="p-4 rounded-2xl border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">{selectedPayment.clientName}</div>
                  <div className="text-xs text-slate-500">{selectedPayment.clientEmail}</div>
                </div>
              </div>

              {/* Plano */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Plano Contratado</div>
                <div className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{selectedPayment.planName}</div>
                    <div className="text-xs text-slate-500">Duração: 30 dias / 1 ano</div>
                  </div>
                  <div className="font-black text-slate-900">{formatCurrency(selectedPayment.amount)}</div>
                </div>
              </div>

              {/* Processamento */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Processamento (Provedor)</div>
                <div className="p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provedor:</span>
                    <span className="font-bold text-slate-900">{selectedPayment.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID do Checkout / Transação:</span>
                    <span className="font-mono font-medium text-slate-700">{selectedPayment.checkoutId}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Histórico / Timeline</div>
                <div className="space-y-3 border-l-2 border-slate-200 pl-4 ml-2">
                  {selectedPayment.timeline.map((item, i) => (
                    <div key={i} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-slate-900 border-2 border-white" />
                      <div className="text-[11px] font-bold text-slate-400">{item.time}</div>
                      <div className="text-xs font-medium text-slate-800">{item.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
