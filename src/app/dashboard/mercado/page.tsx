'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuthContext } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer 
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  TrendingUp, 
  Zap, 
  Calendar, 
  ArrowUpRight,
  Home,
  Building,
  Users,
  Coins,
  ArrowRight,
  Filter,
  FileText,
  Download,
  Quote,
  TrendingDown,
  MoveRight,
  ChevronRight,
  Search,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogClose 
} from "@/components/ui/dialog";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const MarketHeatMap = dynamic(() => import('@/components/MarketHeatMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-slate-100 animate-pulse rounded-2xl" />
});

export default function MercadoCorretorPage() {
  const { userProfile, user } = useAuthContext();
  const firestore = useFirestore();

  const [periodicity, setPeriodicity] = useState<'mensal' | 'trimestral' | 'anual'>('mensal');
  const [analysisYear, setAnalysisYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<{ year: string, q: number } | null>(null);
  
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isQuarterModalOpen, setIsQuarterModalOpen] = useState(false);

  const reportsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'marketReports'), orderBy('month', 'asc')) : null),
    [firestore]
  );
  const { data: reports, isLoading: areReportsLoading } = useCollection<any>(reportsQuery);

  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true)) : null),
    [firestore]
  );
  const { data: properties, isLoading: arePropertiesLoading } = useCollection<any>(propertiesQuery);

  // Lógica de filtragem por periodicidade e seleção
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    
    if (periodicity === 'mensal' && selectedMonth) {
      return reports.filter(r => r.month === selectedMonth);
    }
    
    if (periodicity === 'trimestral' && selectedQuarter) {
      const { year, q } = selectedQuarter;
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      return reports.filter(r => {
        const [rYear, rMonth] = r.month.split('-').map(Number);
        return String(rYear) === year && rMonth >= startMonth && rMonth <= endMonth;
      });
    }

    if (periodicity === 'anual') {
      if (analysisYear === 'all') return reports;
      return reports.filter(r => r.month && r.month.startsWith(analysisYear));
    }

    return reports.slice(-12); // Fallback padrão
  }, [reports, analysisYear, periodicity, selectedMonth, selectedQuarter]);

  const latestReport = useMemo(() => {
    if (filteredReports.length === 0) return null;
    return [...filteredReports].sort((a, b) => b.month.localeCompare(a.month))[0];
  }, [filteredReports]);

  const chartData = useMemo(() => {
    if (filteredReports.length === 0) return [];
    return filteredReports.map(r => ({
      month: format(parseISO(`${r.month}-01`), 'MMM/yy', { locale: ptBR }),
      price: r.avgPricePerM2,
    }));
  }, [filteredReports]);

  const marketStats = useMemo(() => {
    if (filteredReports.length === 0) return null;
    
    const sortedByDate = [...filteredReports].sort((a, b) => a.month.localeCompare(b.month));
    const firstOfRange = sortedByDate[0];
    const latestOfRange = sortedByDate[sortedByDate.length - 1];

    const accumulatedAppreciation = ((latestOfRange.avgPricePerM2 - firstOfRange.avgPricePerM2) / firstOfRange.avgPricePerM2) * 100;
    
    // Identificar o pico de alta real no período filtrado
    let peakReport = filteredReports[0];
    let maxVar = -Infinity;

    filteredReports.forEach(r => {
      const currentVar = parseFloat(r.monthlyVariation || 0);
      if (currentVar > maxVar) {
        maxVar = currentVar;
        peakReport = r;
      }
    });

    return {
      accumulatedAppreciation: accumulatedAppreciation.toFixed(2),
      peakMonth: format(parseISO(`${peakReport.month}-01`), 'MMMM/yy', { locale: ptBR }),
      peakValue: peakReport.monthlyVariation,
      avgPrice: latestOfRange.avgPricePerM2
    };
  }, [filteredReports]);

  const availableYears = useMemo(() => {
    if (!reports) return [];
    const years = new Set(reports.map(r => r.month?.split('-')[0]));
    return Array.from(years).sort().reverse();
  }, [reports]);

  const jpProperties = useMemo(() => {
    if (!properties) return [];
    return properties.filter((p: any) => p.localizacao?.cidade === 'João Pessoa');
  }, [properties]);

  const neighborhoodMarketStats = useMemo(() => {
    if (jpProperties.length === 0 || !latestReport) return [];

    const counts: Record<string, number> = {};
    jpProperties.forEach((p: any) => {
      const bairro = p.localizacao?.bairro;
      if (bairro) {
        counts[bairro] = (counts[bairro] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => {
      const reportData = latestReport.topNeighborhoods?.find((nb: any) => nb.name.toLowerCase() === name.toLowerCase());
      return {
        name,
        count,
        variation: reportData?.variation || 0,
        price: reportData?.price || 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [jpProperties, latestReport]);

  const heatmapData = useMemo(() => {
    if (neighborhoodMarketStats.length === 0) return [];
    
    const neighborhoodCoords: Record<string, [number, number]> = {
      "Cabo Branco": [-7.1466, -34.8231],
      "Manaíra": [-7.1065, -34.8322],
      "Tambaú": [-7.1189, -34.8247],
      "Altiplano": [-7.1396, -34.8335],
      "Bessa": [-7.0863, -34.8378],
      "Jardim Oceania": [-7.0950, -34.8350],
      "Torre": [-7.1235, -34.8625],
      "Miramar": [-7.1245, -34.8432],
      "Bancários": [-7.1625, -34.8385],
    };

    const prices = neighborhoodMarketStats.map(n => n.price).filter(p => p > 0);
    const maxPrice = prices.length ? Math.max(...prices) : 1;
    const minPrice = prices.length ? Math.min(...prices) : 0;

    return neighborhoodMarketStats
      .map(nb => {
        const coords = neighborhoodCoords[nb.name];
        if (!coords) return null;
        
        const intensity = maxPrice === minPrice ? 0.5 : (nb.price - minPrice) / (maxPrice - minPrice);
        return { lat: coords[0], lng: coords[1], intensity };
      })
      .filter((item): item is { lat: number; lng: number; intensity: number } => item !== null);
  }, [neighborhoodMarketStats]);

  const currentSelectionLabel = useMemo(() => {
    if (periodicity === 'mensal' && selectedMonth) {
      return format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR });
    }
    if (periodicity === 'trimestral' && selectedQuarter) {
      return `${selectedQuarter.q}º Trimestre ${selectedQuarter.year}`;
    }
    if (analysisYear === 'all') return 'Todo o Histórico';
    return `Janeiro ${analysisYear} - Dezembro ${analysisYear}`;
  }, [periodicity, selectedMonth, selectedQuarter, analysisYear]);

  /**
   * Limpa o resumo para exibição no card de topo.
   * Remove artefatos de Markdown e garante texto fluido.
   */
  const cleanSummaryText = (markdown: string | undefined) => {
    if (!markdown) return 'Análise consolidada do mercado imobiliário baseada no último relatório processado.';
    return markdown
        .replace(/###/g, '')
        .replace(/\*\*/g, '')
        .replace(/📈/g, '')
        .replace(/🚀/g, '')
        .replace(/💬/g, '')
        .split('\n').filter(p => p.trim() !== '')[0] 
        .substring(0, 300);
  };

  /**
   * Processa o markdown garantindo que quebras de linha simples virem duplas
   * para forçar a criação de parágrafos no ReactMarkdown.
   */
  const formatMarkdown = (text: string | undefined) => {
    if (!text) return '';
    return text.replace(/\n(?!\n)/g, '\n\n');
  };

  const isLoading = areReportsLoading || arePropertiesLoading;

  if (isLoading) return <div className="p-10 text-center italic text-slate-500">Carregando inteligência de mercado...</div>;

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Inteligência de Mercado</h1>
          <p className="text-slate-500 font-medium mt-1">Panorama de João Pessoa - {currentSelectionLabel}</p>
        </div>
        {userProfile?.userType === 'admin' && (
          <Button asChild className="h-12 px-6 bg-primary hover:bg-primary-hover text-slate-950 font-bold shadow-lg shadow-primary/20 border-none transition-all">
            <Link href="/dashboard/admin/inteligencia">
              <span className="material-symbols-outlined mr-2">analytics</span>
              Gerenciar Relatórios
            </Link>
          </Button>
        )}
      </header>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 rounded-2xl shadow-soft border border-slate-100">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => { setPeriodicity('mensal'); setIsMonthModalOpen(true); }}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
              periodicity === 'mensal' ? "bg-primary text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-200"
            )}
          >
            Mensal
          </button>
          <button 
            onClick={() => { setPeriodicity('trimestral'); setIsQuarterModalOpen(true); }}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
              periodicity === 'trimestral' ? "bg-primary text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-200"
            )}
          >
            Trimestral
          </button>
          <button 
            onClick={() => { setPeriodicity('anual'); setAnalysisYear(availableYears[0] || 'all'); }}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
              periodicity === 'anual' ? "bg-primary text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-200"
            )}
          >
            Anual
          </button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {periodicity === 'anual' && (
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-transparent focus-within:border-primary transition-all">
              <Calendar className="size-4 text-slate-400" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Período de Análise</span>
                <select 
                  value={analysisYear}
                  onChange={(e) => setAnalysisYear(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-bold p-0 pr-8 h-5 text-slate-900 cursor-pointer"
                >
                  <option value="all">Todo o Histórico</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>Janeiro {year} - Dezembro {year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {periodicity === 'mensal' && selectedMonth && (
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-primary transition-all">
                <Calendar className="size-4 text-primary" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Mês Selecionado</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">
                        {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}
                    </span>
                </div>
                <button onClick={() => setIsMonthModalOpen(true)} className="ml-2 text-[10px] font-bold text-primary-hover underline cursor-pointer">Trocar</button>
            </div>
          )}

          {periodicity === 'trimestral' && selectedQuarter && (
             <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-primary transition-all">
                <Calendar className="size-4 text-primary" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Trimestre Selecionado</span>
                    <span className="text-sm font-bold text-slate-900">
                        {selectedQuarter.q}º Trimestre {selectedQuarter.year}
                    </span>
                </div>
                <button onClick={() => setIsQuarterModalOpen(true)} className="ml-2 text-[10px] font-bold text-primary-hover underline cursor-pointer">Trocar</button>
            </div>
          )}

          <button className="flex items-center gap-2 px-6 h-11 bg-slate-950 text-white rounded-xl hover:bg-black transition-all shadow-soft group">
            <Filter className="size-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">Filtros Avançados</span>
          </button>
        </div>
      </div>

      {latestReport ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-6 rounded-xl shadow-soft hover:scale-[1.01] transition-transform flex flex-col justify-between border border-slate-100">
              <span className="text-xs font-black text-slate-400 tracking-widest uppercase">
                {periodicity === 'anual' && analysisYear === 'all' ? 'Valorização Total' : 'Valorização no Período'}
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">+{marketStats?.accumulatedAppreciation || '0.00'}%</span>
                <TrendingUp className="text-primary size-6" />
              </div>
              <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${Math.min(100, (Number(marketStats?.accumulatedAppreciation) || 0) * 5)}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft hover:scale-[1.01] transition-transform border border-slate-100 text-left">
              <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Preço Médio</span>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">R$ {marketStats?.avgPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic uppercase font-bold tracking-tighter">João Pessoa, PB</p>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-soft hover:scale-[1.01] transition-transform text-white border-none relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full -mr-12 -mt-12"></div>
              <span className="text-xs font-black text-primary tracking-widest uppercase">Mês de Maior Alta</span>
              <div className="mt-4">
                <span className="text-4xl font-bold capitalize text-white">{marketStats?.peakMonth || '---'}</span>
              </div>
              <p className="text-xs text-primary font-bold mt-2">+{marketStats?.peakValue}% de crescimento no mês</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft border-l-4 border-primary hover:scale-[1.01] transition-transform border border-slate-100 text-left">
              <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Confiança do Mercado</span>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-4xl font-bold text-slate-900">Alta</span>
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Sentimento do investidor positivo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            <Card className="lg:col-span-2 shadow-soft border-slate-100 overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-bold text-slate-900 uppercase tracking-tight">Evolução de Preços</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] bg-slate-100 border-none font-bold uppercase py-1">
                    {currentSelectionLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={{ price: { label: "Preço m²", color: "hsl(var(--primary))" } }} className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                        tickFormatter={(val) => `R$ ${val/1000}k`} 
                      />
                      <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                      <Bar 
                        dataKey="price" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                        className="transition-all hover:opacity-80"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-slate-100 bg-white flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                  Ranking por Bairro
                </CardTitle>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(parseISO(`${latestReport.month}-01`), 'MMMM yyyy', { locale: ptBR })}</p>
              </CardHeader>
              <CardContent className="space-y-8 flex-1">
                {[...latestReport.topNeighborhoods]?.sort((a: any, b: any) => b.price - a.price).slice(0, 4).map((nb: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-slate-700 uppercase tracking-tight">{nb.name}</span>
                      <span className={cn("font-bold", i === 0 ? "text-[#2bf20d]" : "text-slate-900")}>R$ {nb.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²</span>
                    </div>
                    <Progress 
                        value={Math.min(100, (nb.price / latestReport.topNeighborhoods[0].price) * 100)} 
                        className="h-2 rounded-none" 
                        style={{
                            '--progress-background': i === 0 ? '#ef4444' : i < 2 ? '#f97316' : '#2bf20d'
                        } as any}
                    />
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-auto py-7 rounded-xl font-bold text-xs uppercase tracking-widest border-2" asChild>
                  <Link href={`/dashboard/mercado/${latestReport.id}`}>Ver Análise Completa</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <section className="bg-white p-8 rounded-xl shadow-soft border border-slate-100 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Mapa de Calor por Bairro</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Valor do m² por zona geográfica em João Pessoa</p>
              </div>
            </div>
            <MarketHeatMap data={heatmapData} className="rounded-2xl" />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <Card className="bg-slate-50 p-8 rounded-xl border border-primary/20 shadow-none flex flex-col h-full">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  Sales Insights
                </h2>
                <Button variant="link" className="text-primary text-xs font-black uppercase tracking-widest p-0 h-auto gap-1" asChild>
                  <Link href={latestReport ? `/dashboard/mercado/${latestReport.id}` : '#'}>Ver Tudo <ArrowRight className="size-3" /></Link>
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                 <ReactMarkdown 
                    className="prose prose-sm text-slate-600 space-y-6"
                    components={{
                        h3: ({ children }) => (
                          <h4 className="text-sm font-bold text-slate-900 mt-10 mb-4">{children}</h4>
                        ),
                        p: ({ children }) => (
                          <p className="text-sm leading-relaxed font-normal text-slate-600 mb-6">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <span className="font-normal text-slate-700">{children}</span>
                        ),
                        blockquote: ({ children }) => (
                            <div className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm border border-slate-100 text-left my-6 group hover:border-primary/40 transition-all border-l-4 border-l-primary">
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <MessageSquare className="size-4 text-slate-900" />
                                </div>
                                <div className="text-sm font-normal italic leading-relaxed text-slate-700">
                                    {children}
                                </div>
                            </div>
                        )
                    }}
                 >
                    {formatMarkdown(latestReport?.aiInsights)}
                 </ReactMarkdown>
              </div>
            </Card>

            <div className="bg-slate-900 p-8 rounded-xl text-white relative overflow-hidden flex flex-col justify-center min-h-[400px]">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-primary uppercase tracking-tight">Resumo do Momento</h2>
              </div>
              <p className="text-lg leading-relaxed opacity-90 mb-8 font-normal">
                  {cleanSummaryText(latestReport?.aiInsights)}
              </p>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/10 text-primary border-none uppercase text-[10px] font-black py-1 px-3">Bullish</Badge>
                <Badge className="bg-white/10 text-white border-none uppercase text-[10px] font-black py-1 px-3">João Pessoa</Badge>
              </div>
              <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confiança</span>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-6 bg-primary rounded-full"></div>)}
                  </div>
                </div>
                <Button variant="link" className="text-primary text-xs font-bold gap-2 p-0 h-auto hover:no-underline" asChild>
                  <Link href={`/dashboard/mercado/${latestReport?.id}`}>Explorar Dossiê <ChevronRight className="size-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">analytics</span>
          <h3 className="text-lg font-bold text-slate-400 italic">Aguardando o primeiro relatório para gerar inteligência de mercado.</h3>
        </div>
      )}

      {/* Month Selection Modal */}
      <Dialog open={isMonthModalOpen} onOpenChange={setIsMonthModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl">
          <DialogHeader className="p-6 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight uppercase">Selecionar Mês de Análise</DialogTitle>
            <DialogDescription>Escolha um mês específico para visualizar o dossiê detalhado.</DialogDescription>
          </DialogHeader>
          <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
            {[...reports || []].sort((a, b) => b.month.localeCompare(a.month)).map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedMonth(r.month); setIsMonthModalOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                  selectedMonth === r.month ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-100 hover:border-primary/50 bg-slate-50/50"
                )}
              >
                <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors capitalize">
                   {format(parseISO(`${r.month}-01`), 'MMMM yyyy', { locale: ptBR })}
                </span>
                <ChevronRight className="size-4 text-slate-300 group-hover:text-primary transition-all" />
              </button>
            ))}
          </div>
          <footer className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <DialogClose asChild>
                <Button variant="ghost" className="font-bold">Fechar</Button>
            </DialogClose>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Quarter Selection Modal */}
      <Dialog open={isQuarterModalOpen} onOpenChange={setIsQuarterModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-none shadow-2xl">
          <DialogHeader className="p-6 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight uppercase">Escolher Trimestre</DialogTitle>
            <DialogDescription>Analise o desempenho consolidado de cada período de 3 meses.</DialogDescription>
          </DialogHeader>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableYears.map(year => (
              <div key={year} className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">{year}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map(q => (
                    <button
                      key={q}
                      onClick={() => { setSelectedQuarter({ year, q }); setIsQuarterModalOpen(false); }}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all cursor-pointer group",
                        (selectedQuarter?.year === year && selectedQuarter?.q === q) ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-100 hover:border-primary/50 bg-slate-50/50"
                      )}
                    >
                      <span className="block text-sm font-bold text-slate-900 group-hover:text-primary">{q}º Trim.</span>
                      <span className="text-[10px] font-medium text-slate-400">Ano {year}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <footer className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <DialogClose asChild>
                <Button variant="ghost" className="font-bold">Fechar</Button>
            </DialogClose>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
