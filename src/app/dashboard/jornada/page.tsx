'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext, useCollection, useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type JourneyStage = 'prospeccao' | 'visitas' | 'proposta' | 'fechamento' | 'all';

interface Journey {
  id: string;
  clientId: string;
  clientName: string;
  persona: string;
  personaIcon?: string;
  statusTag?: string;
  stage: Exclude<JourneyStage, 'all'>;
  propertyIds: string[];
  propertyTitle: string;
  propertyLocation: string;
  propertyImage: string;
  potentialValue: number;
  priority?: boolean;
  brokerId: string;
  createdAt: Timestamp;
  notes?: string;
}

interface Lead {
  id: string;
  name: string;
}

interface Property {
  id: string;
  informacoesbasicas: {
    nome: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
}

interface Persona {
  id: string;
  name: string;
}

const stageDetails: Record<Exclude<JourneyStage, 'all'>, { label: string; color: string; bgColor: string }> = {
  prospeccao: { label: 'Prospecção', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  visitas: { label: 'Visitas', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  proposta: { label: 'Proposta', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  fechamento: { label: 'Fechamento', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
};

export default function JornadaVendaPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filterStage, setFilterStage] = useState<JourneyStage>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    personaId: '',
    propertyIds: [] as string[],
    stage: 'prospeccao' as Exclude<JourneyStage, 'all'>,
    potentialValue: '',
    notes: '',
  });

  // Queries
  const journeysQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'journeys'), where('brokerId', '==', user.uid), orderBy('createdAt', 'desc')) : null),
    [firestore, user?.uid]
  );
  const { data: journeys, isLoading: areJourneysLoading } = useCollection<Journey>(journeysQuery);

  const leadsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: leads } = useCollection<Lead>(leadsQuery);

  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties')) : null),
    [firestore]
  );
  const { data: properties } = useCollection<Property>(propertiesQuery);

  const brokerPropertiesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: brokerProperties } = useCollection<Property>(brokerPropertiesQuery);

  const portfolioDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'portfolios', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: portfolio } = useDoc<{ propertyIds: string[] }>(portfolioDocRef);

  // Filter properties to only show portfolio + broker avulsos
  const selectableProperties = useMemo(() => {
    const portfolioIds = portfolio?.propertyIds || [];
    const myPortfolio = (properties || []).filter(p => portfolioIds.includes(p.id));
    const combined = [...myPortfolio, ...(brokerProperties || [])];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    return Array.from(unique.values());
  }, [properties, brokerProperties, portfolio]);

  const personasQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'personas')) : null),
    [firestore]
  );
  const { data: personas } = useCollection<Persona>(personasQuery);

  const filteredJourneys = useMemo(() => {
    if (!journeys) return [];
    return journeys.filter((j) => {
      const matchesStage = filterStage === 'all' || j.stage === filterStage;
      const matchesSearch =
        j.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        j.propertyTitle?.toLowerCase().includes(search.toLowerCase()) ||
        j.persona?.toLowerCase().includes(search.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [journeys, filterStage, search]);

  const paginatedJourneys = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJourneys.slice(start, start + itemsPerPage);
  }, [filteredJourneys, currentPage]);

  const totalPages = Math.ceil(filteredJourneys.length / itemsPerPage);

  const handleSaveJourney = async () => {
    if (!user || !firestore) return;
    if (!formData.clientId || formData.propertyIds.length === 0) {
      toast({ variant: 'destructive', title: "Campos obrigatórios", description: "Selecione um cliente e pelo menos um imóvel." });
      return;
    }

    const selectedLead = leads?.find(l => l.id === formData.clientId);
    const mainPropId = formData.propertyIds[0];
    const selectedProp = selectableProperties.find(p => p.id === mainPropId);
    const selectedPersona = personas?.find(p => p.id === formData.personaId);

    const journeyData = {
      brokerId: user.uid,
      clientId: formData.clientId,
      clientName: selectedLead?.name || 'Cliente',
      persona: selectedPersona?.name || 'Não definida',
      propertyIds: formData.propertyIds,
      propertyTitle: selectedProp?.informacoesbasicas.nome || 'Imóveis Selecionados',
      propertyLocation: selectedProp ? `${selectedProp.localizacao.bairro}, ${selectedProp.localizacao.cidade}` : '',
      propertyImage: selectedProp?.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/300',
      stage: formData.stage,
      potentialValue: typeof formData.potentialValue === 'string' ? parseFloat(formData.potentialValue.replace(/\D/g, '')) / 100 || 0 : formData.potentialValue,
      notes: formData.notes,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingJourneyId) {
        const docRef = doc(firestore, 'journeys', editingJourneyId);
        setDocumentNonBlocking(docRef, journeyData, { merge: true });
        toast({ title: "Jornada Atualizada!", description: "As alterações foram salvas com sucesso." });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'journeys'), {
          ...journeyData,
          createdAt: serverTimestamp(),
          statusTag: 'Novo Lead',
        });
        toast({ title: "Jornada Criada!", description: "O pipeline foi atualizado com sucesso." });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar", description: "Não foi possível salvar a jornada." });
    }
  };

  const resetForm = () => {
    setEditingJourneyId(null);
    setFormData({ clientId: '', personaId: '', propertyIds: [], stage: 'prospeccao', potentialValue: '', notes: '' });
  };

  const handleEditClick = (journey: Journey) => {
    setEditingJourneyId(journey.id);
    const foundPersona = personas?.find(p => p.name === journey.persona);
    setFormData({
      clientId: journey.clientId,
      personaId: foundPersona?.id || '',
      propertyIds: journey.propertyIds || [],
      stage: journey.stage,
      potentialValue: journey.potentialValue ? (journey.potentialValue * 100).toString() : '',
      notes: journey.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteJourney = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'journeys', id));
    toast({ title: "Jornada Removida", description: "O registro foi excluído do sistema." });
  };

  const togglePropertySelection = (id: string) => {
    setFormData(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.includes(id)
        ? prev.propertyIds.filter(pid => pid !== id)
        : [...prev.propertyIds, id]
    }));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
            Jornadas de Compra
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-body">
            Gerencie o pipeline de vendas e o progresso de seus clientes
          </p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <button className="h-12 px-6 bg-primary hover:bg-primary-hover text-slate-950 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined">add_circle</span>
                Nova Jornada
              </button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-2xl border-none shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark">
              <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <span className="material-symbols-outlined text-slate-800 dark:text-primary">
                      {editingJourneyId ? 'edit' : 'shopping_cart_checkout'}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                    {editingJourneyId ? 'Editar Jornada de Compra' : 'Nova Jornada de Compra'}
                  </DialogTitle>
                </div>
              </DialogHeader>
              <VisuallyHidden>
                <DialogDescription>Preencha os dados para {editingJourneyId ? 'editar' : 'criar'} a jornada.</DialogDescription>
              </VisuallyHidden>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cliente</label>
                  <Select value={formData.clientId} onValueChange={(val) => setFormData({...formData, clientId: val})}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.map(lead => <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Persona</label>
                    <Select value={formData.personaId} onValueChange={(val) => setFormData({...formData, personaId: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectValue placeholder="Selecione a persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personas?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estágio Atual</label>
                    <Select value={formData.stage} onValueChange={(val: any) => setFormData({...formData, stage: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(stageDetails).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Imóveis de Interesse (Carteira & Avulsos)</label>
                  <div className="grid grid-cols-1 gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
                    {selectableProperties.length > 0 ? selectableProperties.map(prop => (
                      <label key={prop.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <Checkbox 
                          checked={formData.propertyIds.includes(prop.id)}
                          onCheckedChange={() => togglePropertySelection(prop.id)}
                        />
                        <span className="text-sm font-medium">{prop.informacoesbasicas.nome}</span>
                      </label>
                    )) : (
                      <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum imóvel na sua carteira ou avulso.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Valor Potencial (R$)</label>
                  <Input 
                    className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                    placeholder="0,00" 
                    value={formData.potentialValue}
                    onChange={(e) => setFormData({...formData, potentialValue: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Observações</label>
                  <textarea 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 resize-none text-sm outline-none" 
                    placeholder="Detalhes importantes..." 
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <footer className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 justify-end">
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSaveJourney} className="bg-primary text-slate-900 font-bold px-8 h-12 rounded-xl">
                  {editingJourneyId ? 'Salvar Alterações' : 'Criar Jornada'}
                </Button>
              </footer>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary focus:ring-primary rounded-xl font-body"
              placeholder="Buscar por cliente, imóvel ou persona..."
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar items-center">
            {(['all', 'prospeccao', 'visitas', 'proposta', 'fechamento'] as JourneyStage[]).map((stage) => (
              <button
                key={stage}
                onClick={() => { setFilterStage(stage); setCurrentPage(1); }}
                className={cn(
                  "flex h-10 shrink-0 items-center justify-center px-5 rounded-full text-sm font-bold transition-all",
                  filterStage === stage
                    ? "bg-primary text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-primary/50"
                )}
              >
                {stage === 'all' ? 'Todos' : stageDetails[stage as Exclude<JourneyStage, 'all'>].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {areJourneysLoading && <p className="text-center p-10 text-slate-400">Carregando jornadas...</p>}
        
        {!areJourneysLoading && paginatedJourneys.map((journey) => {
          const stage = stageDetails[journey.stage];
          const propertyCount = journey.propertyIds?.length || 1;
          const isHotStatus = journey.statusTag?.includes('Proposta');
          const isSold = journey.statusTag === 'Venda Concluída';

          return (
            <div
              key={journey.id}
              className="flex flex-col md:flex-row items-stretch justify-between gap-6 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all group relative"
            >
              {isSold && (
                <div className="absolute -top-3 -right-3 z-30 transform rotate-12 animate-in zoom-in duration-500">
                  <div className="bg-primary text-slate-900 font-black px-4 py-2 rounded-lg border-4 border-slate-900 shadow-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span className="text-xs uppercase tracking-tighter">VENDIDO</span>
                  </div>
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      {journey.clientName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/clientes/${journey.clientId}`} className="text-slate-900 dark:text-white text-xl font-bold leading-tight hover:text-primary transition-colors">
                          {journey.clientName}
                        </Link>
                        {journey.statusTag && (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", 
                            (journey.priority || isHotStatus || isSold) ? "bg-primary text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          )}>
                            {journey.statusTag}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">{journey.personaIcon || 'person'}</span>
                        {journey.persona}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap", stage.bgColor, stage.color)}>
                      {stage.label}
                    </span>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-2 font-medium">
                      {journey.createdAt ? formatDistanceToNow(journey.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <Image alt={journey.propertyTitle} src={journey.propertyImage} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-slate-900 dark:text-slate-100 text-sm font-bold truncate">
                      {journey.propertyTitle} {propertyCount > 1 && <span className="text-primary ml-1">(+{propertyCount - 1} outros)</span>}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs truncate mt-0.5">
                      {journey.propertyLocation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex flex-col">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Valor Potencial</p>
                    <p className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">
                      {journey.potentialValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertDialogTrigger asChild>
                      <button onClick={() => setLeadToDelete({ id: journey.id, name: journey.clientName } as any)} className="p-2 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </AlertDialogTrigger>
                    
                    <Button 
                      onClick={() => handleEditClick(journey)}
                      variant="outline" 
                      className="h-11 px-6 rounded-xl font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-primary hover:text-slate-950 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Editar
                    </Button>

                    <Button asChild variant="outline" className="h-11 px-6 rounded-xl font-bold bg-slate-50 dark:bg-slate-800 border-none hover:bg-primary hover:text-slate-950 transition-all flex items-center justify-center gap-2">
                      <Link href={`/dashboard/jornada/${journey.id}`}>
                        Ver Detalhamento
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!areJourneysLoading && filteredJourneys.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">search_off</span>
            <p className="text-slate-500 font-medium">Nenhuma jornada cadastrada ainda.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 mt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Mostrando {paginatedJourneys.length} de {filteredJourneys.length} jornadas
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="size-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={cn("size-10 rounded-xl border font-bold transition-all cursor-pointer", currentPage === i + 1 ? "bg-primary text-slate-950 border-primary" : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50")}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="size-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir jornada?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita. O registro da jornada de {leadToDelete?.name} será removido permanentemente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setLeadToDelete(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => leadToDelete && handleDeleteJourney(leadToDelete.id)} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }
}
