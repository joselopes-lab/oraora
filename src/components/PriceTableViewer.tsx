'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPriceTablePdfUrlServer } from '@/app/dashboard/construtoras/tabelas.actions.server';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2 } from 'lucide-react';

type PriceTableViewerProps = {
  priceTableInfo: {
    table: any;
    constructorName: string;
    propertyName: string;
  };
};

export default function PriceTableViewer({ priceTableInfo }: PriceTableViewerProps) {
  const { table, constructorName, propertyName } = priceTableInfo;
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const handleOpenPdf = async () => {
    if (!table.sourceFile?.storagePath) {
      toast({ title: 'Aviso', description: 'Esta tabela não possui PDF anexado.', variant: 'default' });
      return;
    }
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsOpeningPdf(true);
    try {
      const idToken = await user.getIdToken();
      const res = await getPriceTablePdfUrlServer({ priceTableId: table.id, idToken });
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        toast({ title: 'Erro ao abrir PDF', description: res.error || 'Não foi possível abrir este documento.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível carregar o PDF.', variant: 'destructive' });
    } finally {
      setIsOpeningPdf(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft text-left space-y-6 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Tabela Comercial Oficial</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{table.name}</h3>
          <p className="text-xs text-slate-500 font-medium">{constructorName} · {propertyName}</p>
        </div>
        <Button
          onClick={handleOpenPdf}
          disabled={isOpeningPdf}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl gap-2 shadow-sm"
        >
          {isOpeningPdf ? (
            <><Loader2 className="size-4 animate-spin" /> Carregando...</>
          ) : (
            <><FileText className="size-4" /> Visualizar PDF</>
          )}
        </Button>
      </div>
    </div>
  );
}
