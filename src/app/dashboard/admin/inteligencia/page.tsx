
'use client';

import React, { useState, useMemo } from 'react';
import { useFirebase, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { analyzeMarketReport } from '@/ai/flows/analyze-market-report-flow';
import { Loader2, Upload, TrendingUp, ChevronRight, Trash2, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export default function AdminInteligenciaPage() {
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [monthYear, setMonthYear] = useState(format(new Date(), 'yyyy-MM'));
  const [reportToDelete, setReportToDelete] = useState<any>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const reportsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'marketReports'), orderBy('month', 'desc')) : null),
    [firestore]
  );
  const { data: reports, isLoading } = useCollection<any>(reportsQuery);

  const { paginatedReports, totalPages } = useMemo(() => {
    if (!reports) return { paginatedReports: [], totalPages: 1 };
    const total = Math.ceil(reports.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      paginatedReports: reports.slice(start, end),
      totalPages: total || 1
    };
  }, [reports, currentPage]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !storage || !firestore) return;

    setIsAnalyzing(true);
    toast({ title: "Iniciando análise...", description: "A IA está interpretando o relatório e extraindo dados fundamentais. Aguarde." });

    try {
      // 1. Convert file to base64 for AI analysis
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const photoDataUri = await base64Promise;

      // 2. Call AI Flow
      const analysis = await analyzeMarketReport({
        photoDataUri,
        monthYear: format(parseISO(`${monthYear}-01`), 'MMMM yyyy', { locale: ptBR })
      });

      // 3. Upload image to Storage
      const fileId = uuidv4();
      const sRef = ref(storage, `market-reports/${fileId}-${file.name}`);
      const uploadTask = await uploadBytesResumable(sRef, file);
      const imageUrl = await getDownloadURL(uploadTask.ref);

      // 4. Save to Firestore
      await addDocumentNonBlocking(collection(firestore, 'marketReports'), {
        month: monthYear,
        imageUrl,
        avgPricePerM2: analysis.avgPricePerM2,
        monthlyVariation: analysis.monthlyVariation,
        yearlyVariation: analysis.yearlyVariation,
        numHouseholds: analysis.numHouseholds || null,
        numApartments: analysis.numApartments || null,
        residentPopulation: analysis.residentPopulation || null,
        avgHouseholdIncome: analysis.avgHouseholdIncome || null,
        topNeighborhoods: analysis.topNeighborhoods,
        aiInsights: analysis.salesInsights,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Relatório Processado!", description: "Os dados e insights foram salvos com sucesso." });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('report-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setCurrentPage(1); // Go back to first page to see the new report
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro no processamento", description: "Não foi possível analisar a imagem. Verifique o formato." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteReport = () => {
    if (!reportToDelete || !firestore) return;

    try {
      const docRef = doc(firestore, 'marketReports', reportToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Relatório excluído",
        description: `O relatório de ${format(parseISO(`${reportToDelete.month}-01`), 'MMMM yyyy', { locale: ptBR })} foi removido.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível remover o relatório selecionado."
      });
    } finally {
      setReportToDelete(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-8 text-left">
      <div className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestão de BI de Mercado</h1>
        <p className="text-slate-500 mt-1">Faça o upload do relatório mensal (FipeZAP) para alimentar a Inteligência de Mercado da rede.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-left">
            <Upload className="size-5" /> Novo Relatório Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-2 w-full text-left">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mês de Referência</label>
              <Input 
                type="month" 
                value={monthYear} 
                onChange={(e) => setMonthYear(e.target.value)}
                className="h-12 bg-white rounded-xl border-slate-200"
              />
            </div>
            <div className="flex-1 space-y-2 w-full text-left">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Imagem do Relatório</label>
              <Input 
                id="report-file"
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="h-12 bg-white pt-2.5 rounded-xl border-slate-200"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!file || isAnalyzing}
              className="h-12 px-8 bg-slate-900 text-white font-bold hover:bg-black rounded-xl border-none shadow-lg shadow-black/10"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Analisando via IA...
                </>
              ) : 'Processar Relatório'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-left">
            <TrendingUp className="size-5 text-primary" /> Histórico de Relatórios
          </h2>
          {!isLoading && reports && reports.length > 0 && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total: {reports.length}
            </span>
          )}
        </div>
        
        {isLoading ? (
          <p className="text-left italic text-slate-400">Carregando histórico...</p>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedReports?.map((report: any) => (
                <div key={report.id} className="relative group">
                  <Link href={`/dashboard/mercado/${report.id}`}>
                    <Card className="overflow-hidden hover:border-primary transition-all duration-300 group border-slate-100 shadow-soft">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-48 h-32 relative bg-slate-100 flex-shrink-0 overflow-hidden">
                          <Image src={report.imageUrl} alt={report.month} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-center text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg capitalize text-slate-900">
                                {format(parseISO(`${report.month}-01`), 'MMMM yyyy', { locale: ptBR })}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium mt-1">Processado em {format(new Date(report.createdAt), 'dd/MM/yyyy')}</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div className="hidden sm:block text-right mr-3">
                                <p className="text-xl font-black text-slate-900">R$ {report.avgPricePerM2?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²</p>
                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">+{report.yearlyVariation}% (12 meses)</p>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReportToDelete(report);
                                }}
                                className="size-10 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                title="Excluir relatório"
                              >
                                <Trash2 className="size-4" />
                              </button>

                              <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-black transition-all">
                                 <ChevronRight className="size-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              ))}
              {!isLoading && reports?.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-slate-400 italic">Nenhum relatório cadastrado.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "size-10 rounded-xl font-bold",
                      currentPage === page ? "bg-primary text-slate-900" : "text-slate-500"
                    )}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-xl"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados extraídos deste relatório serão removidos permanentemente da Inteligência de Mercado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
