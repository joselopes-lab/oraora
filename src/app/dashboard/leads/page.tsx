
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useAuthContext, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy, writeBatch, serverTimestamp, getDocs, getDoc, Timestamp, limit } from 'firebase/firestore';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ClientSideDate = ({ date, options }: { date: Date, options?: Intl.DateTimeFormatOptions }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(date.toLocaleDateString('pt-BR', options));
  }, [date, options]);

  return <>{formattedDate || '...'}</>;
};


type LeadStatus = string;

type Lead = {
    id: string;
    name: string;
    propertyInterest?: string;
    phone: string;
    email: string;
    source: string;
    createdAt: Timestamp;
    status: LeadStatus;
    tempoPorEtapa?: { [key: string]: number };
    tempoTotalFechamentoEmDias?: number;
    leadScore?: number;
    leadQualification?: 'Quente' | 'Morno' | 'Frio';
};

type LeadFunnelColumn = {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  order: number;
}


const sourceStyles: { [key: string]: string } = {
    'WhatsApp': 'bg-green-50 text-green-700 border border-green-100',
    'Site': 'bg-blue-50 text-blue-700 border border-blue-100',
    'Ads': 'bg-purple-50 text-purple-700 border border-purple-100',
    'Indicação': 'bg-orange-50 text-orange-700 border border-orange-100',
    'Site Público': 'bg-blue-50 text-blue-700 border border-blue-100'
};

const sourceIcons: { [key: string]: string } = {
    'WhatsApp': 'chat',
    'Site': 'public',
    'Ads': 'campaign',
    'Indicação': 'person',
    'Site Público': 'public'
};

const qualificationStyles: { [key: string]: string } = {
    'Quente': 'bg-red-100 text-red-700 border border-red-200',
    'Morno': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Frio': 'bg-blue-100 text-blue-700 border border-blue-200',
};

const qualificationIcons: { [key: string]: string } = {
    'Quente': 'local_fire_department',
    'Morno': 'thermostat',
    'Frio': 'ac_unit',
};


const LeadCard = ({ lead, columns, onMove, onDragStart, onDeleteClick }: { lead: Lead, columns: LeadFunnelColumn[], onMove: (leadId: string, direction: 'prev' | 'next') => void, onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void, onDeleteClick: (lead: Lead) => void }) => {
    const columnIndex = columns.findIndex(col => col.id === lead.status);
    const canMovePrev = columnIndex > 0;
    const canMoveNext = columnIndex < columns.length - 1;

    return (
        <div 
            draggable={true}
            onDragStart={(e) => onDragStart(e, lead.id)}
            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:shadow-soft hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing relative ${lead.status === 'converted' ? 'border-l-4 border-l-secondary' : ''}`}>
            
            <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialogTrigger asChild>
                    <button onClick={() => onDeleteClick(lead)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </AlertDialogTrigger>
                <span className="material-symbols-outlined text-gray-300 cursor-grab">drag_indicator</span>
            </div>
            <div className="mb-3">
                <h4 className="font-bold text-text-main">{lead.name}</h4>
                <p className="text-xs text-text-secondary">{lead.propertyInterest || 'Nenhum interesse específico'}</p>
            </div>
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    {lead.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    {lead.email}
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${sourceStyles[lead.source] || 'bg-gray-100 text-gray-800'}`}>
                        <span className="material-symbols-outlined text-[12px]">{sourceIcons[lead.source] || 'help'}</span> {lead.source}
                    </span>
                    {lead.leadQualification && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${qualificationStyles[lead.leadQualification]}`}>
                            <span className="material-symbols-outlined text-[12px]">{qualificationIcons[lead.leadQualification]}</span> {lead.leadQualification}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {canMovePrev && (
                        <button onClick={() => onMove(lead.id, 'prev')} className="p-1 rounded hover:bg-gray-100 text-text-secondary hover:text-red-500 transition-colors" title="Voltar">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        </button>
                    )}
                    {canMoveNext && (
                        <button onClick={() => onMove(lead.id, 'next')} className="p-1 rounded hover:bg-gray-100 text-text-secondary hover:text-primary transition-colors" title="Avançar">
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    )}
                </div>
            </div>
             <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                {lead.createdAt && <ClientSideDate date={lead.createdAt.toDate()} options={{ day: '2-digit', month: 'short' }} />}
            </div>
        </div>
    );
};

export default function LeadsPage() {
    const { user, userProfile } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
    const [editableColumns, setEditableColumns] = useState<LeadFunnelColumn[]>([]);
    const [columnsToDelete, setColumnsToDelete] = useState<string[]>([]);
    const [isFunnelEditorOpen, setIsFunnelEditorOpen] = useState(false);
    const [hasCheckedForDefaultColumns, setHasCheckedForDefaultColumns] = useState(false);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');


    const leadsQuery = useMemoFirebase(
      () => {
        if (!firestore || !user) return null;
        if (userProfile?.userType === 'admin') {
          return query(collection(firestore, 'leads'));
        }
        return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid));
      },
      [firestore, user, userProfile]
    );

    const funnelColumnsQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns'), orderBy('order')) : null),
        [firestore, user]
    );

    const { data: leads, isLoading: areLeadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: columns, isLoading: areColumnsLoading } = useCollection<LeadFunnelColumn>(funnelColumnsQuery);

    const isLoading = areLeadsLoading || areColumnsLoading;

    // Effect to populate editable columns when modal opens or original columns change
    useEffect(() => {
        if (columns) {
            setEditableColumns([...columns]);
        }
    }, [columns]);


    // Effect to create default columns if none exist for a user
    useEffect(() => {
        if (!areColumnsLoading && user && firestore && !hasCheckedForDefaultColumns && columns?.length === 0) {
            setHasCheckedForDefaultColumns(true);
            const defaultColumns: LeadFunnelColumn[] = [
                { id: 'new', title: 'Novos Leads', color: 'bg-blue-500', bgColor: 'bg-gray-50/50', order: 1 },
                { id: 'contacted', title: 'Em Contato', color: 'bg-yellow-500', bgColor: 'bg-gray-50/50', order: 2 },
                { id: 'qualified', title: 'Qualificados', color: 'bg-purple-500', bgColor: 'bg-gray-50/50', order: 3 },
                { id: 'proposal', title: 'Proposta Enviada', color: 'bg-orange-500', bgColor: 'bg-gray-50/50', order: 4 },
                { id: 'converted', title: 'Convertidos', color: 'bg-secondary', bgColor: 'bg-green-50/30', order: 5 },
            ];

            const batch = writeBatch(firestore);
            defaultColumns.forEach(column => {
                const columnRef = doc(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns', column.id);
                batch.set(columnRef, column);
            });
            batch.commit().then(() => {
                toast({
                    title: 'Funil Criado!',
                    description: 'Criamos um funil de vendas padrão para você começar.',
                });
            });
        } else if (!areColumnsLoading && (columns?.length ?? 0) > 0) {
             setHasCheckedForDefaultColumns(true);
        }
    }, [areColumnsLoading, columns, user, firestore, toast, hasCheckedForDefaultColumns]);

    const handleMoveLead = async (leadId: string, direction: 'prev' | 'next' | LeadStatus) => {
        const leadToMove = leads?.find(l => l.id === leadId);
        if (!leadToMove || !firestore || !user || !columns) return;
    
        const fromStatus = leadToMove.status;
        let toStatus: LeadStatus;
    
        if (direction === 'prev' || direction === 'next') {
            const currentIndex = columns.findIndex(col => col.id === fromStatus);
            const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (newIndex < 0 || newIndex >= columns.length) return;
            toStatus = columns[newIndex].id;
        } else {
            toStatus = direction;
        }
    
        if (fromStatus === toStatus) return;
    
        const leadRef = doc(firestore, 'leads', leadId);
        const historyRef = collection(leadRef, 'statusHistory');
        
        try {
            const now = new Date();
    
            const leadDoc = await getDoc(leadRef);
            if (!leadDoc.exists()) throw new Error("Lead document not found");
            const leadData = leadDoc.data();
            const createdAt = leadData.createdAt.toDate();
            const tempoPorEtapa = leadData.tempoPorEtapa || {};
    
            const historyQuery = query(historyRef, orderBy('changedAt', 'desc'), limit(1));
            const lastHistorySnap = await getDocs(historyQuery);
            
            const stageStartDate = lastHistorySnap.empty 
                ? createdAt 
                : lastHistorySnap.docs[0].data().changedAt.toDate();
    
            const durationInHours = (now.getTime() - stageStartDate.getTime()) / (1000 * 60 * 60);
            const newTimeInStage = (tempoPorEtapa[fromStatus] || 0) + durationInHours;
            
            const batch = writeBatch(firestore);
    
            const leadUpdateData: { [key: string]: any } = {
                status: toStatus,
                tempoPorEtapa: { ...tempoPorEtapa, [fromStatus]: newTimeInStage },
            };
    
            const finalStates = ['converted', 'lost'];
            if (finalStates.includes(toStatus)) {
                const closingTimeInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                leadUpdateData.tempoTotalFechamentoEmDias = closingTimeInDays;
            }
            
            batch.update(leadRef, leadUpdateData);
    
            const newHistoryRef = doc(historyRef);
            const historyData = { fromStatus, toStatus, changedAt: serverTimestamp(), brokerId: user.uid };
            batch.set(newHistoryRef, historyData);
    
            await batch.commit();
    
            toast({
                title: 'Lead Atualizado!',
                description: `Lead movido de "${columns.find(c => c.id === fromStatus)?.title}" para "${columns.find(c => c.id === toStatus)?.title}".`
            });
    
        } catch (error) {
            console.error("Erro ao mover lead e registrar histórico:", error);
            toast({
                variant: "destructive",
                title: "Erro ao atualizar lead",
                description: "Não foi possível registrar a mudança de status.",
            });
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, toStatus: LeadStatus) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (!leadId) return;

        handleMoveLead(leadId, toStatus);
        setDraggedLeadId(null);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.setData('leadId', leadId);
    };
    
    const handleDeleteLead = () => {
        if (!leadToDelete || !firestore) return;

        const leadDocRef = doc(firestore, 'leads', leadToDelete.id);
        deleteDocumentNonBlocking(leadDocRef);

        toast({
            title: "Lead excluído!",
            description: `O lead "${leadToDelete.name}" foi removido com sucesso.`,
        });

        setLeadToDelete(null); // Fecha o diálogo
    };
    
    const handleColumnTitleChange = (index: number, newTitle: string) => {
        const updatedColumns = [...editableColumns];
        updatedColumns[index].title = newTitle;
        setEditableColumns(updatedColumns);
    };

    const handleAddColumn = () => {
        const newOrder = editableColumns.length > 0 ? Math.max(...editableColumns.map(c => c.order)) + 1 : 1;
        const newColumn: LeadFunnelColumn = {
            id: `new-${Date.now()}`, // Temporary ID for new columns
            title: 'Nova Etapa',
            color: 'bg-gray-400',
            bgColor: 'bg-gray-50/50',
            order: newOrder,
        };
        setEditableColumns([...editableColumns, newColumn]);
    };
    
    const handleDeleteColumn = (id: string, index: number) => {
        setEditableColumns(prev => prev.filter((_, i) => i !== index));
        // If it's not a newly created column, add its ID to the delete list
        if (!id.startsWith('new-')) {
            setColumnsToDelete(prev => [...prev, id]);
        }
    };


    const handleSaveChanges = async () => {
        if (!firestore || !user) return;
        
        const batch = writeBatch(firestore);
        let changesMade = false;

        // Process deletions
        columnsToDelete.forEach(columnId => {
            const columnRef = doc(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns', columnId);
            batch.delete(columnRef);
            changesMade = true;
        });

        // Process updates and additions
        editableColumns.forEach((column, index) => {
            const originalColumn = columns?.find(c => c.id === column.id);
            
            if (column.id.startsWith('new-')) { // It's a new column
                const newId = column.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                const columnRef = doc(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns', newId);
                const newColumnData = { ...column, id: newId, order: index + 1 };
                batch.set(columnRef, newColumnData);
                changesMade = true;
            } else if (originalColumn && (originalColumn.title !== column.title || originalColumn.order !== index + 1)) { // It's an existing column with changes
                const columnRef = doc(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns', column.id);
                batch.update(columnRef, { title: column.title, order: index + 1 });
                changesMade = true;
            }
        });


        if (!changesMade && columnsToDelete.length === 0) {
            toast({ description: "Nenhuma alteração para salvar." });
            setIsFunnelEditorOpen(false);
            return;
        }

        try {
            await batch.commit();
            toast({
                title: "Funil Atualizado!",
                description: "Suas alterações no funil foram salvas com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao salvar colunas do funil:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar as alterações no funil.",
            });
        } finally {
            setColumnsToDelete([]); // Reset deletion list
            setIsFunnelEditorOpen(false);
        }
    };


    return (
      <AlertDialog>
        <Dialog open={isFunnelEditorOpen} onOpenChange={setIsFunnelEditorOpen}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Gestão de Leads</h1>
                    <p className="text-text-secondary mt-1">Acompanhe seu funil de vendas e mova os cards para atualizar o status.</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline" className="bg-white border border-gray-200 hover:bg-gray-50 text-text-main font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center gap-2">
                        <Link href="/dashboard/leads/analytics">
                            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                            Análise
                        </Link>
                    </Button>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-white border border-gray-200 hover:bg-gray-50 text-text-main font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Editar Funil
                      </Button>
                    </DialogTrigger>
                    <Button asChild className="bg-secondary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2 group">
                        <Link href="/dashboard/clientes/nova">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span className='text-white group-hover:text-black'>Novo Lead</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                    <div className="w-full md:w-auto md:flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Buscar Lead</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                <input className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Nome, email ou telefone..." type="text"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Origem</label>
                            <div className="relative">
                                <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                    <option value="">Todas</option>
                                    <option value="site">Site / Formulário</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="indicacao">Indicação</option>
                                    <option value="campanha">Campanha Ads</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Corretor Responsável</label>
                            <div className="relative">
                                <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                    <option value="">Todos</option>
                                    <option value="me">Ana Silva (Eu)</option>
                                    <option value="joao">João Souza</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                         <button 
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                viewMode === 'list' ? 'text-text-main bg-primary/20 border border-primary/30' : 'text-text-secondary hover:text-primary bg-gray-50 hover:bg-gray-100'
                            )} 
                            title="Visualização Lista"
                        >
                            <span className="material-symbols-outlined text-[20px]">list</span>
                        </button>
                        <button 
                             onClick={() => setViewMode('kanban')}
                             className={cn(
                                'p-2 rounded-lg transition-colors',
                                viewMode === 'kanban' ? 'text-text-main bg-primary/20 border border-primary/30' : 'text-text-secondary hover:text-primary bg-gray-50 hover:bg-gray-100'
                            )}
                            title="Visualização Kanban"
                        >
                            <span className="material-symbols-outlined text-[20px]">view_kanban</span>
                        </button>
                    </div>
                </div>
            </div>
             {viewMode === 'kanban' ? (
                <div className="flex-grow overflow-x-auto pb-4">
                    <div className="flex gap-6 min-w-[1200px] h-full">
                        {columns?.map(column => {
                            const leadsInColumn = leads?.filter(lead => lead.status === column.id) || [];
                            return (
                                <div 
                                    key={column.id} 
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                    className="w-1/5 flex-shrink-0 flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between px-1 mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${column.color}`}></div>
                                            <h3 className="font-bold text-text-main text-sm uppercase tracking-wide">{column.title}</h3>
                                        </div>
                                        <span className="bg-gray-200 text-text-secondary text-xs font-bold px-2 py-0.5 rounded-full">{leadsInColumn.length}</span>
                                    </div>
                                    <div className={`kanban-col ${column.bgColor} rounded-xl p-2 flex flex-col gap-3 border border-gray-100/50 transition-colors`}>
                                        {isLoading && <p className="text-center text-xs text-text-secondary p-4">Carregando...</p>}
                                        {!isLoading && leadsInColumn.map(lead => (
                                            <LeadCard key={lead.id} lead={lead} columns={columns} onMove={handleMoveLead} onDragStart={handleDragStart} onDeleteClick={setLeadToDelete}/>
                                        ))}
                                        {!isLoading && leadsInColumn.length === 0 && (
                                            <div className="text-center text-xs text-text-secondary p-4 h-24 flex items-center justify-center">
                                                Arraste os cards para cá
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                 <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead>Data Cadastro</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading && (
                            <TableRow><TableCell colSpan={5} className="text-center">Carregando leads...</TableCell></TableRow>
                        )}
                        {!isLoading && leads?.map(lead => {
                            const column = columns?.find(c => c.id === lead.status);
                            return (
                                <TableRow key={lead.id}>
                                    <TableCell>
                                        <div className="font-bold">{lead.name}</div>
                                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                                    </TableCell>
                                    <TableCell>
                                       <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="p-0 h-auto">
                                                    {column && (
                                                        <Badge style={{ backgroundColor: column.color }} className="text-black text-[10px] cursor-pointer hover:opacity-80 transition-opacity">{column.title}</Badge>
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {columns?.map(col => (
                                                    <DropdownMenuItem key={col.id} onClick={() => handleMoveLead(lead.id, col.id)}>
                                                        Mover para {col.title}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${sourceStyles[lead.source] || 'bg-gray-100 text-gray-800'}`}>
                                            <span className="material-symbols-outlined text-[12px]">{sourceIcons[lead.source] || 'help'}</span> {lead.source}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {lead.createdAt && <ClientSideDate date={lead.createdAt.toDate()} />}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <Button asChild variant="ghost" size="icon">
                                            <Link href={`/dashboard/clientes/editar/${lead.id}`}>
                                                <span className="material-symbols-outlined text-base">edit</span>
                                            </Link>
                                            </Button>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => setLeadToDelete(lead)}>
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        </TableBody>
                    </Table>
                </div>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o lead de <span className="font-bold">{leadToDelete?.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setLeadToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
             <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Funil de Vendas</DialogTitle>
                    <DialogDescription>
                        Personalize as colunas do seu funil de vendas. Arraste para reordenar.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {editableColumns?.map((column, index) => (
                         <div key={column.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <span className="material-symbols-outlined text-gray-400 cursor-grab">drag_indicator</span>
                            <div className={`w-3 h-6 rounded-sm ${column.color}`}></div>
                             <Input
                                value={column.title}
                                onChange={(e) => handleColumnTitleChange(index, e.target.value)}
                                className="flex-1"
                            />
                             <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => handleDeleteColumn(column.id, index)}>
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </Button>
                        </div>
                    ))}
                </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleAddColumn}>Adicionar Coluna</Button>
                     <Button type="button" onClick={handleSaveChanges}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </AlertDialog>
    );
}
