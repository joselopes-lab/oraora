'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, useFirebase, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, Timestamp, doc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Zap, 
  MapPin, 
  Clock, 
  Target, 
  MessageCircle, 
  CheckCircle2, 
  ClipboardList, 
  History, 
  Share2, 
  Ban, 
  Maximize, 
  Bed, 
  DollarSign, 
  ThumbsUp, 
  Quote,
  Check,
  Handshake,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
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

type Lead = {
  id: string;
  brokerId: string;
  brokerName?: string;
  name: string;
  email: string;
  phone: string;
  localizacao: {
      bairro: string;
      cidade: string;
      estado: string;
  };
  network: {
    published: boolean;
    publishedAt: Timestamp;
    urgency: 'low' | 'normal' | 'high' | 'urgent';
    description: string;
    status: 'open' | 'closed';
    totalViews: number;
    neighborhood: string;
    city: string;
    maxPrice: number;
    propertyType: string;
  };
};

type NetworkResponse = {
  id: string;
  brokerId: string;
  brokerName: string;
  propertyId?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'closed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  closedAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelReason?: string;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
  };
};

const urgencyDetails: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-green-50 text-green-700 border-green-100' },
  normal: { label: 'Normal', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  high: { label: 'Alta', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  urgent: { label: 'Urgente', color: 'bg-red-50 text-red-700 border-red-100' },
};

const statusDetails: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'Aceita', color: 'bg-green-100 text-green-700', icon: ThumbsUp },
  rejected: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: Ban },
  negotiating: { label: 'Negociação', color: 'bg-blue-100 text-blue-700', icon: Zap },
  closed: { label: 'Concluído', color: 'bg-primary text-slate-900', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-500', icon: Ban },
};

function ResponseStepper({ status }: { status: string }) {
  const steps = [
    { id: 'pending', label: 'Proposta' },
    { id: 'accepted', label: 'Aceite' },
    { id: 'negotiating', label: 'Negociação' },
    { id: 'closed', label: 'Concluído' }
  ];

  const getStepIndex = (s: string) => {
    if (s === 'rejected' || s === 'cancelled') return -1;
    return steps.findIndex(step => step.id === s);
  };

  const currentIndex = getStepIndex(status);

  if (status === 'rejected') return <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">A proposta foi recusada pelo originador</div>;
  if (status === 'cancelled') return <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A parceria foi cancelada</div>;

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const isPast = idx < currentIndex || status === 'closed';
        const isCurrent = idx === currentIndex && status !== 'closed';
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "size-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all",
                isPast ? "bg-primary text-slate-900" : isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary/30" : "bg-slate-100 text-slate-300"
              )}>
                {isPast ? <Check className="size-3 stroke-[3]" /> : idx + 1}
              </div>
              <span className={cn("text-[8px] font-bold uppercase tracking-tighter", isPast || isCurrent ? "text-slate-900" : "text-slate-300")}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn("h-px w-6 mb-3", isPast ? "bg-primary" : "bg-slate-100")}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OportunidadeDetalhesPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  const leadRef = useMemoFirebase(() => (isReady && firestore && id ? doc(firestore, 'leads', id) : null), [isReady, firestore, id]);
  const { data: lead, isLoading: isLoadingLead } = useDoc<Lead>(leadRef);

  const responsesQuery = useMemoFirebase(
    () => {
        if (!isReady || !firestore || !id) return null;
        return query(collection(firestore, 'leads', id, 'networkResponses'));
    },
    [isReady, firestore, id]
  );
  const { data: initialResponses } = useCollection<NetworkResponse>(responsesQuery);

  const responses = useMemo(() => {
    if (!initialResponses) return [];
    return [...initialResponses].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [initialResponses]);

  const responsePropertyIds = useMemo(() => responses.map(r => r.propertyId).filter(Boolean) as string[], [responses]);

  const propertiesRef = useMemoFirebase(
    () => (isReady && firestore && responsePropertyIds.length > 0 ? query(collection(firestore, 'properties'), where('__name__', 'in', responsePropertyIds.slice(0, 30))) : null),
    [isReady, firestore, responsePropertyIds]
  );
  const { data: globalProperties } = useCollection<Property>(propertiesRef);

  const brokerPropertiesRef = useMemoFirebase(
    () => (isReady && firestore && responsePropertyIds.length > 0 ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid), where('__name__', 'in', responsePropertyIds.slice(0, 30))) : null),
    [isReady, firestore, responsePropertyIds]
  );
  const { data: partnerBrokerProperties } = useCollection<Property>(brokerPropertiesRef);

  const allPropertiesCache = useMemo(() => {
    const map = new Map<string, Property>();
    [...(globalProperties || []), ...(partnerBrokerProperties || [])].forEach(p => map.set(p.id, p));
    return map;
  }, [globalProperties, partnerBrokerProperties]);

  const isOwner = lead?.brokerId === user?.uid;

  const activeResponse = useMemo(() => {
    if (isOwner) {
      return responses.find(r => ['accepted', 'negotiating', 'closed'].includes(r.status)) || responses[0];
    } else {
      return responses.find(r => r.brokerId === user?.uid);
    }
  }, [isOwner, responses, user?.uid]);

  const partnerId = useMemo(() => {
    if (!lead || !user) return null;
    if (isOwner) {
      return activeResponse?.brokerId || null;
    } else {
      return lead.brokerId;
    }
  }, [lead, user, isOwner, activeResponse]);

  const isPartnerDataVisible = useMemo(() => {
    if (!activeResponse) return false;
    return ['accepted', 'negotiating', 'closed'].includes(activeResponse.status);
  }, [activeResponse]);

  const partnerBrokerRef = useMemoFirebase(
    () => (firestore && partnerId ? doc(firestore, 'brokers', partnerId) : null),
    [firestore, partnerId]
  );
  const { data: partnerBroker } = useDoc<any>(partnerBrokerRef);

  const partnerUserRef = useMemoFirebase(
    () => (firestore && partnerId ? doc(firestore, 'users', partnerId) : null),
    [firestore, partnerId]
  );
  const { data: partnerUser } = useDoc<any>(partnerUserRef);

  const createNotification = (targetBrokerId: string, title: string, content: string) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'announcements'), {
        title,
        content,
        recipients: [targetBrokerId],
        type: 'rede_oraora',
        status: 'sent',
        relatedId: id,
        createdAt: serverTimestamp()
    });
  };

  const handleCloseRequest = () => {
    if (!leadRef) return;
    setDocumentNonBlocking(leadRef, { "network.status": 'closed', "network.published": false }, { merge: true });
    toast({ title: "Solicitação encerrada" });
    router.push('/dashboard/solicitacoes-rede');
  };

  const updateResponseStatus = (res: NetworkResponse, newStatus: NetworkResponse['status'], extras: object = {}) => {
    if (!isReady || !firestore || !id) return;
    const respRef = doc(firestore, 'leads', id, 'networkResponses', res.id);
    
    setDocumentNonBlocking(respRef, { 
        status: newStatus, 
        updatedAt: serverTimestamp(),
        lastUpdate: serverTimestamp(),
        ...extras
    }, { merge: true });

    let title = "";
    let content = "";
    const myName = userProfile?.username || user?.displayName || 'Um corretor';

    switch(newStatus) {
        case 'accepted':
            title = "Proposta Aceita!";
            content = `${myName} aceitou sua proposta para a solicitação #${id.substring(0,6)}.`;
            break;
        case 'negotiating':
            title = "Negociação Iniciada";
            content = `${myName} iniciatou uma negociação com você.`;
            break;
        case 'closed':
            title = "Negócio Concluído! 🚀";
            content = `Parabéns! A parceria para a solicitação #${id.substring(0,6)} foi finalizada com sucesso.`;
            break;
        case 'cancelled':
            title = "Parceria Cancelada";
            content = `A negociação para a solicitação #${id.substring(0,6)} foi encerrada.`;
            break;
    }

    if (title) createNotification(res.brokerId, title, content);
    toast({ title: `Status atualizado: ${statusDetails[newStatus]?.label}` });
  };

  if (isLoadingLead || !isReady) return <div className="p-20 text-center italic text-slate-400">Carregando dossiê...</div>;
  if (!lead || !lead.network?.published) return <div className="p-20 text-center space-y-4">
      <p>Esta solicitação não está mais ativa.</p>
      <button onClick={() => router.push('/dashboard/solicitacoes-rede')} className="px-6 py-2 rounded-lg bg-slate-900 text-white font-bold">Voltar</button>
  </div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 text-left pb-20">
      <AlertDialog>
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col gap-2 text-left">
            <button onClick={() => router.push('/dashboard/solicitacoes-rede')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors uppercase text-[10px] font-black tracking-widest mb-2 border-none bg-transparent cursor-pointer outline-none">
              <ArrowLeft className="size-3" /> Central de Oportunidades
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Dossiê #{id.substring(0, 8).toUpperCase()}</h1>
              <Badge className={cn("border-none text-[10px] font-black uppercase tracking-widest", lead.network.status === 'open' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                  {lead.network.status === 'open' ? 'Solicitação Aberta' : 'Encerrada'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="h-12 px-6 rounded-xl border-2 border-slate-100 font-bold hover:bg-slate-50"><Share2 className="size-4 mr-2" /> Compartilhar</Button>
              {isOwner && (
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="h-12 px-6 rounded-xl font-bold">Encerrar Solicitação</Button>
                  </AlertDialogTrigger>
              )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-3xl p-8 lg:p-12 shadow-soft border border-slate-100 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Target className="size-32 text-primary" /></div>
              <div className="flex items-center gap-3 mb-8">
                <ClipboardList className="size-5 text-primary" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Dossiê da Solicitação</h2>
              </div>
              <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl p-8 mb-10 border border-slate-100 shadow-inner text-left">
                  <p className="text-2xl text-slate-700 leading-relaxed font-medium italic">"{lead.network.description}"</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="space-y-8">
                      <div className="flex gap-4 items-start">
                          <div className="size-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 shrink-0"><MapPin className="size-5" /></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p><p className="text-base font-bold text-slate-900">{lead.network.neighborhood}, {lead.network.city}</p></div>
                      </div>
                      <div className="flex gap-4 items-start">
                          <div className="size-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 shrink-0"><DollarSign className="size-5" /></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investimento</p><p className="text-base font-bold text-slate-900">{lead.network.maxPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p></div>
                      </div>
                  </div>
              </div>
            </section>

            {isOwner && (
              <section className="space-y-8 text-left">
                  <div className="flex items-center justify-between px-2">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Propostas Recebidas</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                      {responses.length > 0 ? responses.map((res) => {
                          const prop = res.propertyId ? allPropertiesCache.get(res.propertyId) : null;
                          const status = statusDetails[res.status] || statusDetails.pending;
                          const StatusIcon = status.icon;
                          
                          return (
                              <div key={res.id} className="group bg-white rounded-3xl border transition-all duration-500 overflow-hidden shadow-soft hover:shadow-card">
                                  <div className="flex flex-col xl:flex-row">
                                      <div className="xl:w-80 h-64 xl:h-auto relative bg-slate-100 shrink-0 overflow-hidden">
                                          <Image src={prop?.midia?.[0] || 'https://picsum.photos/seed/prop/400/400'} alt="prop" fill className="object-cover" />
                                          <div className="absolute top-4 left-4 z-10">
                                            <Badge className={cn("border-none text-[9px] font-black uppercase px-3 py-1 shadow-lg", status.color)}>
                                              <StatusIcon className="size-3 mr-1" /> {status.label}
                                            </Badge>
                                          </div>
                                      </div>
                                      <div className="flex-1 p-8 flex flex-col gap-6 text-left">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                              <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border font-bold uppercase">{res.brokerName.charAt(0)}</div>
                                              <div>
                                                <p className="text-sm font-black text-slate-900 uppercase">{res.brokerName}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{format(res.createdAt.toDate(), "dd MMM, HH:mm", { locale: ptBR })}</p>
                                              </div>
                                            </div>
                                            <ResponseStepper status={res.status} />
                                          </div>

                                          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 relative text-left">
                                            <Quote className="absolute top-2 right-2 size-10 text-slate-100" />
                                            <p className="text-sm text-slate-600 font-medium italic relative z-10">"{res.message}"</p>
                                          </div>

                                          <div className="mt-auto pt-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                                              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><Maximize className="size-3" /> {prop?.caracteristicasimovel.tamanho}</span>
                                                <span className="flex items-center gap-1"><Bed className="size-3" /> {formatQuartos(prop?.caracteristicasimovel.quartos)} Dorms</span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                  {res.status === 'pending' && (
                                                    <>
                                                      <Button onClick={() => updateResponseStatus(res, 'accepted')} className="bg-primary text-slate-950 font-black uppercase text-[10px] rounded-xl h-10 px-6">Aceitar Parceira</Button>
                                                      <Button variant="ghost" onClick={() => updateResponseStatus(res, 'rejected')} className="text-red-500 font-bold uppercase text-[10px] h-10 px-4">Recusar</Button>
                                                    </>
                                                  )}
                                                  {res.status === 'accepted' && (
                                                    <Button onClick={() => updateResponseStatus(res, 'negotiating')} className="bg-slate-900 text-white font-black uppercase text-[10px] rounded-xl h-10 px-6 shadow-glow">Iniciar Negociação</Button>
                                                  )}
                                                  {res.status === 'negotiating' && (
                                                    <>
                                                      <Button onClick={() => updateResponseStatus(res, 'closed', { closedAt: serverTimestamp() })} className="bg-primary text-slate-950 font-black uppercase text-[10px] rounded-xl h-10 px-6">Concluir Negócio</Button>
                                                      <Button variant="ghost" onClick={() => updateResponseStatus(res, 'cancelled', { cancelledAt: serverTimestamp(), cancelReason: 'Cancelado manualmente' })} className="text-slate-400 font-bold uppercase text-[10px] h-10 px-4">Cancelar Parceria</Button>
                                                    </>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      }) : (
                          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6 px-8"><div className="size-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><MessageCircle className="size-12" /></div><p className="text-slate-500 font-medium leading-relaxed">Ainda não há propostas para esta solicitação.</p></div>
                      )}
                  </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6 text-left">
              <section className="bg-slate-950 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden text-left border border-white/5">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[80px] opacity-10"></div>
                  <div className="flex flex-col gap-8 relative z-10">
                      <div className="flex items-center gap-3"><div className="size-11 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-inner"><Zap className="size-5" /></div><h3 className="text-xl font-black uppercase tracking-tight">Atividade</h3></div>
                      <div className="grid grid-cols-2 gap-y-8">
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Visualizações</p><p className="text-2xl font-black text-white">{lead.network.totalViews || 0}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Respostas</p><p className="text-2xl font-black text-primary">{responses?.length || 0}</p></div>
                      </div>
                  </div>
              </section>

              <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft text-left">
                  <div className="flex items-center gap-3 mb-8"><History className="size-5 text-slate-400" /><h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Timeline</h3></div>
                  <div className="relative pl-6 space-y-8 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      <div className="relative"><div className="absolute -left-[24px] top-1 size-2.5 rounded-full bg-primary border-2 border-white shadow-sm"></div><p className="text-xs font-black text-slate-900 uppercase">Solicitação Publicada</p><p className="text-[10px] text-slate-400 font-bold">{format(lead.network.publishedAt.toDate(), "dd 'de' MMM, HH:mm", { locale: ptBR })}</p></div>
                  </div>
              </section>

              {partnerId && (
                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft text-left">
                  <div className="flex items-center gap-3 mb-8">
                    <Handshake className="size-5 text-primary" />
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Parceiro da Negociação</h3>
                  </div>
                  
                  {!isPartnerDataVisible ? (
                    <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                        Os dados do parceiro serão liberados após o aceite da proposta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-primary/20 font-black text-xl uppercase overflow-hidden relative shadow-inner">
                          {(partnerBroker?.logoUrl || partnerUser?.profileImageUrl) ? (
                            <Image src={partnerBroker?.logoUrl || partnerUser?.profileImageUrl} alt="Partner" fill className="object-cover" />
                          ) : (
                            (partnerUser?.username || partnerBroker?.brandName || 'P').charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 uppercase truncate">{partnerUser?.username || partnerBroker?.brandName || 'Não informado'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {partnerBroker?.creci ? `CRECI: ${partnerBroker.creci}` : 'CRECI: Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-slate-50">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Empresa / Cidade</p>
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {partnerBroker?.brandName || 'Não informado'} • {partnerBroker?.city || 'Não informado'}
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Contatos Diretos</p>
                            <div className="grid gap-2">
                              <a href={partnerUser?.phone || partnerBroker?.phone ? `tel:${partnerUser?.phone || partnerBroker?.phone}` : '#'} className="flex items-center gap-2 group/link">
                                <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/link:bg-primary/20 group-hover/link:text-primary transition-colors">
                                  <span className="material-symbols-outlined text-base">call</span>
                                </div>
                                <span className="text-xs font-bold text-slate-600 group-hover/link:text-slate-900 transition-colors">
                                  {partnerUser?.phone || partnerBroker?.phone || 'Não informado'}
                                </span>
                              </a>
                              
                              <a 
                                href={(partnerUser?.whatsapp || partnerBroker?.whatsapp || partnerUser?.phone || partnerBroker?.phone) ? `https://wa.me/55${(partnerUser?.whatsapp || partnerBroker?.whatsapp || partnerUser?.phone || partnerBroker?.phone).replace(/\D/g, '')}` : '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 group/link"
                              >
                                <div className="size-7 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover/link:bg-green-600 group-hover/link:text-white transition-colors">
                                  <span className="material-symbols-outlined text-base">chat</span>
                                </div>
                                <span className="text-xs font-bold text-green-700 group-hover/link:underline transition-all">
                                  {partnerUser?.whatsapp || partnerBroker?.whatsapp || partnerUser?.phone || partnerBroker?.phone || 'Não informado'}
                                </span>
                              </a>

                              <a href={partnerUser?.email || partnerBroker?.publicEmail ? `mailto:${partnerUser?.email || partnerBroker?.publicEmail}` : '#'} className="flex items-center gap-2 group/link">
                                <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/link:bg-primary/20 group-hover/link:text-primary transition-colors">
                                  <span className="material-symbols-outlined text-base">mail</span>
                                </div>
                                <span className="text-xs font-bold text-slate-600 group-hover/link:text-slate-900 transition-colors truncate">
                                  {partnerUser?.email || partnerBroker?.publicEmail || 'Não informado'}
                                </span>
                              </a>
                            </div>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="pt-4 border-t border-slate-50 space-y-3">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Ações Rápidas</p>
                             <TooltipProvider delayDuration={0}>
                               <div className="grid grid-cols-3 gap-2">
                                  {/* Ligar */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="w-full">
                                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                                          <Button 
                                            variant="outline" 
                                            disabled={!(partnerUser?.phone || partnerBroker?.phone)}
                                            className="w-full h-10 px-0 flex items-center justify-center gap-2 rounded-xl border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            onClick={() => {
                                              const tel = partnerUser?.phone || partnerBroker?.phone;
                                              if (tel) window.open(`tel:${tel}`, '_self');
                                            }}
                                          >
                                            <Phone className="size-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Ligar</span>
                                          </Button>
                                        </motion.div>
                                      </div>
                                    </TooltipTrigger>
                                    {!(partnerUser?.phone || partnerBroker?.phone) && (
                                      <TooltipContent className="bg-slate-900 text-white border-none text-[10px] font-bold">Informação não disponível.</TooltipContent>
                                    )}
                                  </Tooltip>

                                  {/* WhatsApp */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="w-full">
                                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                                          <Button 
                                            variant="outline" 
                                            disabled={!(partnerUser?.whatsapp || partnerBroker?.whatsapp || partnerUser?.phone || partnerBroker?.phone)}
                                            className="w-full h-10 px-0 flex items-center justify-center gap-2 rounded-xl border-slate-100 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm"
                                            onClick={() => {
                                              const raw = partnerUser?.whatsapp || partnerBroker?.whatsapp || partnerUser?.phone || partnerBroker?.phone;
                                              if (raw) {
                                                const clean = raw.replace(/\D/g, '');
                                                window.open(`https://wa.me/55${clean}`, '_blank');
                                              }
                                            }}
                                          >
                                            <MessageCircle className="size-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">WhatsApp</span>
                                          </Button>
                                        </motion.div>
                                      </div>
                                    </TooltipTrigger>
                                    {!(partnerUser?.whatsapp || partnerBroker?.whatsapp || partnerUser?.phone || partnerBroker?.phone) && (
                                      <TooltipContent className="bg-slate-900 text-white border-none text-[10px] font-bold">Informação não disponível.</TooltipContent>
                                    )}
                                  </Tooltip>

                                  {/* E-mail */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="w-full">
                                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                                          <Button 
                                            variant="outline" 
                                            disabled={!(partnerUser?.email || partnerBroker?.publicEmail)}
                                            className="w-full h-10 px-0 flex items-center justify-center gap-2 rounded-xl border-slate-100 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm"
                                            onClick={() => {
                                              const mail = partnerUser?.email || partnerBroker?.publicEmail;
                                              if (mail) window.open(`mailto:${mail}`, '_self');
                                            }}
                                          >
                                            <Mail className="size-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">E-mail</span>
                                          </Button>
                                        </motion.div>
                                      </div>
                                    </TooltipTrigger>
                                    {!(partnerUser?.email || partnerBroker?.publicEmail) && (
                                      <TooltipContent className="bg-slate-900 text-white border-none text-[10px] font-bold">Informação não disponível.</TooltipContent>
                                    )}
                                  </Tooltip>
                               </div>
                             </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Card Próxima Ação */}
              {activeResponse && (
                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft text-center flex flex-col items-center">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    Próxima Ação
                  </h3>
                  
                  <div className="flex flex-col items-center gap-5">
                    <div className="size-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl shadow-inner mb-2 animate-in zoom-in duration-500">
                      {activeResponse.status === 'pending' && '⏳'}
                      {activeResponse.status === 'accepted' && '🤝'}
                      {activeResponse.status === 'negotiating' && '📅'}
                      {activeResponse.status === 'closed' && '🎉'}
                      {(activeResponse.status === 'cancelled' || activeResponse.status === 'rejected') && '⚠'}
                    </div>
                    
                    <p className="text-sm font-bold text-slate-600 leading-relaxed max-w-[240px]">
                      {activeResponse.status === 'pending' && 'Aguardando análise da proposta pelo corretor originador.'}
                      {activeResponse.status === 'accepted' && 'Entre em contato com seu parceiro para iniciar a negociação.'}
                      {activeResponse.status === 'negotiating' && 'A negociação está em andamento. Mantenham contato para atualizar o andamento da parceria.'}
                      {activeResponse.status === 'closed' && 'Parceria concluída com sucesso.'}
                      {(activeResponse.status === 'cancelled' || activeResponse.status === 'rejected') && 'Esta parceria foi encerrada.'}
                    </p>
                  </div>
                </section>
              )}
          </div>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Solicitação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá a solicitação da Central de Oportunidades pública da rede.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseRequest} className="bg-destructive hover:bg-destructive/90">Confirmar Encerramento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  
  function formatQuartos(quartosData: any): string {
    if (!quartosData) return 'N/A';
    const dataAsString = Array.isArray(quartosData) ? quartosData.join(' ') : String(quartosData);
    const numbers = dataAsString.match(/\d+/g);
    if (!numbers || numbers.length === 0) return dataAsString.trim() || 'N/A';
    const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (uniqueNumbers.length === 0) return 'N/A';
    if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
    const last = uniqueNumbers.pop();
    return `${uniqueNumbers.join(', ')} e ${last}`;
  }
}
