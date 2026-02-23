
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type BrokerTicketFormData = {
    title: string;
    category: string;
    priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
    description: string;
};

type BrokerTicketFormProps = {
    onSave: (data: BrokerTicketFormData) => void;
    onCancel: () => void;
    isSubmitting: boolean;
};

export default function BrokerTicketForm({ onSave, onCancel, isSubmitting }: BrokerTicketFormProps) {
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries()) as any;
        
        onSave({
            title: data.title,
            category: data.category,
            priority: data.priority,
            description: data.description,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Abrir Novo Ticket de Suporte</h1>
                    <p className="text-text-secondary text-sm mt-2 max-w-2xl">
                        Descreva seu problema ou dúvida em detalhes para que nossa equipe possa ajudar da melhor forma possível.
                    </p>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-12">
                            <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="title">Título / Assunto do Ticket</Label>
                            <Input name="title" id="title" required />
                        </div>
                        <div className="md:col-span-6">
                            <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="category">Categoria</Label>
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm p-3" id="category" name="category">
                                <option value="Dúvida Técnica">Dúvida Técnica</option>
                                <option value="Problema com Faturamento">Problema com Faturamento</option>
                                <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div className="md:col-span-6">
                            <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="priority">Prioridade</Label>
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm p-3" id="priority" name="priority">
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="description">Descrição Detalhada</Label>
                        <Textarea id="description" name="description" rows={8} required />
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 border-t border-gray-100 pt-8 mt-8">
                    <Button onClick={onCancel} variant="outline" type="button">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Abrir Ticket'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
