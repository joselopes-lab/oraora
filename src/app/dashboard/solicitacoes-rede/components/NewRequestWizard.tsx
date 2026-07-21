'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ChevronRight, 
  BadgeCheck, 
  Users, 
  Building2, 
  Home, 
  Map, 
  Briefcase, 
  Zap, 
  Target, 
  MapPin, 
  PlusCircle, 
  FileSearch,
  Loader2,
  Sparkles,
  Phone,
  Check
} from 'lucide-react';
import { useAuthContext, useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface NewRequestWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialLeadId?: string | null;
  mode?: 'create' | 'edit' | 'duplicate';
}

const TOTAL_STEPS = 4;

const propertyTypes = [
    { id: 'Apartamento', label: 'Apartamento', icon: Building2 },
    { id: 'Casa', label: 'Casa', icon: Home },
    { id: 'Terreno', label: 'Terreno', icon: Map },
    { id: 'Sala Comercial', label: 'Comercial', icon: Briefcase },
];

const objectives = [
    { id: 'sale', label: 'Comprar', icon: Target },
    { id: 'rent', label: 'Alugar', icon: MapPin },
];

const differentialOptions = [
    "Piscina", "Sacada Gourmet", "Churrasqueira", "Vista Mar", "Decorado", "Alto Padrão", "Aceita Pet", "Academia"
];

export function NewRequestWizard({ isOpen, onClose, initialLeadId, mode = 'create' }: NewRequestWizardProps) {
  const [step, setStep] = useState(1);
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    withoutLead: false,
    objective: 'sale',
    propertyType: '',
    city: '',
    neighborhood: '',
    nearNeighborhoods: false,
    minPrice: '',
    maxPrice: '',
    urgency: 'normal',
    rooms: '',
    suites: '',
    bathrooms: '',
    parking: '',
    minArea: '',
    maxArea: '',
    differentials: [] as string[],
    description: '',
  });

  const leadsQuery = useMemoFirebase(
    () => {
      if (!isReady || !user?.uid || !firestore) return null;
      return query(
        collection(firestore, 'leads'),
        where('brokerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    },
    [isReady, user?.uid, firestore]
  );
  const { data: leads } = useCollection<any>(leadsQuery);

  // Pre-fill data for Edit or Duplicate mode
  useEffect(() => {
    if (isOpen && initialLeadId && leads) {
        const lead = leads.find((l: any) => l.id === initialLeadId);
        if (lead && lead.network) {
            setFormData({
                clientId: mode === 'duplicate' ? '' : lead.id,
                withoutLead: mode === 'duplicate' ? true : !lead.id,
                objective: lead.network.objective || 'sale',
                propertyType: lead.network.propertyType || '',
                city: lead.network.city || '',
                neighborhood: lead.network.neighborhood || '',
                nearNeighborhoods: lead.network.nearNeighborhoods || false,
                minPrice: lead.network.minPrice?.toString() || '',
                maxPrice: lead.network.maxPrice?.toString() || '',
                urgency: lead.network.urgency || 'normal',
                rooms: lead.network.rooms?.toString() || '',
                suites: lead.network.suites?.toString() || '',
                bathrooms: lead.network.bathrooms?.toString() || '',
                parking: lead.network.parking?.toString() || '',
                minArea: lead.network.minArea?.toString() || '',
                maxArea: lead.network.maxArea?.toString() || '',
                differentials: lead.network.differentials || [],
                description: lead.network.description || '',
            });
            if (mode === 'duplicate') setStep(4);
            else setStep(1);
        }
    } else if (isOpen && !initialLeadId) {
        resetForm();
    }
  }, [isOpen, initialLeadId, leads, mode]);

  const selectedLead = leads?.find((l: any) => l.id === formData.clientId);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMatches([]);
    setIsAnalyzing(false);
    setStep(4);
  };

  const handlePublish = async () => {
    if (!user || !firestore) return;
    setIsPublishing(true);

    const networkData = {
        published: true,
        publishedAt: serverTimestamp(),
        urgency: formData.urgency,
        description: formData.description || `Busca de ${formData.propertyType} em ${formData.neighborhood}, ${formData.city}`,
        objective: formData.objective,
        propertyType: formData.propertyType,
        city: formData.city,
        neighborhood: formData.neighborhood,
        minPrice: parseFloat(formData.minPrice) || 0,
        maxPrice: parseFloat(formData.maxPrice) || 0,
        rooms: formData.rooms,
        suites: formData.suites,
        parking: formData.parking,
        minArea: formData.minArea,
        maxArea: formData.maxArea,
        differentials: formData.differentials,
        matchFound: matches.length > 0,
        totalViews: 0,
        totalResponses: 0,
        status: 'open' as const
    };

    try {
        let finalId = '';
        if (mode === 'edit' && formData.clientId) {
            const leadRef = doc(firestore, 'leads', formData.clientId);
            await setDocumentNonBlocking(leadRef, { network: networkData, updatedAt: serverTimestamp() }, { merge: true });
            finalId = formData.clientId;
        } else {
            // New or Duplicate
            const res = await addDocumentNonBlocking(collection(firestore, 'leads'), {
                brokerId: user.uid,
                brokerName: userProfile?.username || user.displayName || 'Corretor',
                name: formData.withoutLead ? 'Cliente Rede Anônimo' : (selectedLead?.name || 'Cliente'),
                email: formData.withoutLead ? 'privado@rede.oraora' : (selectedLead?.email || ''),
                phone: formData.withoutLead ? '' : (selectedLead?.phone || ''),
                status: 'new',
                source: 'Central de Oportunidades',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                network: networkData,
            });
            finalId = res?.id || '';
        }

        toast({ title: mode === 'edit' ? "Solicitação atualizada!" : "Solicitação publicada!", description: "Toda a rede agora pode te ajudar." });
        onClose();
        if (finalId) router.push(`/dashboard/solicitacoes-rede/${finalId}`);
    } catch (error) {
        toast({ variant: 'destructive', title: "Erro ao publicar" });
    } finally {
        setIsPublishing(false);
    }
  };

  const nextStep = () => {
    if (step === 3) performAnalysis();
    else if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const formatCurrency = (val: string | number) => {
      const num = typeof val === 'string' ? parseFloat(val.replace(/\D/g, '')) / 100 : val;
      if (isNaN(num)) return '---';
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      clientId: '',
      withoutLead: false,
      objective: 'sale',
      propertyType: '',
      city: '',
      neighborhood: '',
      nearNeighborhoods: false,
      minPrice: '',
      maxPrice: '',
      urgency: 'normal',
      rooms: '',
      suites: '',
      bathrooms: '',
      parking: '',
      minArea: '',
      maxArea: '',
      differentials: [] as string[],
      description: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-none rounded-none bg-white flex flex-col overflow-hidden text-left">
        <VisuallyHidden>
            <DialogHeader>
                <DialogTitle>{mode === 'edit' ? 'Editar' : 'Nova'} Solicitação na Rede</DialogTitle>
                <DialogDescription>Preencha os dados do cliente e do imóvel para publicar na rede.</DialogDescription>
            </DialogHeader>
        </VisuallyHidden>

        <header className="shrink-0 h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white z-50">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Zap className="size-5 fill-current" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {mode === 'edit' ? 'Editar' : mode === 'duplicate' ? 'Duplicar' : 'Nova'} Solicitação na Rede
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativo na Central de Oportunidades</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors border-none bg-transparent cursor-pointer outline-none">
            <X className="size-5" />
          </button>
        </header>

        <div className="shrink-0 px-8 py-4 bg-slate-50 border-b border-slate-100">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Passo {step} de {TOTAL_STEPS}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">{(step / TOTAL_STEPS) * 100}% Concluído</span>
            </div>
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5 bg-slate-200" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          <main className="max-w-6xl mx-auto py-12 px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                        <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center space-y-8">
                            <div className="relative"><div className="size-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin" /><Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 text-primary animate-pulse" /></div>
                            <div className="space-y-2"><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Análise Inteligente</h2><p className="text-slate-500 font-medium italic">Cruzando sua demanda com as tendências da rede...</p></div>
                        </motion.div>
                    ) : step === 1 ? (
                        <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                            <div className="space-y-2"><h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Quem é o cliente?</h1><p className="text-slate-500 text-lg">Selecione um lead da sua base ou publique anonimamente.</p></div>
                            <div className="grid gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Minha Base de Leads</label>
                                    <Select value={formData.clientId} onValueChange={(val) => setFormData({ ...formData, clientId: val, withoutLead: false })}><SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner text-left px-6 text-base font-bold"><SelectValue placeholder="Escolha um cliente..." /></SelectTrigger><SelectContent className="max-h-64">{leads?.map((l: any) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent></Select>
                                </div>
                                <div className="relative py-4 flex items-center gap-4"><div className="h-px flex-1 bg-slate-100"></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OU</span><div className="h-px flex-1 bg-slate-100"></div></div>
                                <button onClick={() => setFormData({ ...formData, clientId: '', withoutLead: true })} className={cn("w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left group cursor-pointer", formData.withoutLead ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-100 bg-white hover:border-primary/50")}>
                                    <div className="flex items-center gap-6"><div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-colors shadow-sm"><Users className="size-7" /></div><div><h4 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none mb-2">Publicação Anônima</h4><p className="text-sm text-slate-500 font-medium">A rede verá apenas os critérios técnicos da busca.</p></div></div>
                                    <div className={cn("size-6 rounded-full border-2 flex items-center justify-center transition-all", formData.withoutLead ? "bg-primary border-primary" : "border-slate-200")}>{formData.withoutLead && <div className="size-2 bg-white rounded-full"></div>}</div>
                                </button>
                                {selectedLead && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px]"></div>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="size-20 rounded-full border-4 border-primary/20 bg-white/10 flex items-center justify-center font-black text-2xl uppercase shadow-inner">{selectedLead.name.charAt(0)}</div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <h3 className="text-2xl font-black truncate uppercase tracking-tighter">{selectedLead.name}</h3>
                                                <div className="flex flex-wrap gap-2 mt-3"><Badge className="bg-white/10 text-white border-none text-[9px] uppercase font-black px-3 py-1 shadow-sm"><Phone className="size-3 mr-1.5" /> {selectedLead.phone || 'Privado'}</Badge><Badge className="bg-white/10 text-white border-none text-[9px] uppercase font-black px-3 py-1 shadow-sm">{selectedLead.status}</Badge></div>
                                            </div>
                                            <BadgeCheck className="size-10 text-primary shrink-0 opacity-80" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ) : step === 2 ? (
                        <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                            <div className="space-y-2 text-left">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Parâmetros de Busca</h1>
                                <p className="text-slate-500 text-lg">Localização e valores para os parceiros prospectarem.</p>
                            </div>
                            <div className="space-y-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Modalidade & Tipo</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl h-16">{objectives.map(o => (
                                        <button key={o.id} onClick={() => setFormData({...formData, objective: o.id})} className={cn("flex-1 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs transition-all cursor-pointer border-none", formData.objective === o.id ? "bg-white text-slate-950 shadow-md ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600 bg-transparent")}>
                                            <o.icon className="size-4" /> {o.label}
                                        </button>
                                    ))}</div>
                                    <div className="relative">
                                        <select value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})} className="w-full h-16 rounded-2xl bg-slate-50 border-none px-6 font-bold text-base focus:ring-primary focus:ring-2 shadow-inner appearance-none">
                                            <option value="">Tipo de Imóvel...</option>
                                            {propertyTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight className="size-5 rotate-90" /></div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Região</span>
                                    <div className="space-y-3">
                                        <Input placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-lg px-6" />
                                        <Input placeholder="Bairro" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-lg px-6" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Investimento Máximo</span>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm uppercase">R$</span>
                                        <Input type="number" placeholder="0,00" value={formData.maxPrice} onChange={e => setFormData({...formData, maxPrice: e.target.value})} className="h-16 pl-14 rounded-2xl bg-slate-50 border-none shadow-inner font-black text-2xl px-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase pl-1 italic">Defina o teto para evitar propostas fora do perfil.</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : step === 3 ? (
                        <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 text-left">
                             <div className="space-y-2">
                                 <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Especificações Técnicas</h1>
                                 <p className="text-slate-500 text-lg">Métricas obrigatórias para filtragem avançada pela rede.</p>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[{ n: 'Dormitórios', f: 'rooms' }, { n: 'Suítes', f: 'suites' }, { n: 'Vagas', f: 'parking' }, { n: 'Área Min (m²)', f: 'minArea' }].map(field => (
                                    <div key={field.f} className="space-y-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.n}</span>
                                        <Input type="number" value={(formData as any)[field.f]} onChange={e => setFormData({...formData, [field.f]: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-black text-xl text-center" />
                                    </div>
                                ))}
                             </div>
                             <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><Zap className="size-3 fill-current" /> Diferenciais Chave</h3>
                                <div className="flex flex-wrap gap-2">
                                    {differentialOptions.map(item => (
                                        <button key={item} type="button" onClick={() => { const current = formData.differentials; setFormData({...formData, differentials: current.includes(item) ? current.filter(d => d !== item) : [...current, item]}); }} className={cn("px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border-none", formData.differentials.includes(item) ? "bg-primary border-primary text-slate-950 shadow-md" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300")}>{formData.differentials.includes(item) && <Check className="size-3 stroke-[3]" />}{item}</button>
                                    ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações do Atendimento</span>
                                <Textarea placeholder="Descreva aqui particularidades subjetivas, perfis aceitos ou restrições do cliente..." className="min-h-[150px] rounded-3xl bg-slate-50 border-none p-6 text-base font-medium shadow-inner resize-none focus:ring-primary focus:ring-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 text-center">
                            <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                <div className="size-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 shadow-inner"><FileSearch className="size-12" /></div>
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Confirmar Publicação</h1>
                                    <p className="text-slate-500 text-lg max-w-xl mx-auto">Sua demanda será compartilhada com todos os corretores da Rede Oraora.</p>
                                </div>
                                <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl max-w-lg">
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed text-left">
                                        Ao publicar, parceiros poderão enviar propostas de imóveis que você ainda não conhece. A parceria é protegida pelos termos da rede.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <aside className="lg:col-span-4 sticky top-12 h-fit">
                    <div className="bg-slate-950 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white/5">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] -mr-20 -mt-20"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-10 flex items-center gap-3 relative z-10"><PlusCircle className="size-4" /> Resumo do Pedido</h3>
                        <div className="space-y-8 relative z-10 text-left">
                            <div className="space-y-1.5"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Solicitante</span><p className="text-base font-black text-white truncate">{formData.withoutLead ? 'Demanda Anônima' : (selectedLead?.name || '---')}</p></div>
                            <div className="grid grid-cols-2 gap-8"><div className="space-y-1.5"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Objetivo</span><p className="text-sm font-bold text-white uppercase">{formData.objective === 'sale' ? 'Comprar' : 'Alugar'}</p></div><div className="space-y-1.5"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tipo</span><p className="text-sm font-bold text-white uppercase">{formData.propertyType || '---'}</p></div></div>
                            <div className="space-y-1.5"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Local</span><p className="text-sm font-bold text-white truncate uppercase">{formData.neighborhood ? `${formData.neighborhood}, ${formData.city}` : (formData.city || '---')}</p></div>
                            <div className="space-y-1.5"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Orçamento</span><p className="text-xl font-black text-primary">{formData.maxPrice ? formatCurrency(formData.maxPrice) : '---'}</p></div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/10 opacity-30"><p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Protocolo Rede Oraora</p></div>
                    </div>
                </aside>
            </div>
          </main>
        </div>

        <footer className="shrink-0 h-24 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xl px-8 flex items-center z-50">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <Button variant="ghost" onClick={step === 1 ? onClose : prevStep} className="px-10 h-12 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200/50 transition-all border-none bg-transparent cursor-pointer">
                {step === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            
            {step === TOTAL_STEPS ? (
                <Button onClick={handlePublish} disabled={isPublishing} className="px-12 h-14 bg-primary hover:bg-primary-hover text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-glow transition-all active:scale-[0.98] border-none cursor-pointer">
                    {isPublishing ? <Loader2 className="animate-spin size-5" /> : mode === 'edit' ? "Salvar Alterações" : "Publicar na Rede"}
                </Button>
            ) : (
                <Button onClick={nextStep} disabled={isAnalyzing || (step === 1 && !formData.clientId && !formData.withoutLead)} className="px-12 h-14 bg-primary hover:bg-primary-hover text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-glow transition-all active:scale-[0.98] border-none cursor-pointer group">
                  Próximo <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            )}
          </div>
        </footer>

      </DialogContent>
    </Dialog>
  );
}
