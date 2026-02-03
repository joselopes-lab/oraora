
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


export default function AccountsReceivablePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());

    const transactionsQuery = useMemoFirebase(
      () => (firestore && user ? query(collection(firestore, 'transactions'), where('brokerId', '==', user.uid), where('type', '==', 'receita')) : null),
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
            case 'Recebido':
                return { container: 'bg-status-success text-status-success-text border-green-100', dot: 'bg-status-success-text' };
            default:
                return { container: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-500' };
        }
    }
    
    const totalToReceive = useMemo(() => monthlyTransactions.filter(t => t.status === 'Pendente' || t.status === 'Agendado' || t.status === 'Atrasado').reduce((acc, curr) => acc + curr.value, 0), [monthlyTransactions]);
    const totalReceived = useMemo(() => monthlyTransactions.filter(t => t.status === 'Recebido').reduce((acc, curr) => acc + curr.value, 0), [monthlyTransactions]);
    const totalOverdue = useMemo(() => monthlyTransactions.filter(t => t.status === 'Atrasado').reduce((acc, curr) => acc + curr.value, 0), [monthlyTransactions]);


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard/financeiro">Financeiro</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">Contas a Receber</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Contas a Receber</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 text-gray-500 hover:text-primary transition-colors border-r border-gray-100">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 min-w-[160px] justify-center">
              <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_month</span>
              <span className="text-sm font-bold text-text-main capitalize">{format(currentDate, 'MMMM, yyyy', { locale: ptBR })}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 text-gray-500 hover:text-primary transition-colors border-l border-gray-100">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-main font-bold py-2.5 px-6 rounded-lg shadow-glow transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Registrar Receita
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">payments</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">Total a Receber ({format(currentDate, 'MMM', { locale: ptBR })})</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-text-main">{totalToReceive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <p className="text-xs text-text-secondary mt-1">{monthlyTransactions.filter(t => t.status === 'Pendente' || t.status === 'Agendado').length} transações pendentes</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-status-success-text">check_circle</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">Já Recebido</span>
          <h3 className="text-2xl font-bold text-text-main">{totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          <p className="text-xs text-text-secondary mt-1">{monthlyTransactions.filter(t => t.status === 'Recebido').length} transações finalizadas</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-status-error-text">warning</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">Em Atraso</span>
          <h3 className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          <p className="text-xs text-text-secondary mt-1">{monthlyTransactions.filter(t => t.status === 'Atrasado').length} transações críticas</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 flex flex-col h-full">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400">search</span>
            </div>
            <input className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out" placeholder="Buscar por descrição, cliente ou valor..." type="text"/>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group">
              <select className="appearance-none bg-gray-50 border border-gray-200 text-text-main py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                <option value="">Status: Todos</option>
                <option value="pendente">Pendente</option>
                <option value="recebido">Recebido</option>
                <option value="atrasado">Atrasado</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider" scope="col">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider" scope="col">Cliente Associado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider" scope="col">Previsão</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider" scope="col">Valor</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider" scope="col">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-text-secondary uppercase tracking-wider" scope="col">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
                {isLoading && (
                    <tr><td colSpan={6} className="text-center p-6 text-text-secondary">Carregando contas a receber...</td></tr>
                )}
                {!isLoading && monthlyTransactions.map(account => {
                    const statusClass = getStatusClasses(account.status);
                    return (
                    <tr key={account.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedAccount(account)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="ml-4">
                                    <div className="text-sm font-bold text-text-main">{account.description}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-text-main">{account.clientOrProvider || 'N/A'}</div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${account.status === 'Atrasado' ? 'text-red-600 font-bold' : 'text-text-main'}`}>
                            {format(parseISO(account.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-text-main">{account.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${statusClass.container}`}>
                                {account.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-text-secondary hover:text-secondary font-bold inline-flex items-center gap-1 transition-colors" onClick={() => setSelectedAccount(account)}>
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                Ver Detalhes
                            </button>
                        </td>
                    </tr>
                )})}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Mostrando <span className="font-bold text-text-main">1-{monthlyTransactions.length}</span> de <span className="font-bold text-text-main">{monthlyTransactions.length}</span> resultados
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50">
              Anterior
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-text-main bg-white hover:bg-gray-50 hover:border-primary transition-colors">
              Próxima
            </button>
          </div>
        </div>
      </div>

       <Dialog open={!!selectedAccount} onOpenChange={(isOpen) => !isOpen && setSelectedAccount(null)}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Detalhes da Transação</DialogTitle>
              <DialogDescription>
                Exibe os detalhes da transação selecionada.
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          {selectedAccount && <TransactionDetail transaction={selectedAccount} onClose={() => setSelectedAccount(null)} onDelete={handleDeleteTransaction} onStatusChange={handleStatusChange} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
