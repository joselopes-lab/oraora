'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getBrokerPriceTablesAction, getPriceTablePdfUrlServer } from '@/app/dashboard/construtoras/tabelas.actions.server';
import PriceTableViewer from '@/components/PriceTableViewer';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Search, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth, useUser } from '@/firebase';

function formatDate(dateInput: any): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput).substring(0, 10);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return String(dateInput).substring(0, 10);
  }
}

function getRelativeTimeString(dateInput: any): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Atualizada hoje';
    if (diffDays === 1) return 'Atualizada ontem';
    if (diffDays > 1 && diffDays < 30) return `Atualizada há ${diffDays} dias`;
    if (diffDays >= 30) {
      const diffMonths = Math.floor(diffDays / 30);
      return diffMonths === 1 ? 'Atualizada há 1 mês' : `Atualizada há ${diffMonths} meses`;
    }
    return '';
  } catch (e) {
    return '';
  }
}

export default function BrokerPriceTablesPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTables() {
      if (!user || isUserLoading) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const idToken = await user.getIdToken();
        const res = await getBrokerPriceTablesAction({ idToken });
        setTablesList(res.tables || []);
      } catch (err: any) {
        console.error('Error loading broker price tables:', err);
        setError(err.message || 'Erro ao carregar tabelas de preços.');
      } finally {
        setLoading(false);
      }
    }
    loadTables();
  }, [user, isUserLoading]);

  const handleViewPdf = async (table: any) => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }
    if (!table.sourceFile?.storagePath) {
      toast({ title: 'Aviso', description: 'Esta tabela não possui PDF anexado.', variant: 'default' });
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const res = await getPriceTablePdfUrlServer({ priceTableId: table.id, idToken });
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        toast({ title: 'Erro ao abrir PDF', description: res.error || 'Não foi possível gerar o link do documento.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const filteredTables = tablesList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchName = item.table?.name?.toLowerCase().includes(term);
    const matchProp = item.propertyName?.toLowerCase().includes(term);
    const matchConst = item.constructorName?.toLowerCase().includes(term);
    return matchName || matchProp || matchConst;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin size-8 text-primary" />
        <p className="text-sm font-medium text-slate-500">Carregando tabelas de preços autorizadas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-800 space-y-2">
          <h2 className="text-lg font-bold">Não foi possível carregar as tabelas</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-black text-primary uppercase tracking-widest block mb-1">Área Comercial do Corretor</span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tabelas de Preços</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Consulte as tabelas comerciais e histórico de preços dos imóveis e empreendimentos da sua carteira.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 text-xs font-bold bg-primary/5 text-primary border-primary/20">
            {tablesList.length} Tabela(s) Disponível(is)
          </Badge>
        </div>
      </div>

      {selectedTable ? (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedTable(null)} className="rounded-xl font-bold">
            ← Voltar para a lista de tabelas
          </Button>
          <PriceTableViewer priceTableInfo={{ table: selectedTable.table, constructorName: selectedTable.constructorName, propertyName: selectedTable.propertyName }} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft">
            <Search className="size-5 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Buscar por nome da tabela, imóvel ou construtora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
            />
          </div>

          {filteredTables.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <FileText className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhuma tabela de preços encontrada</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Você não possui imóveis com tabelas de preços associadas em sua carteira ou portfólio no momento.</p>
              <Button asChild className="rounded-xl font-bold mt-2">
                <Link href="/dashboard/minha-carteira">Ver Minha Carteira</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTables.map((item) => {
                const { table, currentVersion, constructorName, propertyName } = item;
                return (
                  <div key={table.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between hover:border-primary/50 transition-all group">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600">
                          {constructorName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">
                          {table.status === 'active' ? 'Ativa' : table.status}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-1">{propertyName}</span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">{table.name}</h3>
                      </div>

                      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 p-4 rounded-2xl space-y-0.5">
                        <span className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest">
                          <Calendar className="size-3.5" /> Data da Tabela
                        </span>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatDate(table.createdAt || table.updatedAt)}
                        </p>
                        {getRelativeTimeString(table.createdAt || table.updatedAt) && (
                          <p className="text-xs text-slate-500 font-medium pt-0.5">
                            {getRelativeTimeString(table.createdAt || table.updatedAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <FileText className="size-3.5 text-slate-400" /> Documento PDF
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {table.sourceFile?.fileName || 'Disponível'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end mt-4">
                      <Button
                        onClick={() => handleViewPdf(table)}
                        size="sm"
                        className="rounded-xl font-bold gap-1.5 w-full"
                      >
                        Ver Tabela <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
