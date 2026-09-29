'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { adminFinanceMockData, MockClientPlan } from '../mockData';
import { Search, Eye, ArrowLeft, Users, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

// TEMPORARY UI MOCK — replace with financial data source later

export default function AdminFinanceiroClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedClient, setSelectedClient] = useState<MockClientPlan | null>(null);

  const clients = adminFinanceMockData.clientsAndPlans;
  const summary = adminFinanceMockData.clientsSummary;

  const filteredClients = clients.filter(c => {
    const matchesSearch = !searchTerm || 
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || c.accessStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  const getAccessBadge = (status: string) => {
    switch (status) {
      case 'Ativo': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">Ativo</Badge>;
      case 'Próximo do vencimento': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold">Próximo do vencimento</Badge>;
      case 'Expirado': return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold">Expirado</Badge>;
      case 'Suspenso': return <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold">Suspenso</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard/admin/financeiro" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="size-3.5" /> Voltar à Visão Geral
          </Link>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clientes e Planos</h1>
        <p className="text-sm text-slate-500 mt-1">Acompanhe a relação entre pagamentos, planos contratados e status de acesso dos corretores.</p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
        <Link href="/dashboard/admin/financeiro" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Visão Geral</Link>
        <Link href="/dashboard/admin/financeiro/pagamentos" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Pagamentos</Link>
        <Link href="/dashboard/admin/financeiro/clientes" className="pb-3 border-b-2 border-slate-900 text-slate-900">Clientes e Planos</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clientes Pagantes</span>
            <Users className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.pagantes}</div>
          <p className="text-[11px] text-slate-400 mt-1">Com histórico ativo</p>
        </Card>
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Acessos Ativos</span>
            <ShieldCheck className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.acessosAtivos}</div>
          <p className="text-[11px] text-slate-400 mt-1">Utilizando a plataforma</p>
        </Card>
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Próximos do Vencimento</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary.proximosVencimento}</div>
          <p className="text-[11px] text-slate-400 mt-1">Expiram em até 7 dias</p>
        </Card>
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Acessos Suspensos</span>
            <AlertTriangle className="size-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.suspensos}</div>
          <p className="text-[11px] text-slate-400 mt-1">Pagamento pendente/expirado</p>
        </Card>
      </div>

      {/* Search and Filters */}
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
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500">Status de Acesso:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="Todos">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Próximo do vencimento">Próximo do vencimento</option>
            <option value="Expirado">Expirado</option>
            <option value="Suspenso">Suspenso</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl bg-white">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Plano</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Último Pagamento</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Início do Acesso</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Fim do Acesso</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Status Acesso</TableHead>
              <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="font-bold text-slate-900">{c.clientName}</div>
                    <div className="text-xs text-slate-400">{c.clientEmail}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{c.planName}</TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{formatCurrency(c.lastPaymentAmount)}</div>
                    <div className="text-xs text-slate-400">{c.lastPaymentDate}</div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-medium">{c.accessStart}</TableCell>
                  <TableCell className="text-slate-600 text-xs font-medium">{c.accessEnd}</TableCell>
                  <TableCell>{getAccessBadge(c.accessStatus)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedClient(c)}
                      className="text-xs font-bold gap-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Eye className="size-3.5" /> Ver cliente
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Client Detail Sheet / Drawer */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-8 bg-white">
          {selectedClient && (
            <div className="space-y-8">
              <SheetHeader className="space-y-2 text-left p-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">{selectedClient.id}</span>
                  {getAccessBadge(selectedClient.accessStatus)}
                </div>
                <SheetTitle className="text-2xl font-black text-slate-900">{selectedClient.clientName}</SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  {selectedClient.clientEmail}
                </SheetDescription>
              </SheetHeader>

              {/* Plano Atual */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Plano Atual</div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-base">{selectedClient.planName}</span>
                    <span className="font-black text-slate-900">{formatCurrency(selectedClient.lastPaymentAmount)}</span>
                  </div>
                  <div className="text-xs text-slate-500">Duração contratada: Período padrão</div>
                </div>
              </div>

              {/* Acesso */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Status de Acesso (Plataforma)</div>
                <div className="p-5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Início do Acesso</span>
                    <span className="font-bold text-slate-800">{selectedClient.accessStart}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Fim do Acesso</span>
                    <span className="font-bold text-slate-800">{selectedClient.accessEnd}</span>
                  </div>
                </div>
              </div>

              {/* Último Pagamento */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Último Pagamento Registrado</div>
                <div className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{selectedClient.lastPaymentDate}</span>
                    <span className="text-slate-500">Método: PIX / Cartão</span>
                  </div>
                  <div className="font-black text-emerald-600 text-sm">{formatCurrency(selectedClient.lastPaymentAmount)}</div>
                </div>
              </div>

              {/* Histórico de Pagamentos */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Histórico de Pagamentos (Leitura)</div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold text-slate-700">Data</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700">Plano</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700">Valor</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClient.paymentHistory.map((ph, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs text-slate-600">{ph.date}</TableCell>
                          <TableCell className="text-xs font-medium text-slate-800">{ph.plan}</TableCell>
                          <TableCell className="text-xs font-bold text-slate-900">{formatCurrency(ph.amount)}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px] font-bold">{ph.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
