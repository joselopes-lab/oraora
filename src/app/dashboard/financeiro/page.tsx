'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, LayoutGrid, ChevronRight, Clock } from "lucide-react";
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
import { useDoc, useFirebase, useMemoFirebase, useUser, useAuthContext } from "@/firebase";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  const { userProfile, isReady } = useAuthContext();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const transactionsQuery = useMemoFirebase(
    () => (user?.uid && firestore ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid)) : null),
    [user?.uid, firestore]
  );

  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);

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

  const processedData = useMemo(() => {
    if (!allTransactions || !isClient) return {
        currentMonthTransactions: [],
        revenueData: [],
        expenseData: [],
        revenuePercentageChange: 0,
        expensePercentageChange: 0,
        expenseCategoryData: [],
        chartMonths: []
    };

    const currentMonthTrx = getTransactionsForMonth(currentDate, allTransactions);
    const prevMonthDate = subMonths(currentDate, 1);
    const prevMonthTrx = getTransactionsForMonth(prevMonthDate, allTransactions);

    const currentRevenue = currentMonthTrx.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
    const prevRevenue = prevMonthTrx.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
    
    const currentExpenses = currentMonthTrx.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
    const prevExpenses = prevMonthTrx.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);

    const revenueChange = prevRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    const expenseChange = prevExpenses === 0 ? (currentExpenses > 0 ? 100 : 0) : ((currentExpenses - prevExpenses) / prevExpenses) * 100;

    // Chart Data (Last 6 months)
    const chartMonths = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(currentDate, 5 - i);
        const monthTransactions = getTransactionsForMonth(d, allTransactions);
        const revenue = monthTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
        const label = format(d, 'MMM', { locale: ptBR });
        return { label, value: revenue, isCurrent: i === 5 };
    });

    // Categories Data
    const categoryTotals: { [key: string]: number } = currentMonthTrx.filter(t => t.type === 'despesa').reduce((acc, transaction) => {
        const category = transaction.category || 'Outros';
        acc[category] = (acc[category] || 0) + transaction.value;
        return acc;
    }, {} as { [key: string]: number });

    const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
    const top4 = sortedCategories.slice(0, 4);
    const othersTotal = sortedCategories.slice(4).reduce((acc, [, value]) => acc + value, 0);
    const chartColors = ['#c3e738', '#84e637', '#1f2937', '#e5e7eb', '#a1a1aa'];
    
    const expenseCategoryData = top4.map(([name, value], index) => ({
        name,
        value,
        fill: chartColors[index],
    }));
    
    if(othersTotal > 0) {
        expenseCategoryData.push({ name: 'Outros', value: othersTotal, fill: chartColors[4] });
    }

    return {
        currentMonthTransactions: currentMonthTrx,
        revenueData: currentMonthTrx.filter(t => t.type === 'receita').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 6),
        expenseData: currentMonthTrx.filter(t => t.type === 'despesa').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 6),
        revenuePercentageChange: revenueChange,
        expensePercentageChange: expenseChange,
        expenseCategoryData,
        chartMonths
    };
  }, [allTransactions, currentDate, isClient]);

  const { currentMonthTransactions, revenueData, expenseData, revenuePercentageChange, expensePercentageChange, expenseCategoryData, chartMonths } = processedData;

  const upcomingDueDates = useMemo(() => {
    if (!isClient) return [];
    const today = new Date();
    return currentMonthTransactions
      .filter(t => t.type === 'despesa' && (t.status === 'Pendente' || t.status === 'Atrasado'))
      .filter(t => parseISO(t.date) >= today)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 3);
  }, [currentMonthTransactions, isClient]);
  
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const totalRevenue = useMemo(() => currentMonthTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0), [currentMonthTransactions]);
  const totalExpenses = useMemo(() => currentMonthTransactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0), [currentMonthTransactions]);
  const netBalance = totalRevenue - totalExpenses;
  
  const currentBrokerDocRef = useMemoFirebase(
      () => (firestore && user?.uid && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user?.uid, userProfile?.userType]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(currentBrokerDocRef);

  const isPageLoading = isLoading || isBrokerLoading || !isClient || !isReady;
  
  const openTransactionModal = (type: 'receita' | 'despesa' | undefined) => {
    setInitialTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  const handleSaveGoal = (month: string, amount: number) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'brokers', user.uid);
    setDocNonBlocking(docRef, { monthlyGoals: { [month]: amount } }, { merge: true });
    toast({ title: "Meta Salva!", description: `Sua meta para ${format(parseISO(`${month}-01`), 'MMMM/yyyy', { locale: ptBR })} foi definida.` });
    setIsGoalModalOpen(false);
  };
  
  const handleSaveTransaction = async (data: TransactionFormData) => {
      if (!user || !firestore) return;
      const batch = writeBatch(firestore);
      const now = new Date();
      const groupId = uuidv4();

      if (data.isRecurring) {
        const newDocRef = doc(collection(firestore, 'transactions'));
        batch.set(newDocRef, { ...data, installments: undefined, brokerId: user.uid, createdAt: now.toISOString(), status: 'Pendente' });
      } else if (data.installments && data.installments > 1) {
          const installmentValue = data.value / data.installments;
          for (let i = 0; i < data.installments; i++) {
              const installmentDate = addMonths(parseISO(data.date), i);
              const newDocRef = doc(collection(firestore, 'transactions'));
              batch.set(newDocRef, { ...data, value: installmentValue, totalValue: data.value, date: format(installmentDate, 'yyyy-MM-dd'), brokerId: user.uid, createdAt: now.toISOString(), status: 'Pendente', installmentNumber: i + 1, installments: data.installments, groupId, isRecurring: false });
          }
      } else {
          const newDocRef = doc(collection(firestore, 'transactions'));
          batch.set(newDocRef, { ...data, brokerId: user.uid, createdAt: now.toISOString(), status: 'Pendente' });
      }

      try {
          await batch.commit();
          toast({ title: "Transação Salva!", description: `Sua ${data.type} foi registrada com sucesso.` });
          setIsTransactionModalOpen(false);
      } catch (error) {
          toast({ variant: "destructive", title: "Erro ao Salvar" });
      }
  };

  const handleTransactionClick = (transaction: Transaction) => setSelectedTransaction(transaction);
  
  const handleDeleteTransaction = (t: Transaction) => {
    if (!t || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'transactions', t.id));
    toast({ title: 'Transação Excluída!' });
    setSelectedTransaction(null);
  };
  
  const handleStatusChange = (tid: string, s: string) => {
    if (!firestore) return;
    setDocNonBlocking(doc(firestore, 'transactions', tid), { status: s }, { merge: true });
    toast({ title: "Status Atualizado!" });
    setSelectedTransaction(null);
  };

  const currentMonthKey = format(currentDate, 'yyyy-MM');
  const monthlyGoal = brokerProfile?.monthlyGoals?.[currentMonthKey] || 0;
  const totalReceived = useMemo(() => currentMonthTransactions.filter(t => t.type === 'receita' && t.status === 'Recebido').reduce((acc, curr) => acc + curr.value, 0), [currentMonthTransactions]);
  const goalProgress = monthlyGoal > 0 ? (totalReceived / monthlyGoal) * 100 : 0;

  if (isPageLoading) return <div className="w-full max-w-7xl mx-auto p-10 space-y-8"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">Financeiro</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-text-main tracking-tight uppercase">Controle Financeiro</h1>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-1 py-1 rounded-lg text-sm font-medium shadow-sm">
                <Button onClick={handlePrevMonth} variant="ghost" size="icon" className="h-7 w-7"><span className="material-symbols-outlined text-base">chevron_left</span></Button>
                <span className="w-32 text-center capitalize">{format(currentDate, 'MMMM, yyyy', { locale: ptBR })}</span>
                <Button onClick={handleNextMonth} variant="ghost" size="icon" className="h-7 w-7"><span className="material-symbols-outlined text-base">chevron_right</span></Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="bg-white border-gray-200 h-11 px-6 rounded-xl font-bold transition-all"><Link href="/dashboard/financeiro/relatorios"><span className="material-symbols-outlined mr-2">print</span> Relatórios</Link></Button>
          <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-white font-bold h-11 px-6 rounded-xl shadow-glow transition-all active:scale-[0.98] border-none">
                  <span className="material-symbols-outlined mr-2">add_card</span> Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                <VisuallyHidden>
                  <DialogHeader>
                    <DialogTitle>Registrar Transação</DialogTitle>
                    <DialogDescription>Preencha os detalhes da transação financeira.</DialogDescription>
                  </DialogHeader>
                </VisuallyHidden>
                <TransactionForm onSave={handleSaveTransaction} onCancel={() => setIsTransactionModalOpen(false)} initialType={initialTransactionType} />
              </DialogContent>
          </Dialog>
        </div>
      </div>
       
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft relative overflow-hidden group text-left">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-6xl text-green-500">trending_up</span></div>
                <div className="flex items-center gap-2 mb-2"><div className="size-8 rounded-full bg-status-success flex items-center justify-center text-status-success-text"><span className="material-symbols-outlined text-[18px]">arrow_upward</span></div><span className="text-sm font-medium text-text-secondary">Receitas (Mês)</span></div>
                <p className="text-2xl font-bold text-text-main">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 <p className={cn("text-xs mt-1 flex items-center gap-1 font-medium", revenuePercentageChange >= 0 ? 'text-status-success-text' : 'text-status-error-text')}>
                    {revenuePercentageChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(revenuePercentageChange).toFixed(1)}% vs mês ant.
                </p>
            </div>
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft relative overflow-hidden group text-left">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-6xl text-red-500">trending_down</span></div>
                <div className="flex items-center gap-2 mb-2"><div className="size-8 rounded-full bg-status-error flex items-center justify-center text-status-error-text"><span className="material-symbols-outlined text-[18px]">arrow_downward</span></div><span className="text-sm font-medium text-text-secondary">Despesas (Mês)</span></div>
                <p className="text-2xl font-bold text-text-main">{totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 <p className={cn("text-xs mt-1 flex items-center gap-1 font-medium", expensePercentageChange <= 0 ? 'text-status-success-text' : 'text-status-error-text')}>
                    {expensePercentageChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {Math.abs(expensePercentageChange).toFixed(1)}% vs mês ant.
                </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 h-full w-1 bg-primary"></div>
              <div className="flex items-center gap-2 mb-2"><div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><span className="material-symbols-outlined text-[18px]">account_balance_wallet</span></div><span className="text-sm font-medium text-text-secondary">Saldo em {format(currentDate, 'MMM', { locale: ptBR })}</span></div>
              <p className="text-2xl font-bold text-text-main">{netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <p className="text-xs text-text-secondary mt-1">Líquido do período</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="md:col-span-2 bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-bold text-text-main text-lg uppercase tracking-tight">Desempenho de Receitas</h3>
                <Badge variant="outline" className="bg-slate-50 border-slate-100 font-bold">Fluxo 6 Meses</Badge>
              </div>
              <div className="h-56 flex items-end justify-between gap-4 px-2">
                {chartMonths.map((m, i) => (
                    <div key={i} className="w-full flex flex-col items-center gap-3 group cursor-pointer relative">
                        <div 
                            className={cn("relative w-full rounded-t-xl transition-all duration-500", m.isCurrent ? "bg-primary shadow-glow hover:brightness-105" : "bg-primary/20 hover:bg-primary/40")} 
                            style={{ height: `${Math.max(12, (m.value / (Math.max(...chartMonths.map(x => x.value)) || 1)) * 100)}%` }}
                        >
                            <div className={cn("absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-900 transition-opacity whitespace-nowrap", m.isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                {m.value >= 1000 ? `R$ ${(m.value/1000).toFixed(1)}k` : `R$ ${m.value.toFixed(0)}`}
                            </div>
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", m.isCurrent ? "text-slate-900" : "text-slate-400")}>
                            {m.label}
                        </span>
                    </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-1 bg-white rounded-xl shadow-soft border border-gray-100 p-6 flex flex-col">
                <h3 className="font-bold text-text-main text-lg uppercase tracking-tight mb-8">Gastos do Mês</h3>
                <div className="space-y-5 flex-1">
                  {expenseCategoryData.length > 0 ? (
                    expenseCategoryData.map((category, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase tracking-tighter">{category.name}</span>
                          <span className="text-slate-900">{category.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden"><div className="h-full transition-all duration-1000" style={{ width: `${(category.value / totalExpenses) * 100}%`, backgroundColor: category.fill }}></div></div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-50 rounded-xl">
                        <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">payments</span>
                        <p className="text-xs text-slate-400 italic">Sem despesas registradas.</p>
                    </div>
                  )}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary"></span> Contas a Receber
                </h3>
                <Link className="text-[10px] font-black uppercase text-primary-hover hover:underline" href="/dashboard/financeiro/contas-a-receber">Ver Extrato</Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden min-h-[300px] flex flex-col">
                {isLoading ? <div className="p-10 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : revenueData.length > 0 ? (
                   <div className="divide-y divide-slate-50">
                    {revenueData.map((item) => (
                    <div key={item.id} onClick={() => handleTransactionClick(item)} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                <span className="material-symbols-outlined text-xl">{item.categoryIcon}</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{item.description}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(item.date), 'dd MMM', { locale: ptBR })}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", item.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>{item.status}</span>
                        </div>
                    </div>
                    ))}
                   </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
                        <span className="material-symbols-outlined text-slate-200 text-5xl">savings</span>
                        <p className="text-sm text-slate-400 italic">Nenhum recebimento em {format(currentDate, 'MMMM', { locale: ptBR })}.</p>
                    </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-500"></span> Contas a Pagar
                </h3>
                <Link className="text-[10px] font-black uppercase text-primary-hover hover:underline" href="/dashboard/financeiro/contas-a-pagar">Ver Extrato</Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden min-h-[300px] flex flex-col">
                {isLoading ? <div className="p-10 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : expenseData.length > 0 ? (
                   <div className="divide-y divide-slate-50">
                    {expenseData.map((item) => (
                    <div key={item.id} onClick={() => handleTransactionClick(item)} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                <span className="material-symbols-outlined text-xl">{item.categoryIcon}</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{item.description}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(item.date), 'dd MMM', { locale: ptBR })}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", item.status === 'Atrasado' ? 'bg-red-100 text-red-700' : item.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>{item.status}</span>
                        </div>
                    </div>
                    ))}
                   </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
                        <span className="material-symbols-outlined text-slate-200 text-5xl">receipt</span>
                        <p className="text-sm text-slate-400 italic">Tudo pago ou sem contas em {format(currentDate, 'MMMM', { locale: ptBR })}.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden border border-slate-800 text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] opacity-20"></div>
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-6">Ações Rápidas</h3>
            <div className="space-y-3">
              <button onClick={() => openTransactionModal('receita')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-lg">add</span></div>
                      <span className="font-bold text-sm">Registrar Receitas</span>
                  </div>
                  <ChevronRight className="size-4 text-slate-600" />
              </button>
              <button onClick={() => openTransactionModal('despesa')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                      <div className="size-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-lg">remove</span></div>
                      <span className="font-bold text-sm">Registrar Despesas</span>
                  </div>
                  <ChevronRight className="size-4 text-slate-600" />
              </button>
               <Button asChild variant="ghost" className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all group cursor-pointer border-none h-auto">
                <Link href="/dashboard/financeiro/relatorios">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-lg">bar_chart</span></div>
                      <span className="font-bold text-sm">Painel Completo</span>
                    </div>
                    <ChevronRight className="size-4 text-slate-600" />
                </Link>
              </Button>
            </div>
          </div>

          <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
             <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft text-left relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">flag</span> Meta de Receitas</h3>
                   <DialogTrigger asChild><button className="text-slate-300 hover:text-primary transition-colors cursor-pointer border-none bg-transparent"><span className="material-symbols-outlined text-sm">edit</span></button></DialogTrigger>
                </div>
                <div className="mb-4">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Objetivo: {monthlyGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                </div>
                <div className="space-y-2">
                    <Progress value={goalProgress} className="h-1.5 bg-slate-100" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{goalProgress.toFixed(0)}% da meta em {format(currentDate, 'MMMM', { locale: ptBR })}</p>
                </div>
            </div>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
              <VisuallyHidden>
                <DialogHeader>
                  <DialogTitle>Definir Meta</DialogTitle>
                  <DialogDescription>Ajuste sua meta financeira para o mês atual.</DialogDescription>
                </DialogHeader>
              </VisuallyHidden>
              <GoalForm onSave={handleSaveGoal} onCancel={() => setIsGoalModalOpen(false)} currentMonth={currentDate} />
            </DialogContent>
          </Dialog>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft text-left">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-lg">notifications_active</span> Vencimentos</h3>
            <div className="space-y-6">
              {isLoading ? <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : upcomingDueDates.length > 0 ? (
                upcomingDueDates.map(item => {
                  const dueDate = parseISO(item.date);
                  const daysLeft = differenceInDays(dueDate, new Date());
                  const isSoon = daysLeft <= 5;
                  return (
                    <div key={item.id} className="flex gap-4 items-start group cursor-pointer" onClick={() => handleTransactionClick(item)}>
                      <div className={cn("flex flex-col items-center rounded-xl p-2 min-w-[3.5rem] transition-all", isSoon ? "bg-red-50 border border-red-100 text-red-600" : "bg-slate-50 border border-slate-100 text-slate-500")}>
                        <span className="text-[9px] font-black uppercase">{format(dueDate, 'MMM', { locale: ptBR })}</span>
                        <span className="text-lg font-black">{format(dueDate, 'dd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{item.description}</p>
                        <p className="text-xs font-medium text-slate-400">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        {isSoon && <p className="text-[9px] font-black text-red-600 uppercase mt-1 flex items-center gap-1"><Clock className="size-2.5" /> em {daysLeft} dias</p>}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-6 italic">Sem despesas próximas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={!!selectedTransaction} onOpenChange={(isOpen) => !isOpen && setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Detalhes da Transação</DialogTitle>
              <DialogDescription>Visualize as informações detalhadas desta transação.</DialogDescription>
            </DialogHeader>
          </VisuallyHidden>
          {selectedTransaction && <TransactionDetail transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} onStatusChange={handleStatusChange} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
