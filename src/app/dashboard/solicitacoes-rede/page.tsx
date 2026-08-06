'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuthContext, useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Zap, 
  PlusCircle,
  Activity,
  Heart,
  Handshake,
  MoreVertical,
  Edit,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileSearch,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewRequestWizard } from './components/NewRequestWizard';
import { ResponseWizard } from './components/ResponseWizard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type Urgency = 'low' | 'normal' | 'high' | 'urgent';

interface Lead {
  id: string;
  brokerId: string;
  brokerName?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  network?: {
    published: boolean;
    description: string;
    urgency: Urgency;
    publishedAt: Timestamp;
    totalResponses: number;
    totalViews?: number;
    propertyType?: string;
    city?: string;
    neighborhood?: string;
    maxPrice?: number;
    status: 'open' | 'closed' | 'archived';
  };
}

const urgencyDetails: Record<Urgency, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-500' },
  normal: { label: 'Normal', color: 'bg-blue-500 text-white' },
  high: { label: 'Alta', color: 'bg-orange-500 text-white' },
  urgent: { label: 'Urgente', color: 'bg-red-500 text-white' },
};

export default function CentralOportunidadesPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'network' | 'my-requests'>('network');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isResponseWizardOpen, setIsResponseWizardOpen] = useState(false);
  const [selectedLeadForResponse, setSelectedLeadForResponse] = useState<Lead | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user?.uid) {
      const saved = localStorage.getItem(`oraora_fav_leads_${user.uid}`);
      if (saved) setFavorites(JSON.parse(saved));
    }
  }, [user?.uid]);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    if (user?.uid) localStorage.setItem(`oraora_fav_leads_${user.uid}`, JSON.stringify(next));
  };

  const networkQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid ? query(collection(firestore, 'leads'), where('network.published', '==', true), where('network.status', '==', 'open')) : null),
    [isReady, user?.uid, firestore]
  );
  const { data: networkLeads, isLoading: isNetworkLoading } = useCollection<Lead>(networkQuery);

  const myLeadsQuery = useMemoFirebase(
    () => (firestore && user && isReady ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null),
    [firestore, user?.uid, isReady]
  );
  const { data: initialMyLeads } = useCollection<Lead>(myLeadsQuery);

  const myRequests = useMemo(() => {
    if (!initialMyLeads) return [];
    return initialMyLeads.filter(l => !!l.network).sort((a, b) => (b.network?.publishedAt?.toMillis() || 0) - (a.network?.publishedAt?.toMillis() || 0));
  }, [initialMyLeads]);

  const networkOpportunities = useMemo(() => {
    if (!networkLeads) return [];
    return networkLeads.filter(op => {
      if (op.brokerId === user?.uid) return false;
      const term = search.toLowerCase();
      const matchesSearch = op.network?.description?.toLowerCase().includes(term) || op.brokerName?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (activeFilter === 'Favoritas') return favorites.includes(op.id);
      if (activeFilter === 'Urgentes') return op.network?.urgency === 'urgent' || op.network?.urgency === 'high';
      return true;
    }).sort((a, b) => (b.network?.publishedAt?.toMillis() || 0) - (a.network?.publishedAt?.toMillis() || 0));
  }, [networkLeads, search, activeFilter, favorites, user?.uid]);

  const handleArchiveRequest = (leadId: string, currentPublished: boolean) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'leads', leadId);
    setDocumentNonBlocking(docRef, { "network.published": !currentPublished, "network.status": !currentPublished ? 'open' : 'archived', updatedAt: serverTimestamp() }, { merge: true });
    toast({ title: currentPublished ? "Solicitação arquivada" : "Solicitação reativada" });
  };

  const handleDeleteRequest = () => {
    if (!firestore || !leadToDelete) return;
    const docRef = doc(firestore, 'leads', leadToDelete.id);
    setDocumentNonBlocking(docRef, { "network": null }, { merge: true });
    toast({ title: "Removido da rede" });
    setLeadToDelete(null);
  };

  // Pagination Logic
  const totalPages = Math.ceil(myRequests.length / itemsPerPage);
  const paginatedMyRequests = myRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-left pb-20">
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight uppercase">Central de Oportunidades</h1>
            <p className="text-text-secondary mt-1">Conecte sua demanda com as ofertas de toda a rede.</p>
            </div>
            <Button onClick={() => { setWizardMode('create'); setSelectedLeadId(null); setIsWizardOpen(true); }} className="bg-secondary text-white hover:text-black font-bold h-11 px-6 rounded-xl shadow-glow transition-all flex items-center gap-2">
            <PlusCircle className="size-5" /> Nova Solicitação
            </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <TabsList className="bg-transparent p-0 h-auto gap-8 border-b border-slate-100 w-full justify-start rounded-none mb-8">
            <TabsTrigger value="network" className="pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold">Marketplace Rede</TabsTrigger>
            <TabsTrigger value="my-requests" className="pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold">Minhas Solicitações</TabsTrigger>
            </TabsList>

            <TabsContent value="network" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex gap-4">
                            <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-14 pl-12 pr-4 bg-white border-slate-200 rounded-xl" placeholder="Busque por bairro, cidade ou corretor..." />
                            </div>
                            <div className="flex gap-2">
                            {['Todos', 'Favoritas', 'Urgentes'].map((filter) => (
                                <button key={filter} onClick={() => setActiveFilter(filter)} className={cn("px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeFilter === filter ? "bg-primary text-slate-900 shadow-md" : "bg-white text-slate-500 border border-slate-200")}>{filter}</button>
                            ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {isNetworkLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)
                            ) : networkOpportunities.length > 0 ? (
                            networkOpportunities.map((op) => (
                                <div key={op.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-8 flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-6 text-left">
                                    <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-12 border-2 border-slate-50"><AvatarFallback className="bg-slate-100 text-slate-400 font-bold uppercase">{op.brokerName?.charAt(0)}</AvatarFallback></Avatar>
                                        <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{op.brokerName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{op.network?.publishedAt ? formatDistanceToNow(op.network.publishedAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={cn("border-none text-[9px] font-black uppercase px-3 py-1 shadow-sm", urgencyDetails[op.network!.urgency]?.color)}>{urgencyDetails[op.network!.urgency]?.label}</Badge>
                                        <button onClick={() => toggleFavorite(op.id)} className={cn("p-2 rounded-full transition-all cursor-pointer border-none bg-transparent outline-none", favorites.includes(op.id) ? "text-red-500" : "text-slate-300 hover:text-red-400")}>
                                        <Heart className={cn("size-5", favorites.includes(op.id) && "fill-current")} />
                                        </button>
                                    </div>
                                    </div>
                                    <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{op.network?.propertyType} em {op.network?.neighborhood}, {op.network?.city}</h3>
                                    <p className="text-slate-600 text-lg font-medium italic leading-relaxed">"{op.network?.description}"</p>
                                    </div>
                                </div>
                                <div className="md:w-64 shrink-0 flex flex-col justify-center gap-4">
                                    <Button onClick={() => { setSelectedLeadForResponse(op); setIsResponseWizardOpen(true); }} className="h-14 bg-primary text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl shadow-glow hover:scale-[1.02] transition-all border-none cursor-pointer">
                                    <Handshake className="size-4 mr-2" /> Tenho Oferta
                                    </Button>
                                </div>
                                </div>
                            ))
                            ) : (
                            <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6 px-8">
                                <FileSearch className="size-12 text-slate-200" />
                                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Nenhuma oportunidade ativa na rede</h3>
                            </div>
                            )}
                        </div>
                    </div>
                    <aside className="lg:col-span-4 space-y-8 sticky top-24">
                        <Card className="bg-slate-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2"><Activity className="size-4" /> Atividade da Rede</h3>
                            <div className="grid grid-cols-2 gap-8 text-left">
                            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Solicitações</p><p className="text-3xl font-black text-white">{networkOpportunities.length}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status Rede</p><p className="text-3xl font-black text-primary">Ativa</p></div>
                            </div>
                        </Card>
                    </aside>
                </div>
            </TabsContent>

            <TabsContent value="my-requests" className="mt-0">
                <div className="grid grid-cols-1 gap-4">
                    {myRequests.length > 0 ? paginatedMyRequests.map((lead) => {
                    const hasResponses = (lead.network?.totalResponses || 0) > 0;
                    const isArchived = lead.network?.status === 'archived' || !lead.network?.published;
                    return (
                        <div key={lead.id} className={cn("bg-white p-6 rounded-[2rem] border transition-all flex flex-col md:flex-row items-center gap-6", hasResponses ? "border-primary shadow-glow" : "border-slate-100 shadow-soft", isArchived && "opacity-60 grayscale")}>
                        <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0"><PlusCircle className="size-8" /></div>
                        <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{lead.network?.description}</h3>
                            <p className="text-xs text-slate-500 font-medium">{lead.network?.neighborhood}, {lead.network?.city} • {lead.network?.propertyType}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 px-8 border-x border-slate-50">
                            <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Propostas</p><span className="text-2xl font-black text-primary-hover">{lead.network?.totalResponses || lead.network?.responses || 0}</span></div>
                            <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p><Badge variant="outline" className="text-[10px] font-bold uppercase">{lead.network?.status}</Badge></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild className="h-11 px-6 rounded-xl bg-slate-900 text-white font-bold"><Link href={`/dashboard/solicitacoes-rede/${lead.id}`}>Ver Dossiê</Link></Button>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="size-11 rounded-xl border-slate-200"><MoreVertical className="size-5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                                <DropdownMenuItem onClick={() => { setSelectedLeadId(lead.id); setWizardMode('edit'); setIsWizardOpen(true); }} className="gap-2 cursor-pointer font-bold text-xs uppercase"><Edit className="size-4" /> Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleArchiveRequest(lead.id, lead.network?.published || false)} className="gap-2 cursor-pointer font-bold text-xs uppercase"><Archive className="size-4" /> {lead.network?.published ? 'Arquivar' : 'Reativar'}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setLeadToDelete({ id: lead.id, name: lead.name }); }} className="gap-2 cursor-pointer font-bold text-xs uppercase text-red-500 focus:bg-red-50 focus:text-red-600">
                                    <Trash2 className="size-4" /> Excluir da Rede
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        </div>
                    );
                    }) : (
                    <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                        <PlusCircle className="size-12 text-slate-200" />
                        <p className="text-slate-500 font-medium">Você ainda não publicou demandas na rede.</p>
                    </div>
                    )}
                    
                    {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="size-4" /></Button>
                        <span className="text-sm font-bold">Página {currentPage} de {totalPages}</span>
                        <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="size-4" /></Button>
                    </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá permanentemente o registro da rede para {leadToDelete?.name}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeadToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest} className="bg-destructive hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewRequestWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialLeadId={selectedLeadId} mode={wizardMode} />
      {selectedLeadForResponse && <ResponseWizard isOpen={isResponseWizardOpen} onClose={() => setIsResponseWizardOpen(false)} request={selectedLeadForResponse} />}
    </div>
  );
}
