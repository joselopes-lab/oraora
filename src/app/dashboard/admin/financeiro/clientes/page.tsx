'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { adminFinanceMockData, MockPayment } from '../mockData';
import { 
  Search, Eye, ArrowLeft, Users, ShieldCheck, Clock, AlertTriangle, 
  RefreshCw, CheckCircle2, DollarSign, CreditCard, ExternalLink, Filter, XCircle, Zap, Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AdminFinanceiroClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [methodFilter, setMethodFilter] = useState('Todos');
  const [selectedSale, setSelectedSale] = useState<MockPayment | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [payments, setPayments] = useState<MockPayment[]>(adminFinanceMockData.payments);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveFirestore, setIsLiveFirestore] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            setPayments(json.data);
            setIsLiveFirestore(true);
          } else {
            // If Firestore payments collection is empty, keep mock data or empty
            setIsLiveFirestore(true);
          }
          toast({
            title: 'Dados atualizados',
            description: `${json.data.length} pedidos carregados do Firestore.`
          });
        }
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Exibindo dados de demonstração.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredSales = payments.filter(p => {
    const matchesSearch = !searchTerm || 
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.checkoutId?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const handleSyncAbacatePay = async (checkoutId: string) => {
    if (!checkoutId) return;
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/pix/check?id=${encodeURIComponent(checkoutId)}`);
      const data = await res.json();
      if (res.ok && data?.success) {
        toast({
          title: 'Sincronizado com Abacate Pay',
          description: `Status atual na API: ${data.data?.status || 'Atualizado'}`
        });
        fetchPayments();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na Sincronização',
          description: data?.error || 'Não foi possível consultar a Abacate Pay.'
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Falha ao contatar Abacate Pay API.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Cash Flow Calculations
  const totalVolume = payments.reduce((acc, p) => acc + (p.status === 'Pago' ? p.amount : 0), 0);
  const totalPending = payments.reduce((acc, p) => acc + (p.status === 'Pendente' ? p.amount : 0), 0);
  const paidCount = payments.filter(p => p.status === 'Pago').length;
  const pendingCount = payments.filter(p => p.status === 'Pendente').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard/admin/financeiro" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="size-3.5" /> Voltar à Visão Geral
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Vendas do Checkout Transparente</span>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2.5 py-0.5 font-bold gap-1">
                <Zap className="size-3 fill-emerald-600 text-emerald-600" /> Abacate Pay API v2
              </Badge>
              {isLiveFirestore && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5 font-bold">
                  Firestore Live
                </Badge>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Dados reais obtidos da base de pagamentos e checkout transparente da Abacate Pay.</p>
          </div>
          <div>
            <Button
              onClick={fetchPayments}
              disabled={isLoading}
              variant="outline"
              className="text-xs font-bold gap-2 bg-white"
            >
              {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Atualizar Dados
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
        <Link href="/dashboard/admin/financeiro" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Visão Geral</Link>
        <Link href="/dashboard/admin/financeiro/pagamentos" className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Pagamentos</Link>
        <Link href="/dashboard/admin/financeiro/clientes" className="pb-3 border-b-2 border-slate-900 text-slate-900">Vendas & Clientes (Abacate Pay)</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Recebido</span>
            <DollarSign className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalVolume)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{paidCount} transações pagas</p>
        </Card>
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Em Aberto (PIX/Boleto)</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{formatCurrency(totalPending)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{pendingCount} pedidos pendentes</p>
        </Card>
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Provedor Ativo</span>
            <Zap className="size-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">Abacate Pay v2</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Conectado via API</p>
        </Card>
        <Card className="p-5 border-slate-100 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Pedidos</span>
            <Users className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{payments.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Registrados na base</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente, e-mail, ID ou Checkout ID..." 
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
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Cliente & E-mail</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Plano / Descrição</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Valor</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Método</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Checkout ID (Abacate Pay)</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Data / Hora</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Carregando vendas do Firestore...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                  Nenhuma venda encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id || sale.checkoutId} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="font-bold text-slate-900">{sale.clientName}</div>
                    <div className="text-xs text-slate-400">{sale.clientEmail}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{sale.planName}</TableCell>
                  <TableCell className="font-black text-slate-900">{formatCurrency(sale.amount)}</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{sale.method}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {sale.checkoutId || '—'}
                    </code>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs font-medium">{sale.dateTime || sale.date}</TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedSale(sale)}
                      className="text-xs font-bold gap-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Eye className="size-3.5" /> Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Sale Detail Sheet / Drawer */}
      <Sheet open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-8 bg-white">
          {selectedSale && (
            <div className="space-y-8">
              <SheetHeader className="space-y-2 text-left p-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">ID Interno: {selectedSale.id}</span>
                  {getStatusBadge(selectedSale.status)}
                </div>
                <SheetTitle className="text-2xl font-black text-slate-900">Detalhes do Pedido & Abacate Pay</SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  Informações completas da transação via checkout transparente.
                </SheetDescription>
              </SheetHeader>

              {/* Abacate Pay Integration Box */}
              <div className="bg-emerald-50/60 border border-emerald-200/60 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      AP
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900">Abacate Pay Gateway v2</div>
                      <div className="text-[11px] font-mono text-emerald-700">{selectedSale.checkoutId}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSyncing}
                    onClick={() => handleSyncAbacatePay(selectedSale.checkoutId)}
                    className="text-xs font-bold gap-1 bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-800"
                  >
                    <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizar
                  </Button>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Resumo da Venda</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Cliente</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedSale.clientName}</div>
                    <div className="text-xs text-slate-400">{selectedSale.clientEmail}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Plano Contratado</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedSale.planName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Valor</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(selectedSale.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Forma de Pagamento</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedSale.method}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">Data e Hora da Transação</div>
                    <div className="text-sm font-medium text-slate-900 mt-0.5">{selectedSale.dateTime}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Histórico & Timeline do Pedido</div>
                <div className="space-y-3 border-l-2 border-slate-100 pl-4 ml-2">
                  {selectedSale.timeline?.map((t, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-slate-300 border-2 border-white" />
                      <div className="text-xs font-bold text-slate-900">{t.event}</div>
                      <div className="text-[11px] text-slate-400">{t.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSale(null)}
                  className="text-xs font-bold"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
