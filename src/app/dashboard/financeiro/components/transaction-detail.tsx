
'use client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from 'react';

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
};

type TransactionDetailProps = {
    transaction: Transaction;
    onClose: () => void;
    onDelete: (transaction: Transaction) => void;
    onStatusChange: (transactionId: string, newStatus: string) => void;
};


export default function TransactionDetail({ transaction, onClose, onDelete, onStatusChange }: TransactionDetailProps) {
    const isRevenue = transaction.type === 'receita';
    const party = transaction.clientOrProvider || (isRevenue ? 'Cliente não informado' : 'Fornecedor não informado');
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Atrasado': return { container: 'bg-status-error text-status-error-text border-red-100', dot: 'bg-status-error-text' };
            case 'Pendente': return { container: 'bg-status-pending text-status-pending-text border-yellow-100', dot: 'bg-status-pending-text' };
            case 'Agendado': return { container: 'bg-status-pending text-status-pending-text border-yellow-100', dot: 'bg-status-pending-text' };
            case 'Pago':
            case 'Recebido': return { container: 'bg-status-success text-status-success-text border-green-100', dot: 'bg-status-success-text' };
            default: return { container: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-500' };
        }
    };
    
    const handleConfirmDelete = () => {
        onDelete(transaction);
        setIsDeleteAlertOpen(false); // Fechar o alerta após confirmar
    };

    const handleStatusUpdate = () => {
        const newStatus = isRevenue ? 'Recebido' : 'Pago';
        onStatusChange(transaction.id, newStatus);
    };
    
    return (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">receipt_long</span>
                            Detalhes da {isRevenue ? 'Receita' : 'Despesa'}
                        </h3>
                        <p className="text-sm text-text-secondary mt-0.5">Ref {transaction.id.substring(0, 6)} - Visualização detalhada</p>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
                        <div className="col-span-1 md:col-span-2 bg-background-light p-6 rounded-xl border border-dashed border-gray-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Valor da Transação</span>
                                <div className="text-3xl font-bold text-text-main">
                                {(transaction.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusClasses(transaction.status || 'Pendente').container}`}>
                                    <span className={`size-1.5 rounded-full ${getStatusClasses(transaction.status || 'Pendente').dot}`}></span>
                                    {transaction.status || 'Pendente'}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-secondary">Descrição</span>
                            <p className="text-sm font-medium text-text-main">{transaction.description || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-secondary">Categoria</span>
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded bg-primary/20 flex items-center justify-center text-text-main">
                                    <span className="material-symbols-outlined text-[14px]">{transaction.categoryIcon || 'category'}</span>
                                </div>
                                <p className="text-sm font-medium text-text-main">{transaction.category || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-secondary">{isRevenue ? 'Cliente Associado' : 'Fornecedor'}</span>
                            <a className="flex items-center gap-2 group" href="#">
                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 group-hover:bg-primary group-hover:text-text-main transition-colors">
                                    {party.substring(0, 2).toUpperCase()}
                                </div>
                                <p className="text-sm font-medium text-primary underline underline-offset-2">{party}</p>
                                <span className="material-symbols-outlined text-[14px] text-text-secondary">open_in_new</span>
                            </a>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-secondary">Tipo de Transação</span>
                            <p className="text-sm font-medium text-text-main flex items-center gap-1">
                                <span className={`material-symbols-outlined text-[16px] ${isRevenue ? 'text-status-success-text' : 'text-status-error-text'}`}>
                                    {isRevenue ? 'arrow_circle_up' : 'arrow_circle_down'}
                                </span>
                                {isRevenue ? 'Receita' : 'Despesa'} {transaction.isRecurring && '(Recorrente)'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-secondary">Data da Transação</span>
                            <p className="text-sm font-medium text-text-main">{new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-secondary">{isRevenue ? 'Previsão de Recebimento' : 'Data de Vencimento'}</span>
                            <p className="text-sm font-bold text-text-main">{new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>
                        {transaction.notes && (
                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <span className="text-xs font-semibold text-text-secondary">Observações</span>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                                    {transaction.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto px-4 py-2.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Excluir Transação
                        </Button>
                    </AlertDialogTrigger>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-text-main hover:bg-gray-50 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                        </Button>
                        <Button onClick={handleStatusUpdate} className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-secondary text-white hover:text-black font-bold text-sm hover:bg-primary transition-all shadow-glow">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Marcar como {isRevenue ? 'Recebido' : 'Pago'}
                        </Button>
                    </div>
                </div>
            </div>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                    Você tem certeza que deseja excluir a transação <span className="font-bold">"{transaction?.description}"</span>? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Sim, Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
