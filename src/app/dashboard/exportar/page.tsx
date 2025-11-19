
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
import { Loader2, Download, Copy, Server, Building2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { type Builder } from '../builders/page';
import { type Persona } from '../personas/page';
import { type Property } from '../properties/page';
import { Input } from '@/components/ui/input';

interface ExportData {
    builders: Omit<Builder, 'id'>[];
    personas: Omit<Persona, 'id'>[];
    properties: Omit<Property, 'id' | 'personaIds'> & { personaNames?: string[] }[];
}

export default function ExportPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const propertiesApiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/properties` : '';
  const buildersApiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/builders` : '';


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

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
        toast({ title: 'Copiado!', description: 'O endereço da API foi copiado.' });
    }, () => {
        toast({ variant: 'destructive', title: 'Falha ao copiar.' });
    });
  };

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download />
              Exportar Arquivo JSON
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
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Server />
                    Endpoints de API
                </CardTitle>
                <CardDescription>
                    Use estes endereços para acessar os dados visíveis em formato JSON a partir de outros sites ou aplicações.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <h3 className="font-medium flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        API de Imóveis
                    </h3>
                    <div className="flex items-center gap-2">
                        <Input value={propertiesApiUrl} readOnly className="bg-muted" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(propertiesApiUrl)}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copiar endereço da API de imóveis</span>
                        </Button>
                    </div>
                </div>
                 <div>
                    <h3 className="font-medium flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        API de Construtoras
                    </h3>
                    <div className="flex items-center gap-2">
                        <Input value={buildersApiUrl} readOnly className="bg-muted" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(buildersApiUrl)}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copiar endereço da API de construtoras</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
