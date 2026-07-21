
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileJson, Upload, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PropertyImport {
  title?: string;
  nome?: string;
  cidade?: string;
  city?: string;
  preco?: string | number;
  price?: string | number;
  valor?: string | number;
  salePrice?: string | number;
  quartos?: string | number;
  dormitorios?: string | number;
  bedrooms?: string | number;
  [key: string]: any;
}

export default function ImportPropertiesPage() {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; count: number } | null>(null);
  const [properties, setProperties] = useState<PropertyImport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setFileInfo(null);
    setProperties([]);

    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError("Por favor, selecione um arquivo JSON válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          setError("O conteúdo do JSON deve ser um array de imóveis.");
          return;
        }

        setProperties(parsed);
        setFileInfo({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
          count: parsed.length
        });
      } catch (err) {
        setError("Erro ao processar o arquivo JSON. Verifique a formatação.");
      }
    };
    reader.readAsText(file);
  };

  const getVal = (prop: PropertyImport, keys: string[]) => {
    for (const key of keys) {
      if (prop[key] !== undefined && prop[key] !== null) return prop[key];
    }
    // Fallback for nested objects if present in JSON
    if (prop.informacoesbasicas) {
        for (const key of keys) if (prop.informacoesbasicas[key] !== undefined) return prop.informacoesbasicas[key];
    }
    return "-";
  };

  const handleImport = async () => {
    if (!firestore || !user) return;
    setIsImporting(true);
    
    try {
      const colRef = collection(firestore, 'brokerProperties');
      
      for (const prop of properties) {
        // Map common fields to our schema
        const dataToSave = {
          brokerId: user.uid,
          builderId: user.uid, // Mark as self-owned
          inPortfolio: false, // Default: not in portfolio
          isVisibleOnSite: false, 
          createdAt: serverTimestamp(),
          informacoesbasicas: {
            nome: getVal(prop, ['title', 'nome', 'name']),
            valor: parseFloat(String(getVal(prop, ['price', 'preco', 'valor', 'salePrice'])).replace(/[^\d.-]/g, '')) || 0,
            status: 'Pronto para Morar',
            descricao: prop.description || prop.descricao || ''
          },
          localizacao: {
            cidade: getVal(prop, ['city', 'cidade']),
            estado: getVal(prop, ['state', 'estado']),
            bairro: getVal(prop, ['neighborhood', 'bairro']),
            address: getVal(prop, ['address', 'endereco'])
          },
          caracteristicasimovel: {
            quartos: String(getVal(prop, ['bedrooms', 'quartos', 'dormitorios'])),
            tipo: prop.type || prop.tipo || 'Apartamento',
            tamanho: prop.area || prop.tamanho || '-'
          },
          midia: prop.images || prop.midia || []
        };
        
        await addDocumentNonBlocking(colRef, dataToSave);
      }

      toast({
        title: "Sucesso!",
        description: `${properties.length} imóveis importados com sucesso.`,
      });
      router.push('/dashboard/imoveis');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: "Ocorreu um erro ao salvar os imóveis no banco.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-6xl text-left">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <Button asChild variant="ghost" className="mb-4 -ml-4 text-slate-500 font-bold uppercase tracking-widest text-[10px] gap-2">
                <Link href="/dashboard/imoveis"><ArrowLeft className="size-3" /> Voltar para Imóveis</Link>
            </Button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Importar Imóveis JSON</h1>
            <p className="text-slate-500">Selecione o arquivo e revise os dados antes de confirmar a entrada no sistema.</p>
        </div>
        {properties.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting} className="bg-primary hover:bg-primary-hover text-black font-black uppercase tracking-widest px-8 h-12 shadow-glow">
                {isImporting ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                {isImporting ? 'Importando...' : 'Confirmar Importação'}
            </Button>
        )}
      </div>

      {!fileInfo ? (
        <Card className="mb-8 border-dashed border-2 py-12">
            <CardContent>
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="bg-primary/10 p-6 rounded-full">
                <FileJson className="w-12 h-12 text-primary" />
                </div>
                <div className="text-center">
                <h3 className="text-xl font-bold">Selecionar Arquivo</h3>
                <p className="text-sm text-muted-foreground">Arraste ou clique para selecionar seu arquivo .json</p>
                </div>
                <Input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                />
                <Button 
                onClick={() => fileInputRef.current?.click()}
                className="font-bold gap-2 mt-2 h-12 px-8"
                >
                <Upload className="w-4 h-4" />
                Selecionar JSON
                </Button>
            </div>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-50 border-none shadow-none">
                <CardHeader className="pb-2">
                    <CardDescription className="font-bold uppercase text-[10px] tracking-widest">Arquivo</CardDescription>
                    <CardTitle className="text-lg truncate">{fileInfo.name}</CardTitle>
                </CardHeader>
            </Card>
            <Card className="bg-slate-50 border-none shadow-none">
                <CardHeader className="pb-2">
                    <CardDescription className="font-bold uppercase text-[10px] tracking-widest">Tamanho</CardDescription>
                    <CardTitle className="text-lg">{fileInfo.size}</CardTitle>
                </CardHeader>
            </Card>
            <Card className="bg-primary/10 border-none shadow-none relative overflow-hidden">
                <CardHeader className="pb-2">
                    <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-primary-hover">Registros</CardDescription>
                    <CardTitle className="text-lg">{fileInfo.count} imóveis</CardTitle>
                </CardHeader>
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10"><FileJson size={80} /></div>
            </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na validação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {properties.length > 0 && (
        <Card className="overflow-hidden border-slate-100 shadow-soft rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Pré-visualização dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 font-black uppercase text-[10px]">#</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Título</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Cidade</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Preço</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Dormitórios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-[10px] text-slate-400">{index + 1}</TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {getVal(prop, ['title', 'nome', 'name'])}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {getVal(prop, ['city', 'cidade'])}
                      </TableCell>
                      <TableCell className="text-green-700 font-bold">
                        {getVal(prop, ['price', 'preco', 'valor', 'salePrice'])}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {getVal(prop, ['bedrooms', 'quartos', 'dormitorios'])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {properties.length > 0 && (
          <div className="mt-8 flex justify-center pb-20">
             <Button variant="outline" onClick={() => { setProperties([]); setFileInfo(null); }} className="gap-2">
                 <ArrowLeft size={16} /> Trocar Arquivo
             </Button>
          </div>
      )}
    </main>
  );
}
