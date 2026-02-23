'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';


type Note = {
    id: string;
    text: string;
    createdAt: string;
    authorId: string;
    authorName: string;
};

type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    clientType?: 'comprador' | 'vendedor';
    propertyInterest?: string;
    source?: string;
    status: string;
    createdAt: Timestamp;
    address?: {
        street?: string;
        city?: string;
        state?: string;
    };
    personaIds?: string[];
    notes?: Note[];
};

type Persona = {
    id: string;
    name: string;
    icon: string;
    iconBackgroundColor: string;
}

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
};

type ClientDetailViewProps = {
    client: Lead;
    personas: Persona[];
    recommendedProperties: Property[];
    linkedProperties: Property[];
    brokerSlug?: string;
};

export default function ClientDetailView({ client, personas, recommendedProperties, linkedProperties, brokerSlug }: ClientDetailViewProps) {
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const { toast } = useToast();
    const { user } = useAuthContext();
    const firestore = useFirestore();
    const [newNote, setNewNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    
    // Pagination state for recommended properties
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(recommendedProperties.length / itemsPerPage);
    const [editingNote, setEditingNote] = useState<{ id: string; text: string } | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    
    const paginatedRecommendedProperties = recommendedProperties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };


    const handlePropertySelection = (propertyId: string) => {
        setSelectedProperties(prev => 
            prev.includes(propertyId) 
                ? prev.filter(id => id !== propertyId)
                : [...prev, propertyId]
        );
    };

    const handleShare = () => {
        if (selectedProperties.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhum imóvel selecionado',
                description: 'Selecione pelo menos um imóvel para compartilhar.'
            });
            return;
        }

        const siteUrl = window.location.origin;
        const propertyLinks = selectedProperties.map(id => `${siteUrl}/sites/${brokerSlug}/imovel/${id}`).join('\n');
        
        const message = encodeURIComponent(`Olá ${client.name}! Conforme nossa conversa, seguem os links para os imóveis que selecionei para você:\n\n${propertyLinks}`);
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${message}`;

        window.open(whatsappUrl, '_blank');
    };

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
            await setDocumentNonBlocking(docRef, { notes: updatedNotes }, { merge: true });
            
            setNewNote('');
            toast({
                title: 'Nota Adicionada!',
                description: 'Sua observação foi salva no histórico do cliente.',
            });
        } catch (error) {
            console.error("Error adding note:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: 'Não foi possível adicionar a nota.',
            });
        } finally {
            setIsSavingNote(false);
        }
    };
    
    const handleUpdateNote = async () => {
        if (!editingNote || !client || !firestore) return;
        const updatedNotes = client.notes?.map(note =>
            note.id === editingNote.id ? { ...note, text: editingNote.text, updatedAt: new Date().toISOString() } : note
        ) || [];
        const docRef = doc(firestore, 'leads', client.id);
        await setDocumentNonBlocking(docRef, { notes: updatedNotes }, { merge: true });
        toast({ title: 'Nota Atualizada!', description: 'Sua nota foi salva com sucesso.' });
        setEditingNote(null);
    };

    const handleStartEdit = (note: Note) => {
        setEditingNote({ id: note.id, text: note.text });
    };

    const handleDeleteNote = async () => {
        if (!noteToDelete || !client || !firestore) return;
        const updatedNotes = client.notes?.filter(note => note.id !== noteToDelete.id) || [];
        const docRef = doc(firestore, 'leads', client.id);
        await setDocumentNonBlocking(docRef, { notes: updatedNotes }, { merge: true });
        toast({ title: 'Nota Excluída!', description: 'A nota foi removida do histórico.' });
        setNoteToDelete(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">Ativo</span>;
            case 'contacted':
                return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-200 uppercase tracking-wider">Em Contato</span>;
            // Add other statuses here
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 uppercase tracking-wider">{status}</span>;
        }
    }
    
    const getSourceBadge = (source: string | undefined) => {
        if (!source) return null;
        switch (source.toLowerCase()) {
            case 'google':
            case 'google / busca orgânica':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><span className="material-symbols-outlined text-[14px]">public</span>Google Orgânico</span>
            case 'site':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><span className="material-symbols-outlined text-[14px]">public</span>Site</span>
            default:
                 return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"><span className="material-symbols-outlined text-[14px]">help</span>{source}</span>
        }
    }

    return (
      <AlertDialog>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">person</span>
                            Dados Pessoais
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">Nome Completo</span>
                                <p className="text-text-main font-medium">{client.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">E-mail</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-text-main font-medium">{client.email}</p>
                                    <button className="text-gray-400 hover:text-primary transition-colors" title="Copiar E-mail">
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">Telefone / WhatsApp</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-text-main font-medium">{client.phone}</p>
                                    <a className="text-green-600 hover:text-green-700 transition-colors bg-green-50 rounded-full p-1" href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp">
                                        <span className="material-symbols-outlined text-[16px] block">chat</span>
                                    </a>
                                </div>
                            </div>
                            {client.address?.street && (
                                <div className="space-y-1">
                                    <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">Endereço</span>
                                    <p className="text-text-main font-medium">{client.address.street}</p>
                                    <p className="text-text-secondary text-sm">{client.address.city} - {client.address.state}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                        <span className="material-symbols-outlined text-secondary">groups</span>
                        Perfil do Cliente (Personas)
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {personas.length > 0 ? personas.map((persona) => (
                            <div key={persona.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                                <div className={`size-8 rounded-full ${persona.iconBackgroundColor} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined text-sm">{persona.icon}</span>
                                </div>
                                <span className="font-bold text-sm text-text-main">{persona.name}</span>
                            </div>
                        )) : (
                            <p className="text-sm text-text-secondary">Nenhuma persona associada a este cliente.</p>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">interests</span>
                            Perfil de Interesse
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">O que procura</span>
                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg">
                                    <p className="text-text-main text-sm leading-relaxed">
                                        {client.propertyInterest || 'Nenhum interesse específico detalhado.'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">Origem do Lead</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {getSourceBadge(client.source)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">real_estate_agent</span>
                            Imóveis do Cliente
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                       {linkedProperties.length > 0 ? linkedProperties.map((prop) => (
                           <div key={prop.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                               <div className="size-16 rounded-md overflow-hidden bg-gray-200 shrink-0">
                                   <Image src={prop.midia?.[0] || 'https://placehold.co/100x100'} alt={prop.informacoesbasicas.nome} width={64} height={64} className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1">
                                   <p className="font-bold text-text-main text-sm">{prop.informacoesbasicas.nome}</p>
                                   <p className="text-xs text-text-secondary">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                                   {prop.informacoesbasicas.valor && <p className="text-xs font-bold text-primary mt-1">{prop.informacoesbasicas.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>}
                               </div>
                               <Button asChild variant="outline" size="sm">
                                   <Link href={`/dashboard/imoveis/editar/${prop.id}`}>Detalhes</Link>
                               </Button>
                           </div>
                       )) : (
                           <p className="text-sm text-text-secondary text-center py-4">Nenhum imóvel diretamente associado a este cliente.</p>
                       )}
                    </div>
                </div>


                 <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">recommend</span>
                            Indicação de Vendas
                        </h3>
                        <Button onClick={handleShare} disabled={selectedProperties.length === 0} className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">share</span>
                            Compartilhar ({selectedProperties.length})
                        </Button>
                    </div>
                    <div className="p-6 space-y-4">
                       {recommendedProperties.length > 0 ? paginatedRecommendedProperties.map((prop) => (
                           <div key={prop.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                               <Checkbox
                                    id={`prop-${prop.id}`}
                                    checked={selectedProperties.includes(prop.id)}
                                    onCheckedChange={() => handlePropertySelection(prop.id)}
                                    className="mr-2"
                                />
                               <div className="size-16 rounded-md overflow-hidden bg-gray-200 shrink-0">
                                   <Image src={prop.midia?.[0] || 'https://placehold.co/100x100'} alt={prop.informacoesbasicas.nome} width={64} height={64} className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1">
                                   <p className="font-bold text-text-main text-sm">{prop.informacoesbasicas.nome}</p>
                                   <p className="text-xs text-text-secondary">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                                   {prop.informacoesbasicas.valor && <p className="text-xs font-bold text-primary mt-1">{prop.informacoesbasicas.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>}
                               </div>
                               <Button asChild variant="outline" size="sm">
                                   <Link href={`/dashboard/imoveis/${prop.id}`}>Detalhes</Link>
                               </Button>
                           </div>
                       )) : (
                           <p className="text-sm text-text-secondary text-center py-4">Nenhum imóvel recomendado para esta combinação de personas.</p>
                       )}
                    </div>
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm font-medium text-gray-500">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Próxima
                            </Button>
                        </div>
                    )}
                </div>

                 <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">history</span>
                            Histórico de Interações
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 rounded text-text-secondary cursor-pointer hover:border-secondary">Tudo</span>
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-transparent border border-transparent rounded text-text-secondary cursor-pointer hover:bg-gray-100">Notas</span>
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-transparent border border-transparent rounded text-text-secondary cursor-pointer hover:bg-gray-100">Tarefas</span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="relative pl-4 border-l border-gray-200 space-y-8">
                            {client.notes?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((note) => (
                               <div key={note.id} className="relative group">
                                {editingNote?.id === note.id ? (
                                    <div>
                                        <Textarea
                                            value={editingNote.text}
                                            onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                                            className="w-full bg-gray-50 p-3 rounded-lg border border-primary mb-2"
                                            rows={3}
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)}>Cancelar</Button>
                                            <Button size="sm" onClick={handleUpdateNote}>Salvar</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="absolute -left-[23px] top-1 bg-secondary rounded-full size-3.5 border-2 border-white shadow-sm group-hover:scale-110 transition-transform"></span>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-sm text-text-main pr-24">Nota de {note.authorName}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-text-secondary font-medium">{note.createdAt ? new Date(note.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'}) : 'Data inválida'}</span>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(note)}>
                                                        <span className="material-symbols-outlined text-base">edit</span>
                                                    </Button>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setNoteToDelete(note)}>
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {note.text}
                                        </p>
                                    </>
                                )}
                               </div>
                            ))}
                            <div className="relative group">
                                <span className="absolute -left-[23px] top-1 bg-gray-300 rounded-full size-3.5 border-2 border-white shadow-sm group-hover:bg-secondary transition-colors"></span>
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                                    <h4 className="font-bold text-sm text-text-main">Novo Cliente Cadastrado</h4>
                                    <span className="text-xs text-text-secondary font-medium">{client.createdAt?.toDate ? new Date(client.createdAt.toDate()).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) : ''}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Cadastro realizado via {client.source}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 sticky top-24">
                    <h3 className="text-lg font-bold text-text-main mb-4 border-b border-gray-100 pb-2">Ações Rápidas</h3>
                    <details className="group bg-gray-50 rounded-lg border border-gray-200 open:bg-white open:ring-2 open:ring-secondary/20 transition-all duration-300">
                        <summary className="flex items-center justify-between p-3 cursor-pointer select-none font-bold text-sm text-text-main hover:text-primary-hover transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="bg-secondary text-text-main rounded p-1">
                                    <span className="material-symbols-outlined text-[18px] block">note_add</span>
                                </div>
                                Adicionar Nota
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
                        </summary>
                        <div className="p-3 pt-0 animate-fade-in border-t border-gray-100 mt-2">
                            <textarea 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400 min-h-[100px] mb-2" 
                                placeholder="Digite sua nota sobre o cliente..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            ></textarea>
                            <button 
                                className="w-full bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                                onClick={handleAddNote}
                                disabled={isSavingNote || !newNote.trim()}
                            >
                                {isSavingNote ? 'Salvando...' : 'Salvar Nota'}
                            </button>
                        </div>
                    </details>
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-text-main mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
                            Tarefas Associadas
                            <button className="text-secondary hover:text-primary transition-colors" title="Nova Tarefa">
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            </button>
                        </h3>
                        <div className="space-y-3">
                             {/* Mockup task */}
                             <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-orange-500 text-[18px]">calendar_clock</span>
                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Reunião</span>
                                    </div>
                                    <a className="text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100" href="#">
                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    </a>
                                </div>
                                <h4 className="text-sm font-bold text-text-main mb-0.5">Apresentação de Proposta</h4>
                                <p className="text-xs text-text-secondary mb-2">Ref. Imóvel 5501 - Ed. Horizonte</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <span className="material-symbols-outlined text-[14px]">event</span>
                                    22 Out, 10:00
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir esta nota?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A nota será removida permanentemente do histórico deste cliente.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
                    Sim, Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
}
