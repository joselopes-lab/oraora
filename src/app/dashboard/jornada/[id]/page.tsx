'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase, useAuthContext, useCollection, setDocumentNonBlocking, useFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, limit, doc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadFile } from '@/lib/storage';

interface Note {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
}

interface Proposal {
  propertyId: string;
  totalValue: number;
  entryValue: number;
  financingValue: number;
  createdAt: string;
}

interface FinancingRecord {
  bank: string;
  value: number;
  status: string;
  createdAt: string;
}

interface ClientDocument {
  url: string;
  name: string;
  uploadedAt: string;
  status: string;
}

interface Journey {
  id: string;
  clientId: string;
  clientName: string;
  persona: string;
  stage: 'prospeccao' | 'visitas' | 'proposta' | 'fechamento';
  statusTag?: string;
  propertyIds: string[];
  propertyTitle: string;
  propertyLocation: string;
  propertyImage: string;
  potentialValue: number;
  notes?: string;
  createdAt: Timestamp;
  proposals?: Proposal[];
  currentProposal?: Proposal;
  // Closing specific fields
  salePropertyId?: string;
  finalValue?: number;
  commissionPercentage?: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest?: string;
  documents?: {
    identity?: ClientDocument;
    civilStatus?: ClientDocument;
    residence?: ClientDocument;
    income?: ClientDocument;
  };
  financing?: { 
    bank: string;
    status: string;
    value: number;
  };
  financings?: FinancingRecord[];
  notes?: Note[];
}

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  completed?: boolean;
}

interface Property {
  id: string;
  informacoesbasicas: {
    nome: string;
    valor?: number;
  };
  midia: string[];
}

const steps = [
  { id: 1, label: 'Cadastro', stage: 'prospeccao' },
  { id: 2, label: 'Persona', stage: 'prospeccao' },
  { id: 3, label: 'Imóveis', stage: 'prospeccao' },
  { id: 4, label: 'Visitas', stage: 'visitas' },
  { id: 5, label: 'Proposta', stage: 'proposta' },
  { id: 6, label: 'Documentação', stage: 'fechamento' },
  { id: 7, label: 'Financiamento', stage: 'fechamento' },
  { id: 8, label: 'Fechamento', stage: 'fechamento' },
];

const BRAZILIAN_BANKS = [
  "Caixa Econômica Federal",
  "Banco do Brasil",
  "Itaú Unibanco",
  "Bradesco",
  "Santander",
  "Safra",
  "BTG Pactual",
  "Nubank",
  "Inter",
  "C6 Bank",
  "Banrisul",
  "BRB",
  "Banco do Nordeste",
  "Banco da Amazônia",
  "Sicredi",
  "Sicoob",
  "Banco PAN",
  "Banco BMG",
  "Votorantim",
  "Original"
].sort();

const docTypes = [
  { key: 'identity', label: 'Identidade (RG/CNH)' },
  { key: 'civilStatus', label: 'Estado Civil' },
  { key: 'residence', label: 'Residência' },
  { key: 'income', label: 'Comprovante de Renda' },
];

export default function JourneyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { firestore, storage } = useFirebase();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [currentPropIndex, setCurrentPropIndex] = useState(0);
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0);
  const [currentFinancingIndex, setCurrentFinancingIndex] = useState(0);
  
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Form States
  const [proposalData, setProposalData] = useState({ propertyId: '', totalValue: 0, entryValue: 0 });
  const [financingData, setFinancingData] = useState({ bank: '', value: 0, status: 'Em análise' });
  const [newNoteText, setNewNoteText] = useState('');
  const [closingData, setClosingData] = useState({ propertyId: '', finalValue: 0, commissionPercentage: 4 });

  const journeyRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'journeys', id) : null),
    [firestore, id]
  );
  const { data: journey, isLoading: isJourneyLoading } = useDoc<Journey>(journeyRef);

  const clientRef = useMemoFirebase(
    () => (firestore && journey?.clientId ? doc(firestore, 'leads', journey.clientId) : null),
    [firestore, journey?.clientId]
  );
  const { data: client, isLoading: isClientLoading } = useDoc<Lead>(clientRef);

  const linkedPropertiesQuery = useMemoFirebase(
    () => (firestore && journey?.propertyIds?.length 
      ? query(collection(firestore, 'properties'), where('__name__', 'in', journey.propertyIds.slice(0, 30))) 
      : null),
    [firestore, journey?.propertyIds]
  );
  const { data: propertiesFromGlobal } = useCollection<Property>(linkedPropertiesQuery);

  const linkedBrokerPropertiesQuery = useMemoFirebase(
    () => (firestore && journey?.propertyIds?.length && user?.uid
      ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid), where('__name__', 'in', journey.propertyIds.slice(0, 30))) 
      : null),
    [firestore, journey?.propertyIds, user?.uid]
  );
  const { data: propertiesFromBroker } = useCollection<Property>(linkedBrokerPropertiesQuery);

  const allLinkedProperties = useMemo(() => {
    const combined = [...(propertiesFromGlobal || []), ...(propertiesFromBroker || [])];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    return (journey?.propertyIds || []).map(id => unique.get(id)).filter(Boolean) as any[];
  }, [propertiesFromGlobal, propertiesFromBroker, journey?.propertyIds]);

  const eventsQuery = useMemoFirebase(
    () => {
      if (!firestore || !user?.uid) return null;
      const safeClientId = journey?.clientId || 'aguardando-cliente';
      return query(
        collection(firestore, 'events'),
        where('brokerId', '==', user.uid),
        where('clientId', '==', safeClientId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc'),
        limit(5)
      );
    },
    [firestore, user?.uid, journey?.clientId]
  );
  const { data: events } = useCollection<Event>(eventsQuery);

  const proposals = useMemo(() => {
    if (!journey) return [];
    const list = [...(journey.proposals || [])];
    if (journey.currentProposal && !list.some(p => p.createdAt === journey.currentProposal?.createdAt)) {
      list.unshift(journey.currentProposal);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journey]);

  const financings = useMemo(() => {
    if (!client) return [];
    const list = [...(client.financings || [])];
    if (client.financing && !list.some(f => f.bank === client.financing?.bank && f.value === client.financing?.value)) {
      list.unshift({ 
        ...client.financing, 
        createdAt: (client.financing as any).createdAt || client.createdAt?.toDate().toISOString() || new Date().toISOString() 
      });
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [client]);

  const currentStepIndex = useMemo(() => {
    if (!journey) return 0;
    const stageMap: Record<string, number> = { 'prospeccao': 2, 'visitas': 3, 'proposta': 4, 'fechamento': 7 };
    return stageMap[journey.stage] || 0;
  }, [journey]);

  useEffect(() => {
    if (journey) {
      setClosingData({
        propertyId: journey.salePropertyId || (journey.propertyIds?.[0] || ''),
        finalValue: journey.finalValue || journey.potentialValue || 0,
        commissionPercentage: journey.commissionPercentage || 4,
      });
    }
  }, [journey]);

  const handleSaveProposal = async () => {
    if (!firestore || !journeyRef || !proposalData.propertyId || !proposalData.totalValue || !journey) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha o valor total e selecione o imóvel.' });
      return;
    }
    const financingValue = Math.max(0, proposalData.totalValue - proposalData.entryValue);
    const now = new Date().toISOString();
    const newProposal: Proposal = {
      propertyId: proposalData.propertyId,
      totalValue: proposalData.totalValue,
      entryValue: proposalData.entryValue,
      financingValue: financingValue,
      createdAt: isEditingProposal && proposals[currentProposalIndex] ? proposals[currentProposalIndex].createdAt : now,
    };
    let updatedProposals = [...(journey.proposals || [])];
    if (isEditingProposal) {
      updatedProposals = updatedProposals.map(p => p.createdAt === newProposal.createdAt ? newProposal : p);
    } else {
      updatedProposals.push(newProposal);
    }
    try {
      setDocumentNonBlocking(journeyRef, { potentialValue: proposalData.totalValue, stage: 'proposta', statusTag: 'Proposta Enviada', proposals: updatedProposals }, { merge: true });
      toast({ title: isEditingProposal ? "Proposta Atualizada!" : "Proposta Registrada!", description: "A jornada foi atualizada." });
      setIsProposalModalOpen(false);
      resetProposalForm();
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar" });
    }
  };

  const handleSaveFinancing = async () => {
    if (!firestore || !clientRef || !financingData.bank || !financingData.value) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha os dados do financiamento.' });
      return;
    }
    const newRecord: FinancingRecord = { bank: financingData.bank, value: financingData.value, status: financingData.status, createdAt: new Date().toISOString() };
    try {
      setDocumentNonBlocking(clientRef, { financings: arrayUnion(newRecord), financing: newRecord }, { merge: true });
      toast({ title: "Financiamento Cadastrado!" });
      setIsFinancingModalOpen(false);
      setFinancingData({ bank: '', value: 0, status: 'Em análise' });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar" });
    }
  };

  const handleSaveClosing = async () => {
    if (!firestore || !journeyRef || !closingData.propertyId || !closingData.finalValue) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Selecione o imóvel e informe o valor final.' });
      return;
    }
    try {
      setDocumentNonBlocking(journeyRef, {
        salePropertyId: closingData.propertyId,
        finalValue: closingData.finalValue,
        commissionPercentage: closingData.commissionPercentage,
        stage: 'fechamento',
        statusTag: 'Fechamento'
      }, { merge: true });
      toast({ title: "Fechamento Registrado!", description: "Os dados de comissão e venda foram atualizados." });
      setIsClosingModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar fechamento" });
    }
  };

  const handleCompleteSale = async () => {
    if (!firestore || !journeyRef) return;
    try {
      setDocumentNonBlocking(journeyRef, { 
        statusTag: 'Venda Concluída',
        stage: 'fechamento'
      }, { merge: true });
      toast({ title: "Venda Concluída!", description: "Parabéns pelo fechamento!" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao atualizar status" });
    }
  };

  const handleEndNegotiation = async () => {
    if (!firestore || !journeyRef) return;
    try {
      setDocumentNonBlocking(journeyRef, { 
        statusTag: 'Negociação Encerrada',
      }, { merge: true });
      toast({ title: "Negociação Encerrada" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao atualizar status" });
    }
  };

  const handleDocUpload = async (docType: string, file: File) => {
    if (!file || !firestore || !clientRef || !storage) return;
    setUploadingDoc(docType);
    try {
      const path = `leads/${client?.id}/documents/${docType}`;
      const url = await uploadFile(storage, path, file, () => {});
      const docData: ClientDocument = { url, name: file.name, uploadedAt: new Date().toISOString(), status: 'VALIDADO' };
      setDocumentNonBlocking(clientRef, { documents: { [docType]: docData } }, { merge: true });
      toast({ title: "Documento Enviado!" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro no upload" });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !firestore || !clientRef) return;
    
    const noteToAdd: Note = {
      id: crypto.randomUUID(),
      text: newNoteText,
      createdAt: new Date().toISOString(),
      authorName: user?.displayName || 'Corretor',
    };

    try {
      setDocumentNonBlocking(clientRef, { notes: arrayUnion(noteToAdd) }, { merge: true });
      toast({ title: "Nota Salva!", description: "A observação foi registrada no histórico do cliente." });
      setNewNoteText('');
      setIsNotesModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar nota" });
    }
  };

  const handleEditProposalClick = () => {
    const current = proposals[currentProposalIndex];
    if (current) {
      setProposalData({ propertyId: current.propertyId, totalValue: current.totalValue, entryValue: current.entryValue });
      setIsEditingProposal(true);
      setIsProposalModalOpen(true);
    }
  };

  const handleDeleteProposal = async () => {
    if (!journey || !journeyRef || !proposals[currentProposalIndex]) return;
    const toRemove = proposals[currentProposalIndex];
    
    const updatedProposals = (journey.proposals || []).filter(p => p.createdAt !== toRemove.createdAt);
    const updateData: any = { proposals: updatedProposals };
    
    if (journey.currentProposal?.createdAt === toRemove.createdAt) {
      updateData.currentProposal = null;
    }

    try {
      setDocumentNonBlocking(journeyRef, updateData, { merge: true });
      toast({ title: "Proposta Excluída" });
      setCurrentProposalIndex(0);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao excluir" });
    }
  };

  const handleDeleteFinancing = async () => {
    if (!client || !clientRef || !financings[currentFinancingIndex]) return;
    const toRemove = financings[currentFinancingIndex];
    
    const updatedFinancings = (client.financings || []).filter(f => f.createdAt !== toRemove.createdAt);
    const updateData: any = { financings: updatedFinancings };
    
    if (client.financing?.bank === toRemove.bank && client.financing?.value === toRemove.value) {
      updateData.financing = null;
    }

    try {
      setDocumentNonBlocking(clientRef, updateData, { merge: true });
      toast({ title: "Registro Excluído" });
      setCurrentFinancingIndex(0);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao excluir" });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!client || !clientRef) return;
    const noteToRemove = client.notes?.find(n => n.id === noteId);
    if (!noteToRemove) return;
    try {
      setDocumentNonBlocking(clientRef, { notes: arrayRemove(noteToRemove) }, { merge: true });
      toast({ title: "Nota Removida" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao excluir nota" });
    }
  };

  const handleDeleteDocument = async (docKey: string) => {
    if (!client || !clientRef) return;
    try {
      setDocumentNonBlocking(clientRef, { 
        documents: { 
          [docKey]: deleteField() 
        } 
      }, { merge: true });
      toast({ title: "Documento Removido" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao remover documento" });
    }
  };

  const resetProposalForm = () => {
    setProposalData({ propertyId: '', totalValue: 0, entryValue: 0 });
    setIsEditingProposal(false);
  };

  if (isJourneyLoading || isClientLoading) {
    return <div className="p-10 text-center text-slate-500 font-medium italic">Carregando detalhes da jornada...</div>;
  }

  if (!journey) {
    return <div className="p-10 text-center">Jornada não encontrada.</div>;
  }

  const currentDisplayedProposal = proposals[currentProposalIndex];
  const proposalProperty = allLinkedProperties.find(p => p.id === currentDisplayedProposal?.propertyId);
  const currentDisplayedFinancing = financings[currentFinancingIndex];
  
  const currentFinalValue = journey.finalValue || journey.potentialValue || 0;
  const currentCommissionPercentage = journey.commissionPercentage || 4;
  const commissionValue = (currentFinalValue * currentCommissionPercentage) / 100;
  const soldProperty = allLinkedProperties.find(p => p.id === journey.salePropertyId);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AlertDialog>
      {/* Client Header */}
      <div className="flex flex-col bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:items-center">
          <div className="flex gap-6 items-center">
            <div className="relative h-24 w-24 rounded-full border-4 border-primary/20 overflow-hidden bg-slate-100 shrink-0">
              <Image src={`https://i.pravatar.cc/150?u=${journey.clientId}`} alt={journey.clientName} fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{journey.clientName}</h1>
                <Badge className={cn("border-none uppercase text-[10px] font-bold", journey.statusTag === 'Venda Concluída' ? "bg-primary text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                  {journey.statusTag || 'Em Atendimento'}
                </Badge>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex flex-wrap gap-y-1">
                <span className="inline-flex items-center gap-1 mr-4">
                  <span className="material-symbols-outlined text-sm">mail</span> {client?.email || 'N/A'}
                </span>
                <span className="inline-flex items-center gap-1 mr-4">
                  <span className="material-symbols-outlined text-sm">phone</span> {client?.phone || 'N/A'}
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium flex flex-wrap gap-y-1">
                <span className="inline-flex items-center gap-1 mr-4">
                  <span className="material-symbols-outlined text-sm">payments</span> {journey.potentialValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">apartment</span> {journey.propertyTitle}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 lg:flex-none h-10 px-4 font-bold rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                <span className="material-symbols-outlined text-lg mr-2">cancel</span> Encerrar Negociação
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar negociação?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação marcará a jornada como encerrada sem venda. Deseja prosseguir?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndNegotiation} className="bg-destructive hover:bg-destructive/90">Confirmar Encerramento</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>

            <AlertDialogTrigger asChild>
              <Button className="flex-1 lg:flex-none h-10 px-6 bg-primary text-slate-900 text-sm font-black shadow-lg shadow-primary/20 border-none hover:scale-[1.02] transition-transform">
                <span className="material-symbols-outlined text-lg mr-2">verified</span> Venda Concluída
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar conclusão de venda?</AlertDialogTitle>
                <AlertDialogDescription>Parabéns! Isso marcará a jornada como concluída com sucesso e adicionará o selo de vendido.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteSale} className="bg-primary text-slate-900 font-bold hover:bg-primary/90">Confirmar Venda</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-2 overflow-x-auto pb-4 px-2">
        <div className="min-w-[900px] relative">
          <div className="flex justify-between relative mb-2 px-4">
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 z-0"></div>
            <div className="absolute top-4 left-0 h-1 bg-primary z-0 transition-all duration-700" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
            {steps.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300", isActive ? "bg-primary text-slate-900 shadow-sm" : "bg-slate-200 dark:bg-slate-800 text-slate-500", isCurrent && "ring-4 ring-primary/30 scale-110")}>
                    {step.id}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", isActive ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persona Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-bold">psychology</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Persona</h3>
              </div>
              <Button variant="link" asChild className="h-auto p-0 text-primary text-xs font-bold hover:underline">
                <Link href={`/dashboard/clientes/${journey.clientId}`}>Editar Persona</Link>
              </Button>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg mb-4 border border-primary/10">
              <p className="text-primary-hover font-bold text-lg mb-1">{journey.persona}</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Perfil identificado para segmentação de imóveis compatíveis.</p>
            </div>
            <div className="mt-auto space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Região de Interesse</span>
                <span className="text-slate-900 dark:text-white font-medium">{journey.propertyLocation}</span>
              </div>
            </div>
          </div>

          {/* Imóveis Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apartment</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Imóveis de Interesse</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {allLinkedProperties.length > 0 ? `${currentPropIndex + 1} de ${allLinkedProperties.length}` : '0 de 0'}
                </span>
              </div>
            </div>
            {allLinkedProperties.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-all group">
                    <div className="h-12 w-12 rounded overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-600">
                      <Image src={allLinkedProperties[currentPropIndex]?.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/300'} alt={allLinkedProperties[currentPropIndex]?.informacoesbasicas?.nome} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{allLinkedProperties[currentPropIndex]?.informacoesbasicas?.nome}</p>
                      <p className="text-xs text-slate-500">{allLinkedProperties[currentPropIndex]?.informacoesbasicas?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p>
                    </div>
                    <Link href={`/imoveis/${allLinkedProperties[currentPropIndex]?.id}`} target="_blank" className="p-1.5 rounded-lg text-slate-300 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-4">
                  <button onClick={() => setCurrentPropIndex(prev => Math.max(0, prev - 1))} disabled={currentPropIndex === 0} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span> Anterior</button>
                  <button onClick={() => setCurrentPropIndex(prev => Math.min(allLinkedProperties.length - 1, prev + 1))} disabled={currentPropIndex === allLinkedProperties.length - 1} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors">Próximo <span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 flex-1 flex flex-col justify-center">
                <p className="text-xs text-slate-400 italic">Nenhum imóvel vinculado.</p>
              </div>
            )}
          </div>

          {/* Visitas Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_available</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Visitas Agendadas</h3>
              </div>
              <Button variant="link" asChild className="h-auto p-0 text-primary text-xs font-bold hover:underline">
                <Link href="/dashboard/agenda">Criar Roteiro</Link>
              </Button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[150px] pr-1">
              {events?.filter(e => e.type === 'visita').length ? events.filter(e => e.type === 'visita').map(event => (
                <div key={event.id} className={cn("flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0", event.completed && "opacity-50")}>
                  <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded h-12 w-12 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{format(parseISO(event.date), 'MMM', { locale: ptBR })}</span>
                    <span className="text-lg font-bold text-primary">{format(parseISO(event.date), 'dd')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.time}h • {event.completed ? 'Realizada' : 'Agendada'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center py-6 italic">Nenhuma visita registrada.</p>
              )}
            </div>
          </div>

          {/* Proposta Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Propostas ({proposals.length})</h3>
              </div>
              <Dialog open={isProposalModalOpen} onOpenChange={(open) => { setIsProposalModalOpen(open); if (!open) resetProposalForm(); }}>
                <DialogTrigger asChild><button className="bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm">Nova Proposta</button></DialogTrigger>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900">
                    <DialogTitle className="text-xl font-bold">{isEditingProposal ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
                  </DialogHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Imóvel</Label>
                      <Select value={proposalData.propertyId} onValueChange={(val) => setProposalData({ ...proposalData, propertyId: val })}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner"><SelectValue placeholder="Selecione um imóvel" /></SelectTrigger>
                        <SelectContent>{allLinkedProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.informacoesbasicas.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Total</Label>
                      <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={proposalData.totalValue || ''} onChange={(e) => setProposalData({...proposalData, totalValue: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor de Entrada</Label>
                      <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={proposalData.entryValue || ''} onChange={(e) => setProposalData({...proposalData, entryValue: Number(e.target.value)})} />
                    </div>
                  </div>
                  <footer className="p-6 border-t bg-slate-50 flex gap-3">
                    <DialogClose asChild><Button variant="ghost" className="flex-1">Cancelar</Button></DialogClose>
                    <Button onClick={handleSaveProposal} className="flex-1 bg-primary text-slate-900 font-bold h-11 rounded-xl shadow-lg border-none">Salvar Dados</Button>
                  </footer>
                </DialogContent>
              </Dialog>
            </div>
            {proposals.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Valor Ofertado</span><span className="text-base font-bold text-slate-900 dark:text-white">{currentDisplayedProposal.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Imóvel</span><span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{proposalProperty?.informacoesbasicas?.nome}</span></div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={handleDeleteProposal} className="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline cursor-pointer">Excluir</button>
                      <button onClick={handleEditProposalClick} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline cursor-pointer">Editar</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4 mt-4">
                  <button onClick={() => setCurrentProposalIndex(prev => Math.max(0, prev - 1))} disabled={currentProposalIndex === 0} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer"><span className="material-symbols-outlined text-sm">chevron_left</span> Anterior</button>
                  <button onClick={() => setCurrentProposalIndex(prev => Math.min(proposals.length - 1, prev + 1))} disabled={currentProposalIndex === proposals.length - 1} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer">Próxima <span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 flex-1 flex flex-col justify-center"><p className="text-xs text-slate-400 italic">Nenhuma proposta.</p></div>
            )}
          </div>

          {/* Documentação Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_shared</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Documentação</h3>
              </div>
              <Dialog open={isDocsModalOpen} onOpenChange={setIsDocsModalOpen}>
                <DialogTrigger asChild><button className="bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm">Gerenciar</button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Documentos</DialogTitle>
                    <DialogDescription>Faça o upload ou remova os documentos obrigatórios do cliente.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {docTypes.map(docType => {
                      const docExists = !!client?.documents?.[docType.key as keyof Lead['documents']];
                      return (
                        <div key={docType.key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold uppercase text-slate-500">{docType.label}</Label>
                            {docExists && (
                              <button onClick={() => handleDeleteDocument(docType.key)} className="text-[10px] text-red-500 font-bold hover:underline uppercase">Excluir</button>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className={cn("flex-1 cursor-pointer h-10 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium hover:border-primary transition-all", uploadingDoc === docType.key && "opacity-50 pointer-events-none")}>
                              {uploadingDoc === docType.key ? 'Enviando...' : docExists ? 'Substituir Documento' : 'Clique para carregar'}
                              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload(docType.key, e.target.files[0])} />
                            </label>
                            {docExists && (
                              <span className="material-symbols-outlined text-green-500">check_circle</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter><DialogClose asChild><Button variant="ghost">Fechar</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[150px] pr-1">
              {docTypes.map((docType) => {
                const docRef = client?.documents?.[docType.key as keyof Lead['documents']];
                return (
                  <div key={docType.key} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="flex items-center gap-2">
                      <span className={cn("material-symbols-outlined text-lg", docRef?.status === 'VALIDADO' ? 'text-green-500' : 'text-amber-500')}>
                        {docRef?.status === 'VALIDADO' ? 'check_circle' : 'pending'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 text-xs">{docType.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {docRef?.url && (
                        <>
                          <a href={docRef.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Visualizar"><span className="material-symbols-outlined text-base">visibility</span></a>
                          <a href={docRef.url} download={docRef.name} className="text-slate-400 hover:text-primary transition-colors" title="Baixar"><span className="material-symbols-outlined text-base">download</span></a>
                        </>
                      )}
                      <span className={cn("text-[9px] font-bold", docRef?.status === 'VALIDADO' ? 'text-green-600' : 'text-amber-600')}>
                        {docRef?.status || 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financiamento Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Financiamento ({financings.length})</h3>
              </div>
              <Dialog open={isFinancingModalOpen} onOpenChange={setIsFinancingModalOpen}>
                <DialogTrigger asChild><button className="bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm">Cadastrar</button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Cadastrar Financiamento</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Banco</Label><Select value={financingData.bank} onValueChange={(val) => setFinancingData({...financingData, bank: val})}><SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger><SelectContent>{BRAZILIAN_BANKS.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Valor do Crédito</Label><Input type="number" value={financingData.value || ''} onChange={(e) => setFinancingData({...financingData, value: Number(e.target.value)})} /></div>
                    <div className="space-y-2"><Label>Status</Label><Select value={financingData.status} onValueChange={(val) => setFinancingData({...financingData, status: val})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Não iniciado">Não iniciado</SelectItem><SelectItem value="Em análise">Em análise</SelectItem><SelectItem value="Aprovado">Aprovado</SelectItem><SelectItem value="Reprovado">Reprovado</SelectItem></SelectContent></Select></div>
                  </div>
                  <DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose><Button onClick={handleSaveFinancing} className="bg-primary text-slate-900 border-none">Salvar Dados</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {financings.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded font-bold text-primary shadow-sm border border-slate-200">{currentDisplayedFinancing.bank.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentDisplayedFinancing.bank}</p>
                      <button onClick={handleDeleteFinancing} className="text-red-500 text-[9px] font-bold uppercase hover:underline cursor-pointer">Excluir Registro</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">Status</p><p className="text-sm font-bold">{currentDisplayedFinancing.status}</p></div>
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">Valor</p><p className="text-sm font-bold">{currentDisplayedFinancing.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-4">
                  <button onClick={() => setCurrentFinancingIndex(prev => Math.max(0, prev - 1))} disabled={currentFinancingIndex === 0} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"><span className="material-symbols-outlined text-xs">chevron_left</span> Anterior</button>
                  <button onClick={() => setCurrentFinancingIndex(prev => Math.min(financings.length - 1, prev + 1))} disabled={currentFinancingIndex === financings.length - 1} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer">Próxima <span className="material-symbols-outlined text-xs">chevron_right</span></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 flex-1 flex flex-col justify-center"><p className="text-xs text-slate-400 italic">Nenhum financiamento.</p></div>
            )}
          </div>

          {/* Fechamento Card */}
          <div className="md:col-span-2 bg-slate-950 text-white p-6 rounded-xl border border-slate-800 shadow-xl h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">handshake</span>
                </div>
                <h3 className="font-bold text-xl text-white">Fechamento e Comissões</h3>
              </div>
              <Dialog open={isClosingModalOpen} onOpenChange={setIsClosingModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-slate-900 h-9 px-6 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-95 border-none">
                    Configurar Venda
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900">
                    <DialogTitle className="text-xl font-bold">Dados do Fechamento</DialogTitle>
                    <DialogDescription>Selecione o imóvel vendido e os termos finais do acordo.</DialogDescription>
                  </DialogHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Imóvel da Venda</Label>
                      <Select value={closingData.propertyId} onValueChange={(val) => setClosingData({...closingData, propertyId: val})}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner">
                          <SelectValue placeholder="Selecione o imóvel" />
                        </SelectTrigger>
                        <SelectContent>
                          {allLinkedProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.informacoesbasicas.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Final Acordado (R$)</Label>
                      <Input 
                        type="number" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                        value={closingData.finalValue || ''} 
                        onChange={(e) => setClosingData({...closingData, finalValue: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Porcentagem da Comissão (%)</Label>
                      <Input 
                        type="number" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                        value={closingData.commissionPercentage || ''} 
                        onChange={(e) => setClosingData({...closingData, commissionPercentage: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <p className="text-[10px] font-black uppercase text-primary-hover mb-1">Comissão Líquida Estimada</p>
                      <p className="text-lg font-black text-slate-900">
                        {((closingData.finalValue * closingData.commissionPercentage) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <footer className="p-6 border-t bg-slate-50 flex gap-3">
                    <DialogClose asChild><Button variant="ghost" className="flex-1">Cancelar</Button></DialogClose>
                    <Button onClick={handleSaveClosing} className="flex-1 bg-primary text-slate-900 font-bold h-11 rounded-xl shadow-lg border-none">Salvar Dados</Button>
                  </footer>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Valor Final Acordado</p>
                <p className="text-xl font-black text-white">{currentFinalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p>
                {soldProperty && <p className="text-[9px] text-slate-500 mt-1 truncate font-medium uppercase tracking-wider">{soldProperty.informacoesbasicas.nome}</p>}
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Comissão ({currentCommissionPercentage}%)</p>
                <p className="text-xl font-black text-primary">{commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Previsão de Escritura</p>
                <p className="text-xl font-bold text-white">A definir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Notas do Corretor */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 h-fit">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><span className="material-symbols-outlined text-primary text-lg">sticky_note_2</span> Notas Internas</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {client?.notes?.length ? client.notes.map(note => (
                <div key={note.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 relative group">
                  <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed italic pr-6">"{note.text}"</p>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                  <div className="flex justify-between items-center mt-2"><span className="text-[9px] font-bold text-slate-400 uppercase">{note.authorName}</span><span className="text-[9px] text-slate-400">{format(new Date(note.createdAt), 'dd MMM, HH:mm', { locale: ptBR })}</span></div>
                </div>
              )) : (<p className="text-xs text-slate-400 text-center py-6 italic">Nenhuma observação.</p>)}
            </div>
            <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4 h-9 text-xs font-bold border-dashed border-slate-300 transition-all hover:bg-slate-50">Adicionar Nota</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Nota Interna</DialogTitle>
                  <DialogDescription>Registre uma observação importante sobre o atendimento deste cliente.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea 
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Descreva aqui os detalhes..."
                    rows={6}
                    className="rounded-xl bg-slate-50 border-none focus:ring-primary shadow-inner"
                  />
                </div>
                <DialogFooter className="flex gap-2">
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <Button onClick={handleSaveNote} className="bg-primary text-slate-900 font-bold px-8 border-none">Salvar Nota</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Histórico Timeline */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 h-fit">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider"><span className="material-symbols-outlined text-primary text-lg">history</span> Histórico</h3><button className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary transition-colors hover:text-white cursor-pointer"><span className="material-symbols-outlined text-lg">add</span></button></div>
            <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
              <div className="relative"><div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white dark:border-slate-900 shadow-[0_0_10px_rgba(43,242,13,0.3)]"></div><p className="text-xs font-bold text-slate-900 dark:text-white">Início da Jornada</p><p className="text-[10px] text-slate-500">{format(journey.createdAt.toDate(), 'dd/MM/yyyy, HH:mm', { locale: ptBR })}</p></div>
            </div>
            <Button variant="outline" className="w-full mt-8 h-9 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none hover:bg-primary hover:text-black transition-all">Registrar Interação</Button>
          </div>
        </div>
      </div>
      </AlertDialog>
    </div>
  );
}
