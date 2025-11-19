
'use client';

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Wallet, TrendingUp, TrendingDown, Loader2, MoreHorizontal, FilePen, Trash2, ArrowUpRight, ArrowDownLeft, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { type Client } from '../clientes/page';
import { type Builder } from '@/app/dashboard/builders/page';
import { Textarea } from '@/components/ui/textarea';
import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { 
    handleAddRevenue, 
    handleUpdateRevenue, 
    handleDeleteRevenue, 
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    type State 
} from './actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type RevenueSourceType = 'client' | 'builder';

interface Revenue {
    id: string;
    brokerId: string;
    partnerId: string;
    partnerName: string;
    sourceType: RevenueSourceType;
    value: number;
    status: 'Pendente' | 'Paga' | 'Atrasada';
    dueDate: Timestamp;
    description?: string;
}

interface Expense {
    id: string;
    brokerId: string;
    description: string;
    category: string;
    value: number;
    status: 'Pendente' | 'Paga' | 'Atrasada';
    dueDate: Timestamp;
}

const initialRevenueState: Partial<Revenue> = {
    sourceType: 'client',
    status: 'Pendente',
    value: 0,
    description: '',
};

const initialExpenseState: Partial<Expense> = {
    description: '',
    category: '',
    value: 0,
    status: 'Pendente',
}


const initialFormState: State = {
  success: null,
  error: null,
};

function SubmitButton({ isEditing, entityType }: { isEditing: boolean, entityType: 'revenue' | 'expense' }) {
    const { pending } = useFormStatus();
    const actionText = entityType === 'revenue' ? 'Receita' : 'Despesa';
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : (isEditing ? `Salvar Alterações` : `Salvar ${actionText}`)}
        </Button>
    )
}

export default function FinanceiroPage() {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('revenues');

    const [sellerClients, setSellerClients] = useState<Client[]>([]);
    const [builders, setBuilders] = useState<Builder[]>([]);
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog State
    const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRevenue, setCurrentRevenue] = useState<Partial<Revenue>>({});
    const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({});
    const [originalItem, setOriginalItem] = useState<Partial<Revenue> | Partial<Expense> | null>(null);
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

    // Delete Alert State
    const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'revenue' | 'expense'} | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    // Summary state
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

    const revenueFormRef = useRef<HTMLFormElement>(null);
    const expenseFormRef = useRef<HTMLFormElement>(null);

    const [addRevenueState, addRevenueAction] = useActionState(handleAddRevenue, initialFormState);
    const [updateRevenueState, updateRevenueAction] = useActionState(handleUpdateRevenue, initialFormState);
    const [addExpenseState, addExpenseAction] = useActionState(handleAddExpense, initialFormState);
    const [updateExpenseState, updateExpenseAction] = useActionState(handleUpdateExpense, initialFormState);

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        
        async function fetchInitialData() {
            const clientsQuery = query(collection(db, 'broker_clients'), where('brokerId', '==', user!.uid), where('type', '==', 'Vendedor'));
            const clientsSnapshot = await getDocs(clientsQuery);
            setSellerClients(clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));

            const buildersQuery = query(collection(db, 'builders'));
            const buildersSnapshot = await getDocs(buildersQuery);
            setBuilders(buildersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder)));
            
            setIsLoading(false);
        }
        fetchInitialData();

        const revenuesQuery = query(collection(db, 'broker_revenues'), where('brokerId', '==', user.uid), orderBy('dueDate', 'asc'));
        const unsubscribeRevenues = onSnapshot(revenuesQuery, (snapshot) => {
            setRevenues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Revenue)));
        });
        
        const expensesQuery = query(collection(db, 'broker_expenses'), where('brokerId', '==', user.uid), orderBy('dueDate', 'asc'));
        const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
            setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
        });


        return () => {
            unsubscribeRevenues();
            unsubscribeExpenses();
        };

    }, [user]);

    const handleFormState = (state: State, action: string, type: 'Receita' | 'Despesa') => {
         if (state.success) {
            toast({ title: "Sucesso!", description: `${type} ${action} com sucesso.` });
            if (type === 'Receita') closeRevenueDialog();
            if (type === 'Despesa') closeExpenseDialog();
        } else if (state.error) {
            toast({ variant: 'destructive', title: `Erro ao ${action === 'adicionada' ? 'adicionar' : 'atualizar'}`, description: state.error });
        }
    }

    useEffect(() => { if (addRevenueState.success !== null || addRevenueState.error !== null) { handleFormState(addRevenueState, 'adicionada', 'Receita'); setActiveTab('revenues'); } }, [addRevenueState]);
    useEffect(() => { if (updateRevenueState.success !== null || updateRevenueState.error !== null) { handleFormState(updateRevenueState, 'atualizada', 'Receita'); setActiveTab('revenues'); } }, [updateRevenueState]);
    useEffect(() => { if (addExpenseState.success !== null || addExpenseState.error !== null) { handleFormState(addExpenseState, 'adicionada', 'Despesa'); setActiveTab('expenses'); } }, [addExpenseState]);
    useEffect(() => { if (updateExpenseState.success !== null || updateExpenseState.error !== null) { handleFormState(updateExpenseState, 'atualizada', 'Despesa'); setActiveTab('expenses'); } }, [updateExpenseState]);

    const openRevenueDialog = (revenue: Revenue | null = null) => {
        if (revenue) {
            setIsEditing(true);
            const revenueForEdit = { ...revenue, dueDate: revenue.dueDate instanceof Timestamp ? revenue.dueDate.toDate() : revenue.dueDate } as any;
            setCurrentRevenue(revenueForEdit);
            setOriginalItem(JSON.parse(JSON.stringify(revenueForEdit)));
        } else {
            setIsEditing(false);
            const newRevenue = { ...initialRevenueState };
            setCurrentRevenue(newRevenue);
            setOriginalItem(JSON.parse(JSON.stringify(newRevenue)));
        }
        setIsRevenueDialogOpen(true);
    };

    const openExpenseDialog = (expense: Expense | null = null) => {
        if (expense) {
            setIsEditing(true);
            const expenseForEdit = { ...expense, dueDate: expense.dueDate instanceof Timestamp ? expense.dueDate.toDate() : expense.dueDate } as any;
            setCurrentExpense(expenseForEdit);
            setOriginalItem(JSON.parse(JSON.stringify(expenseForEdit)));
        } else {
            setIsEditing(false);
            const newExpense = { ...initialExpenseState };
            setCurrentExpense(newExpense);
            setOriginalItem(JSON.parse(JSON.stringify(newExpense)));
        }
        setIsExpenseDialogOpen(true);
    }
    
    const closeRevenueDialog = () => {
        setIsRevenueDialogOpen(false);
        revenueFormRef.current?.reset();
        setCurrentRevenue({});
        setOriginalItem(null);
    }

    const closeExpenseDialog = () => {
        setIsExpenseDialogOpen(false);
        expenseFormRef.current?.reset();
        setCurrentExpense({});
        setOriginalItem(null);
    }
    
    const handleDialogChange = (isOpen: boolean, type: 'revenue' | 'expense') => {
        const currentItem = type === 'revenue' ? currentRevenue : currentExpense;
        const dialogSetter = type === 'revenue' ? setIsRevenueDialogOpen : setIsExpenseDialogOpen;
        const closeFn = type === 'revenue' ? closeRevenueDialog : closeExpenseDialog;

        if (!isOpen) {
            const hasChanges = JSON.stringify(currentItem) !== JSON.stringify(originalItem);
            if (hasChanges) {
                setIsConfirmCloseOpen(true);
            } else {
                closeFn();
            }
        } else {
            dialogSetter(true);
        }
    };

    const openDeleteAlert = (id: string, type: 'revenue' | 'expense') => {
        setItemToDelete({id, type});
        setIsDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        const { id, type } = itemToDelete;
        const result = type === 'revenue' ? await handleDeleteRevenue(id) : await handleDeleteExpense(id);
        
        if (result.success) {
            toast({ title: `${type === 'revenue' ? 'Receita' : 'Despesa'} Excluída!` });
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
        setIsDeleteAlertOpen(false);
        setItemToDelete(null);
    }

    const formatDate = (timestamp: Timestamp | Date | undefined, formatStr = "dd/MM/yyyy") => {
        if (!timestamp) return 'N/A';
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        return format(date, formatStr, { locale: ptBR });
    };
    
    const formatCurrency = (value?: number) => {
        if (value === undefined) return 'N/A';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const getCategoryLabel = (categoryValue: string) => {
        const options = [
            { value: 'marketing', label: 'Marketing' },
            { value: 'transporte', label: 'Transporte' },
            { value: 'alimentacao', label: 'Alimentação' },
            { value: 'escritorio', label: 'Escritório' },
            { value: 'taxas', label: 'Taxas' },
            { value: 'outros', label: 'Outros' },
        ];
        return options.find(opt => opt.value === categoryValue)?.label || categoryValue;
    };
    
    const getStatusVariant = (status: 'Pendente' | 'Paga' | 'Atrasada') => {
        switch(status) {
            case 'Pendente': return 'secondary';
            case 'Paga': return 'default';
            case 'Atrasada': return 'destructive';
            default: return 'outline';
        }
    }


    const monthlySummary = useMemo(() => {
        const summary: { [key: string]: { revenues: Revenue[], expenses: Expense[] } } = {};

        revenues.forEach(revenue => {
            const dueDate = revenue.dueDate;
            if (dueDate) {
                const date = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
                const monthKey = format(date, 'yyyy-MM');
                if (!summary[monthKey]) summary[monthKey] = { revenues: [], expenses: [] };
                summary[monthKey].revenues.push(revenue);
            }
        });

        expenses.forEach(expense => {
            const dueDate = expense.dueDate;
            if (dueDate) {
                const date = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
                const monthKey = format(date, 'yyyy-MM');
                if (!summary[monthKey]) summary[monthKey] = { revenues: [], expenses: [] };
                summary[monthKey].expenses.push(expense);
            }
        });
        
        return Object.entries(summary)
            .map(([monthKey, data]) => {
                const totalIncome = data.revenues.reduce((sum, item) => sum + item.value, 0);
                const totalExpense = data.expenses.reduce((sum, item) => sum + item.value, 0);
                return {
                    month: monthKey,
                    ...data,
                    totalIncome,
                    totalExpense,
                    balance: totalIncome - totalExpense
                }
            })
            .sort((a, b) => b.month.localeCompare(a.month));

    }, [revenues, expenses]);
    
     useEffect(() => {
        setCurrentMonthIndex(0);
    }, [monthlySummary]);

    const currentMonthData = monthlySummary[currentMonthIndex];
    
    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Wallet className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Controle Financeiro</h1>
                    <p className="font-light text-[23px] text-black">Gerencie suas receitas, contas a pagar e a receber.</p>
                </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="revenues">
                        <TrendingUp className="mr-2 h-4 w-4" /> Receitas
                    </TabsTrigger>
                    <TabsTrigger value="expenses">
                        <TrendingDown className="mr-2 h-4 w-4" /> Despesas
                    </TabsTrigger>
                     <TabsTrigger value="summary">
                        <Wallet className="mr-2 h-4 w-4" /> Previsão Mensal
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="revenues" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Receitas</CardTitle>
                                <CardDescription>Vendas realizadas e pendentes de pagamento.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => openRevenueDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Receita
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Parceiro</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data Prevista</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {revenues.length > 0 ? revenues.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.partnerName}</TableCell>
                                            <TableCell>{formatCurrency(item.value)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openRevenueDialog(item)}><FilePen className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => openDeleteAlert(item.id, 'revenue')} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                Nenhuma receita registrada.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="expenses" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div>
                                <CardTitle>Despesas</CardTitle>
                                <CardDescription>Contas e despesas operacionais.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => openExpenseDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Despesa
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data de Vencimento</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {expenses.length > 0 ? expenses.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{getCategoryLabel(item.category)}</TableCell>
                                            <TableCell>{formatCurrency(item.value)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openExpenseDialog(item)}><FilePen className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => openDeleteAlert(item.id, 'expense')} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Nenhuma despesa registrada.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="summary" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Previsão Financeira Mensal</CardTitle>
                            <CardDescription>Previsão de receitas e despesas para cada mês.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {monthlySummary.length > 0 ? (
                                <div className="space-y-6">
                                     <div className="flex justify-center items-center gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentMonthIndex(prev => Math.min(prev + 1, monthlySummary.length - 1))}
                                            disabled={currentMonthIndex >= monthlySummary.length - 1}
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Mês Anterior
                                        </Button>
                                        <h3 className="text-lg font-semibold capitalize text-center min-w-[200px]">
                                            {format(new Date(currentMonthData.month + '-02'), "MMMM 'de' yyyy", { locale: ptBR })}
                                        </h3>
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentMonthIndex === 0}
                                        >
                                            Próximo Mês <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base font-medium flex items-center gap-2"><TrendingUp className="text-green-600"/> A receber</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-2xl font-bold">{formatCurrency(currentMonthData.totalIncome)}</p>
                                                <div className="mt-2 space-y-2 text-sm">
                                                    {currentMonthData.revenues.map(rev => (
                                                        <div key={rev.id} className="flex justify-between items-center">
                                                            <span>{rev.partnerName}</span>
                                                            <Badge variant={getStatusVariant(rev.status)}>{formatCurrency(rev.value)}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                            <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base font-medium flex items-center gap-2"><TrendingDown className="text-red-600"/>A pagar</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                    <p className="text-2xl font-bold">{formatCurrency(currentMonthData.totalExpense)}</p>
                                                    <div className="mt-2 space-y-2 text-sm">
                                                    {currentMonthData.expenses.map(exp => (
                                                        <div key={exp.id} className="flex justify-between items-center">
                                                            <span>{exp.description}</span>
                                                            <Badge variant={getStatusVariant(exp.status)}>{formatCurrency(exp.value)}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                            <Card className={currentMonthData.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base font-medium flex items-center gap-2"><Wallet/>Saldo Previsto</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className={`text-2xl font-bold ${currentMonthData.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(currentMonthData.balance)}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Nenhuma transação encontrada para gerar a previsão.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isRevenueDialogOpen} onOpenChange={(isOpen) => handleDialogChange(isOpen, 'revenue')}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Receita' : 'Adicionar Nova Receita'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Atualize os dados da sua receita.' : 'Registre uma nova receita.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form ref={revenueFormRef} action={isEditing ? updateRevenueAction : addRevenueAction} className="space-y-4 py-4">
                        <input type="hidden" name="brokerId" value={user?.uid || ''} />
                        {isEditing && <input type="hidden" name="revenueId" value={currentRevenue.id || ''} />}
                        
                        <div className="space-y-2">
                            <Label>Fonte da Receita</Label>
                            <Select name="sourceType" value={currentRevenue.sourceType} onValueChange={(value) => {
                                setCurrentRevenue(prev => ({...prev, partnerId: undefined, partnerName: undefined, sourceType: value as RevenueSourceType }));
                            }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Cliente Vendedor</SelectItem>
                                    <SelectItem value="builder">Construtora</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <div className="space-y-2">
                                <Label>{currentRevenue.sourceType === 'client' ? 'Selecione o Cliente' : 'Selecione a Construtora'}</Label>
                                <Select name="partnerId" 
                                    value={currentRevenue.partnerId ? `${currentRevenue.partnerId}|${currentRevenue.partnerName}` : ''}
                                    onValueChange={(value) => {
                                        const [id, name] = value.split('|');
                                        setCurrentRevenue(prev => ({...prev, partnerId: id, partnerName: name}));
                                    }}
                                    required
                                >
                                    <SelectTrigger><SelectValue placeholder="Selecione um parceiro" /></SelectTrigger>
                                    <SelectContent>
                                        {(currentRevenue.sourceType === 'client' ? sellerClients : builders).map(partner => (
                                            <SelectItem key={partner.id} value={`${partner.id}|${partner.name}`}>{partner.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="revenue-value">Valor (R$)</Label>
                            <Input id="revenue-value" name="value" type="number" step="0.01" value={currentRevenue.value || ''} onChange={(e) => setCurrentRevenue(prev => ({ ...prev, value: parseFloat(e.target.value) || undefined }))} placeholder="Ex: 5000.00" required/>
                        </div>
                            <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="revenue-date">Data Prevista</Label>
                                <Input id="revenue-date" name="dueDate" type="date" value={currentRevenue.dueDate ? formatDate(currentRevenue.dueDate, 'yyyy-MM-dd') : ''} onChange={(e) => setCurrentRevenue(prev => ({ ...prev, dueDate: e.target.valueAsDate || undefined }))} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="revenue-status">Status</Label>
                                <Select name="status" value={currentRevenue.status || "Pendente"} onValueChange={(value) => setCurrentRevenue(prev => ({...prev, status: value as Revenue['status']}))} required>
                                    <SelectTrigger id="revenue-status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Paga">Paga</SelectItem>
                                        <SelectItem value="Atrasada">Atrasada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="revenue-description">Descrição (Opcional)</Label>
                            <Textarea id="revenue-description" name="description" value={currentRevenue.description || ''} onChange={(e) => setCurrentRevenue(prev => ({...prev, description: e.target.value}))} placeholder="Ex: Receita da venda do apartamento 101..." />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleDialogChange(false, 'revenue')}>Cancelar</Button>
                            <SubmitButton isEditing={isEditing} entityType="revenue" />
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isExpenseDialogOpen} onOpenChange={(isOpen) => handleDialogChange(isOpen, 'expense')}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DialogTitle>
                        <DialogDescription>Registre uma nova despesa ou conta a pagar.</DialogDescription>
                    </DialogHeader>
                    <form ref={expenseFormRef} action={isEditing ? updateExpenseAction : addExpenseAction} className="space-y-4 py-4">
                        <input type="hidden" name="brokerId" value={user?.uid || ''} />
                        {isEditing && <input type="hidden" name="expenseId" value={currentExpense.id || ''} />}
                        <div className="space-y-2">
                            <Label htmlFor="expense-description">Descrição</Label>
                            <Input id="expense-description" name="description" placeholder="Ex: Anúncio no Facebook" value={currentExpense.description || ''} onChange={e => setCurrentExpense(prev => ({...prev, description: e.target.value}))} required />
                        </div>
                            <div className="space-y-2">
                            <Label htmlFor="expense-category">Categoria</Label>
                            <Select name="category" value={currentExpense.category || ''} onValueChange={v => setCurrentExpense(prev => ({...prev, category: v}))} required>
                                <SelectTrigger id="expense-category"><SelectValue placeholder="Selecione uma categoria"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="marketing">Marketing e Publicidade</SelectItem>
                                    <SelectItem value="transporte">Transporte</SelectItem>
                                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                                    <SelectItem value="escritorio">Material de Escritório</SelectItem>
                                    <SelectItem value="taxas">Taxas e Impostos</SelectItem>
                                    <SelectItem value="outros">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expense-value">Valor (R$)</Label>
                            <Input id="expense-value" name="value" type="number" step="0.01" placeholder="Ex: 150.00" value={currentExpense.value || ''} onChange={e => setCurrentExpense(prev => ({...prev, value: parseFloat(e.target.value) || undefined }))} required/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expense-date">Data de Vencimento</Label>
                                <Input id="expense-date" name="dueDate" type="date" value={currentExpense.dueDate ? formatDate(currentExpense.dueDate, 'yyyy-MM-dd') : ''} onChange={e => setCurrentExpense(prev => ({...prev, dueDate: e.target.valueAsDate || undefined}))} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expense-status">Status</Label>
                                <Select name="status" value={currentExpense.status || 'Pendente'} onValueChange={v => setCurrentExpense(prev => ({...prev, status: v as Expense['status']}))} required>
                                    <SelectTrigger id="expense-status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Paga">Paga</SelectItem>
                                        <SelectItem value="Atrasada">Atrasada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleDialogChange(false, 'expense')}>Cancelar</Button>
                            <SubmitButton isEditing={isEditing} entityType="expense" />
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita e irá excluir o item permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem alterações não salvas. Se sair, seu progresso será perdido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsConfirmCloseOpen(false)}>Continuar Editando</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            setIsConfirmCloseOpen(false);
                            if (isRevenueDialogOpen) closeRevenueDialog();
                            if (isExpenseDialogOpen) closeExpenseDialog();
                        }}>Sair e Descartar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    

    