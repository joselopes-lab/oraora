
'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, Mail, Phone, FileText, GripVertical, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


type LeadStatus = string;

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  brokerId: string;
  createdAt: Timestamp;
  status: LeadStatus;
  propertyName?: string;
  propertySlug?: string;
}

interface Column {
  id: string;
  name: string;
  items: Lead[];
  isDeletable: boolean;
}

interface Columns {
  [key: string]: Column;
}

const initialColumnOrder: string[] = ['new', 'contacted', 'closed'];

const initialColumnsData: Columns = {
  new: { id: 'new', name: 'Novos', items: [], isDeletable: false },
  contacted: { id: 'contacted', name: 'Contatados', items: [], isDeletable: false },
  closed: { id: 'closed', name: 'Fechados', items: [], isDeletable: false },
};

export default function CorretorLeadsPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [columns, setColumns] = useState<Columns>(initialColumnsData);
    const [columnOrder, setColumnOrder] = useState<string[]>(initialColumnOrder);
    const [editingColumn, setEditingColumn] = useState<string | null>(null);
    const [editingColumnName, setEditingColumnName] = useState('');
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    
    useEffect(() => {
        if (!user) {
            if (!loadingAuth) setIsLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            let savedColumns = { ...initialColumnsData };
            let savedOrder = [...initialColumnOrder];

            if (userDoc.exists() && userDoc.data().kanbanSettings) {
                const settings = userDoc.data().kanbanSettings;
                if (settings.columns && settings.order) {
                    savedColumns = { ...initialColumnsData, ...settings.columns };
                    savedOrder = settings.order;
                    // Ensure all initial columns are present
                    initialColumnOrder.forEach(id => {
                      if (!savedOrder.includes(id)) savedOrder.push(id);
                      if (!savedColumns[id]) savedColumns[id] = initialColumnsData[id];
                    });
                }
            }
             setColumns(savedColumns);
             setColumnOrder(savedOrder);


            const leadsQuery = query(
                collection(db, 'broker_leads'), 
                where('brokerId', '==', user.uid)
            );

            const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
                const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
                leadsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
                
                setColumns(prevColumns => {
                    const newCols = { ...prevColumns };
                    // Reset items for all columns
                    Object.keys(newCols).forEach(colId => {
                        newCols[colId] = { ...newCols[colId], items: [] };
                    });

                    leadsData.forEach(lead => {
                        const status = lead.status || 'new';
                        if (newCols[status]) {
                            newCols[status].items.push(lead);
                        } else {
                            // If lead has a status for a deleted column, move it to 'new'
                             newCols['new'].items.push(lead);
                        }
                    });
                    return newCols;
                });
                
                setIsLoading(false);
            }, (error) => {
                console.error("Erro ao buscar leads: ", error);
                toast({ variant: 'destructive', title: 'Falha ao carregar leads' });
                setIsLoading(false);
            });
            
            return unsubscribe;
        }

        const unsubscribePromise = fetchInitialData();

        return () => {
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [user, loadingAuth, toast]);
    
    const saveKanbanSettings = async (newColumns: Columns, newOrder: string[]) => {
      if (!user) return;
      const userDocRef = doc(db, 'users', user.uid);
      const settings: { columns: { [key: string]: Omit<Column, 'items'> }, order: string[] } = {
        columns: {},
        order: newOrder,
      };

      for(const colId in newColumns) {
        settings.columns[colId] = {
          id: newColumns[colId].id,
          name: newColumns[colId].name,
          isDeletable: newColumns[colId].isDeletable,
        }
      }

      await updateDoc(userDocRef, { kanbanSettings: settings });
    };

    const handleTitleClick = (columnId: string, currentName: string) => {
        if (!columns[columnId].isDeletable && columnId !== 'contacted' && columnId !== 'closed') return;
        setEditingColumn(columnId);
        setEditingColumnName(currentName);
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEditingColumnName(e.target.value);
    };

    const handleTitleBlur = async (columnId: string) => {
        if (!user || !editingColumnName.trim()) {
            setEditingColumn(null);
            return;
        }

        const newName = editingColumnName.trim();
        const oldName = columns[columnId].name;

        if (newName !== oldName) {
            const newColumns = {
              ...columns,
              [columnId]: { ...columns[columnId], name: newName },
            };
            setColumns(newColumns);
            await saveKanbanSettings(newColumns, columnOrder);
            toast({ title: "Nome da coluna atualizado!" });
        }
        setEditingColumn(null);
    };


    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, columnId: string) => {
        if (e.key === 'Enter') {
            handleTitleBlur(columnId);
        } else if (e.key === 'Escape') {
            setEditingColumn(null);
        }
    };
    
    const handleAddColumn = async () => {
      const newId = `custom_${Date.now()}`;
      const newColumn: Column = {
        id: newId,
        name: 'Nova Etapa',
        items: [],
        isDeletable: true,
      };

      const newColumns = { ...columns, [newId]: newColumn };
      const newOrder = [...columnOrder, newId];
      
      setColumns(newColumns);
      setColumnOrder(newOrder);

      await saveKanbanSettings(newColumns, newOrder);
      toast({ title: "Nova etapa adicionada!", description: "Clique no título para renomear." });
    };

    const handleDeleteColumn = async () => {
      if (!columnToDelete || !columns[columnToDelete].isDeletable) return;
      
      const column = columns[columnToDelete];
      const leadsToMove = column.items;
      
      const newColumns = { ...columns };
      delete newColumns[columnToDelete];
      
      // Move leads back to 'new'
      newColumns['new'].items = [...newColumns['new'].items, ...leadsToMove];

      const newOrder = columnOrder.filter(id => id !== columnToDelete);

      setColumns(newColumns);
      setColumnOrder(newOrder);
      setColumnToDelete(null);
      setIsDeleteAlertOpen(false);

      // Update Firestore
      const batch = writeBatch(db);
      leadsToMove.forEach(lead => {
        const leadRef = doc(db, 'broker_leads', lead.id);
        batch.update(leadRef, { status: 'new' });
      });
      await batch.commit();
      await saveKanbanSettings(newColumns, newOrder);

      toast({ title: "Etapa removida!", description: "Os leads foram movidos para 'Novos'." });
    };
    
    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp?.seconds) return 'Data inválida';
        return format(new Date(timestamp.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
          return;
        }

        const start = columns[source.droppableId];
        const finish = columns[destination.droppableId];
        
        // Moving within the same column
        if (start === finish) {
          const newItems = Array.from(start.items);
          const [reorderedItem] = newItems.splice(source.index, 1);
          newItems.splice(destination.index, 0, reorderedItem);

          const newColumn = { ...start, items: newItems };
          const newColumns = { ...columns, [start.id]: newColumn };
          
          setColumns(newColumns);
          return;
        }

        // Moving from one column to another
        const startItems = Array.from(start.items);
        const [movedItem] = startItems.splice(source.index, 1);
        const finishItems = Array.from(finish.items);
        finishItems.splice(destination.index, 0, movedItem);

        const newStart = { ...start, items: startItems };
        const newFinish = { ...finish, items: finishItems };

        const newColumns = {
          ...columns,
          [start.id]: newStart,
          [finish.id]: newFinish
        };
        setColumns(newColumns);
            
        const leadRef = doc(db, 'broker_leads', draggableId);
        try {
            await updateDoc(leadRef, { status: finish.id });
            toast({ title: "Status do Lead Atualizado!" });
        } catch (error: any) {
            setColumns(columns); // Revert on error
            toast({ variant: 'destructive', title: "Erro ao atualizar status", description: error.message });
        }
    };
    
    if (isLoading || loadingAuth) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Carregando seus leads...</p>
            </div>
        );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
            <Inbox className="h-10 w-10 mt-2"/>
            <div>
                <h1 className="text-6xl font-thin tracking-tight">Meus Leads</h1>
                <p className="font-light text-[23px] text-black">Arraste e solte os leads para organizar seu funil de vendas.</p>
            </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 items-start overflow-x-auto pb-4">
                {columnOrder.map((columnId) => {
                    const column = columns[columnId];
                    if (!column) return null;
                    return (
                    <Droppable droppableId={columnId} key={columnId}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-4 rounded-lg bg-muted/50 min-h-[500px] w-[350px] shrink-0 flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-muted' : ''}`}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    {editingColumn === columnId ? (
                                         <Input
                                            type="text"
                                            value={editingColumnName}
                                            onChange={handleTitleChange}
                                            onBlur={() => handleTitleBlur(columnId)}
                                            onKeyDown={(e) => handleTitleKeyDown(e, columnId)}
                                            autoFocus
                                            className="h-8 text-lg font-semibold p-1 border-primary"
                                        />
                                    ) : (
                                        <h2 
                                            className="font-semibold text-lg cursor-pointer"
                                            onClick={() => handleTitleClick(columnId, column.name)}
                                        >
                                            {column.name}
                                        </h2>
                                    )}
                                    <Badge variant="secondary">{column.items.length}</Badge>
                                    {column.isDeletable && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive ml-auto" onClick={() => { setColumnToDelete(columnId); setIsDeleteAlertOpen(true);}}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-4 overflow-y-auto flex-grow">
                                    {column.items.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`p-4 rounded-lg bg-card border shadow-sm ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                    style={{...provided.draggableProps.style}}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <h4 className="font-semibold">{item.name}</h4>
                                                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab"/>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                                                    
                                                    <div className="text-sm space-y-1 mt-3">
                                                        <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{item.email}</span></div>
                                                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{item.phone}</span></div>
                                                    </div>

                                                    {item.propertyName && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <p className="text-xs font-medium text-muted-foreground">Imóvel de Interesse:</p>
                                                            <Button variant="link" asChild className="p-0 h-auto font-normal text-sm">
                                                                <Link href={`/imoveis/${item.propertySlug || ''}`} target="_blank" className="flex items-center gap-2 text-primary">
                                                                    <FileText className="h-4 w-4" />
                                                                    {item.propertyName}
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {item.message && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <p className="text-xs font-medium text-muted-foreground">Mensagem:</p>
                                                            <p className="text-sm italic text-muted-foreground line-clamp-3">"{item.message}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                                {column.items.length === 0 && !snapshot.isDraggingOver && (
                                    <div className="flex justify-center items-center h-40 border-2 border-dashed rounded-lg mt-auto">
                                        <p className="text-sm text-muted-foreground">Arraste os leads para cá</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                    )
                })}
                <div className="w-[350px] shrink-0 flex items-center justify-center">
                     <Button variant="outline" onClick={handleAddColumn} className="w-full h-12 border-dashed">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Adicionar Etapa
                     </Button>
                </div>
            </div>
        </DragDropContext>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Excluir etapa "{columns[columnToDelete!]?.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os leads nesta etapa serão movidos de volta para "Novos".
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setColumnToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
}

    

    
