
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDoc, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import Link from "next/link";
import { doc, collection, query, where, writeBatch, setDoc } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { format, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, isBefore, isEqual, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import GoalForm from "./components/goal-form";
import TransactionForm, { TransactionFormData } from "./components/transaction-form";
import TransactionDetail from "./components/transaction-detail";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking as setDocNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
    userType: 'admin' | 'broker' | 'constructor';
};

type BrokerProfile = {
    slug: string;
    monthlyGoals?: { [key: string]: number };
};

type Transaction = {
    id: string;
    description: string;
    date: string;
    status: string;
    value: number;
    categoryIcon: string;
    category: string;
    type: 'receita' | 'despesa';
    clientOrProvider?: string;
    notes?: string;
    brokerId: string;
    isRecurring?: boolean;
    installments?: number;
    totalValue?: number;
    installmentNumber?: number;
    groupId?: string;
};

export default function FinancialPage() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [initialTransactionType, setInitialTransactionType] = useState<'receita' | 'despesa' | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const transactionsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

   useEffect(() => {
    if (allTransactions) {
      setTransactions(allTransactions);
    }
  }, [allTransactions]);


  const [currentMonthTransactions, setCurrentMonthTransactions] = useState<Transaction[]>([]);
  const [revenueData, setRevenueData] = useState<Transaction[]>([]);
  const [expenseData, setExpenseData] = useState<Transaction[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<{ name: string; value: number; fill: string; }[]>([]);

  const [revenuePercentageChange, setRevenuePercentageChange] = useState(0);
  const [expensePercentageChange, setExpensePercentageChange] = useState(0);

  const getTransactionsForMonth = (date: Date, allTrx: Transaction[]): Transaction[] => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const filtered: Transaction[] = [];

      allTrx.forEach(t => {
          const transactionDate = parseISO(t.date);
          if (t.isRecurring) {
              if (isBefore(transactionDate, end) || isEqual(transactionDate, end)) {
                  filtered.push({
                      ...t,
                      date: format(new Date(date.getFullYear(), date.getMonth(), transactionDate.getDate()), 'yyyy-MM-dd'),
                  });
              }
          } else {
              if (transactionDate >= start && transactionDate <= end) {
                  filtered.push(t);
              }
          }
      });
      return filtered;
  };


  useEffect(() => {
    if (transactions) {
        const currentMonthTrx = getTransactionsForMonth(currentDate, transactions);
        const prevMonthDate = subMonths(currentDate, 1);
        const prevMonthTrx = getTransactionsForMonth(prevMonthDate, transactions);

        const currentRevenue = currentMonthTrx.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
        const prevRevenue = prevMonthTrx.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
        
        const currentExpenses = currentMonthTrx.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
        const prevExpenses = prevMonthTrx.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);

        // Calculate percentage changes
        const revenueChange = prevRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
        const expenseChange = prevExpenses === 0 ? (currentExpenses > 0 ? 100 : 0) : ((currentExpenses - prevExpenses) / prevExpenses) * 100;
        
        setRevenuePercentageChange(revenueChange);
        setExpensePercentageChange(expenseChange);


        setCurrentMonthTransactions(currentMonthTrx);
        setRevenueData(currentMonthTrx.filter(t => t.type === 'receita').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 6));
        setExpenseData(currentMonthTrx.filter(t => t.type === 'despesa').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 6));

        const totalExpenses = currentExpenses;

        if (totalExpenses > 0) {
            const categoryTotals: { [key: string]: number } = currentMonthTrx.filter(t => t.type === 'despesa').reduce((acc, transaction) => {
            const category = transaction.category || 'Outros';
            acc[category] = (acc[category] || 0) + transaction.value;
            return acc;
            }, {} as { [key: string]: number });

            const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);

            const top4 = sortedCategories.slice(0, 4);
            const othersTotal = sortedCategories.slice(4).reduce((acc, [, value]) => acc + value, 0);

            const chartColors = ['#c3e738', '#84e637', '#1f2937', '#e5e7eb', '#a1a1aa'];
            let chartData = top4.map(([name, value], index) => ({
            name,
            value,
            fill: chartColors[index],
            }));
            
            if(othersTotal > 0) {
            chartData.push({
                name: 'Outros',
                value: othersTotal,
                fill: chartColors[4],
            });
            }
            setExpenseCategoryData(chartData);
        } else {
            setExpenseCategoryData([]);
        }

    }
  }, [transactions, currentDate]);

  const upcomingDueDates = useMemo(() => {
    const today = new Date();
    return currentMonthTransactions
      .filter(t => t.type === 'despesa' && (t.status === 'Pendente' || t.status === 'Atrasado'))
      .filter(t => parseISO(t.date) >= today)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 3);
  }, [currentMonthTransactions]);
  
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };


  const totalRevenue = useMemo(() => currentMonthTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0), [currentMonthTransactions]);
  const totalExpenses = useMemo(() => currentMonthTransactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0), [currentMonthTransactions]);
  const netBalance = totalRevenue - totalExpenses;
  
  const { isUserLoading: isAuthLoading } = useUser();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isUserLoading } = useDoc<UserProfile>(userDocRef);

  const brokerDocRef = useMemoFirebase(
      () => (firestore && user && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user, userProfile]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);

  const isPageLoading = isLoading || isAuthLoading || isUserLoading || isBrokerLoading || !isClient;
  const isBroker = userProfile?.userType === 'broker';
  
  const [displayDate, setDisplayDate] = useState('');
   useEffect(() => {
    setDisplayDate(format(new Date(), "dd 'de' MMM, yyyy", { locale: ptBR }));
  }, []);

  const openTransactionModal = (type: 'receita' | 'despesa' | undefined) => {
    setInitialTransactionType(type);
    setIsTransactionModalOpen(true);
  }

  const handleSaveGoal = (month: string, amount: number) => {
    if (!user || !firestore) return;
    const key = `monthlyGoals.${month}`;
    const docRef = doc(firestore, 'brokers', user.uid);
    setDocNonBlocking(docRef, { monthlyGoals: { [month]: amount } }, { merge: true });
    toast({
        title: "Meta Salva!",
        description: `Sua meta para ${format(parseISO(`${month}-01`), 'MMMM/yyyy', { locale: ptBR })} foi definida.`,
    });
    setIsGoalModalOpen(false);
  }
  
  const handleSaveTransaction = async (data: TransactionFormData) => {
      if (!user || !firestore) {
          toast({ variant: "destructive", title: "Erro de autenticação", description: "Você precisa estar logado." });
          return;
      }

      const batch = writeBatch(firestore);
      const now = new Date();
      const groupId = uuidv4();

      if (data.isRecurring) {
        const newDocRef = doc(collection(firestore, 'transactions'));
        batch.set(newDocRef, {
            ...data,
            installments: undefined, // Recurring is not installment-based
            brokerId: user.uid,
            createdAt: now.toISOString(),
            status: 'Pendente',
        });
      } else if (data.installments && data.installments > 1) {
          const installmentValue = data.value / data.installments;
          for (let i = 0; i < data.installments; i++) {
              const installmentDate = addMonths(parseISO(data.date), i);
              const newDocRef = doc(collection(firestore, 'transactions'));
              batch.set(newDocRef, {
                  ...data,
                  value: installmentValue,
                  totalValue: data.value,
                  date: format(installmentDate, 'yyyy-MM-dd'),
                  brokerId: user.uid,
                  createdAt: now.toISOString(),
                  status: 'Pendente',
                  installmentNumber: i + 1,
                  installments: data.installments,
                  groupId: groupId,
                  isRecurring: false, 
              });
          }
      } else {
          const newDocRef = doc(collection(firestore, 'transactions'));
          batch.set(newDocRef, {
              ...data,
              brokerId: user.uid,
              createdAt: now.toISOString(),
              status: 'Pendente',
          });
      }

      try {
          await batch.commit();
          toast({
              title: "Transação Salva!",
              description: `Sua ${data.type} foi registrada com sucesso.`,
          });
          setIsTransactionModalOpen(false);
      } catch (error) {
          console.error("Error adding transaction(s):", error);
          toast({
              variant: "destructive",
              title: "Erro ao Salvar",
              description: "Não foi possível registrar a transação. Tente novamente.",
          });
      }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };
  
  const handleDeleteTransaction = (transactionToDelete: Transaction) => {
    if (!transactionToDelete || !firestore) return;
    const docRef = doc(firestore, 'transactions', transactionToDelete.id);
    deleteDocumentNonBlocking(docRef);
    
    toast({
      title: 'Transação Excluída!',
      description: `A transação "${transactionToDelete.description}" foi removida.`,
    });
    
    setSelectedTransaction(null);
  };
  
  const handleStatusChange = (transactionId: string, newStatus: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'transactions', transactionId);
    setDocNonBlocking(docRef, { status: newStatus }, { merge: true });
    toast({
        title: "Status Atualizado!",
        description: `A transação foi marcada como ${newStatus.toLowerCase()}.`,
    });
    setSelectedTransaction(null);
  };

  const currentMonthKey = format(currentDate, 'yyyy-MM');
  const monthlyGoal = brokerProfile?.monthlyGoals?.[currentMonthKey] || 0;
  const totalReceived = useMemo(() => currentMonthTransactions
      .filter(t => t.type === 'receita' && t.status === 'Recebido')
      .reduce((acc, curr) => acc + curr.value, 0), [currentMonthTransactions]);
  const goalProgress = monthlyGoal > 0 ? (totalReceived / monthlyGoal) * 100 : 0;

  if (isPageLoading) {
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-28" />
                    <Skeleton className="h-11 w-40" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                    </div>
                    <Skeleton className="h-96 rounded-xl" />
                </div>
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                     <Skeleton className="h-48 rounded-xl" />
                     <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">Financeiro</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Controle Financeiro</h1>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 px-1 py-1 rounded-lg text-sm font-medium shadow-sm">
                <Button onClick={handlePrevMonth} variant="ghost" size="icon" className="h-7 w-7"><span className="material-symbols-outlined text-base">chevron_left</span></Button>
                <span className="w-32 text-center capitalize">{format(currentDate, 'MMMM, yyyy', { locale: ptBR })}</span>
                <Button onClick={handleNextMonth} variant="ghost" size="icon" className="h-7 w-7"><span className="material-symbols-outlined text-base">chevron_right</span></Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-text-main hover:text-text-main font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-300">
            <Link href="/dashboard/financeiro/relatorios">
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span className="hidden sm:inline">Relatórios</span>
            </Link>
          </Button>
          <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 group">
                  <span className="material-symbols-outlined text-[20px] ">add_card</span>
                   <span>Nova Transação</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0">
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>Registrar Nova Transação</DialogTitle>
                        <DialogDescription>Preencha os detalhes abaixo para registrar uma nova receita ou despesa.</DialogDescription>
                    </VisuallyHidden>
                </DialogHeader>
                  <TransactionForm 
                    onSave={handleSaveTransaction} 
                    onCancel={() => setIsTransactionModalOpen(false)}
                    initialType={initialTransactionType}
                  />
              </DialogContent>
          </Dialog>
        </div>
      </div>
       
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-6xl text-green-500">trending_up</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-full bg-status-success flex items-center justify-center text-status-success-text">
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                    </div>
                    <span className="text-sm font-medium text-text-secondary">Receitas (Mês)</span>
                </div>
                <p className="text-2xl font-bold text-text-main">
                    {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                 <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${revenuePercentageChange >= 0 ? 'text-status-success-text' : 'text-status-error-text'}`}>
                    {revenuePercentageChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(revenuePercentageChange).toFixed(1)}% vs mês anterior
                </p>
            </div>
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-6xl text-red-500">trending_down</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-full bg-status-error flex items-center justify-center text-status-error-text">
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    </div>
                    <span className="text-sm font-medium text-text-secondary">Despesas (Mês)</span>
                </div>
                <p className="text-2xl font-bold text-text-main">
                    {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                 <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${expensePercentageChange <= 0 ? 'text-status-success-text' : 'text-status-error-text'}`}>
                    {expensePercentageChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {Math.abs(expensePercentageChange).toFixed(1)}% vs mês anterior
                </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-full w-1 bg-primary"></div>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
                <span className="text-sm font-medium text-text-secondary">Saldo Atual</span>
              </div>
              <p className="text-2xl font-bold text-text-main">
                {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                Disponível para saque
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-text-main">Desempenho Financeiro</h3>
                <select className="text-xs border-gray-200 rounded-md py-1 pr-6 pl-2 text-text-secondary focus:ring-primary focus:border-primary cursor-pointer">
                  <option>Últimos 6 meses</option>
                  <option>Este ano</option>
                </select>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 md:gap-4 px-2">
                <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full bg-primary/20 rounded-t-sm h-[40%] group-hover:bg-primary/40 transition-all">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">12k</div>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Mai</span>
                </div>
                <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full bg-primary/20 rounded-t-sm h-[55%] group-hover:bg-primary/40 transition-all">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">18k</div>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Jun</span>
                </div>
                <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full bg-primary/20 rounded-t-sm h-[45%] group-hover:bg-primary/40 transition-all">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">15k</div>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Jul</span>
                </div>
                <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full bg-primary/20 rounded-t-sm h-[70%] group-hover:bg-primary/40 transition-all">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">28k</div>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Ago</span>
                </div>
                <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full bg-primary/20 rounded-t-sm h-[60%] group-hover:bg-primary/40 transition-all">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">22k</div>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Set</span>
                </div>
                <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full bg-primary rounded-t-sm h-[90%] shadow-glow transition-all hover:bg-primary-hover">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-text-main">45k</div>
                  </div>
                  <span className="text-[10px] text-text-main font-bold uppercase">Out</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-1 bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                <h3 className="font-bold text-text-main mb-6">Despesas por Categoria</h3>
                <div className="space-y-4">
                  {expenseCategoryData.length > 0 ? (
                    expenseCategoryData.map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary font-medium">{category.name}</span>
                          <span className="font-bold">{category.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${(category.value / totalExpenses) * 100}%`, backgroundColor: category.fill }}></div></div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary text-center py-8">Nenhuma despesa registrada para este mês.</p>
                  )}
                </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary"></span>
                  Contas a Receber
                </h3>
                <Link className="text-xs font-bold text-secondary hover:underline" href="/dashboard/financeiro/contas-a-receber">Ver todas</Link>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? <p className="p-4 text-center text-sm text-text-secondary">Carregando...</p> : revenueData.map((item) => (
                  <div key={item.id} onClick={() => handleTransactionClick(item)} className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg text-text-main">
                        <span className="material-symbols-outlined text-[18px]">{item.categoryIcon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{item.description}</p>
                        <p className="text-xs text-text-secondary">Previsão: {format(parseISO(item.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-main">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Pendente' ? 'bg-status-pending text-status-pending-text' : 'bg-status-success text-status-success-text'}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-400"></span>
                  Contas a Pagar
                </h3>
                <Link className="text-xs font-bold text-secondary hover:underline" href="/dashboard/financeiro/contas-a-pagar">Ver todas</Link>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? <p className="p-4 text-center text-sm text-text-secondary">Carregando...</p> : expenseData.map((item) => (
                  <div key={item.id} onClick={() => handleTransactionClick(item)} className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 p-2 rounded-lg text-red-600">
                        <span className="material-symbols-outlined text-[18px]">{item.categoryIcon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{item.description}</p>
                        <p className="text-xs text-text-secondary">Vencimento: {format(parseISO(item.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-main">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Atrasado' ? 'bg-status-error text-status-error-text' : item.status === 'Pendente' ? 'bg-status-pending text-status-pending-text' : 'bg-status-success text-status-success-text'}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-card text-card-foreground rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Button onClick={() => openTransactionModal('receita')} className="w-full justify-between p-4 h-auto bg-white hover:bg-gray-50 text-black rounded-xl shadow-sm transition-all group border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px] text-black">add</span>
                  </div>
                  <span className="font-bold text-left text-black" dangerouslySetInnerHTML={{ __html: 'Registrar<br>Receitas' }}></span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-black">chevron_right</span>
              </Button>
              <Button onClick={() => openTransactionModal('despesa')} variant="outline" className="w-full justify-between p-4 h-auto bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-foreground rounded-xl shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-1.5 rounded-lg text-red-600 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </div>
                  <span className="font-bold text-left text-black" dangerouslySetInnerHTML={{ __html: 'Registrar<br>Despesas' }}></span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-red-400">chevron_right</span>
              </Button>
               <Button asChild variant="outline" className="w-full justify-between p-4 h-auto bg-white border border-gray-200 hover:border-secondary hover:bg-gray-50 text-foreground rounded-xl shadow-sm transition-all group">
                <Link href="/dashboard/financeiro/relatorios">
                    <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-1.5 rounded-lg text-text-main group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px] text-black">bar_chart</span>
                    </div>
                    <span className="font-bold text-left text-black" dangerouslySetInnerHTML={{ __html: 'Relatórios<br>Detalhados' }}></span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-secondary">chevron_right</span>
                </Link>
              </Button>
            </div>
          </div>
          <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
             <div className="bg-black text-white rounded-xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 size-32 bg-primary blur-[60px] opacity-20 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">flag</span>
                      Meta de Receitas
                  </h3>
                   <DialogTrigger asChild>
                      <button className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-white/10" title="Definir Meta">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                  </DialogTrigger>
                </div>
                <div className="mb-2 relative z-10">
                <p className="text-3xl font-bold tracking-tight">{totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="text-xs text-gray-400">Meta: {monthlyGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <Progress value={goalProgress} className="h-2 [&>div]:bg-primary" />
                <p className="text-xs text-gray-400 leading-relaxed relative z-10 mt-2">
                  {goalProgress.toFixed(0)}% da meta de {format(currentDate, 'MMMM', { locale: ptBR })} alcançada.
                </p>
            </div>
            <DialogContent className="sm:max-w-md p-0">
                <VisuallyHidden>
                  <DialogHeader>
                      <DialogTitle>Definir Meta Mensal</DialogTitle>
                  </DialogHeader>
                </VisuallyHidden>
              <GoalForm onSave={handleSaveGoal} onCancel={() => setIsGoalModalOpen(false)} currentMonth={currentDate} />
            </DialogContent>
          </Dialog>
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px]">notifications_active</span>
              Próximos Vencimentos
            </h3>
            <div className="space-y-4">
              {isLoading ? (
                 <p className="text-xs text-text-secondary">Carregando...</p>
              ) : upcomingDueDates.length > 0 ? (
                upcomingDueDates.map(item => {
                  const dueDate = parseISO(item.date);
                  const daysLeft = differenceInDays(dueDate, new Date());
                  const isSoon = daysLeft <= 5;
                  return (
                    <div key={item.id} className="flex gap-3 items-start opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleTransactionClick(item)}>
                      <div className={`flex flex-col items-center rounded px-2 py-1 min-w-[3rem] ${isSoon ? 'bg-red-50 border border-red-100' : 'bg-gray-100'}`}>
                        <span className={`text-xs font-bold uppercase ${isSoon ? 'text-red-500' : 'text-gray-500'}`}>{format(dueDate, 'MMM', { locale: ptBR })}</span>
                        <span className={`text-lg font-bold ${isSoon ? 'text-red-600' : 'text-text-main'}`}>{format(dueDate, 'dd')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{item.description}</p>
                        <p className="text-xs text-text-secondary">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                         {isSoon && <span className="text-[10px] text-red-500 font-bold">Vence em {daysLeft} dias</span>}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-text-secondary text-center py-4">Nenhuma despesa próxima do vencimento.</p>
              )}
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-5 border border-primary/20 flex gap-3 items-start">
            <span className="material-symbols-outlined text-secondary text-xl mt-0.5 shrink-0">tips_and_updates</span>
            <div>
              <h4 className="text-sm font-bold text-text-main mb-1">Dica Financeira</h4>
              <p className="text-xs text-text-secondary leading-relaxed">Categorizar suas despesas ajuda a identificar onde cortar custos desnecessários no próximo mês.</p>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={!!selectedTransaction} onOpenChange={(isOpen) => !isOpen && setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl p-0">
          <VisuallyHidden>
              <DialogHeader>
                  <DialogTitle>Detalhes da Transação</DialogTitle>
                  <DialogDescription>Exibe os detalhes da transação selecionada.</DialogDescription>
              </DialogHeader>
          </VisuallyHidden>
          {selectedTransaction && <TransactionDetail transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} onStatusChange={handleStatusChange} />}
        </DialogContent>
      </Dialog>
    </AlertDialog>
  );
}
