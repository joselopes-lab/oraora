
'use client';

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, FileText, Trash2, FilePen, UploadCloud, Search, ArrowLeft, ArrowRight, Download, Calendar, Users, Home } from 'lucide-react';
import { type Client } from '../clientes/page';
import { type Property } from '@/app/dashboard/properties/page';
import { handleAddDocument, handleUpdateDocument, handleDeleteDocument, type State } from './actions';
import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { format, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { queryInBatches } from '@/lib/firestoreUtils';

interface Document {
  id: string;
  brokerId: string;
  name: string;
  fileUrl: string;
  fileName: string;
  associatedType: 'client' | 'property' | 'none';
  associatedId?: string;
  associatedName?: string;
  expiryDate?: Timestamp;
  createdAt: Timestamp;
}

const initialFormState: State = { success: null, error: null };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : (isEditing ? 'Salvar Alterações' : 'Salvar Documento')}
        </Button>
    )
}

export default function DocumentosPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDocument, setCurrentDocument] = useState<Partial<Document>>({});
    const [file, setFile] = useState<File | null>(null);

    const [itemToDelete, setItemToDelete] = useState<Document | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const DOCS_PER_PAGE = 10;

    const [addState, addAction] = useActionState(handleAddDocument, initialFormState);
    const [updateState, updateAction] = useActionState(handleUpdateDocument, initialFormState);

    useEffect(() => {
        if (!user || loadingAuth) return;

        const unsubDocs = onSnapshot(query(collection(db, 'broker_documents'), where('brokerId', '==', user.uid), orderBy('createdAt', 'desc')), snapshot => {
            setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document)));
            setIsLoading(false);
        });

        const unsubClients = onSnapshot(query(collection(db, 'broker_clients'), where('brokerId', '==', user.uid)), snapshot => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        });
        
        const fetchProperties = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const portfolioPropertyIds = userData.portfolioPropertyIds || [];
                const avulsoQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
                
                const [avulsoSnapshot, portfolioProperties] = await Promise.all([
                    getDocs(avulsoQuery),
                    portfolioPropertyIds.length > 0 ? queryInBatches<Property>('properties', 'id', portfolioPropertyIds) : Promise.resolve([])
                ]);

                const avulsoProps = avulsoSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as Property);

                const allPropsMap = new Map<string, Property>();
                [...avulsoProps, ...portfolioProperties].forEach(p => allPropsMap.set(p.id, p));
                
                setProperties(Array.from(allPropsMap.values()));
            }
        };

        fetchProperties();

        return () => {
            unsubDocs();
            unsubClients();
        };
    }, [user, loadingAuth]);
    
    useEffect(() => {
        const state = isEditing ? updateState : addState;
        if(state.success) {
            toast({ title: "Sucesso!", description: `Documento ${isEditing ? 'atualizado' : 'salvo'} com sucesso.` });
            closeDialog();
        } else if (state.error) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: state.error });
        }
    }, [addState, updateState, isEditing, toast]);


    const openDialog = (doc: Document | null) => {
        if (doc) {
            setIsEditing(true);
            setCurrentDocument({ ...doc, expiryDate: doc.expiryDate?.toDate() } as any);
        } else {
            setIsEditing(false);
            setCurrentDocument({});
        }
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setCurrentDocument({});
        setFile(null);
        formRef.current?.reset();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };
    
    const handleDelete = async () => {
        if (!itemToDelete) return;
        const result = await handleDeleteDocument(itemToDelete.id);
         if (result.success) {
            toast({ title: "Documento Excluído" });
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
        setIsDeleteAlertOpen(false);
        setItemToDelete(null);
    }
    
    const formatDate = (timestamp: Timestamp | undefined, formatStr = "dd/MM/yyyy") => {
        if (!timestamp) return 'N/A';
        return format(timestamp.toDate(), formatStr, { locale: ptBR });
    };

    const getStatusBadge = (doc: Document) => {
        if (!doc.expiryDate) return null;
        const expiry = doc.expiryDate.toDate();
        if (isPast(expiry)) {
            return <Badge variant="destructive">Vencido</Badge>;
        }
        return <Badge variant="secondary">Válido</Badge>;
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [documents, searchTerm]);
    
    const totalPages = Math.ceil(filteredDocuments.length / DOCS_PER_PAGE);
    const paginatedDocuments = useMemo(() => {
        const startIndex = (currentPage - 1) * DOCS_PER_PAGE;
        return filteredDocuments.slice(startIndex, startIndex + DOCS_PER_PAGE);
    }, [filteredDocuments, currentPage]);

    if (isLoading || loadingAuth) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <FileText className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Gestão de Documentos</h1>
                    <p className="font-light text-[23px] text-black">Armazene contratos, anexos e gerencie vencimentos.</p>
                </div>
            </div>
            <div className="text-right">
                <Button size="sm" className="gap-1" onClick={() => openDialog(null)}>
                    <PlusCircle className="h-4 w-4" /> Novo Documento
                </Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <div className="mb-4">
                        <Input
                            placeholder="Buscar por nome do documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Associado a</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedDocuments.length > 0 ? paginatedDocuments.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell>
                                        {doc.associatedType === 'client' && <Users className="h-4 w-4 inline mr-2"/>}
                                        {doc.associatedType === 'property' && <Home className="h-4 w-4 inline mr-2"/>}
                                        {doc.associatedName || 'Nenhum'}
                                    </TableCell>
                                    <TableCell>{formatDate(doc.expiryDate)}</TableCell>
                                    <TableCell>{getStatusBadge(doc)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button asChild variant="outline" size="icon"><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDialog(doc)}><FilePen className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setItemToDelete(doc); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum documento encontrado.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-center items-center gap-4 pt-6 border-t">
                        <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
                        <span className="text-sm font-medium">Página {currentPage} / {totalPages}</span>
                        <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próxima<ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
                        <DialogDescription>Preencha os dados do documento.</DialogDescription>
                    </DialogHeader>
                    <form ref={formRef} action={isEditing ? updateAction : addAction} className="space-y-4 py-4">
                        <input type="hidden" name="brokerId" value={user?.uid || ''} />
                        {isEditing && <input type="hidden" name="documentId" value={currentDocument.id || ''} />}
                        
                        <div className="space-y-2">
                            <Label htmlFor="doc-name">Nome do Documento</Label>
                            <Input id="doc-name" name="name" defaultValue={currentDocument.name || ''} required />
                        </div>

                        {!isEditing && (
                            <div className="space-y-2">
                                <Label htmlFor="doc-file">Arquivo</Label>
                                <Input id="doc-file" name="file" type="file" onChange={handleFileChange} required={!isEditing} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="doc-expiry">Data de Vencimento</Label>
                            <Input id="doc-expiry" name="expiryDate" type="date" defaultValue={currentDocument.expiryDate ? format(currentDocument.expiryDate.toDate(), 'yyyy-MM-dd') : ''} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="doc-assoc-type">Associar a</Label>
                            <Select name="associatedType" defaultValue={currentDocument.associatedType || 'none'} onValueChange={(value) => setCurrentDocument(p => ({...p, associatedType: value as 'client'|'property'|'none', associatedId: ''}))}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    <SelectItem value="client">Cliente</SelectItem>
                                    <SelectItem value="property">Imóvel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {currentDocument.associatedType && currentDocument.associatedType !== 'none' && (
                             <div className="space-y-2">
                                <Label htmlFor="doc-assoc-id">Selecione {currentDocument.associatedType === 'client' ? 'o Cliente' : 'o Imóvel'}</Label>
                                <Select name="associatedId" defaultValue={currentDocument.associatedId || ''}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {(currentDocument.associatedType === 'client' ? clients : properties).map((item: Client | Property) => (
                                            <SelectItem key={item.id} value={item.id}>{ 'name' in item ? item.name : item.informacoesbasicas.nome }</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <SubmitButton isEditing={isEditing} />
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita e irá deletar o documento <strong>{itemToDelete?.name}</strong>.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

