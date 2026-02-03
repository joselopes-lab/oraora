
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type TicketFormData = {
    title: string;
    clientId: string;
    clientName: string;
    category: string;
    priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
    description: string;
};

type TicketFormProps = {
    onSave: (data: TicketFormData) => void;
    onCancel: () => void;
};

export default function TicketForm({ onSave, onCancel }: TicketFormProps) {
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries()) as any;
        
        // This is a simplification. In a real app, you'd get the client ID from a search.
        const clientName = data.client;
        const clientId = clientName.toLowerCase().replace(/\s/g, ''); 

        onSave({
            title: data.subject,
            clientId: clientId,
            clientName: clientName,
            category: data.category,
            priority: data.priority,
            description: data.description,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Cadastrar Novo Ticket</h1>
                    <p className="text-text-secondary text-sm mt-2 max-w-2xl">
                        Preencha o formulário abaixo para registrar um novo chamado. Assegure-se de fornecer todos os detalhes necessários para um atendimento eficiente.
                    </p>
                </div>
                <div className="space-y-6">
                    <div>
                        <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="subject">Título / Assunto do Ticket</Label>
                        <Input className="w-full bg-background-light border border-gray-200 focus:bg-white focus:border-secondary rounded-lg text-sm text-text-main placeholder-gray-400 focus:ring-0 transition-all p-3" id="subject" name="subject" placeholder="Ex: Erro na integração com portal Zap Imóveis" type="text" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-6">
                            <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="client">Cliente Associado</Label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-secondary transition-colors">search</span>
                                <Input className="w-full pl-10 pr-4 py-3 bg-background-light border border-gray-200 focus:bg-white focus:border-secondary rounded-lg text-sm text-text-main placeholder-gray-400 focus:ring-0 transition-all" id="client" name="client" placeholder="Buscar por nome, e-mail ou ID do cliente..." type="text" />
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="category">Categoria</Label>
                            <select className="w-full bg-background-light border border-gray-200 focus:bg-white focus:border-secondary rounded-lg text-sm text-text-main focus:ring-0 transition-all p-3 cursor-pointer" id="category" name="category">
                                <option disabled value="">Selecionar...</option>
                                <option value="Erro Técnico / Bug">Erro Técnico / Bug</option>
                                <option value="Dúvida Operacional">Dúvida Operacional</option>
                                <option value="Financeiro">Financeiro</option>
                                <option value="Integrações">Integrações</option>
                                <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="priority">Prioridade</Label>
                            <select className="w-full bg-background-light border border-gray-200 focus:bg-white focus:border-secondary rounded-lg text-sm text-text-main focus:ring-0 transition-all p-3 cursor-pointer" id="priority" name="priority">
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label className="block text-sm font-bold text-text-main mb-2" htmlFor="description">Descrição Detalhada do Problema</Label>
                        <div className="relative">
                            <Textarea className="w-full bg-background-light border border-gray-200 focus:bg-white focus:border-secondary rounded-lg text-sm text-text-main placeholder-gray-400 focus:ring-0 transition-all p-3 resize-none" id="description" name="description" placeholder="Descreva o problema detalhadamente. Inclua passos para reproduzir o erro, mensagens apresentadas e links relevantes..." rows={6}></Textarea>
                            <div className="absolute bottom-2 right-2 flex gap-1">
                                <button className="p-1 text-gray-400 hover:text-text-secondary rounded hover:bg-gray-200 transition-colors" title="Formatar texto" type="button">
                                    <span className="material-symbols-outlined text-[18px]">format_bold</span>
                                </button>
                                <button className="p-1 text-gray-400 hover:text-text-secondary rounded hover:bg-gray-200 transition-colors" title="Lista" type="button">
                                    <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label className="block text-sm font-bold text-text-main mb-2">Anexar Arquivos (Opcional)</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-background-light/50 hover:border-secondary transition-all cursor-pointer group bg-gray-50/50">
                            <div className="size-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-300 mb-3">
                                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                            </div>
                            <p className="text-sm font-bold text-text-main group-hover:text-primary-hover transition-colors">Clique para fazer upload ou arraste e solte</p>
                            <p className="text-xs text-text-secondary mt-1">Imagens (PNG, JPG) ou documentos (PDF). Máx 10MB.</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 border-t border-gray-100 pt-8 mt-8">
                    <Button onClick={onCancel} className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:text-text-main hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all" type="button">
                        Cancelar
                    </Button>
                    <Button className="w-full sm:w-auto bg-secondary hover:bg-primary-hover text-secondary-foreground font-bold py-2.5 px-8 rounded-lg shadow-glow hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02]" type="submit">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        Abrir Ticket
                    </Button>
                </div>
            </div>
        </form>
    )
}

    