
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useState } from "react";

type GoalFormProps = {
    onSave: (month: string, amount: number) => void;
    onCancel: () => void;
    currentMonth: Date;
};

export default function GoalForm({ onSave, onCancel, currentMonth }: GoalFormProps) {
    const [month, setMonth] = useState(format(currentMonth, 'yyyy-MM'));
    const [amount, setAmount] = useState('80000');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(numericAmount)) {
            onSave(month, numericAmount);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader className="px-6 py-4 border-b border-gray-100">
                <DialogTitle>Definir Meta Mensal</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 space-y-6">
                <div>
                    <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="goal-amount">Valor da Meta</Label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500 font-bold sm:text-sm">R$</span>
                        </div>
                        <Input 
                          className="block w-full rounded-xl border-gray-200 pl-12 py-3 text-text-main focus:border-primary focus:ring-primary sm:text-lg font-bold placeholder:text-gray-300 placeholder:font-normal bg-background-light" 
                          id="goal-amount" 
                          name="goal-amount" 
                          placeholder="0,00" 
                          type="text" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <span className="text-gray-400 text-xs">BRL</span>
                        </div>
                    </div>
                </div>
                <div>
                  <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="goal-month">Mês/Ano</Label>
                   <Input 
                        type="month"
                        id="goal-month"
                        name="goal-month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="block w-full appearance-none rounded-xl border-gray-200 py-3 pl-4 pr-10 text-text-main focus:border-primary focus:ring-primary sm:text-sm cursor-pointer bg-white"
                    />
                </div>
                <div className="bg-status-pending/50 p-4 rounded-xl border border-status-pending flex gap-3 items-start">
                    <span className="material-symbols-outlined text-status-pending-text text-[20px] shrink-0 mt-0.5">info</span>
                    <p className="text-xs text-status-pending-text leading-relaxed">Esta meta será utilizada para calcular a porcentagem de atingimento e projeções no seu dashboard financeiro.</p>
                </div>
            </div>
            <DialogFooter className="bg-gray-50 px-6 py-4 flex-row-reverse gap-3 border-t border-gray-100">
                 <Button className="inline-flex w-full justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-main shadow-glow hover:bg-primary-hover sm:w-auto transition-all" type="submit">Salvar Meta</Button>
                 <DialogClose asChild>
                    <Button onClick={onCancel} className="inline-flex w-full justify-center rounded-xl bg-white border border-gray-200 px-5 py-3 text-sm font-bold text-text-secondary shadow-sm hover:bg-gray-50 hover:text-text-main sm:w-auto transition-all" type="button">Cancelar</Button>
                 </DialogClose>
            </DialogFooter>
        </form>
    )
}
