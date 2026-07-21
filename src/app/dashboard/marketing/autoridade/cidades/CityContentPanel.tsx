
'use client';

import React, { useState, useMemo } from 'react';
import { useAuthContext, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Zap, 
    RefreshCw, 
    Eye, 
    Edit, 
    CheckCircle2, 
    AlertCircle, 
    FileSearch,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateCityContent } from '@/ai/flows/generate-city-content-flow';
import Link from 'next/link';

export default function CityContentPanel() {
  const { user, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // 1. Get Broker Coverage (Which cities the broker works in)
  const coverageRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'brokerCoverage', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: coverage, isLoading: isCoverageLoading } = useDoc<any>(coverageRef);

  // 2. Get Generated Content for these cities
  const contentQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'cityContent'), where('brokerId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: generatedContents, isLoading: isContentLoading } = useCollection<any>(contentQuery);

  const cityList = useMemo(() => {
    if (!coverage?.cities) return [];
    return coverage.cities.map((cityName: string) => {
        const generated = generatedContents?.find(c => c.cityName === cityName);
        return {
            name: cityName,
            state: coverage.states[0], // Simplified assuming first state
            status: generated?.status || 'needs_generation',
            lastGen: generated?.lastGeneratedAt || null,
            score: generated?.scores?.quality || 0,
            contentId: generated?.id || null
        };
    });
  }, [coverage, generatedContents]);

  const handleGenerate = async (cityName: string, stateUf: string) => {
    if (!user?.uid || !firestore) return;
    
    setIsGenerating(cityName);
    toast({ title: `Iniciando City Content Engine para ${cityName}`, description: "Executando pesquisa analítica e redação editorial..." });

    try {
        const result = await generateCityContent({
            cityName,
            stateUf,
            brokerContext: {
                brokerId: user.uid,
                specialties: coverage.specialties,
                profile: coverage.profile
            }
        });

        const contentId = `${user.uid}_${cityName.replace(/\s+/g, '_')}`;
        const contentRef = doc(firestore, 'cityContent', contentId);
        
        await setDoc(contentRef, {
            id: contentId,
            brokerId: user.uid,
            cityName,
            stateUf,
            status: 'draft',
            ...result,
            lastGeneratedAt: new Date().toISOString()
        }, { merge: true });

        toast({ title: "Conteúdo Gerado!", description: `A página de ${cityName} está pronta para revisão em Rascunho.` });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Falha na Geração", description: "O motor de IA encontrou um erro técnico." });
    } finally {
        setIsGenerating(null);
    }
  };

  const isLoading = isCoverageLoading || isContentLoading || !isReady;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
            <Link href="/dashboard/marketing/autoridade" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                <ArrowLeft className="size-3" /> Voltar para Autoridade
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestão de Conteúdo Local</h1>
            <p className="text-slate-500 font-medium">Páginas de autoridade geradas automaticamente para suas cidades de atuação.</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8 h-14">Cidade / Região</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Status Editorial</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Quality Score</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Última Geração</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest pr-8 h-14 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={5} className="p-10 text-center italic text-slate-400">Sincronizando com a base de conhecimento...</TableCell></TableRow>
            ) : cityList.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="p-20 text-center flex flex-col items-center gap-4">
                        <MapPin className="size-12 text-slate-200" />
                        <p className="text-slate-400 font-medium max-w-xs mx-auto">Nenhuma cidade configurada. Defina sua área de atuação no Wizard de Autoridade.</p>
                        <Button asChild variant="outline" className="rounded-xl"><Link href="/dashboard/marketing/autoridade">Configurar Agora</Link></Button>
                    </TableCell>
                </TableRow>
            ) : cityList.map((city: any) => (
              <TableRow key={city.name} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="pl-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Globe className="size-5" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 uppercase tracking-tight">{city.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{city.state}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "border-none text-[9px] font-black uppercase px-3 py-1",
                    city.status === 'published' ? "bg-green-100 text-green-700" :
                    city.status === 'draft' ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {city.status === 'published' ? 'Publicado' : 
                     city.status === 'draft' ? 'Rascunho' : 'Não Gerado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {city.score > 0 ? (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">{city.score}%</span>
                        <Progress value={city.score} className="h-1 w-16" />
                    </div>
                  ) : <span className="text-slate-300">---</span>}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-medium">
                  {city.lastGen ? new Date(city.lastGen).toLocaleDateString('pt-BR') : 'Nunca'}
                </TableCell>
                <TableCell className="pr-8 text-right">
                  <div className="flex justify-end gap-2">
                    {city.status === 'needs_generation' ? (
                        <Button 
                            onClick={() => handleGenerate(city.name, city.state)} 
                            disabled={isGenerating === city.name}
                            className="bg-primary text-slate-950 font-black text-[10px] uppercase h-10 px-4 rounded-xl shadow-glow"
                        >
                            {isGenerating === city.name ? <Loader2 className="animate-spin size-4" /> : <><Zap className="size-3 mr-2 fill-current" /> Gerar Conteúdo</>}
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" size="icon" className="size-9 rounded-lg text-slate-400 hover:text-primary"><Eye className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="size-9 rounded-lg text-slate-400 hover:text-primary"><Edit className="size-4" /></Button>
                            <Button 
                                onClick={() => handleGenerate(city.name, city.state)}
                                disabled={isGenerating === city.name}
                                variant="ghost" 
                                size="icon" 
                                className="size-9 rounded-lg text-slate-400 hover:text-primary"
                            >
                                <RefreshCw className={cn("size-4", isGenerating === city.name && "animate-spin")} />
                            </Button>
                        </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="size-24 text-primary" /></div>
          <div className="relative z-10 flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0"><FileSearch className="size-6" /></div>
              <div className="space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-tight">O Ciclo de Autoridade</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">Cada página gerada alimenta o seu <strong>Knowledge Graph</strong> pessoal. Quanto mais cidades e bairros você domina, maior a autoridade do seu domínio aos olhos das IAs generativas e mecanismos de busca.</p>
              </div>
          </div>
      </div>
    </div>
  );
}
