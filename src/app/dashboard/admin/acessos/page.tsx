'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { 
  Globe, 
  Smartphone, 
  MousePointer2, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Users
} from 'lucide-react';
import Link from 'next/link';

type Broker = {
  id: string;
  brandName: string;
  slug: string;
  logoUrl?: string;
};

type User = {
  id: string;
  username: string;
  lastAccess?: any;
  isOnline?: boolean;
};

type BrokerMetrics = {
    id: string;
    siteHits?: number;
    oralinkHits?: number;
    totalLeads?: number;
    conversionRate?: number;
};

export default function AcessosPerformancePage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 20;

  const brokersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'brokers')) : null),
    [firestore, refreshKey]
  );
  const { data: brokers, isLoading: isBrokersLoading } = useCollection<Broker>(brokersQuery);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore, refreshKey]
  );
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const metricsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'corretorMetrics')) : null),
      [firestore, refreshKey]
  );
  const { data: metrics, isLoading: isMetricsLoading } = useCollection<BrokerMetrics>(metricsQuery);

  const userMap = useMemo(() => {
    return new Map(users?.map(u => [u.id, u]) || []);
  }, [users]);

  const metricsMap = useMemo(() => {
      return new Map(metrics?.map(m => [m.id, m]) || []);
  }, [metrics]);

  const brokersWithStats = useMemo(() => {
    if (!brokers) return [];
    return brokers.map(broker => {
      const m = metricsMap.get(broker.id) || {};
      const siteHits = Number(m.siteHits || 0);
      const totalLeads = Number(m.totalLeads || 0);
      
      return { 
        ...broker, 
        siteHits, 
        oralinkHits: Number(m.oralinkHits || 0), 
        totalLeads,
        conversion: siteHits > 0 ? ((totalLeads / siteHits) * 100).toFixed(1) : "0.0"
      };
    });
  }, [brokers, metricsMap]);

  const processedBrokers = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    return brokersWithStats
      .filter(b => 
        (b.brandName?.toLowerCase() || "").includes(term) || 
        (b.slug?.toLowerCase() || "").includes(term)
      )
      .sort((a, b) => (Number(b.siteHits) || 0) - (Number(a.siteHits) || 0));
  }, [brokersWithStats, searchTerm]);

  const totalPages = Math.ceil(processedBrokers.length / itemsPerPage) || 1;
  const paginatedBrokers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedBrokers.slice(start, start + itemsPerPage);
  }, [processedBrokers, currentPage]);

  const isLoading = isBrokersLoading || isUsersLoading || isMetricsLoading;

  const globalMetrics = useMemo(() => {
    if (brokersWithStats.length === 0) return { totalSiteHits: 0, totalOralink: 0, totalLeads: 0 };
    return {
      totalSiteHits: brokersWithStats.reduce((acc, curr) => acc + (Number(curr.siteHits) || 0), 0),
      totalOralink: brokersWithStats.reduce((acc, curr) => acc + (Number(curr.oralinkHits) || 0), 0),
      totalLeads: brokersWithStats.reduce((acc, curr) => acc + (Number(curr.totalLeads) || 0), 0),
    };
  }, [brokersWithStats]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Acessos e Performance</h1>
          <p className="text-slate-500 font-medium">Acompanhe o engajamento dos sites e links de contato dos corretores.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="h-11 px-6 rounded-xl border-slate-200 font-bold bg-white hover:bg-slate-50 transition-all gap-2"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Atualizar Estatísticas
        </Button>
      </header>

      {/* Global Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-100 shadow-soft overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acessos Site</span>
              <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Globe className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{globalMetrics.totalSiteHits.toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Visitas únicas acumuladas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-soft overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessos Oralink</span>
              <div className="size-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <Smartphone className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{globalMetrics.totalOralink.toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Interações via link da bio</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-soft overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Leads Site</span>
              <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-green-700">
                <Users className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{globalMetrics.totalLeads.toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Leads gerados via site</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-none shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 size-32 bg-primary blur-[80px] opacity-20"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Conversão Média</span>
              <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-primary">
                <Zap className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">
                {globalMetrics.totalSiteHits > 0 
                  ? ((globalMetrics.totalLeads / globalMetrics.totalSiteHits) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Leads vs Acessos totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter">Performance por Corretor</h3>
          <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4 group-focus-within:text-primary transition-colors" />
               <Input 
                type="text" 
                placeholder="Buscar por nome ou slug..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 h-10 w-64 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-primary focus:border-primary transition-all outline-none"
               />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8 h-12">Corretor / Marca</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-12 text-center">Acessos Site</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-12 text-center">Acessos Oralink</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-12 text-center">Total Leads</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-12 text-center">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center p-20 italic text-slate-400">Carregando dados de performance...</TableCell></TableRow>
              ) : paginatedBrokers.map((broker) => {
                return (
                  <TableRow key={broker.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-10 rounded-xl border-2 border-slate-100 shadow-sm">
                          <AvatarImage src={broker.logoUrl} />
                          <AvatarFallback className="bg-slate-100 text-slate-400 font-bold uppercase text-xs">{(broker.brandName || 'B').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{broker.brandName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">/{broker.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-black text-slate-900">{broker.siteHits.toLocaleString('pt-BR')}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-black text-slate-900">{broker.oralinkHits.toLocaleString('pt-BR')}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-black text-slate-900">{broker.totalLeads.toLocaleString('pt-BR')}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-primary/20 text-green-700 border-none font-black text-[10px] tracking-widest px-3">
                        {broker.conversion}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && paginatedBrokers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center p-20 italic text-slate-400">Nenhum corretor encontrado com os filtros aplicados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-bold uppercase">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg h-9 font-bold"
              >
                <ChevronLeft className="size-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg h-9 font-bold"
              >
                Próximo <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Tip */}
      <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex gap-4 items-start">
        <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary-hover shrink-0">
          <Zap className="size-5 fill-current" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Dica de Inteligência</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">Os números de acessos são atualizados em tempo real. A taxa de conversão utiliza o volume total de leads gerados dividido pelo número de acessos únicos no site. Leads criados manualmente no painel não são contabilizados na taxa de conversão do site.</p>
        </div>
      </div>
    </div>
  );
}
