
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X, 
  ChevronRight, 
  ArrowLeft,
  Building2, 
  MapPin, 
  DollarSign, 
  Bed, 
  Maximize, 
  Check,
  Search,
  Handshake,
  Target,
  Clock,
  Sparkles,
  Info,
  MessageSquare,
  Zap,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  FileText,
  UserCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useAuthContext, useCollection, useDoc, useFirestore, useMemoFirebase, useFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, getDocs, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  builderId?: string;
  brokerId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    transactionTypes?: string[];
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    suites?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
}

interface LeadRequest {
  id: string;
  brokerId: string;
  name: string;
  network?: {
    description: string;
    objective?: string;
    propertyType?: string;
    city?: string;
    neighborhood?: string;
    minPrice?: number;
    maxPrice?: number;
    urgency?: string;
    rooms?: string;
    minArea?: string;
    maxArea?: string;
    differentials?: string[];
  };
}

interface ResponseWizardProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeadRequest;
}

const TOTAL_STEPS = 3;

const DIFFERENTIALS = [
  'Excelente localização',
  'Melhor custo-benefício',
  'Aceita negociação',
  'Documentação pronta',
  'Vista para o mar',
  'Alto padrão',
  'Excelente investimento',
  'Cliente aceita permuta',
  'Entrega imediata',
  'Condomínio completo',
  'Mobiliado',
  'Recém reformado'
];

const urgencyDetails: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-green-600 bg-green-50' },
  normal: { label: 'Normal', color: 'text-blue-600 bg-blue-50' },
  high: { label: 'Alta', color: 'text-orange-600 bg-orange-50' },
  urgent: { label: 'Urgente', color: 'text-red-600 bg-red-50' },
};

export function ResponseWizard({ isOpen, onClose, request }: ResponseWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [selectedDifferentials, setSelectedDifferentials] = useState<string[]>([]);
  const [confidence, setConfidence] = useState([80]);
  const [isSending, setIsSending] = useState(false);
  
  // Step 3 Confirmations
  const [isAvailableConfirmed, setIsAvailableConfirmed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { storage } = useFirebase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // --- Data Fetching ---
  const avulsoPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore && user ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [isReady, firestore, user?.uid]
  );
  const { data: avulsoProperties, isLoading: areAvulsoLoading } = useCollection<Property>(avulsoPropertiesQuery);

  const portfolioDocRef = useMemoFirebase(
    () => (isReady && firestore && user ? doc(firestore, 'portfolios', user.uid) : null),
    [isReady, firestore, user?.uid]
  );
  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<{ propertyIds: string[] }>(portfolioDocRef);

  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
  const [arePortfolioPropsLoading, setArePortfolioPropsLoading] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!firestore || !portfolio?.propertyIds?.length) {
        setPortfolioProperties([]);
        return;
      }
      setArePortfolioPropsLoading(true);
      try {
        const ids = portfolio.propertyIds.slice(0, 30);
        const q = query(collection(firestore, 'properties'), where('__name__', 'in', ids));
        const snap = await getDocs(q);
        setPortfolioProperties(snap.docs.map(d => ({ id: d.id, ...d.data() } as Property)));
      } finally {
        setArePortfolioPropsLoading(false);
      }
    };
    if (user) fetchPortfolio();
  }, [firestore, portfolio, user?.uid]);

  const allSelectableProperties = useMemo(() => {
    const combined = [...(avulsoProperties || []), ...portfolioProperties];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    
    let list = Array.from(unique.values());
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        list = list.filter(p => 
            p.informacoesbasicas.nome.toLowerCase().includes(term) ||
            p.localizacao.bairro.toLowerCase().includes(term)
        );
    }
    return list;
  }, [avulsoProperties, portfolioProperties, searchTerm]);

  const selectedProperty = useMemo(() => 
    allSelectableProperties.find(p => p.id === selectedPropertyId), 
    [allSelectableProperties, selectedPropertyId]
  );

  const isLoading = areAvulsoLoading || isPortfolioLoading || arePortfolioPropsLoading;

  // --- Handlers ---
  const handleSelectProperty = (id: string) => {
    setSelectedPropertyId(id === selectedPropertyId ? null : id);
  };

  const toggleDifferential = (diff: string) => {
    setSelectedDifferentials(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined) return '---';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const getConfidenceLabel = (val: number) => {
    if (val <= 25) return { label: 'Baixa', color: 'text-red-500' };
    if (val <= 50) return { label: 'Média', color: 'text-orange-500' };
    if (val <= 75) return { label: 'Alta', color: 'text-blue-500' };
    return { label: 'Muito Alta', color: 'text-primary-hover' };
  };

  const confidenceInfo = getConfidenceLabel(confidence[0]);

  const createNotification = (targetBrokerId: string, title: string, content: string) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'announcements'), {
        title,
        content,
        recipients: [targetBrokerId],
        type: 'rede_oraora',
        status: 'sent',
        relatedId: request.id,
        createdAt: serverTimestamp()
    });
  };

  const handleSendProposal = async () => {
    if (!firestore || !user || !selectedProperty || !request) return;

    setIsSending(true);

    try {
        // 1. Validação de duplicidade
        const responsesRef = collection(firestore, 'leads', request.id, 'networkResponses');
        const q = query(responsesRef, where('brokerId', '==', user.uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            toast({
                variant: "destructive",
                title: "Atenção",
                description: "Você já respondeu a esta oportunidade.",
            });
            setIsSending(false);
            return;
        }

        // 2. Preparação do snapshot do imóvel
        const propertySnapshot = {
            id: selectedProperty.id,
            title: selectedProperty.informacoesbasicas.nome,
            price: selectedProperty.informacoesbasicas.valor || selectedProperty.informacoesbasicas.salePrice || 0,
            city: selectedProperty.localizacao.cidade,
            state: selectedProperty.localizacao.estado,
            type: selectedProperty.caracteristicasimovel.tipo,
            bedrooms: selectedProperty.caracteristicasimovel.quartos || 'N/A',
            bathrooms: selectedProperty.caracteristicasimovel.vagas || 'N/A',
            parkingSpaces: selectedProperty.caracteristicasimovel.vagas || 'N/A',
            area: selectedProperty.caracteristicasimovel.tamanho || 'N/A',
            coverImage: selectedProperty.midia?.[0] || '',
            builder: selectedProperty.builderId || '',
            slug: selectedProperty.informacoesbasicas.slug || selectedProperty.id
        };

        // 3. Preparação do Payload final
        const payload = {
            brokerId: user.uid,
            brokerName: userProfile?.username || user.displayName || 'Corretor',
            leadId: request.id,
            propertyId: selectedProperty.id,
            status: 'pending',
            message: message,
            highlights: selectedDifferentials,
            confidence: confidence[0],
            propertySnapshot: propertySnapshot,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            lastUpdate: serverTimestamp()
        };

        // 4. Gravação no Firestore
        await addDoc(responsesRef, payload);

        // Atualizar contador de propostas
        setDocumentNonBlocking(doc(firestore, 'leads', request.id), {
            "network.totalResponses": increment(1)
        }, { merge: true });

        // 5. Gerar Notificação para o dono do lead
        createNotification(
            request.brokerId, 
            "Nova Proposta Recebida", 
            `${userProfile?.username || user.displayName} enviou uma oportunidade para sua solicitação.`
        );

        toast({
            title: "Oportunidade enviada!",
            description: "Sua proposta foi entregue ao corretor parceiro com sucesso.",
        });
        onClose();

    } catch (error) {
        console.error("Error sending network response:", error);
        toast({
            variant: "destructive",
            title: "Erro ao enviar",
            description: "Não foi possível processar sua proposta agora.",
        });
    } finally {
        setIsSending(false);
    }
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    const dataAsString = Array.isArray(quartosData) ? quartosData.join(' ') : String(quartosData);
    const numbers = dataAsString.match(/\d+/g);
    if (!numbers || numbers.length === 0) return dataAsString.trim() || 'N/A';
    const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (uniqueNumbers.length === 0) return 'N/A';
    if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
    const last = uniqueNumbers.pop();
    return `${uniqueNumbers.join(', ')} e ${last}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-none rounded-none bg-white flex flex-col overflow-hidden text-left">
        <VisuallyHidden>
            <DialogHeader>
                <DialogTitle>Responder Solicitação</DialogTitle>
                <DialogDescription>Fluxo guiado para apresentar uma oportunidade.</DialogDescription>
            </DialogHeader>
        </VisuallyHidden>

        <header className="shrink-0 h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white z-50">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Handshake className="size-5" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Responder Solicitação</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conectando Oportunidades</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSending}
            className="size-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors border-none bg-transparent cursor-pointer outline-none disabled:opacity-30"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="shrink-0 px-8 py-4 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Passo {step} de {TOTAL_STEPS}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">{Math.round((step / TOTAL_STEPS) * 100)}% Concluído</span>
            </div>
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5 bg-slate-200" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-white flex flex-col lg:flex-row">
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 h-full custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-24">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Qual imóvel você deseja oferecer?</h1>
                                    <p className="text-slate-500 text-lg">Selecione o ativo da sua carteira que melhor atende aos requisitos desta solicitação.</p>
                                </div>

                                <div className="relative group max-w-xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-14 pl-12 pr-4 bg-slate-50 border-none rounded-2xl font-bold shadow-inner" 
                                        placeholder="Buscar por nome ou bairro..." 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem]" />)
                                    ) : allSelectableProperties.length > 0 ? (
                                        allSelectableProperties.map((prop) => (
                                            <motion.div 
                                                key={prop.id} 
                                                whileHover={{ y: -4 }}
                                                onClick={() => handleSelectProperty(prop.id)}
                                                className={cn(
                                                    "group flex flex-col bg-white rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden relative",
                                                    selectedPropertyId === prop.id 
                                                        ? "border-primary ring-4 ring-primary/20 shadow-glow" 
                                                        : "border-slate-100 hover:border-slate-300 shadow-soft"
                                                )}
                                            >
                                                <div className="relative h-44 w-full overflow-hidden">
                                                    <Image src={prop.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'} alt={prop.informacoesbasicas.nome} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute top-4 left-4">
                                                        <Badge className="bg-white/90 backdrop-blur-md text-black border-none font-black text-[9px] uppercase px-3 py-1 shadow-sm tracking-widest">
                                                            {prop.informacoesbasicas.status}
                                                        </Badge>
                                                    </div>
                                                    {selectedPropertyId === prop.id && (
                                                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                                            <div className="size-14 rounded-full bg-primary text-slate-900 flex items-center justify-center shadow-xl border-4 border-white">
                                                                <Check className="size-8 stroke-[3.5]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-6 flex flex-col flex-1">
                                                    <h3 className="font-bold text-lg text-slate-900 truncate uppercase tracking-tight mb-1">{prop.informacoesbasicas.nome}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-4">
                                                        <MapPin className="size-3" /> {prop.localizacao.bairro}, {prop.localizacao.cidade}
                                                    </p>
                                                    
                                                    <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                                        <div>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Valor</span>
                                                            <p className="text-base font-black text-slate-900">{formatCurrency(prop.informacoesbasicas.valor || prop.informacoesbasicas.salePrice)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Métricas</span>
                                                            <div className="flex justify-end gap-3 text-[10px] font-bold text-slate-600">
                                                                <span className="flex items-center gap-1"><Bed className="size-3" /> {formatQuartos(prop.caracteristicasimovel.quartos)}</span>
                                                                <span className="flex items-center gap-1"><Maximize className="size-3" /> {prop.caracteristicasimovel.tamanho}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                                            <Building2 className="size-12 text-slate-200" />
                                            <p className="text-slate-400 font-medium">Nenhum imóvel disponível para seleção no momento.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : step === 2 ? (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Apresente sua oportunidade</h1>
                                    <p className="text-slate-500 text-lg">Explique rapidamente por que este imóvel é uma boa opção para o cliente.</p>
                                </div>

                                <section className="space-y-4 text-left">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Mensagem ao Corretor Parceiro</label>
                                        <span className={cn("text-[10px] font-bold", message.length > 900 ? "text-red-500" : "text-slate-400")}>
                                            {message.length} / 1000
                                        </span>
                                    </div>
                                    <Textarea 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value.substring(0, 1000))}
                                        placeholder="Ex.: Este imóvel atende praticamente todos os requisitos informados. Está localizado na região desejada, possui vista permanente para o mar e o proprietário aceita negociação."
                                        className="min-h-[180px] rounded-3xl bg-slate-50 border-none p-6 text-base font-medium shadow-inner resize-none focus:ring-primary focus:ring-2"
                                    />
                                </section>

                                <section className="space-y-6 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diferenciais Estratégicos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DIFFERENTIALS.map(diff => (
                                            <button 
                                                key={diff}
                                                type="button"
                                                onClick={() => toggleDifferential(diff)}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2",
                                                    selectedDifferentials.includes(diff)
                                                        ? "bg-primary border-primary text-slate-950 shadow-md"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                                )}
                                            >
                                                {selectedDifferentials.includes(diff) && <Check className="size-3 stroke-[3]" />}
                                                {diff}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner text-left">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Confiança</label>
                                            <p className="text-sm font-bold text-slate-600">Qual a chance deste imóvel ser o escolhido?</p>
                                        </div>
                                        <div className={cn("text-2xl font-black tracking-tighter", confidenceInfo.color)}>
                                            {confidence[0]}% — {confidenceInfo.label}
                                        </div>
                                    </div>
                                    <Slider 
                                        value={confidence}
                                        onValueChange={setConfidence}
                                        max={100}
                                        step={1}
                                        className="price-slider"
                                    />
                                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                                        <span>Baixa</span>
                                        <span>Altíssima</span>
                                    </div>
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10 text-left"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Revise sua proposta</h1>
                                    <p className="text-slate-500 text-lg">Confira todas as informações antes de enviar sua oportunidade para o corretor parceiro.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Solicitação Card */}
                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <Target className="size-4" /> Solicitação Original
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                                                    {request.name?.charAt(0) || 'C'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{request.name || 'Cliente Confidencial'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{request.network?.objective === 'sale' ? 'Comprar' : 'Alugar'} • {request.network?.propertyType}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Local</span>
                                                    <p className="text-xs font-bold truncate">{request.network?.neighborhood || request.network?.city}</p>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Orçamento</span>
                                                    <p className="text-xs font-bold text-primary-hover">{formatCurrency(request.network?.maxPrice)}</p>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Requisitos</span>
                                                    <p className="text-xs font-bold">{request.network?.rooms || '---'} Dorms • {request.network?.minArea || '---'}m²</p>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Urgência</span>
                                                    <p className="text-xs font-bold">{urgencyDetails[request.network?.urgency || 'normal']?.label || 'Normal'}</p>
                                                </div>
                                            </div>
                                            {request.network?.differentials?.length ? (
                                                <div className="flex flex-wrap gap-1.5 mt-4">
                                                    {request.network.differentials.map(d => (
                                                        <span key={d} className="px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[8px] font-black uppercase text-slate-500">{d}</span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Imóvel Ofertado Card */}
                                    <div className="bg-white rounded-[2rem] p-8 border-2 border-primary shadow-soft relative">
                                        <div className="absolute -top-3 right-8 bg-primary text-slate-900 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">SUA OFERTA</div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <Building2 className="size-4" /> Ativo Selecionado
                                        </h3>
                                        {selectedProperty && (
                                            <div className="space-y-6">
                                                <div className="flex gap-4 items-center">
                                                    <div className="size-16 rounded-xl overflow-hidden relative shrink-0 border border-slate-100 shadow-sm">
                                                        <Image src={selectedProperty.midia[0]} alt="p" fill className="object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-base font-black text-slate-900 truncate uppercase">{selectedProperty.informacoesbasicas.nome}</h4>
                                                        <p className="text-xs text-slate-500">{selectedProperty.localizacao.bairro}, {selectedProperty.localizacao.cidade}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Valor</span>
                                                        <p className="text-sm font-black text-slate-900">{formatCurrency(selectedProperty.informacoesbasicas.valor || selectedProperty.informacoesbasicas.salePrice)}</p>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Área / Dorms</span>
                                                        <p className="text-sm font-black text-slate-900">{selectedProperty.caracteristicasimovel.tamanho} • {formatQuartos(selectedProperty.caracteristicasimovel.quartos)}</p>
                                                    </div>
                                                </div>
                                                <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                                                    Visualizar Imóvel <ExternalLink className="size-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Justificativa Card */}
                                    <div className="md:col-span-2 bg-slate-900 text-white rounded-[2rem] p-8 lg:p-10 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-10 opacity-5"><Zap className="size-32 text-primary" /></div>
                                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-8 relative z-10">Sua Justificativa</h3>
                                        <div className="space-y-8 relative z-10">
                                            <div className="space-y-4">
                                                <p className="text-lg text-slate-300 italic leading-relaxed">"{message}"</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedDifferentials.map(d => (
                                                        <span key={d} className="px-3 py-1 rounded-full bg-white/10 text-primary text-[10px] font-black uppercase tracking-widest border border-white/10">{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-8 border-t border-white/5">
                                                <div className="flex justify-between items-end mb-3">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nível de Confiança</span>
                                                    <span className={cn("text-base font-black uppercase tracking-tight", confidenceInfo.color)}>{confidenceInfo.label} ({confidence[0]}%)</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${confidence[0]}%` }} className="h-full bg-primary" transition={{ duration: 1 }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Card */}
                                    <div className="md:col-span-2 bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-100 shadow-soft">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10">O que acontece após o envio?</h3>
                                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-50 hidden md:block"></div>
                                            {[
                                                { icon: 'send', label: 'Proposta Enviada' },
                                                { icon: 'visibility', label: 'Análise do Parceiro' },
                                                { icon: 'handshake', label: 'Início da Parceria' },
                                                { icon: 'rocket_launch', label: 'Fechamento' },
                                            ].map((step, i) => (
                                                <div key={i} className="relative z-10 flex items-center md:flex-col gap-4 md:gap-3 group">
                                                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 group-hover:bg-primary group-hover:text-slate-900 group-hover:border-primary transition-all">
                                                        <span className="material-symbols-outlined text-xl">{step.icon}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">{step.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Section */}
                                <section className="p-8 bg-primary/5 rounded-[2rem] border-2 border-primary/20 space-y-4">
                                    <label className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-colors cursor-pointer group">
                                        <Checkbox 
                                            checked={isAvailableConfirmed} 
                                            onCheckedChange={(val) => setIsAvailableConfirmed(!!val)}
                                            className="size-6 rounded-lg data-[state=checked]:bg-primary" 
                                        />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Confirmo que este imóvel está disponível para venda/locação agora.</span>
                                    </label>
                                    <label className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-colors cursor-pointer group">
                                        <Checkbox 
                                            checked={isAuthorized} 
                                            onCheckedChange={(val) => setIsAuthorized(!!val)}
                                            className="size-6 rounded-lg data-[state=checked]:bg-primary" 
                                        />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Confirmo que possuo autorização formal para oferecer este imóvel para terceiros.</span>
                                    </label>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Sidebar de Resumo */}
            {step < 3 && (
                <aside className="lg:w-[400px] h-full bg-slate-950 text-white p-8 lg:p-10 border-l border-white/5 relative overflow-hidden flex flex-col shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
                    
                    <div className="relative z-10 space-y-10 flex-1 overflow-y-auto no-scrollbar">
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-primary shadow-inner"><Target className="size-5" /></div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Demanda do Lead</h3>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 shadow-inner">
                                <p className="text-base text-slate-300 leading-relaxed font-medium italic">"{request.network?.description}"</p>
                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Local</span>
                                        <p className="text-xs font-bold truncate">{request.network?.neighborhood || request.network?.city}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Budget</span>
                                        <p className="text-xs font-bold text-primary">{formatCurrency(request.network?.maxPrice)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedProperty && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pt-6 border-t border-white/10 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Building2 className="size-5" /></div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Ativo Selecionado</h3>
                                </div>
                                <div className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                                    <div className="relative h-32 w-full">
                                        <Image src={selectedProperty.midia[0]} alt="prop" fill className="object-cover opacity-60" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                                        <div className="absolute bottom-3 left-4">
                                            <p className="text-sm font-black uppercase tracking-tight">{selectedProperty.informacoesbasicas.nome}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold uppercase">Valor</span>
                                            <span className="font-black text-primary">{formatCurrency(selectedProperty.informacoesbasicas.valor || selectedProperty.informacoesbasicas.salePrice)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold uppercase">Área</span>
                                            <span className="font-bold">{selectedProperty.caracteristicasimovel.tamanho}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="pt-8 border-t border-white/10 flex items-center gap-3 opacity-40 text-left">
                            <Info className="size-4 text-primary" />
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-widest">Protocolo de Parceria v2.0</p>
                        </div>
                    </div>
                </aside>
            )}
        </div>

        <footer className="shrink-0 h-24 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xl px-8 flex items-center z-50">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <Button 
                variant="ghost" 
                onClick={step === 1 ? onClose : () => setStep(prev => prev - 1)} 
                disabled={isSending}
                className="px-10 h-12 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200/50 transition-all border-none bg-transparent cursor-pointer disabled:opacity-30"
            >
                {step === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            
            {step === TOTAL_STEPS ? (
                <Button 
                    onClick={handleSendProposal}
                    disabled={!isAvailableConfirmed || !isAuthorized || isSending}
                    className="px-12 h-14 bg-primary hover:bg-primary-hover text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-glow transition-all active:scale-[0.98] border-none cursor-pointer disabled:opacity-50"
                >
                    {isSending ? <Loader2 className="animate-spin size-5" /> : "Enviar Proposta Agora"}
                </Button>
            ) : (
                <Button 
                    onClick={() => setStep(prev => prev + 1)}
                    disabled={step === 1 ? !selectedPropertyId : (step === 2 && !message.trim())}
                    className="px-12 h-14 bg-primary hover:bg-primary-hover text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-glow transition-all active:scale-[0.98] border-none cursor-pointer group"
                >
                    Próximo Passo <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

