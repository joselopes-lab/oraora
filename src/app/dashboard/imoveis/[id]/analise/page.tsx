
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy, limit, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  ArrowLeft, 
  Zap, 
  ShieldCheck,
  AlertTriangle,
  Download,
  Share2,
  BarChart4,
  CheckCircle2,
  TrendingDown,
  ExternalLink,
  Quote,
  BarChart3
} from 'lucide-react';
import { generatePropertyInvestmentAnalysis } from '@/ai/flows/property-investment-analysis-flow';
import { PropertyInvestmentAnalysisOutput } from '@/ai/genkit';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PropertyAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<PropertyInvestmentAnalysisOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const propertyDocRef = useMemoFirebase(() => (firestore && id ? doc(firestore, 'properties', id) : null), [firestore, id]);
  const { data: property, isLoading: isPropertyLoading } = useDoc<any>(propertyDocRef);

  const marketReportQuery = useMemoFirebase(
    () => (firestore && property?.localizacao.bairro 
      ? query(collection(firestore, 'marketReports'), orderBy('month', 'desc'), limit(1))
      : null),
    [firestore, property?.localizacao.bairro]
  );
  const { data: latestReports, isLoading: isMarketLoading } = useCollection<any>(marketReportQuery);

  const neighborhoodData = useMemo(() => {
    if (!latestReports || latestReports.length === 0 || !property) return null;
    const report = latestReports[0];
    return report.topNeighborhoods?.find((nb: any) => 
      nb.name.toLowerCase() === property.localizacao.bairro.toLowerCase()
    );
  }, [latestReports, property]);

  const propertyPricePerM2 = useMemo(() => {
    if (!property?.informacoesbasicas.valor || !property?.caracteristicasimovel.tamanho) return 0;
    
    const sizeStr = property.caracteristicasimovel.tamanho
      .replace(/\./g, '')
      .replace(',', '.');
      
    const matches = sizeStr.match(/(\d+(?:\.\d+)?)/);
    const area = matches ? parseFloat(matches[0]) : 0;
    
    return area > 0 ? property.informacoesbasicas.valor / area : 0;
  }, [property]);

  useEffect(() => {
    async function triggerAnalysis() {
      if (!property || !neighborhoodData || propertyPricePerM2 === 0 || !firestore) return;
      
      setIsGenerating(true);
      try {
        const currentPrice = property.informacoesbasicas.valor;
        const currentMarketReportId = latestReports[0].id;
        
        // 1. Check for Cached Analysis
        const analysisCacheRef = doc(firestore, 'propertyAnalyses', id);
        const cacheSnap = await getDoc(analysisCacheRef);
        
        if (cacheSnap.exists()) {
          const cacheData = cacheSnap.data();
          const cachedAt = cacheData.cachedAt as Timestamp;
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const isExpired = cachedAt.toDate() < sevenDaysAgo;
          const hasPriceChanged = cacheData.lastPropertyPrice !== currentPrice;
          const hasNewMarketData = cacheData.lastMarketReportId !== currentMarketReportId;
          
          if (!isExpired && !hasPriceChanged && !hasNewMarketData) {
            console.log("Using cached analysis for property:", id);
            setAnalysis(cacheData.result);
            setIsGenerating(false);
            return;
          }
          console.log("Cache invalid or expired. Re-generating...");
        }

        // 2. Generate New Analysis
        const result = await generatePropertyInvestmentAnalysis({
          propertyName: property.informacoesbasicas.nome,
          propertyPricePerM2: Math.round(propertyPricePerM2),
          neighborhoodName: property.localizacao.bairro,
          neighborhoodAvgPricePerM2: neighborhoodData.price,
          neighborhoodYearlyVariation: neighborhoodData.variation
        });

        // 3. Update Cache
        setDocumentNonBlocking(analysisCacheRef, {
          propertyId: id,
          result: result,
          cachedAt: serverTimestamp(),
          lastPropertyPrice: currentPrice,
          lastMarketReportId: currentMarketReportId
        }, { merge: true });

        setAnalysis(result);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Erro na IA", description: "Não foi possível gerar a análise estratégica." });
      } finally {
        setIsGenerating(false);
      }
    }

    if (!isPropertyLoading && !isMarketLoading && property && neighborhoodData) {
        triggerAnalysis();
    }
  }, [property, neighborhoodData, propertyPricePerM2, isPropertyLoading, isMarketLoading, toast, firestore, id, latestReports]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  if (isPropertyLoading || isMarketLoading || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Processando Inteligência</h2>
          <p className="text-slate-500 italic">Cruzando dados do empreendimento com tendências de mercado...</p>
        </div>
      </div>
    );
  }

  if (!analysis || !property || !neighborhoodData) {
      return (
        <div className="p-20 text-center space-y-4">
            <h2 className="text-xl font-bold">Dados insuficientes para análise</h2>
            <Button onClick={() => router.back()} variant="outline">Voltar</Button>
        </div>
      );
  }

  // Escala para o gráfico de barras
  const maxScale = Math.max(analysis.benchmark.propertyReturn, analysis.benchmark.cdi, analysis.benchmark.ibovespa, 20);

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 text-left">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span>Inteligência</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Análise de Ativo</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">{property.localizacao.bairro}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {property.informacoesbasicas.nome} <span className="text-slate-300 ml-2">{property.localizacao.bairro}</span>
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl font-medium">Relatório estratégico de viabilidade e inteligência preditiva de mercado para investidores de alta performance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-xl border-2 border-slate-200 font-bold hover:bg-slate-50">
            <Share2 className="size-4 mr-2" /> Compartilhar
          </Button>
          <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-bold border-none hover:bg-black transition-all">
            <Download className="size-4 mr-2" /> Baixar PDF
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* CRITICAL ALERT CARD */}
        <div className={cn(
          "md:col-span-8 rounded-2xl p-8 border flex flex-col justify-between overflow-hidden relative",
          analysis.criticalAnalysis.isAnomaly ? "bg-red-50/50 border-red-200" : "bg-primary/5 border-primary/20"
        )}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertTriangle className={cn("size-32", analysis.criticalAnalysis.isAnomaly ? "text-red-500" : "text-primary")} />
          </div>
          <div className="relative z-10">
            <div className={cn("flex items-center gap-2 font-black text-lg mb-8 uppercase tracking-tight", analysis.criticalAnalysis.isAnomaly ? "text-red-600" : "text-primary-hover")}>
              {analysis.criticalAnalysis.isAnomaly ? <AlertTriangle className="size-5" /> : <Zap className="size-5" />}
              {analysis.criticalAnalysis.isAnomaly ? 'Destaque Crítico: Anomalia Detectada' : 'Posicionamento de Mercado'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Preço do Ativo</p>
                <p className={cn("text-4xl font-black tracking-tighter", analysis.criticalAnalysis.isAnomaly ? "text-red-600" : "text-slate-900")}>
                  R$ {formatBRL(propertyPricePerM2)}/m²
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Média {property.localizacao.bairro}</p>
                <p className="text-4xl font-black tracking-tighter text-slate-900">
                  R$ {formatBRL(neighborhoodData.price)}/m²
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-100 shadow-sm relative z-10 text-left">
            <p className="text-slate-700 font-medium leading-relaxed">
              <span className="font-black uppercase text-[10px] text-slate-400 block mb-2 tracking-widest">Análise do Consultor:</span>
              {analysis.criticalAnalysis.analysisText}
            </p>
          </div>
        </div>

        {/* TREND CARD */}
        <div className="md:col-span-4 bg-white rounded-2xl p-8 shadow-soft border border-slate-100 flex flex-col justify-between group hover:border-primary transition-all duration-500 text-left">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Tendência 12 Meses</h3>
              <Badge className="bg-primary/20 text-green-700 border-none font-black text-[10px] px-3 py-1">
                +{neighborhoodData.variation}%
              </Badge>
            </div>
            <div className="space-y-6">
              <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{property.localizacao.bairro}</p>
              <div className="h-32 flex items-end gap-1.5">
                <div className="flex-1 bg-slate-100 h-[40%] rounded-t-lg transition-all group-hover:h-[45%] duration-700"></div>
                <div className="flex-1 bg-slate-100 h-[55%] rounded-t-lg transition-all group-hover:h-[60%] duration-700"></div>
                <div className="flex-1 bg-slate-100 h-[45%] rounded-t-lg transition-all group-hover:h-[50%] duration-700"></div>
                <div className="flex-1 bg-slate-100 h-[65%] rounded-t-lg transition-all group-hover:h-[70%] duration-700"></div>
                <div className="flex-1 bg-slate-100 h-[75%] rounded-t-lg transition-all group-hover:h-[80%] duration-700"></div>
                <div className="flex-1 bg-primary h-[90%] rounded-t-lg shadow-glow"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-8 border-t border-slate-50 pt-4">
            {analysis.trend.description}
          </p>
        </div>

        {/* PROJECTION CARDS */}
        <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-8 rounded-2xl border-l-4 border-primary shadow-soft hover:shadow-glow transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Projeção 6 Meses</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">+{analysis.projections.sixMonths.toFixed(2)}%</span>
              <TrendingUp className="text-primary size-5" />
            </div>
            <p className="text-xs text-slate-500 mt-3 italic font-medium leading-relaxed">
              {analysis.projections.descriptions.sixMonths}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border-l-4 border-primary shadow-soft hover:shadow-glow transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Projeção 1 Ano</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">+{analysis.projections.oneYear.toFixed(2)}%</span>
              <TrendingUp className="text-primary size-5" />
            </div>
            <p className="text-xs text-slate-500 mt-3 italic font-medium leading-relaxed">
              {analysis.projections.descriptions.oneYear}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border-l-4 border-primary shadow-soft hover:shadow-glow transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Projeção 2 Anos</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">+{analysis.projections.twoYears.toFixed(2)}%</span>
              <TrendingUp className="text-primary size-5" />
            </div>
            <p className="text-xs text-slate-500 mt-3 italic font-medium leading-relaxed">
              {analysis.projections.descriptions.twoYears}
            </p>
          </div>
        </div>

        {/* BENCHMARK SECTION */}
        <div className="md:col-span-12 bg-slate-950 p-8 lg:p-12 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl text-left border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] -mr-48 -mt-48"></div>
          
          <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
            {/* Left Content */}
            <div className="lg:w-2/5 flex flex-col justify-center">
              <h2 className="text-4xl font-black text-primary mb-6 uppercase tracking-tighter leading-tight">
                Benchmark de Investimento
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-12 max-w-sm">
                Comparativo de retorno anualizado (a.a.) entre este ativo e os principais indicadores do mercado financeiro nacional.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-5 group">
                  <div className="size-4 rounded-full bg-primary shadow-glow transition-transform group-hover:scale-125"></div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">Retorno Total Ativo</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{analysis.benchmark.propertyReturn.toFixed(1)}%</span>
                      <span className="text-xs font-bold text-slate-500">a.a.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className="size-4 rounded-full bg-slate-600 transition-transform group-hover:scale-125"></div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">CDI Estimado</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{analysis.benchmark.cdi.toFixed(1)}%</span>
                      <span className="text-xs font-bold text-slate-500">a.a.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className="size-4 rounded-full bg-slate-800 transition-transform group-hover:scale-125"></div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">Ibovespa Médio</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{analysis.benchmark.ibovespa.toFixed(1)}%</span>
                      <span className="text-xs font-bold text-slate-500">a.a.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Chart Area */}
            <div className="flex-1 bg-[#111418] rounded-[2rem] p-8 lg:p-12 relative min-h-[420px] flex items-end justify-around border border-white/5 shadow-inner">
              {/* Bars */}
              <div className="flex flex-col items-center gap-5 w-full group">
                <div 
                    className="w-20 bg-primary rounded-t-xl transition-all duration-700 group-hover:brightness-110 shadow-glow" 
                    style={{ height: `${(analysis.benchmark.propertyReturn / maxScale) * 100}%`, minHeight: '40px' }}
                ></div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">ATIVO</span>
              </div>
              <div className="flex flex-col items-center gap-5 w-full group">
                <div 
                    className="w-20 bg-slate-600 rounded-t-xl transition-all duration-700 group-hover:bg-slate-500" 
                    style={{ height: `${(analysis.benchmark.cdi / maxScale) * 100}%`, minHeight: '40px' }}
                ></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">CDI</span>
              </div>
              <div className="flex flex-col items-center gap-5 w-full group">
                <div 
                    className="w-20 bg-slate-800 rounded-t-xl transition-all duration-700 group-hover:bg-slate-700" 
                    style={{ height: `${(analysis.benchmark.ibovespa / maxScale) * 100}%`, minHeight: '40px' }}
                ></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">IBOV</span>
              </div>
              
              {/* Floating Breakdown Card */}
              <div className="absolute top-10 right-10 bg-black/80 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-[220px] text-left">
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-4">Breakdown Real</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold gap-4">
                    <span className="text-slate-400">Valorização:</span> 
                    <span className="text-white">+{analysis.benchmark.appreciation.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold gap-4">
                    <span className="text-slate-400">Yield (Aluguel):</span> 
                    <span className="text-white">+{analysis.benchmark.yield.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STRATEGIC VERDICT PANEL */}
        <div className="md:col-span-12 bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-soft border border-slate-100 relative overflow-hidden group text-left mt-6">
          <div className="absolute -right-20 -bottom-20 size-80 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors duration-1000"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-primary text-[10px] font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-[0.2em] shadow-lg">
                Veredito Estratégico
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
                Recomendação: <span className="text-primary-hover italic">{analysis.verdict.status}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-8">
                <div className="space-y-3 text-left">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                    <ShieldCheck className="text-primary size-5" />
                    Proteção de Capital
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{analysis.verdict.protection}</p>
                </div>
                <div className="space-y-3 text-left">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                    <Zap className="text-primary size-5" />
                    Potencial de Ganho
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{analysis.verdict.gainPotential}</p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-auto shrink-0">
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center max-w-[320px] mx-auto shadow-sm group-hover:shadow-md transition-all">
                <CheckCircle2 className="size-12 text-slate-900 dark:text-primary mb-4" />
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase mb-4 tracking-tighter">Ação Necessária</p>
                <p className="text-[11px] text-slate-500 font-bold mb-8 leading-relaxed uppercase tracking-tight">
                  {analysis.verdict.actionNeeded}
                </p>
                <Button className="w-full bg-primary hover:bg-primary-hover text-slate-950 font-black h-14 rounded-xl shadow-glow transition-all uppercase text-xs tracking-widest border-none">
                  Confirmar Dados
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
