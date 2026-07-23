
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
import locationData from '@/lib/location-data.json';

interface PropertyImport {
  [key: string]: any;
}

// Helper: case & accent insensitive string normalization
function cleanString(str: any): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Helper: search raw property object or nested sub-objects for keys
function getRawVal(prop: any, keys: string[]): any {
  if (!prop || typeof prop !== 'object') return undefined;

  // 1. Direct key match on root object
  for (const k of keys) {
    if (prop[k] !== undefined && prop[k] !== null && prop[k] !== '') {
      return prop[k];
    }
  }

  // 2. Search in common nested sub-objects
  const subObjects = [
    prop.informacoesbasicas,
    prop.caracteristicasimovel,
    prop.localizacao,
    prop.location,
    prop.address,
    prop.endereco,
    prop.features,
    prop.caracteristicas,
    prop.details,
    prop.detalhes,
    prop.info,
    prop.dados,
    prop.specs,
    prop.media,
    prop.midia
  ];

  for (const sub of subObjects) {
    if (sub && typeof sub === 'object') {
      for (const k of keys) {
        if (sub[k] !== undefined && sub[k] !== null && sub[k] !== '') {
          return sub[k];
        }
      }
    }
  }

  // 3. Case-insensitive / snake_case fallback search on prop keys
  const propKeys = Object.keys(prop);
  for (const k of keys) {
    const cleanK = cleanString(k);
    const foundKey = propKeys.find(pk => cleanString(pk) === cleanK);
    if (foundKey && prop[foundKey] !== undefined && prop[foundKey] !== null && prop[foundKey] !== '') {
      return prop[foundKey];
    }
  }

  return undefined;
}

// Helper: parse string or number into clean numeric float
function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  if (!str) return 0;

  // Handle Brazilian monetary strings e.g. "R$ 1.250.000,00", "1.250.000,00" or "4.200.000"
  let cleanStr = str.replace(/[^\d.,]/g, '');
  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(',', '.');
  } else if ((cleanStr.match(/\./g) || []).length > 0) {
    cleanStr = cleanStr.replace(/\./g, '');
  }
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper: parse array of strings for rooms, suites, etc.
function parseArrayOfStrings(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(v => String(v).trim()).filter(Boolean);
  }
  if (val !== undefined && val !== null && val !== '') {
    const str = String(val).trim();
    if (str.includes(',')) {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [str];
  }
  return [];
}

// Helper: resolve Location state, city, neighborhood to match locationData cascade exactly
function resolveLocation(rawState?: any, rawCity?: any, rawNeighborhood?: any) {
  let matchedStateUf = '';
  let matchedCityName = '';
  let matchedNeighborhood = '';

  const stateStr = cleanString(rawState);
  const cityStr = cleanString(rawCity);
  const neighborhoodStr = cleanString(rawNeighborhood);

  // 1. Try to find state by UF or name in locationData
  let foundState = locationData.states.find(s => 
    cleanString(s.uf) === stateStr || cleanString(s.name) === stateStr
  );

  // 2. If state not provided or not matched, search all states for the city name
  if (!foundState && cityStr) {
    for (const s of locationData.states) {
      if (s.cities.some(c => cleanString(c.name) === cityStr)) {
        foundState = s;
        break;
      }
    }
  }

  if (foundState) {
    matchedStateUf = foundState.uf;

    if (cityStr) {
      const foundCity = foundState.cities.find(c => cleanString(c.name) === cityStr);
      if (foundCity) {
        matchedCityName = foundCity.name;

        if (neighborhoodStr) {
          const foundBairro = foundCity.neighborhoods.find(b => cleanString(b) === neighborhoodStr);
          matchedNeighborhood = foundBairro || String(rawNeighborhood).trim();
        }
      } else {
        matchedCityName = rawCity ? String(rawCity).trim() : '';
        matchedNeighborhood = rawNeighborhood ? String(rawNeighborhood).trim() : '';
      }
    }
  } else {
    matchedStateUf = rawState ? String(rawState).trim() : '';
    matchedCityName = rawCity ? String(rawCity).trim() : '';
    matchedNeighborhood = rawNeighborhood ? String(rawNeighborhood).trim() : '';
  }

  return {
    estado: matchedStateUf,
    cidade: matchedCityName,
    bairro: matchedNeighborhood
  };
}

// Helper: parse bedrooms, suites array into clean string[] without numeric expanding
function parseQuartos(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(v => String(v).trim()).filter(Boolean);
  }
  if (val !== undefined && val !== null && val !== '') {
    const str = String(val).trim();
    if (str.includes(',')) {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [str];
  }
  return [];
}

// Map a raw JSON property record into property-form.tsx schema
function mapPropertyRecord(prop: PropertyImport, transactionMode: 'sale' | 'rent' | 'both' = 'sale') {
  // Title / Name
  const nome = String(getRawVal(prop, ['nome', 'title', 'name', 'nomeImovel', 'propertyTitle', 'titulo']) || 'Imóvel Sem Nome');

  // Values & Transactions
  const valor = parseNumber(getRawVal(prop, ['valor', 'price', 'preco', 'referencePrice', 'valorReferencia']));
  const salePrice = parseNumber(getRawVal(prop, ['salePrice', 'valorVenda', 'precoVenda', 'preco_venda', 'valor_venda'])) || valor;
  const rentPrice = parseNumber(getRawVal(prop, ['rentPrice', 'valorAluguel', 'precoAluguel', 'aluguel', 'rent', 'valor_aluguel']));

  let transactionTypes: string[] = ['sale'];
  if (transactionMode === 'rent') {
    transactionTypes = ['rent'];
  } else if (transactionMode === 'both') {
    transactionTypes = ['sale', 'rent'];
  } else {
    transactionTypes = ['sale'];
  }

  // Condo & Taxes
  const condominio = parseNumber(getRawVal(prop, ['condominio', 'condominium', 'condoFee', 'valorCondominio', 'taxaCondominio', 'condo']));
  const iptu = parseNumber(getRawVal(prop, ['iptu', 'iptuPrice', 'valorIptu', 'taxaIptu', 'iptuAnual']));
  const nomeCondominio = String(getRawVal(prop, ['nomeCondominio', 'condominiumName', 'condoName', 'buildingName', 'nome_condominio']) || '');

  // Status, Descriptions & Options
  let status = String(getRawVal(prop, ['status', 'statusObra', 'stage', 'fase']) || 'Pronto para Morar');
  const statusLower = cleanString(status);
  if (statusLower.includes('lancament') || statusLower.includes('launch')) {
    status = 'Lançamento';
  } else if (statusLower.includes('construc') || statusLower.includes('construcao') || statusLower.includes('under')) {
    status = 'Em Construção';
  } else if (statusLower.includes('pronto') || statusLower.includes('ready')) {
    status = 'Pronto para Morar';
  }

  const descricao = String(getRawVal(prop, ['descricao', 'description', 'details', 'text', 'about', 'sobre', 'observacoes']) || '');
  const slogan = String(getRawVal(prop, ['slogan', 'subtitulo', 'subtitle', 'tagline']) || '');
  const previsaoentrega = String(getRawVal(prop, ['previsaoentrega', 'previsaoEntrega', 'deliveryDate', 'previsao']) || '');
  const exclusivo = Boolean(getRawVal(prop, ['exclusivo', 'exclusive', 'isExclusive']));

  // Location Mapping
  const rawState = getRawVal(prop, ['estado', 'state', 'uf']);
  const rawCity = getRawVal(prop, ['cidade', 'city', 'municipio']);
  const rawBairro = getRawVal(prop, ['bairro', 'neighborhood', 'district', 'suburb']);
  const locationResolved = resolveLocation(rawState, rawCity, rawBairro);

  const cep = String(getRawVal(prop, ['cep', 'zipCode', 'zipcode', 'postalCode']) || '');
  const address = String(getRawVal(prop, ['address', 'endereco', 'street', 'logradouro', 'rua', 'addressFull']) || '');
  const googleMapsLink = String(getRawVal(prop, ['googleMapsLink', 'mapsLink', 'mapUrl', 'googleMaps']) || '');
  const googleStreetViewLink = String(getRawVal(prop, ['googleStreetViewLink', 'streetViewLink', 'streetView']) || '');

  // Property Features
  let tipo = String(getRawVal(prop, ['tipo', 'type', 'propertyType', 'tipoImovel', 'category']) || 'Apartamento');
  const tipoLower = cleanString(tipo);
  if (tipoLower.includes('apto') || tipoLower.includes('apart')) tipo = 'Apartamento';
  else if (tipoLower.includes('casa') || tipoLower.includes('house') || tipoLower.includes('sobrado')) tipo = 'Casa';
  else if (tipoLower.includes('terreno') || tipoLower.includes('lote') || tipoLower.includes('land')) tipo = 'Terreno';
  else if (tipoLower.includes('cobertura') || tipoLower.includes('penthouse')) tipo = 'Cobertura';
  else if (tipoLower.includes('comercial') || tipoLower.includes('sala') || tipoLower.includes('loja') || tipoLower.includes('office')) tipo = 'Comercial';

  const tamanho = String(getRawVal(prop, ['tamanho', 'area', 'areaUtil', 'usefulArea', 'size', 'areaTotal', 'metragem', 'useful_area', 'total_area']) || '');
  const vagas = String(getRawVal(prop, ['vagas', 'vagasGaragem', 'garage', 'parkingSpots', 'garages', 'parking']) || '');
  const quartos = parseQuartos(getRawVal(prop, ['quartos', 'dormitorios', 'bedrooms', 'bedroomCount', 'roomCount', 'numQuartos', 'dormitoriosCount']));
  const suites = parseQuartos(getRawVal(prop, ['suites', 'suiteCount', 'numSuites', 'num_suites']));

  // Photos & Media
  let midia: string[] = [];
  const midiaVal = getRawVal(prop, ['midia', 'images', 'fotos', 'gallery', 'pictures', 'photos', 'imageUrls']);
  if (Array.isArray(midiaVal)) {
    midia = midiaVal.map(i => String(i)).filter(Boolean);
  } else if (typeof midiaVal === 'string' && midiaVal) {
    midia = [midiaVal];
  }

  // Common Areas / Amenities
  let areascomuns: string[] = [];
  const areasVal = getRawVal(prop, ['areascomuns', 'areasComuns', 'commonAreas', 'lazer', 'amenities', 'features', 'diferenciais', 'infraestrutura']);
  if (Array.isArray(areasVal)) {
    areascomuns = areasVal.map(a => String(a)).filter(Boolean);
  } else if (typeof areasVal === 'string' && areasVal) {
    areascomuns = areasVal.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Optional Video & Link
  const youtubeVideoUrl = String(getRawVal(prop, ['youtubeVideoUrl', 'youtube', 'videoUrl', 'video']) || '');
  const link = String(getRawVal(prop, ['link', 'url']) || '');

  return {
    informacoesbasicas: {
      nome,
      status,
      slogan,
      descricao,
      valor: valor || salePrice,
      salePrice,
      rentPrice,
      transactionTypes,
      condominio,
      iptu,
      nomeCondominio,
      exclusivo,
      previsaoentrega,
    },
    localizacao: {
      cep,
      estado: locationResolved.estado,
      cidade: locationResolved.cidade,
      bairro: locationResolved.bairro,
      address,
      googleMapsLink,
      googleStreetViewLink,
    },
    caracteristicasimovel: {
      tipo,
      quartos,
      suites,
      tamanho,
      vagas,
    },
    areascomuns,
    midia,
    youtubeVideoUrl,
    link,
    isVisibleOnSite: true,
  };
}

export default function ImportPropertiesPage() {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; count: number } | null>(null);
  const [properties, setProperties] = useState<PropertyImport[]>([]);
  const [transactionMode, setTransactionMode] = useState<'sale' | 'rent' | 'both'>('sale');
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
        const mapped = mapPropertyRecord(prop, transactionMode);
        const dataToSave = {
          brokerId: user.uid,
          builderId: user.uid, // Mark as self-owned
          inPortfolio: false, // Default: not in portfolio
          isVisibleOnSite: true, 
          createdAt: serverTimestamp(),
          ...mapped
        };
        
        await addDocumentNonBlocking(colRef, dataToSave);
      }

      toast({
        title: "Sucesso!",
        description: `${properties.length} imóveis importados com sucesso.`,
      });
      router.push('/dashboard/avulso');
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
        <>
          <Card className="mb-6 p-4 border-slate-200 bg-slate-50/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Tipo de Transação para Importação</h4>
                <p className="text-xs text-slate-500">Selecione a modalidade que será aplicada aos imóveis importados (sobrescreve a inferência):</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={transactionMode === 'sale' ? 'default' : 'outline'}
                  onClick={() => setTransactionMode('sale')}
                  className={`font-bold text-xs uppercase tracking-wider h-9 ${transactionMode === 'sale' ? 'bg-primary text-black hover:bg-primary-hover' : 'bg-white text-slate-700'}`}
                >
                  Venda
                </Button>
                <Button
                  type="button"
                  variant={transactionMode === 'rent' ? 'default' : 'outline'}
                  onClick={() => setTransactionMode('rent')}
                  className={`font-bold text-xs uppercase tracking-wider h-9 ${transactionMode === 'rent' ? 'bg-primary text-black hover:bg-primary-hover' : 'bg-white text-slate-700'}`}
                >
                  Aluguel
                </Button>
                <Button
                  type="button"
                  variant={transactionMode === 'both' ? 'default' : 'outline'}
                  onClick={() => setTransactionMode('both')}
                  className={`font-bold text-xs uppercase tracking-wider h-9 ${transactionMode === 'both' ? 'bg-primary text-black hover:bg-primary-hover' : 'bg-white text-slate-700'}`}
                >
                  Venda e Aluguel
                </Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-100 shadow-soft rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Pré-visualização dos Dados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 font-black uppercase text-[10px]">#</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Nome do Imóvel</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Tipo</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Localização</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Preço</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Dorms / Vagas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((rawProp, index) => {
                      const item = mapPropertyRecord(rawProp, transactionMode);
                      const locationText = [item.localizacao.bairro, item.localizacao.cidade, item.localizacao.estado].filter(Boolean).join(', ') || '-';
                      const priceText = item.informacoesbasicas.valor 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.informacoesbasicas.valor)
                        : 'Sob consulta';
                      const specsText = `${item.caracteristicasimovel.quartos.join(', ') || '0'} dorm | ${item.caracteristicasimovel.vagas || '0'} vagas`;

                      return (
                        <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono text-[10px] text-slate-400">{index + 1}</TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {item.informacoesbasicas.nome}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs font-medium">
                            {item.caracteristicasimovel.tipo}
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {locationText}
                          </TableCell>
                          <TableCell className="text-green-700 font-bold text-xs">
                            {priceText}
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {specsText}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
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
