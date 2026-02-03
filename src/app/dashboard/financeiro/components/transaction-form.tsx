
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";


const transactionSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  value: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  date: z.string().min(1, 'A data é obrigatória.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  clientOrProvider: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  installments: z.coerce.number().optional(),
});


export type TransactionFormData = z.infer<typeof transactionSchema>;


type TransactionFormProps = {
    onSave: (data: TransactionFormData) => void;
    onCancel: () => void;
    initialType?: 'receita' | 'despesa';
};

const revenueCategories = [
    { value: 'comissao-venda', label: 'Comissão de venda de imóvel', icon: 'real_estate_agent' },
    { value: 'comissao-locacao', label: 'Comissão de locação (primeiro aluguel)', icon: 'key' },
    { value: 'comissao-administracao', label: 'Comissão de administração de aluguel', icon: 'manage_accounts' },
    { value: 'comissao-renovacao', label: 'Comissão de renovação de contrato', icon: 'autorenew' },
    { value: 'comissao-indicacao', label: 'Comissão por indicação', icon: 'group' },
    { value: 'comissao-parceria', label: 'Comissão de parceria com outro corretor', icon: 'handshake' },
    { value: 'comissao-lancamento', label: 'Comissão por lançamento imobiliário', icon: 'rocket_launch' },
    { value: 'taxa-corretagem', label: 'Taxa de corretagem', icon: 'percent' },
    { value: 'honorarios-intermediacao', label: 'Honorários por intermediação', icon: 'request_quote' },
    { value: 'taxa-avaliacao', label: 'Taxa de avaliação de imóvel', icon: 'analytics' },
    { value: 'taxa-consultoria', label: 'Taxa de consultoria imobiliária', icon: 'support_agent' },
    { value: 'elaboracao-contrato', label: 'Elaboração de contrato', icon: 'description' },
    { value: 'acompanhamento-escritura', label: 'Acompanhamento de escritura / registro', icon: 'assignment_turned_in' },
    { value: 'comissao-mensal-admin', label: 'Comissão mensal de administração de imóveis', icon: 'calendar_month' },
    { value: 'honorarios-recorrentes', label: 'Honorários recorrentes', icon: 'recurring' },
    { value: 'multa-rescisao', label: 'Multa por rescisão contratual', icon: 'cancel' },
    { value: 'multa-atraso', label: 'Multa por atraso de pagamento', icon: 'schedule' },
    { value: 'juros-correcao', label: 'Juros e correção monetária', icon: 'trending_up' },
    { value: 'reembolso-despesas', label: 'Reembolso de despesas', icon: 'receipt_long' },
    { value: 'receitas-extraordinarias', label: 'Receitas extraordinárias', icon: 'star' },
    { value: 'ajustes-positivos', label: 'Ajustes financeiros positivos', icon: 'add_circle' },
];

const expenseCategories = [
    { value: 'anuncios-pagos', label: 'Anúncios pagos (Facebook, Google, Instagram)', icon: 'campaign' },
    { value: 'portais-imobiliarios', label: 'Portais imobiliários', icon: 'web' },
    { value: 'producao-fotos-videos', label: 'Produção de fotos e vídeos', icon: 'photo_camera' },
    { value: 'tour-virtual', label: 'Tour virtual', icon: '360' },
    { value: 'design-grafico', label: 'Design gráfico', icon: 'design_services' },
    { value: 'impressos', label: 'Impressos (panfletos, placas, cartões)', icon: 'print' },
    { value: 'combustivel', label: 'Combustível', icon: 'local_gas_station' },
    { value: 'transporte-app', label: 'Transporte por aplicativo', icon: 'directions_car' },
    { value: 'estacionamento', label: 'Estacionamento', icon: 'local_parking' },
    { value: 'pedagio', label: 'Pedágio', icon: 'toll' },
    { value: 'manutencao-veiculo', label: 'Manutenção do veículo', icon: 'build' },
    { value: 'crm-saas', label: 'Assinatura de CRM / SaaS imobiliário', icon: 'dvr' },
    { value: 'site-pessoal', label: 'Site pessoal', icon: 'language' },
    { value: 'hospedagem-dominio', label: 'Hospedagem e domínio', icon: 'dns' },
    { value: 'whatsapp-sms', label: 'WhatsApp Business / SMS', icon: 'sms' },
    { value: 'software-edicao', label: 'Softwares de edição / design', icon: 'brush' },
    { value: 'armazenamento-nuvem', label: 'Armazenamento em nuvem', icon: 'cloud_upload' },
    { value: 'contabilidade', label: 'Contabilidade', icon: 'account_balance' },
    { value: 'honorarios-juridicos', label: 'Honorários jurídicos', icon: 'gavel' },
    { value: 'taxas-bancarias', label: 'Taxas bancárias', icon: 'account_balance_wallet' },
    { value: 'tarifas-pagamento', label: 'Tarifas de boleto, PIX, cartão', icon: 'payments' },
    { value: 'certificado-digital', label: 'Certificado digital', icon: 'verified_user' },
    { value: 'despesas-cartoriais', label: 'Despesas cartoriais', icon: 'badge' },
    { value: 'cursos', label: 'Cursos', icon: 'school' },
    { value: 'treinamentos', label: 'Treinamentos', icon: 'model_training' },
    { value: 'eventos-feiras', label: 'Eventos e feiras imobiliárias', icon: 'event' },
    { value: 'mentorias', label: 'Mentorias', icon: 'group' },
    { value: 'aluguel-escritorio', label: 'Aluguel de coworking / escritório', icon: 'store' },
    { value: 'condominio', label: 'Condomínio', icon: 'location_city' },
    { value: 'energia-eletrica', label: 'Energia elétrica', icon: 'lightbulb' },
    { value: 'internet', label: 'Internet', icon: 'wifi' },
    { value: 'telefonia', label: 'Telefonia', icon: 'phone' },
    { value: 'iss', label: 'ISS', icon: 'receipt' },
    { value: 'inss', label: 'INSS', icon: 'receipt' },
    { value: 'imposto-renda', label: 'Imposto de Renda', icon: 'receipt' },
    { value: 'taxas-municipais', label: 'Taxas municipais', icon: 'assured_workload' },
    { value: 'anuidade-creci', label: 'Anuidade do CRECI', icon: 'badge' },
    { value: 'multas', label: 'Multas', icon: 'gavel' },
    { value: 'ajustes-negativos', label: 'Ajustes financeiros negativos', icon: 'remove_circle' },
    { value: 'despesas-extraordinarias', label: 'Despesas extraordinárias', icon: 'priority_high' },
    { value: 'perdas-nao-previstas', label: 'Perdas não previstas', icon: 'report' },
];


export default function TransactionForm({ onSave, onCancel, initialType }: TransactionFormProps) {
    const form = useForm<TransactionFormData>({
      resolver: zodResolver(transactionSchema),
      defaultValues: {
        type: initialType || 'receita',
        description: '',
        value: 0,
        date: new Date().toISOString().split('T')[0],
        category: '',
        clientOrProvider: '',
        notes: '',
        isRecurring: false,
        installments: 1,
      }
    });

    const transactionType = form.watch('type');
    const isTypeLocked = !!initialType;
    const currentCategories = transactionType === 'receita' ? revenueCategories : expenseCategories;
    
    useEffect(() => {
      form.setValue('type', initialType || 'receita');
    }, [initialType, form]);


    return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-background-light">
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-black rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[20px]">add_card</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-main tracking-tight">Registrar Nova Transação</h3>
                </div>
            </div>
            <div className="p-6 md:p-8 space-y-6">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="block text-sm font-bold text-text-main mb-2">Tipo de Transação</FormLabel>
                            <FormControl>
                                <div className={cn("grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg", isTypeLocked && "opacity-70 pointer-events-none")}>
                                    <label className={cn(`relative flex items-center justify-center gap-2 py-2.5 rounded-md cursor-pointer transition-all`, field.value === 'receita' ? 'bg-white shadow-sm text-text-main ring-1 ring-gray-200' : 'text-text-secondary hover:text-text-main hover:bg-white/50')}>
                                        <input {...field} value="receita" checked={field.value === 'receita'} className="peer sr-only" name="type" type="radio" disabled={isTypeLocked}/>
                                        <span className="material-symbols-outlined text-[20px] text-green-600">arrow_upward</span>
                                        <span className="font-bold text-sm">Receita</span>
                                    </label>
                                    <label className={cn(`relative flex items-center justify-center gap-2 py-2.5 rounded-md cursor-pointer transition-all`, field.value === 'despesa' ? 'bg-white shadow-sm text-text-main ring-1 ring-gray-200' : 'text-text-secondary hover:text-text-main hover:bg-white/50')}>
                                        <input {...field} value="despesa" checked={field.value === 'despesa'} className="peer sr-only" name="type" type="radio" disabled={isTypeLocked}/>
                                        <span className="material-symbols-outlined text-[20px] text-red-500">arrow_downward</span>
                                        <span className="font-bold text-sm">Despesa</span>
                                    </label>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                         <FormField control={form.control} name="description" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="block text-sm font-bold text-text-main mb-1.5">{transactionType === 'receita' ? 'Descrição da Receita' : 'Descrição da Despesa'}</FormLabel>
                                <FormControl>
                                <Input 
                                  placeholder={transactionType === 'receita' ? "Ex: Comissão Venda Ap. 302" : "Ex: Anúncio no Facebook"}
                                  {...field}
                                  value={field.value || ''}
                                />
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                         )}/>
                    </div>
                    <div>
                         <FormField control={form.control} name="value" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="block text-sm font-bold text-text-main mb-1.5">Valor (R$)</FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
                                    <Input className="pl-10 font-bold" placeholder="0,00" type="number" step="0.01" {...field}/>
                                </div>
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                         )}/>
                    </div>
                    <div>
                         <FormField control={form.control} name="date" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="block text-sm font-bold text-text-main mb-1.5">{transactionType === 'receita' ? 'Previsão de Recebimento' : 'Data de Vencimento'}</FormLabel>
                                <FormControl><Input type="date" {...field} value={field.value || ''}/></FormControl>
                                <FormMessage />
                             </FormItem>
                         )}/>
                    </div>
                    <div>
                        <FormField control={form.control} name="category" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="block text-sm font-bold text-text-main mb-1.5">Categoria</FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <select className="w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary text-sm py-2.5 appearance-none px-3" {...field} value={field.value || ''}>
                                        <option value="">Selecione uma categoria</option>
                                        {currentCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[20px]">expand_more</span>
                                </div>
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                         )}/>
                    </div>
                    <div>
                        <FormField control={form.control} name="clientOrProvider" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="block text-sm font-bold text-text-main mb-1.5">
                                    Cliente / Fornecedor
                                    <span className="text-xs font-normal text-text-secondary ml-1">(Opcional)</span>
                                </FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <Input className="pl-9" placeholder="Buscar contato..." type="text" {...field} value={field.value || ''}/>
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                </div>
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                         )}/>
                    </div>

                    
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <FormField
                            control={form.control}
                            name="isRecurring"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            id="isRecurring"
                                        />
                                    </FormControl>
                                    <FormLabel htmlFor="isRecurring" className="!m-0 text-sm font-medium">É uma {transactionType === 'receita' ? 'receita' : 'despesa'} recorrente?</FormLabel>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="installments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nº de Parcelas</FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            className="w-full h-11 rounded-lg border-gray-200 bg-white focus:border-primary focus:ring-primary text-sm px-3"
                                            value={field.value || 1}
                                            onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                        >
                                            {[...Array(24).keys()].map(i => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}x
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="notes" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="block text-sm font-bold text-text-main mb-1.5">Observações</FormLabel>
                                <FormControl>
                                    <Textarea className="resize-none" placeholder="Adicione detalhes extras sobre esta transação..." rows={3} {...field} value={field.value || ''}></Textarea>
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                         )}/>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:text-text-main hover:bg-gray-100 transition-colors">
                    Cancelar
                </Button>
                <Button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-secondary hover:bg-primary text-white hover:text-black transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Salvar Transação
                </Button>
            </div>
        </form>
        </Form>
    );
}
