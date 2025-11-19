'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as TableIcon, PlusCircle, Loader2, Download, Trash2 } from 'lucide-react';
import { type Property } from '@/app/dashboard/properties/page';
import { handleAddTable, handleDeleteTable, type State } from './actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface PropertyTable {
    id: string;
    propertyId: string;
    propertyName: string;
    tableName: string;
    fileUrl: string;
    createdAt: Timestamp;
}

const initialFormState: State = { success: null, error: null };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : 'Salvar Tabela'}
        </Button>
    )
}

export default function TabelasPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const [properties, setProperties] = useState<Property[]>([]);
    const [tables, setTables] = useState<PropertyTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [tableToDelete, setTableToDelete] = useState<PropertyTable | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    const [filterPropertyId, setFilterPropertyId] = useState<string>('all');

    const [addState, addAction] = useActionState(handleAddTable, initialFormState);

    useEffect(() => {
        if (!user || loadingAuth) return;
        
        setIsLoading(true);
        const propsQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
        const tablesQuery = query(collection(db, 'property_tables'), where('builderId', '==', user.uid), orderBy('createdAt', 'desc'));

        const unsubProps = onSnapshot(propsQuery, snapshot => {
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
        });
        const unsubTables = onSnapshot(tablesQuery, snapshot => {
            setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyTable)));
            setIsLoading(false);
        });

        return () => { unsubProps(); unsubTables(); };
    }, [user, loadingAuth]);

     useEffect(() => {
        if(addState.success) {
            toast({ title: "Sucesso!", description: "Tabela salva com sucesso." });
            formRef.current?.reset();
        } else if (addState.error) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: addState.error });
        }
    }, [addState, toast]);
    
    const openDeleteAlert = (table: PropertyTable) => {
        setTableToDelete(table);
        setIsDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!tableToDelete) return;
        const result = await handleDeleteTable(tableToDelete.id);
        if (result.success) {
            toast({ title: 'Tabela Excluída' });
        } else {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: result.error });
        }
        setIsDeleteAlertOpen(false);
        setTableToDelete(null);
    };
    
    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const filteredTables = useMemo(() => {
        if (filterPropertyId === 'all') {
            return tables;
        }
        return tables.filter(table => table.propertyId === filterPropertyId);
    }, [tables, filterPropertyId]);

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <TableIcon className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Tabelas de Vendas</h1>
                    <p className="font-light text-[23px] text-black">Gerencie as tabelas de preços e informações dos seus imóveis.</p>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PlusCircle/> Nova Tabela</CardTitle>
                            <CardDescription>Faça o upload de uma nova tabela para um de seus imóveis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form ref={formRef} action={addAction} className="space-y-4">
                                <input type="hidden" name="builderId" value={user?.uid || ''} />
                                <div className="space-y-2">
                                    <Label htmlFor="propertyId">Imóvel*</Label>
                                    <Select name="propertyId" required>
                                        <SelectTrigger><SelectValue placeholder="Selecione o imóvel"/></SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => <SelectItem key={p.id} value={`${p.id}|${p.informacoesbasicas.nome}`}>{p.informacoesbasicas.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tableName">Nome da Tabela*</Label>
                                    <Input id="tableName" name="tableName" placeholder="Ex: Tabela de Preços - Janeiro/2025" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="file">Arquivo PDF (Opcional)</Label>
                                    <Input id="file" name="file" type="file" accept=".pdf" />
                                </div>
                                <SubmitButton />
                            </form>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>Histórico de Tabelas</CardTitle>
                                    <CardDescription>Visualize todas as tabelas que você já cadastrou.</CardDescription>
                                </div>
                                <div className="w-full sm:w-auto sm:min-w-[200px]">
                                    <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filtrar por imóvel..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Imóveis</SelectItem>
                                            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.informacoesbasicas.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : filteredTables.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredTables.map(table => (
                                        <div key={table.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                            <div>
                                                <p className="font-semibold">{table.tableName}</p>
                                                <p className="text-sm text-muted-foreground">{table.propertyName}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Cadastrado em: {formatDate(table.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button asChild variant="outline" size="icon" disabled={!table.fileUrl}>
                                                    <a href={table.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4"/></a>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(table)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">Nenhuma tabela encontrada.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita e irá excluir o arquivo da tabela permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
