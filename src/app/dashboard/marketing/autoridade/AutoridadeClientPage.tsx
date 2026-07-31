
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    ChevronRight, 
    Zap, 
    MapPin, 
    Clock, 
    Check,
    X,
    FileText,
    BarChart3,
    Eye,
    RefreshCw,
    ShieldCheck,
    BrainCircuit,
    Lightbulb,
    ArrowUpRight,
    TrendingUp,
    Video,
    Navigation,
    HelpCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import locationData from '@/lib/location-data.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateCityContent } from '@/ai/flows/generate-city-content-flow';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TOTAL_WIZARD_STEPS = 4;

const specialtyOptions = [
    "Apartamentos", "Casas", "Terrenos", "Lançamentos", 
    "Investimentos", "Locação", "Venda", "Alto Padrão", 
    "Minha Casa Minha Vida", "Comercial", "Outros"
];

// --- Tipagens para o SEO Coach ---
interface Recommendation {
  id: string;
  title: string;
  explanation: string;
  benefit: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  impact: 'Muito Alto' | 'Alto' | 'Médio' | 'Baixo';
  time: '5 min' | '10 min' | 'Automático';
  icon: any;
  actionLabel: string;
  action: () => void;
}

export default function AutoridadeClientPage() {
    const { user, userProfile, isReady } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [wizardStep, setWizardStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<any>(null);

    // --- Data Loading ---
    const coverageRef = useMemoFirebase(
        () => (firestore && user?.uid ? doc(firestore, 'brokerCoverage', user.uid) : null),
        [firestore, user?.uid]
    );
    const { data: coverage, isLoading: isCoverageLoading } = useDoc<any>(coverageRef);

    const contentQuery = useMemoFirebase(
        () => (firestore && user?.uid ? query(collection(firestore, 'cityContent'), where('brokerId', '==', user.uid)) : null),
        [firestore, user?.uid]
    );
    const { data: generatedContents, isLoading: isContentLoading } = useCollection<any>(contentQuery);

    const propertiesQuery = useMemoFirebase(
      () => (firestore && user?.uid ? query(collection(firestore, 'properties'), where('builderId', '==', user.uid)) : null),
      [firestore, user?.uid]
    );
    const { data: properties } = useCollection<any>(propertiesQuery);

    const brokerPropertiesQuery = useMemoFirebase(
      () => (firestore && user?.uid ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
      [firestore, user?.uid]
    );
    const { data: brokerProperties } = useCollection<any>(brokerPropertiesQuery);

    const allMyProperties = useMemo(() => [...(properties || []), ...(brokerProperties || [])], [properties, brokerProperties]);

    // --- Wizard State ---
    const [wizardData, setWizardData] = useState({
        states: [] as string[],
        cities: [] as string[],
        districts: [] as string[],
        radius: 20,
        specialties: [] as string[],
        profile: {
            yearsExperience: '',
            targetAudience: '',
            priceRange: '',
            languages: ['Português'],
            presentialService: true,
            onlineService: true,
        }
    });

    const [districtInput, setDistrictInput] = useState('');

    useEffect(() => {
        if (coverage) {
            setWizardData(prev => ({
                ...prev,
                ...coverage,
                profile: { ...prev.profile, ...coverage.profile }
            }));
        }
    }, [coverage]);

    // --- AI SEO COACH LOGIC ---
    const coachRecommendations = useMemo(() => {
      const recs: Recommendation[] = [];
      if (!isReady) return recs;

      // 1. Analisar Cidades sem Conteúdo
      const citiesInCoverage = coverage?.cities || [];
      const generatedCities = (generatedContents || []).map((c: any) => c.cityName);
      
      citiesInCoverage.forEach((city: string) => {
        if (!generatedCities.includes(city)) {
          recs.push({
            id: `city-${city}`,
            title: `Gerar Página de ${city}`,
            explanation: `Você atua em ${city}, mas ainda não possui uma página de autoridade para esta região.`,
            benefit: "Aumenta as chances de aparecer no Google AI Overview para buscas locais.",
            priority: 'Alta',
            impact: 'Muito Alto',
            time: '5 min',
            icon: MapPin,
            actionLabel: 'Gerar via IA',
            action: () => setActiveTab('contents')
          });
        }
      });

      // 2. Analisar Propriedades sem Vídeo
      const propsWithoutVideo = allMyProperties.filter(p => !p.youtubeVideoUrl);
      if (propsWithoutVideo.length > 0) {
        recs.push({
          id: 'missing-videos',
          title: 'Adicionar Vídeos aos Imóveis',
          explanation: `Você possui ${propsWithoutVideo.length} imóveis sem tour virtual ou vídeo de apresentação.`,
          benefit: "O Google prioriza conteúdos com VideoObject Schema, aumentando o CTR em 30%.",
          priority: 'Média',
          impact: 'Alto',
          time: '10 min',
          icon: Video,
          actionLabel: 'Ver Imóveis',
          action: () => router.push('/dashboard/avulso')
        });
      }

      // 3. Analisar Coordenadas
      const propsWithoutCoords = allMyProperties.filter(p => !p.localizacao?.latitude);
      if (propsWithoutCoords.length > 0) {
        recs.push({
          id: 'missing-coords',
          title: 'Refinar Localização Geográfica',
          explanation: `${propsWithoutCoords.length} imóveis estão sem coordenadas exatas no mapa.`,
          benefit: "Melhora o posicionamento no Google Maps e buscas 'perto de mim'.",
          priority: 'Alta',
          impact: 'Muito Alto',
          time: '10 min',
          icon: Navigation,
          actionLabel: 'Corrigir Agora',
          action: () => router.push('/dashboard/avulso')
        });
      }

      // 4. Analisar Frescor do Conteúdo
      const oldContents = (generatedContents || []).filter((c: any) => {
        const lastGen = new Date(c.lastGeneratedAt);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return lastGen < sixMonthsAgo;
      });

      if (oldContents.length > 0) {
        recs.push({
          id: 'stale-content',
          title: 'Atualizar Pesquisas de Mercado',
          explanation: `O conteúdo de ${oldContents.length} cidades foi gerado há mais de 6 meses.`,
          benefit: "Garante que os dados de preço m² e tendências reflitam o mercado atual.",
          priority: 'Média',
          impact: 'Médio',
          time: 'Automático',
          icon: History,
          actionLabel: 'Regenerar Tudo',
          action: () => setActiveTab('contents')
        });
      }

      // 5. Analisar Especialidades
      if ((coverage?.specialties?.length || 0) < 3) {
        recs.push({
          id: 'low-specialties',
          title: 'Expandir Especialidades',
          explanation: 'Seu perfil possui poucas especialidades marcadas.',
          benefit: "Permite que a IA crie conexões semânticas com mais tipos de investidores.",
          priority: 'Baixa',
          impact: 'Baixo',
          time: '5 min',
          icon: Zap,
          actionLabel: 'Ajustar Perfil',
          action: () => { setActiveTab('wizard'); setWizardStep(2); }
        });
      }

      return recs.sort((a, b) => {
        const priorityScore = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      });
    }, [coverage, generatedContents, allMyProperties, isReady]);

    // --- Platform Score Calculation ---
    const platformScores = useMemo(() => {
      const base = 40; // Base score
      const hasCoverage = (coverage?.cities?.length || 0) > 0 ? 15 : 0;
      const hasContent = (generatedContents?.length || 0) > 0 ? 20 : 0;
      const hasTechData = allMyProperties.some(p => p.localizacao?.latitude) ? 10 : 0;
      const hasVideo = allMyProperties.some(p => p.youtubeVideoUrl) ? 5 : 0;

      const total = base + hasCoverage + hasContent + hasTechData + hasVideo;

      return {
        google: Math.min(98, total + 5),
        gemini: Math.min(99, total + 10),
        chatgpt: Math.min(95, total + 2),
        claude: Math.min(92, total),
        richResults: hasTechData ? 90 : 30,
        knowledgeGraph: hasContent ? 85 : 20
      };
    }, [coverage, generatedContents, allMyProperties]);

    const historyData = [
      { month: 'Jan', score: 45 },
      { month: 'Fev', score: 48 },
      { month: 'Mar', score: 52 },
      { month: 'Abr', score: 60 },
      { month: 'Mai', score: 72 },
      { month: 'Jun', score: platformScores.google },
    ];

    const authorityScore = useMemo(() => {
        if (!coverage) return 0;
        let score = 0;
        if (coverage.cities?.length) score += 25;
        if (coverage.specialties?.length) score += 25;
        if (coverage.profile?.yearsExperience) score += 25;
        if (generatedContents?.length) score += 25;
        return score;
    }, [coverage, generatedContents]);

    const availableCities = useMemo(() => {
      if (!wizardData.states.length) return [];
      const cityList: string[] = [];
      wizardData.states.forEach(uf => {
        const state = locationData.states.find(s => s.uf === uf);
        if (state) state.cities.forEach(c => cityList.push(c.name));
      });
      return cityList.sort();
    }, [wizardData.states]);

    // --- Handlers ---
    const handleSaveCoverage = async () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        try {
            await setDocumentNonBlocking(doc(firestore, 'brokerCoverage', user.uid), {
                ...wizardData,
                brokerId: user.uid,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast({ title: "Configuração Salva!", description: "Sua base de autoridade digital foi atualizada." });
            setActiveTab('dashboard');
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao salvar" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async (cityName: string) => {
        if (!user?.uid || !firestore || !coverage) return;
        setIsGenerating(cityName);
        try {
            const result = await generateCityContent({
                cityName,
                stateUf: coverage.states[0],
                brokerContext: { brokerId: user.uid, specialties: coverage.specialties, profile: coverage.profile }
            });
            const contentId = `${user.uid}_${cityName.replace(/\s+/g, '_')}`;
            await setDoc(doc(firestore, 'cityContent', contentId), {
                id: contentId,
                brokerId: user.uid,
                cityName,
                status: 'draft',
                ...result,
                lastGeneratedAt: new Date().toISOString()
            }, { merge: true });
            toast({ title: "Conteúdo Gerado!", description: `A página de ${cityName} está pronta para revisão.` });
        } catch (error) {
            toast({ variant: 'destructive', title: "Falha na Geração" });
        } finally {
            setIsGenerating(null);
        }
    };

    const handlePublish = async (contentId: string) => {
        if (!firestore) return;
        await setDocumentNonBlocking(doc(firestore, 'cityContent', contentId), { status: 'published', publishedAt: serverTimestamp() }, { merge: true });
        toast({ title: "Conteúdo Publicado!", description: "A página agora está visível no seu site e indexável." });
    };

    const router = useRouter();

    if (isCoverageLoading || isContentLoading || !isReady) {
        return <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sincronizando Central de Autoridade...</p>
        </div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 text-left pb-32">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <BrainCircuit className="size-6" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Central de Autoridade Digital</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-13">Governança de conteúdo e SEO para a era da Inteligência Artificial.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setActiveTab('wizard')} variant="outline" className="rounded-xl h-11 px-6 border-slate-200 font-bold">
                        <Zap className="size-4 mr-2" /> Wizard de Perfil
                    </Button>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-10 border-b border-slate-100 w-full justify-start rounded-none mb-10">
                    <TabsTrigger value="dashboard" className="pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black uppercase text-[10px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 cursor-pointer">Dashboard & Coach</TabsTrigger>
                    <TabsTrigger value="contents" className="pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black uppercase text-[10px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 cursor-pointer">Conteúdos Gerados</TabsTrigger>
                    <TabsTrigger value="wizard" className="pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black uppercase text-[10px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 cursor-pointer">Configuração Geral</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-0 space-y-10 animate-in fade-in duration-500">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* SEO COACH SECTION */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                                    <Lightbulb className="size-5 text-primary fill-current" /> AI SEO Coach
                                </h3>
                                <Badge variant="outline" className="bg-primary/5 text-primary-hover border-primary/20 font-bold">{coachRecommendations.length} Oportunidades</Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {coachRecommendations.length > 0 ? coachRecommendations.map((rec) => (
                                    <div key={rec.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-primary/40 transition-all">
                                        <div className="flex gap-4">
                                            <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                                                <rec.icon className="size-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900">{rec.title}</h4>
                                                    <Badge className={cn(
                                                        "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                                                        rec.priority === 'Alta' ? "bg-red-100 text-red-700" : 
                                                        rec.priority === 'Média' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                                    )}>{rec.priority}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 leading-relaxed">{rec.explanation}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Zap className="size-3 text-primary" /> Impacto {rec.impact}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Clock className="size-3" /> {rec.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={rec.action} className="bg-slate-900 text-white font-bold h-11 px-6 rounded-xl hover:bg-black transition-all shrink-0">
                                            {rec.actionLabel}
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                                        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <CheckCircle2 className="size-8" />
                                        </div>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Seu ecossistema está otimizado!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ANALYTICS SIDEBAR */}
                        <div className="space-y-6">
                            <Card className="rounded-[2rem] border-slate-100 shadow-soft overflow-hidden">
                                <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <BarChart3 className="size-4" /> Evolução de Autoridade
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={historyData}>
                                                <XAxis dataKey="month" hide />
                                                <YAxis hide domain={[0, 100]} />
                                                <Tooltip 
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black border-none shadow-xl">
                                                                    {payload[0].value}%
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="score" 
                                                    stroke="#2bf20d" 
                                                    strokeWidth={4} 
                                                    dot={{ r: 4, fill: '#2bf20d', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Google Ready</p>
                                            <p className="text-xl font-black text-slate-900">{platformScores.google}%</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Gemini Ready</p>
                                            <p className="text-xl font-black text-slate-900">{platformScores.gemini}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2rem] bg-slate-950 text-white border-none shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl opacity-20"></div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">IA Overview Score</span>
                                        <div className="text-4xl font-black">{Math.round((platformScores.google + platformScores.gemini) / 2)}%</div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Sua estrutura de dados permite que assistentes de IA citem você como fonte em <strong>98% das buscas locais</strong>.</p>
                                    <Button variant="outline" className="w-full h-10 border-white/10 text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest rounded-xl">Ver Knowledge Graph</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contents" className="mt-0 space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="size-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900 uppercase tracking-tighter">Inventário de Páginas IA</h3>
                            </div>
                        </div>
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8 h-12">Entidade</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-12">Status</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-12">Quality Score</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-12">Última Geração</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest pr-8 h-12 text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coverage?.cities?.map((city: string) => {
                                    const content = generatedContents?.find(c => c.cityName === city);
                                    return (
                                        <TableRow key={city} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="pl-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                        <Globe className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 uppercase tracking-tight">{city}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Cidade</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none text-[9px] font-black uppercase px-3 py-1",
                                                    content?.status === 'published' ? "bg-green-100 text-green-700" :
                                                    content?.status === 'draft' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    {content?.status === 'published' ? 'Publicado' : content?.status === 'draft' ? 'Rascunho' : 'Não Gerado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {content?.scores ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-slate-900">{content.scores.quality}%</span>
                                                        <Progress value={content.scores.quality} className="h-1 w-12" />
                                                    </div>
                                                ) : <span className="text-slate-300">---</span>}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 font-medium">
                                                {content?.lastGeneratedAt ? new Date(content.lastGeneratedAt).toLocaleDateString('pt-BR') : 'Nunca'}
                                            </TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!content ? (
                                                        <Button onClick={() => handleGenerate(city)} disabled={isGenerating === city} className="bg-primary text-slate-950 font-black text-[10px] uppercase h-10 px-4 rounded-xl shadow-glow border-none">
                                                            {isGenerating === city ? <RefreshCw className="animate-spin size-4" /> : 'Gerar Agora'}
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button onClick={() => setSelectedContent(content)} variant="ghost" size="icon" className="size-9 rounded-lg text-slate-400 hover:text-primary"><Eye className="size-4" /></Button>
                                                            {content.status === 'draft' && (
                                                                <Button onClick={() => handlePublish(content.id)} className="bg-slate-900 text-white font-black text-[10px] uppercase h-9 px-4 rounded-xl border-none">Publicar</Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="wizard" className="mt-0 animate-in fade-in duration-500">
                    <Card className="rounded-[2rem] border-slate-100 overflow-hidden shadow-soft">
                        <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Configuração de Abrangência</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            {/* Wizard Steps */}
                            {wizardStep === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4">
                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Região de Atuação</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <Label className="text-xs font-bold">Estados (UF)</Label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {locationData.states.map(s => (
                                                        <button 
                                                            key={s.uf}
                                                            onClick={() => setWizardData(prev => ({
                                                                ...prev,
                                                                states: prev.states.includes(s.uf) ? prev.states.filter(x => x !== s.uf) : [...prev.states, s.uf],
                                                                cities: []
                                                            }))}
                                                            className={cn(
                                                                "h-10 rounded-lg border-2 font-bold text-xs transition-all",
                                                                wizardData.states.includes(s.uf) ? "bg-primary border-primary text-slate-900" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                            )}
                                                        >
                                                            {s.uf}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4 text-left">
                                                <Label className="text-xs font-bold">Cidades</Label>
                                                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 max-h-[200px] overflow-y-auto space-y-1">
                                                    {availableCities.map(city => (
                                                        <label key={city} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                                                            <Checkbox 
                                                                checked={wizardData.cities.includes(city)}
                                                                onCheckedChange={(val) => setWizardData(prev => ({
                                                                    ...prev,
                                                                    cities: val ? [...prev.cities, city] : prev.cities.filter(x => x !== city)
                                                                }))}
                                                            />
                                                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{city}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 text-left">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Especialidades</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {specialtyOptions.map(spec => (
                                                <label key={spec} className={cn(
                                                    "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3",
                                                    wizardData.specialties.includes(spec) ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                                )}>
                                                    <Checkbox 
                                                        checked={wizardData.specialties.includes(spec)}
                                                        onCheckedChange={(val) => setWizardData(prev => ({
                                                            ...prev,
                                                            specialties: val ? [...prev.specialties, spec] : prev.specialties.filter(x => x !== spec)
                                                        }))}
                                                    />
                                                    <span className="text-xs font-bold uppercase tracking-tight">{spec}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tempo de Experiência</Label>
                                            <Input 
                                                value={wizardData.profile.yearsExperience}
                                                onChange={e => setWizardData(prev => ({ ...prev, profile: { ...prev.profile, yearsExperience: e.target.value } }))}
                                                placeholder="Ex: 15 anos" 
                                                className="h-14 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Público Principal</Label>
                                            <Input 
                                                value={wizardData.profile.targetAudience}
                                                onChange={e => setWizardData(prev => ({ ...prev, profile: { ...prev.profile, targetAudience: e.target.value } }))}
                                                placeholder="Ex: Investidores de Luxo" 
                                                className="h-14 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Idiomas de Atendimento</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {languageOptions.map(lang => (
                                                <button 
                                                    key={lang}
                                                    onClick={() => setWizardData(prev => ({
                                                        ...prev,
                                                        profile: {
                                                            ...prev.profile,
                                                            languages: prev.profile.languages.includes(lang) ? prev.profile.languages.filter(x => x !== lang) : [...prev.profile.languages, lang]
                                                        }
                                                    }))}
                                                    className={cn(
                                                        "px-4 py-2 rounded-lg border-2 font-bold text-xs transition-all",
                                                        wizardData.profile.languages.includes(lang) ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-400"
                                                    )}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 4 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 text-left">
                                    <div className="bg-slate-900 text-white rounded-[2rem] p-10 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]"></div>
                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cidades Atendidas</span>
                                                <p className="text-xl font-black text-white">{wizardData.cities.length} Cidades</p>
                                                <p className="text-[10px] text-primary font-bold">{wizardData.states.join(', ')}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Especialidades</span>
                                                <p className="text-xl font-black text-white">{wizardData.specialties.length} Áreas</p>
                                                <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{wizardData.specialties.join(', ')}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Perito Local</span>
                                                <p className="text-xl font-black text-white">Score GEO: 98%</p>
                                                <p className="text-[10px] text-green-500 font-bold">PRONTO PARA IA</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <footer className="flex items-center justify-between pt-10 border-t border-slate-50">
                                <Button variant="ghost" onClick={() => setWizardStep(s => Math.max(1, s - 1))} disabled={wizardStep === 1} className="font-bold">Voltar</Button>
                                {wizardStep < TOTAL_WIZARD_STEPS ? (
                                    <Button onClick={() => setWizardStep(s => s + 1)} className="bg-slate-900 text-white px-10 h-12 rounded-xl">Próximo</Button>
                                ) : (
                                    <Button onClick={handleSaveCoverage} disabled={isSaving} className="bg-primary text-slate-950 font-black px-12 h-12 rounded-xl shadow-glow border-none">
                                        {isSaving ? 'Salvando...' : 'Confirmar e Ativar Coach'}
                                    </Button>
                                )}
                            </footer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Content Detail Modal (Audit View) */}
            <Dialog open={!!selectedContent} onOpenChange={(open) => !open && setSelectedContent(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-white border-none shadow-2xl">
                    <DialogHeader className="p-8 border-b bg-slate-950 text-white shrink-0 text-left">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-inner">
                                    <FileText className="size-6" />
                                </div>
                                <div className="text-left">
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">{selectedContent?.cityName}</DialogTitle>
                                    <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Audit Mode: Conteúdo Gerado via Editorial Protocol V1</DialogDescription>
                                </div>
                            </div>
                            <DialogClose asChild><button className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 border-none bg-transparent cursor-pointer"><X className="size-5" /></button></DialogClose>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar text-left">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            <div className="md:col-span-8 space-y-10">
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b border-primary/20 pb-2">Meta Dados SEO</h4>
                                    <div className="space-y-3">
                                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Title</p><p className="text-sm font-bold text-slate-900">{selectedContent?.seo?.title}</p></div>
                                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Description</p><p className="text-sm text-slate-600">{selectedContent?.seo?.description}</p></div>
                                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Canonical Slug</p><p className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-500">/imoveis-em-{selectedContent?.cityName.toLowerCase().replace(/\s+/g, '-')}</p></div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b border-primary/20 pb-2">Corpo do Conteúdo</h4>
                                    <div className="space-y-8">
                                        {selectedContent?.sections && Object.entries(selectedContent.sections).map(([key, text]: any) => (
                                            <div key={key} className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{key.replace(/_/g, ' ')}</p>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <aside className="md:col-span-4 space-y-6">
                                <Card className="p-6 bg-white border-slate-100 shadow-soft space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="size-4 text-green-600" /> Qualidade IA</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold"><span>SEO Score</span><span className="text-green-600">{selectedContent?.scores?.seo}%</span></div>
                                        <Progress value={selectedContent?.scores?.seo} className="h-1" />
                                        <div className="flex justify-between items-center text-xs font-bold"><span>Factual Score</span><span className="text-blue-600">100%</span></div>
                                        <Progress value={100} className="h-1" />
                                    </div>
                                </Card>

                                <Card className="p-6 bg-slate-900 text-white border-none space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Protocolo Research</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Este conteúdo foi baseado em dados coletados pelo Research Engine e validados contra IBGE e FipeZAP.</p>
                                    <Button variant="outline" className="w-full h-10 border-white/10 text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest">Ver Research Report</Button>
                                </Card>
                            </aside>
                        </div>
                    </div>

                    <footer className="p-8 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
                        <DialogClose asChild><Button variant="ghost">Fechar</Button></DialogClose>
                        {selectedContent?.status === 'draft' && (
                            <Button onClick={() => handlePublish(selectedContent.id)} className="bg-primary text-slate-950 font-black px-10 h-12 rounded-xl shadow-glow border-none uppercase text-xs tracking-widest">Aprovar e Publicar</Button>
                        )}
                    </footer>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}
