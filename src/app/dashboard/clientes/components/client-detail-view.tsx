'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext, useFirestore, setDocumentNonBlocking, useFirebase, addDocumentNonBlocking, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { doc, Timestamp, collection, query, where, orderBy, arrayUnion, arrayRemove, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Progress } from "@/components/ui/progress";
import { uploadFile } from '@/lib/storage';
import { ref as storageRef, deleteObject } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Checkbox } from "@/components/ui/checkbox";

type Note = {
    id: string;
    text: string;
    createdAt: string;
    authorId: string;
    authorName: string;
};

type ClientDocument = {
    url: string;
    name: string;
    uploadedAt: string;
    status: 'pending' | 'verified' | 'rejected';
};

type Financing = {
    bank: string;
    status: 'Não iniciado' | 'Em análise' | 'Aprovado' | 'Reprovado';
    value: number;
    updatedAt: string;
};

type Proposal = {
    id: string;
    propertyId: string;
    propertyTitle: string;
    offeredValue: number;
    entryValue: number;
    financingValue: number;
    status: 'Negociação' | 'Aceita' | 'Recusada' | 'Arquivada';
    createdAt: string;
};

type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    clientType?: 'comprador' | 'vendedor';
    propertyInterest?: string;
    status: string;
    createdAt: Timestamp;
    address?: {
        street?: string;
        city?: string;
        state?: string;
    };
    personaIds?: string[];
    notes?: Note[];
    potentialValue?: number;
    documents?: {
        identity?: ClientDocument;
        civilStatus?: ClientDocument;
        residence?: ClientDocument;
        income?: ClientDocument;
    };
    financing?: Financing;
    proposals?: Proposal[];
};

type Persona = {
    id: string;
    name: string;
    icon: string;
    iconBackgroundColor: string;
    description?: string;
}

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
  caracteristicasimovel: {
      tamanho?: string;
  };
};

type Event = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'reuniao' | 'visita' | 'tarefa' | 'particular' | 'outro';
  completed?: boolean;
  clientId?: string;
  description?: string;
  location?: string;
  broker?: string;
};

type ClientDetailViewProps = {
    client: Lead;
    personas: Persona[];
    recommendedProperties: Property[];
    linkedProperties: Property[];
    brokerSlug?: string;
};

export default function ClientDetailView({ client, personas, recommendedProperties, linkedProperties, brokerSlug }: ClientDetailViewProps) {
    const { toast } = useToast();
    const { user, storage } = useFirebase();
    const firestore = useFirestore();
    const [newNote, setNewNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [isSavingLink, setIsSavingLink] = useState<string | null>(null);
    const [isPersonaPickerOpen, setIsPersonaPickerOpen] = useState(false);
    
    // Selection for sharing
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

    // --- Pagination for IA Recommendations ---
    const [recPage, setRecPage] = useState(1);
    const recsPerPage = 9;
    const totalRecPages = Math.ceil(recommendedProperties.length / recsPerPage);
    const paginatedRecs = recommendedProperties.slice((recPage - 1) * recsPerPage, recPage * recsPerPage);

    // Reset to first page when client/persona changes
    useEffect(() => {
        setRecPage(1);
        setSelectedPropertyIds([]); // Clear selection when profile changes
    }, [client.personaIds]);

    // Fetch all available personas for the picker
    const allPersonasQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null),
        [firestore]
    );
    const { data: allPersonas, isLoading: areAllPersonasLoading } = useCollection<Persona>(allPersonasQuery);

    // Pagination for Linked Properties
    const [linkedPropsPage, setLinkedPropsPage] = useState(1);
    const propsPerPage = 3;
    const totalLinkedPages = Math.ceil(linkedProperties.length / propsPerPage);
    const paginatedLinkedProps = linkedProperties.slice((linkedPropsPage - 1) * propsPerPage, linkedPropsPage * propsPerPage);

    // Fetch Events for this Client
    const clientEventsQuery = useMemoFirebase(
        () => {
            if (firestore && user?.uid && client?.id) {
                return query(
                    collection(firestore, 'events'), 
                    where('brokerId', '==', user.uid),
                    where('clientId', '==', client.id), 
                    orderBy('date', 'desc'), 
                    orderBy('time', 'desc')
                );
            }
            return null;
        },
        [firestore, user?.uid, client?.id]
    );
    const { data: clientEvents, isLoading: areEventsLoading } = useCollection<Event>(clientEventsQuery);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'qualified': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'proposal': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'converted': return 'bg-green-100 text-green-800 border-green-200';
            case 'lost': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !user || !client || !firestore) return;
        setIsSavingNote(true);
        const noteToAdd: Note = {
            id: uuidv4(),
            text: newNote,
            createdAt: new Date().toISOString(),
            authorId: user.uid,
            authorName: user.displayName || 'Usuário',
        };
        const updatedNotes = [...(client.notes || []), noteToAdd];
        try {
            const docRef = doc(firestore, 'leads', client.id);
            setDocumentNonBlocking(docRef, { notes: updatedNotes }, { merge: true });
            setNewNote('');
            toast({ title: 'Nota Adicionada!', description: 'Sua observação foi salva no histórico do cliente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível adicionar a nota.' });
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleDeleteNote = async () => {
        if (!noteToDelete || !client || !firestore) return;
        const updatedNotes = client.notes?.filter(note => note.id !== noteToDelete.id) || [];
        const docRef = doc(firestore, 'leads', client.id);
        setDocumentNonBlocking(docRef, { notes: updatedNotes }, { merge: true });
        toast({ title: 'Nota Excluída!', description: 'A nota foi removida do histórico.' });
        setNoteToDelete(null);
    };

    const handleLinkProperty = async (propertyId: string) => {
        if (!firestore || !user?.uid || !client.id) return;
        setIsSavingLink(propertyId);
        
        const journeysQuery = query(
            collection(firestore, 'journeys'), 
            where('clientId', '==', client.id), 
            where('brokerId', '==', user.uid)
        );
        
        try {
            const snap = await getDocs(journeysQuery);
            if (!snap.empty) {
                const journeyDoc = snap.docs[0];
                const journeyRef = doc(firestore, 'journeys', journeyDoc.id);
                setDocumentNonBlocking(journeyRef, { 
                    propertyIds: arrayUnion(propertyId) 
                }, { merge: true });
                toast({ title: "Imóvel Vinculado!", description: "O imóvel foi adicionado aos interesses do cliente." });
            } else {
                toast({ variant: 'destructive', title: "Aviso", description: "Crie uma Jornada para este cliente antes de vincular imóveis." });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao vincular" });
        } finally {
            setIsSavingLink(null);
        }
    };

    const handleSelectPersona = (personaId: string) => {
        if (!firestore || !client.id) return;
        const docRef = doc(firestore, 'leads', client.id);
        setDocumentNonBlocking(docRef, { personaIds: [personaId] }, { merge: true });
        toast({ title: "Persona Definida!", description: "O perfil do cliente foi atualizado." });
        setIsPersonaPickerOpen(false);
    };

    const togglePropertySelection = (id: string) => {
        setSelectedPropertyIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleShareSelection = () => {
        if (selectedPropertyIds.length === 0 || !brokerSlug) return;

        const selectedProps = recommendedProperties.filter(p => selectedPropertyIds.includes(p.id));
        
        let message = `Olá ${client.name}! Separei estas oportunidades exclusivas que combinam perfeitamente com o seu perfil:\n\n`;
        
        selectedProps.forEach(prop => {
            const link = `https://oraora.com.br/sites/${brokerSlug}/imovel/${prop.informacoesbasicas.slug || prop.id}`;
            message += `📍 *${prop.informacoesbasicas.nome}*\n${prop.localizacao.bairro}, ${prop.localizacao.cidade}\n🔗 ${link}\n\n`;
        });

        message += `O que achou destas opções? Podemos agendar uma visita?`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = client.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        toast({ title: "WhatsApp Aberto", description: "A mensagem foi preparada com os links selecionados." });
    };

    const currentPersona = personas[0];

    return (
      <div className="flex flex-col gap-6">
        <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir esta nota?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive">Sim, Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Persona Detail Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-green-700">
                                    <span className="material-symbols-outlined font-bold">psychology</span>
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Perfil (Persona)</h3>
                            </div>
                            {currentPersona && (
                                <button onClick={() => setIsPersonaPickerOpen(true)} className="text-[10px] font-black text-green-700 hover:underline uppercase tracking-widest cursor-pointer">Trocar Perfil</button>
                            )}
                        </div>
                        {currentPersona ? (
                            <div className="flex-1 space-y-6">
                                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                                    <p className="text-green-700 font-black text-xl mb-2">{currentPersona.name}</p>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{currentPersona.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilo de Vida</span>
                                        <p className="text-xs font-bold">Exclusivo & Moderno</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</span>
                                        <p className="text-xs font-bold text-green-700">Alta Atividade</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">person_search</span>
                                <p className="text-xs text-slate-400 font-medium">Nenhuma persona vinculada.</p>
                                <Dialog open={isPersonaPickerOpen} onOpenChange={setIsPersonaPickerOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="text-xs font-bold text-green-700 mt-2">Definir Perfil</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
                                        <DialogHeader className="p-6 border-b border-slate-100">
                                            <DialogTitle>Definir Perfil do Cliente</DialogTitle>
                                            <DialogDescription>Escolha a persona que melhor descreve este cliente para receber recomendações inteligentes.</DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-y-auto p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {areAllPersonasLoading ? <p>Carregando perfis...</p> : allPersonas?.map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        onClick={() => handleSelectPersona(p.id)}
                                                        className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className={cn("size-8 rounded-lg flex items-center justify-center", p.iconBackgroundColor)}>
                                                                <span className="material-symbols-outlined text-sm">{p.icon}</span>
                                                            </div>
                                                            <h4 className="font-bold text-slate-900 group-hover:text-green-700 transition-colors">{p.name}</h4>
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <DialogFooter className="p-6 border-t border-slate-100">
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancelar</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>

                    {/* Property Summary (Interests) */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-green-700">
                                    <span className="material-symbols-outlined font-bold">apartment</span>
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Imóveis de Interesse</h3>
                            </div>
                            <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black px-2 py-1 rounded text-slate-500 uppercase">{linkedProperties.length} itens</span>
                        </div>
                        <div className="space-y-3 flex-1">
                            {linkedProperties.length > 0 ? (
                                paginatedLinkedProps.map((prop) => (
                                    <div key={prop.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all shadow-sm">
                                        <div className="h-12 w-12 rounded-lg bg-cover bg-center shrink-0 border border-slate-200" style={{ backgroundImage: `url('${prop.midia?.[0] || 'https://placehold.co/100x100'}')` }}></div>
                                        <div className="flex-1 overflow-hidden min-w-0">
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{prop.informacoesbasicas.nome}</p>
                                            <p className="text-[10px] text-green-700 font-bold mt-0.5">{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
                                        </div>
                                        <Link href={`/dashboard/imoveis/${prop.id}`} className="p-1.5 rounded-lg text-slate-300 group-hover:text-green-700 transition-colors">
                                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-xs text-slate-400">Nenhum imóvel vinculado.</p>
                                </div>
                            )}
                        </div>
                        {totalLinkedPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => setLinkedPropsPage(p => Math.max(1, p - 1))} disabled={linkedPropsPage === 1} className="text-[10px] font-black text-slate-400 hover:text-green-700 disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span> Anterior</button>
                                <button onClick={() => setLinkedPropsPage(p => Math.min(totalLinkedPages, p + 1))} disabled={linkedPropsPage === totalLinkedPages} className="text-[10px] font-black text-slate-400 hover:text-green-700 disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors">Próximo <span className="material-symbols-outlined text-sm">chevron_right</span></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Recommendations Section */}
                <div id="ai-suggestions" className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-20 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-green-700 shadow-sm">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sugestões da IA para {client.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">Imóveis compatíveis com o perfil de <strong>{currentPersona?.name || 'Comprador'}</strong></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                            <span>{recommendedProperties.length} imóveis compatíveis</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendedProperties.length > 0 ? (
                            paginatedRecs.map((prop) => {
                                const isSelected = selectedPropertyIds.includes(prop.id);
                                return (
                                <div key={prop.id} className={cn(
                                    "group flex flex-col bg-slate-50 dark:bg-slate-800/30 rounded-2xl border transition-all duration-300 relative",
                                    isSelected ? "border-primary ring-2 ring-primary shadow-glow" : "border-slate-100 dark:border-slate-800 hover:border-primary/50 overflow-hidden"
                                )}>
                                    <div className="absolute top-3 left-3 z-20">
                                        <Checkbox 
                                            checked={isSelected}
                                            onCheckedChange={() => togglePropertySelection(prop.id)}
                                            className="size-6 rounded-lg border-2 border-white bg-white/20 backdrop-blur shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </div>
                                    <div className="relative h-40 w-full overflow-hidden rounded-t-2xl">
                                        <Image src={prop.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'} alt={prop.informacoesbasicas.nome} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-3 right-3 bg-primary text-black text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg">
                                            98% Match
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mb-1 uppercase tracking-tight">{prop.informacoesbasicas.nome}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                                        <div className="mt-auto pt-4 border-t border-slate-200/50 flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleLinkProperty(prop.id); }}
                                                disabled={isSavingLink === prop.id}
                                                className="size-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-green-700 hover:scale-110 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                                title="Vincular ao Interesse"
                                            >
                                                {isSavingLink === prop.id ? (
                                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <p className="text-sm text-slate-400 font-medium">Nenhuma recomendação compatível encontrada no inventário atual.</p>
                            </div>
                        )}
                    </div>

                    {/* Floating Action Bar for Selection */}
                    {selectedPropertyIds.length > 0 && (
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 duration-300">
                            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">{selectedPropertyIds.length} selecionado{selectedPropertyIds.length > 1 ? 's' : ''}</span>
                                    <p className="text-[10px] text-slate-400">Compartilhe no WhatsApp</p>
                                </div>
                                <div className="h-8 w-px bg-white/10"></div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setSelectedPropertyIds([])}
                                        className="text-white hover:text-red-400 h-11 px-4"
                                    >
                                        Limpar
                                    </Button>
                                    <Button 
                                        onClick={handleShareSelection}
                                        className="bg-primary text-slate-900 font-black h-11 px-6 rounded-xl flex items-center gap-2 shadow-glow"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                        Compartilhar Seleção
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pagination Controls for Recommendations */}
                    {totalRecPages > 1 && (
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <p className="text-xs text-slate-500 font-medium">
                                Mostrando {(recPage - 1) * recsPerPage + 1} - {Math.min(recPage * recsPerPage, recommendedProperties.length)} de {recommendedProperties.length} imóveis
                            </p>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => { setRecPage(p => Math.max(1, p - 1)); document.getElementById('ai-suggestions')?.scrollIntoView({ behavior: 'smooth' }); }}
                                    disabled={recPage === 1}
                                    className="size-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-20 transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                {Array.from({ length: totalRecPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => { setRecPage(page); document.getElementById('ai-suggestions')?.scrollIntoView({ behavior: 'smooth' }); }}
                                        className={cn(
                                            "size-9 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                                            recPage === page 
                                                ? "bg-primary border-primary text-slate-900 shadow-sm" 
                                                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => { setRecPage(p => Math.min(totalRecPages, p + 1)); document.getElementById('ai-suggestions')?.scrollIntoView({ behavior: 'smooth' }); }}
                                    disabled={recPage === totalRecPages}
                                    className="size-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-20 transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Interaction Sidebar */}
            <div className="xl:col-span-1 space-y-6">
                
                {/* Internal Notes Section */}
                <div className="bg-slate-950 text-white p-6 rounded-2xl shadow-xl flex flex-col h-[500px]">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <span className="material-symbols-outlined text-green-700">sticky_note_2</span>
                        <h3 className="font-bold uppercase text-xs tracking-widest">Notas do Corretor</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4">
                        {client.notes?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                            <div key={note.id} className="p-4 bg-white/5 rounded-xl relative group border border-white/5 shadow-inner">
                                <p className="text-xs text-slate-300 leading-relaxed">"{note.text}"</p>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(note.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</p>
                                    <button onClick={() => setNoteToDelete(note)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 cursor-pointer">
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!client.notes || client.notes.length === 0) && (
                            <p className="text-xs text-gray-400 text-center py-10 italic">Nenhuma observação interna registrada.</p>
                        )}
                    </div>
                    <div className="pt-4 border-t border-white/10">
                        <textarea 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Adicionar nota rápida..."
                            className="w-full bg-white/5 border-none rounded-xl p-4 text-xs resize-none focus:ring-1 focus:ring-primary h-24 mb-3 text-white placeholder:text-gray-400 shadow-inner"
                        />
                        <Button 
                            onClick={handleAddNote}
                            disabled={isSavingNote || !newNote.trim()}
                            className="w-full font-black text-[10px] uppercase tracking-widest h-11 bg-primary text-slate-900 hover:brightness-110 shadow-glow"
                        >
                            Salvar Nota
                        </Button>
                    </div>
                </div>

                {/* Next Steps / Task Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-700">event_note</span>
                        Próximas Atividades
                    </h3>
                    <div className="space-y-4">
                        {clientEvents && clientEvents.filter(e => !e.completed).length > 0 ? (
                            clientEvents.filter(e => !e.completed).slice(0, 2).map(event => (
                                <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[9px] font-black text-green-700 uppercase">{event.type}</span>
                                        <span className="text-[9px] text-slate-400 font-bold">{format(parseISO(event.date), 'dd/MM')}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{event.title}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4 italic">Nenhuma atividade pendente.</p>
                        )}
                    </div>
                    <Button asChild variant="outline" className="w-full mt-6 h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest border-slate-200 hover:bg-primary hover:text-slate-950 hover:border-primary transition-all">
                        <Link href="/dashboard/agenda">Gerenciar Agenda</Link>
                    </Button>
                </div>
            </div>
        </div>

        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>
      </div>
    )
}
