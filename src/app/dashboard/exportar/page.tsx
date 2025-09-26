
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { type Builder } from '../builders/page';
import { type Persona } from '../personas/page';
import { type Property } from '../properties/page';

interface ExportData {
    builders: Omit<Builder, 'id'>[];
    personas: Omit<Persona, 'id'>[];
    properties: Omit<Property, 'id' | 'personaIds'> & { personaNames?: string[] }[];
}

export default function ExportPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all collections
      const buildersSnapshot = await getDocs(collection(db, 'builders'));
      const personasSnapshot = await getDocs(collection(db, 'personas'));
      const propertiesSnapshot = await getDocs(collection(db, 'properties'));

      const builders = buildersSnapshot.docs.map(doc => {
          const { id, ...data } = doc.data() as Builder;
          return data;
      });
      const personas = personasSnapshot.docs.map(doc => {
          const { id, ...data } = doc.data() as Persona;
          return data;
      });
      
      const personaMap = new Map(personasSnapshot.docs.map(doc => [doc.id, doc.data().name]));

      const properties = propertiesSnapshot.docs.map(doc => {
          const { id, personaIds, ...data } = doc.data() as Property;
          const personaNames = personaIds?.map(pid => personaMap.get(pid)).filter(Boolean) as string[] | undefined;
          return { ...data, personaNames };
      });

      const exportData: ExportData = {
          builders,
          personas,
          properties,
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "dados_completos.json";
      link.click();

      toast({ title: 'Sucesso!', description: 'Seu arquivo de dados foi baixado.' });

    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({ variant: 'destructive', title: 'Erro na Exportação', description: 'Não foi possível gerar o arquivo. Tente novamente.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Faça o download de um arquivo JSON contendo todos os dados de construtoras, personas e imóveis cadastrados na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">Pronto para exportar?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Clique no botão abaixo para iniciar o download do arquivo `dados_completos.json`.
            </p>
            <Button onClick={handleExport} disabled={isExporting} className="mt-6" size="lg">
                {isExporting ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                {isExporting ? 'Exportando...' : 'Fazer Download dos Dados'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
