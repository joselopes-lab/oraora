'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown,
  ArrowLeft, 
  Zap, 
  Calendar,
  FileText,
  Download,
  Share2,
  Quote,
  ArrowUpRight,
  Users,
  Home,
  Building,
  Coins,
  MapPin,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function MarketReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const firestore = useFirestore();

  const reportRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'marketReports', id) : null),
    [firestore, id]
  );
  const { data: report, isLoading } = useDoc<any>(reportRef);

  /**
   * Processa o markdown garantindo que quebras de linha simples virem duplas
   * para forçar a criação de parágrafos no ReactMarkdown.
   */
  const formatMarkdown = (text: string | undefined) => {
    if (!text) return '';
    // Substitui quebras de linha simples que não sejam seguidas por outra quebra de linha
    return text.replace(/\n(?!\n)/g, '\n\n');
  };

  if (isLoading) return <div className="p-10 text-center italic text-slate-500">Carregando análise detalhada...</div>;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Relatório não encontrado</h2>
        <Button onClick={() => router.back()} variant="outline">Voltar</Button>
      </div>
    );
  }

  const reportDate = format(parseISO(`${report.month}-01`), 'MMMM yyyy', { locale: ptBR });
  const sortedNeighborhoods = report.topNeighborhoods?.sort((a: any, b: any) => b.price - a.price) || [];

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-left">
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            <Link className="hover:text-primary transition-colors" href="/dashboard/mercado">Inteligência</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-900 uppercase font-black">Dossiê Detalhado</span>
          </nav>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="size-10 rounded-full hover:bg-slate-100">
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Relatório de {reportDate}
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 font-bold text-slate-600">
            <Share2 className="size-4 mr-2" /> Compartilhar
          </Button>
          <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-bold border-none hover:bg-black">
            <Download className="size-4 mr-2" /> Baixar PDF
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Preço Médio Global</span>
                <div className="text-3xl font-black text-slate-900">R$ {report.avgPricePerM2?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²</div>
                <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="size-3" /> +{report.monthlyVariation}% no mês
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-100 bg-white">
              <CardContent className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Var. 12 Meses</span>
                <div className="text-3xl font-black text-slate-900">+{report.yearlyVariation}%</div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                   <ArrowUpRight className="size-3" /> Valorização consolidada
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-100 bg-white">
              <CardContent className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Processado em</span>
                <div className="text-xl font-bold text-slate-900">{format(new Date(report.createdAt), 'dd/MM/yyyy')}</div>
                <p className="text-xs text-slate-500 mt-2">Via IA Oraora</p>
              </CardContent>
            </Card>
          </div>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                    <MapPin className="size-5 text-primary" /> Análise Completa por Bairro
                </h3>
                <Badge variant="outline" className="bg-white font-bold">{sortedNeighborhoods.length} Regiões Monitoradas</Badge>
            </div>
            <div className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/30">
                        <TableRow>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest pl-6">Bairro</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Preço m²</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Variação</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest pr-6">Representatividade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedNeighborhoods.map((nb: any, i: number) => (
                            <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-bold text-slate-900 pl-6 uppercase tracking-tight">{nb.name}</TableCell>
                                <TableCell className={cn("font-black", i === 0 ? "text-[#2bf20d]" : "text-slate-900")}>R$ {nb.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²</TableCell>
                                <TableCell>
                                    <span className={cn("inline-flex items-center gap-1 font-bold text-xs", nb.variation >= 0 ? "text-green-600" : "text-red-600")}>
                                        {nb.variation >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                        {nb.variation}%
                                    </span>
                                </TableCell>
                                <TableCell className="pr-6 w-48">
                                    <Progress 
                                        value={Math.min(100, (nb.price / sortedNeighborhoods[0].price) * 100)} 
                                        className="h-2 rounded-none" 
                                        style={{
                                            '--progress-background': i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#2bf20d'
                                        } as any}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </section>

          <Card className="shadow-soft border-primary/30 overflow-hidden bg-white">
            <div className="bg-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="size-6 text-slate-900 fill-current" />
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Insights & Scripts Recomendados</h3>
              </div>
              <Badge className="bg-slate-950 text-primary border-none font-bold text-[10px] uppercase px-3 py-1">AI Powered</Badge>
            </div>
            <CardContent className="p-8 md:p-10 bg-white">
              <div className="prose prose-slate max-w-none text-left">
                <ReactMarkdown
                  components={{
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3" {...props}>
                        <div className="h-8 w-1.5 bg-primary rounded-full"></div>
                        {props.children}
                      </h3>
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-slate-600 leading-relaxed text-base font-normal mb-8 last:mb-0" {...props} />
                    ),
                    strong: ({ children }) => (
                      <span className="font-normal text-slate-700">{children}</span>
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 list-none p-0" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-primary/30 transition-all m-0" {...props}>
                        <Sparkles className="size-4 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-normal text-slate-700">{props.children}</span>
                      </li>
                    ),
                    blockquote: ({ node, ...props }) => (
                      <div className="relative my-10 group text-left">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <blockquote className="relative not-italic bg-slate-900 border-l-8 border-primary p-8 rounded-2xl shadow-xl" {...props}>
                            <div className="flex items-center justify-between mb-4 text-primary">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="size-5 fill-primary/20" />
                                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Roteiro de Venda</span>
                                </div>
                                <Quote className="size-6 opacity-20 fill-current" />
                            </div>
                            <div className="text-slate-100 text-lg leading-relaxed font-normal">
                                {props.children}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button variant="link" className="text-primary text-[10px] font-black uppercase tracking-widest p-0 h-auto gap-2 hover:no-underline">
                                  <span className="material-symbols-outlined text-sm">content_copy</span>
                                  Copiar Script
                                </Button>
                            </div>
                        </blockquote>
                      </div>
                    ),
                  }}
                >
                  {formatMarkdown(report.aiInsights)}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 text-left">
          <Card className="bg-slate-50 border-slate-100 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-slate-200 font-bold text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FileText className="size-4" /> Fonte Original do Relatório
            </div>
            <div className="relative aspect-[3/4] w-full group cursor-zoom-in">
              <Image src={report.imageUrl} alt="Relatório Original" fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <Button variant="secondary" className="font-bold text-xs shadow-xl" asChild>
                  <a href={report.imageUrl} target="_blank" rel="noreferrer">Expandir Imagem</a>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 size-32 bg-primary blur-[60px] opacity-20"></div>
             <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <Zap className="size-5 text-primary" /> Resumo Estratégico
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-normal">
                    Este relatório consolida os dados de {reportDate}. A tendência geral é de {report.monthlyVariation >= 0 ? 'ALTA' : 'BAIXA'}, impactando diretamente a liquidez de novos lançamentos.
                </p>
                <div className="space-y-3">
                    <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                        <span className="text-slate-500 font-bold uppercase tracking-widest">Mês de Referência</span>
                        <span className="font-bold text-white uppercase">{format(parseISO(`${report.month}-01`), 'MMMM', { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                        <span className="text-slate-500 font-bold uppercase tracking-widest">Bairro de Topo</span>
                        <span className="font-bold text-primary">{sortedNeighborhoods[0]?.name || 'N/A'}</span>
                    </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
