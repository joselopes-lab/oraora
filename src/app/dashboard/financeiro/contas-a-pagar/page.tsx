
'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TransactionDetail from "../components/transaction-detail";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, parseISO, isBefore, isEqual, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

type Transaction = {
    id: string;
    description: string;
    subDescription?: string;
    clientOrProvider?: string;
    date: string;
    status: string;
    value: number;
    categoryIcon: string;
    category: string;
    notes?: string;
    type: 'receita' | 'despesa';
    isRecurring?: boolean;
    brokerId: string;
};


export default function AccountsPayablePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());

    const transactionsQuery = useMemoFirebase(
      () => (firestore && user ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid), where('type', '==', 'despesa')) : null),
      [firestore, user]
    );
    const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const monthlyTransactions = useMemo(() => {
        if (!allTransactions) return [];
        const startOfCurrentMonth = startOfMonth(currentDate);
        const endOfCurrentMonth = endOfMonth(currentDate);

        return allTransactions.filter(t => {
            const transactionDate = parseISO(t.date);
            if (t.isRecurring) {
                return isBefore(transactionDate, endOfCurrentMonth) || isEqual(transactionDate, endOfCurrentMonth);
            }
            return transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth;
        });
    }, [allTransactions, currentDate]);
    
    const [selectedAccount, setSelectedAccount] = useState<Transaction | null>(null);

    const handleDeleteTransaction = (transaction: Transaction) => {
        if (!transaction || !firestore) return;
        const docRef = doc(firestore, 'transactions', transaction.id);
        deleteDocumentNonBlocking(docRef);
        
        toast({
          title: 'Transação Excluída!',
          description: `A transação "${transaction.description}" foi removida.`,
        });
        
        setSelectedAccount(null);
    };

    const handleStatusChange = (transactionId: string, newStatus: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'transactions', transactionId);
        setDocumentNonBlocking(docRef, { status: newStatus }, { merge: true });
        toast({
            title: "Status Atualizado!",
            description: `A transação foi marcada como ${newStatus.toLowerCase()}.`,
        });
        setSelectedAccount(null);
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Atrasado':
                return { container: 'bg-status-error text-status-error-text border-red-100', dot: 'bg-status-error-text' };
            case 'Pendente':
            case 'Agendado':
                return { container: 'bg-status-pending text-status-pending-text border-yellow-100', dot: 'bg-status-pending-text' };
            case 'Pago':
                return { container: 'bg-status-success text-status-success-text border-green-100', dot: 'bg-status-success-text' };
            default:
                return { container: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-500' };
        }
    }

    const totalToPay = useMemo(() => monthlyTransactions.filter(t => t.status === 'Pendente' || t.status === 'Agendado' || t.status === 'Atrasado').reduce((acc, curr) => acc + curr.value, 0), [monthlyTransactions]);
    const totalPaid = useMemo(() => monthlyTransactions.filter(t => t.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0), [monthlyTransactions]);
    const totalOverdue = useMemo(() => monthlyTransactions.filter(t => t.status === 'Atrasado').reduce((acc, curr) => acc + curr.value, 0), [monthlyTransactions]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard/financeiro">Financeiro</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">Contas a Pagar</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Contas a Pagar</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 text-text-secondary hover:text-text-main transition-colors border-r border-gray-100">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 min-w-[160px] justify-center">
              <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_month</span>
              <span className="font-bold text-sm text-text-main capitalize">{format(currentDate, 'MMMM, yyyy', { locale: ptBR })}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 text-text-secondary hover:text-text-main transition-colors border-l border-gray-100">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
          <div className="h-8 w-px bg-gray-300 mx-1 hidden md:block"></div>
          <Button variant="outline" className="flex items-center gap-2 bg-white border-gray-200 hover:border-gray-300 text-text-main hover:text-text-main font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-main font-bold py-2.5 px-6 rounded-lg shadow-glow transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Registrar Despesa
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase mb-1">Total a Pagar (Mês)</p>
            <p className="text-2xl font-bold text-text-main">{totalToPay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-main">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase mb-1">Total em Atraso</p>
            <p className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="size-10 rounded-full bg-status-error flex items-center justify-center text-status-error-text">
            <span className="material-symbols-outlined">warning</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase mb-1">Total Pago</p>
            <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="size-10 rounded-full bg-status-success flex items-center justify-center text-status-success-text">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 flex flex-col h-full">
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="Buscar por descrição, fornecedor ou valor..." type="text"/>
          </div>
          <div className="flex w-full lg:w-auto items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
            <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:border-primary focus:ring-primary outline-none cursor-pointer min-w-[140px] text-text-secondary">
              <option value="">Status: Todos</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Atrasado</option>
            </select>
            <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:border-primary focus:ring-primary outline-none cursor-pointer min-w-[160px] text-text-secondary">
              <option value="">Fornecedor: Todos</option>
              <option value="google">Google Ads</option>
              <option value="aws">AWS Services</option>
              <option value="office">Escritório Central</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold">Fornecedor</th>
                <th className="px-6 py-4 font-semibold">Vencimento</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Valor</th>
                <th className="px-6 py-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
                {isLoading && (
                    <tr><td colSpan={6} className="text-center p-6 text-text-secondary">Carregando contas a pagar...</td></tr>
                )}
                {!isLoading && monthlyTransactions.map(account => {
                    const statusClass = getStatusClasses(account.status);
                    return (
                        <tr key={account.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedAccount(account)}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-lg ${statusClass.container} flex items-center justify-center shrink-0`}>
                                        <span className="material-symbols-outlined text-[18px]">{account.categoryIcon}</span>
                                    </div>
                                    <span className="font-bold text-text-main">{account.description}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-text-secondary">{account.clientOrProvider}</td>
                            <td className={`px-6 py-4 font-medium ${account.status === 'Atrasado' ? 'text-red-600' : 'text-text-main'}`}>{format(parseISO(account.date), 'dd/MM/yyyy')}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${statusClass.container}`}>
                                    <span className={`size-1.5 rounded-full ${statusClass.dot}`}></span>
                                    {account.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-text-main">{account.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-6 py-4 text-center">
                                <button className="text-secondary hover:text-primary-hover font-bold text-xs hover:underline transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedAccount(account); }}>
                                    Ver Detalhes
                                </button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-text-secondary">Mostrando <span className="font-bold text-text-main">{monthlyTransactions.length}</span> de <span className="font-bold text-text-main">{monthlyTransactions.length}</span> contas</p>
          <div className="flex items-center gap-2">
            <button className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-text-main hover:border-gray-300 disabled:opacity-50 transition-colors" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="size-8 flex items-center justify-center rounded-lg bg-primary text-text-main font-bold shadow-sm">1</button>
            <button className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors">2</button>
            <button className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors">3</button>
            <button className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-text-main hover:border-gray-300 transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      <Dialog open={!!selectedAccount} onOpenChange={(isOpen) => !isOpen && setSelectedAccount(null)}>
        <DialogContent className="max-w-2xl p-0">
         <DialogHeader>
              <VisuallyHidden>
                  <DialogTitle>Detalhes da Transação</DialogTitle>
                  <DialogDescription>Exibe os detalhes da transação selecionada.</DialogDescription>
              </VisuallyHidden>
          </DialogHeader>
          {selectedAccount && <TransactionDetail transaction={selectedAccount} onClose={() => setSelectedAccount(null)} onDelete={handleDeleteTransaction} onStatusChange={handleStatusChange} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
