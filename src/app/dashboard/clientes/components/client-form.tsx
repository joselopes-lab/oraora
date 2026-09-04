'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Checkbox } from "@/components/ui/checkbox";

const clientSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Insira um e-mail válido.").optional().or(z.literal('')),
  phone: z.string().min(1, "O telefone é obrigatório."),
  clientType: z.enum(['comprador', 'vendedor']).optional(),
  propertyInterest: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "converted", "lost"]).default("new"),
  dealStatus: z.enum(['open', 'won', 'lost']).optional(),
  dealValue: z.number().optional(),
  address: z.object({
    street: z.string().optional(),
    complement: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  personaIds: z.array(z.string()).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

type ClientFormProps = {
    clientData?: Partial<ClientFormData>;
    onSave: (data: ClientFormData) => void;
    isEditing: boolean;
    isSubmitting?: boolean;
    onCancel?: () => void;
    title?: string;
    description?: string;
};

type Persona = {
  id: string;
  name: string;
  icon: string;
  iconBackgroundColor: string;
};

const brazilianStates = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" },
];


export default function ClientForm({ clientData, onSave, isEditing, isSubmitting, onCancel, title, description }: ClientFormProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const [isWonModalOpen, setIsWonModalOpen] = useState(false);
    const [modalDealValue, setModalDealValue] = useState<string>('');
    const [modalError, setModalError] = useState<string>('');

    const personasQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null),
      [firestore]
    );
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            clientType: 'comprador',
            propertyInterest: '',
            source: '',
            status: 'new',
            address: {
                street: '',
                complement: '',
                city: '',
                state: '',
            },
            personaIds: [],
            ...clientData,
        }
    });

    const handleConfirmWon = () => {
        const num = Number(modalDealValue);
        if (!modalDealValue || isNaN(num) || num <= 0) {
            setModalError('Informe um valor de venda válido.');
            return;
        }
        form.setValue('dealStatus', 'won');
        form.setValue('dealValue', num);
        setIsWonModalOpen(false);
    };

    const handleCancelWon = () => {
        setIsWonModalOpen(false);
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6">
                    <div>
                        {!onCancel && (
                            <Link href="/dashboard/clientes" className="text-text-secondary hover:text-text-main font-medium text-sm transition-colors flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                Voltar para Clientes
                            </Link>
                        )}
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">{title || (isEditing ? 'Editar Cliente' : 'Cadastro de Novo Cliente')}</h1>
                        <p className="text-text-secondary mt-1">{description || (isEditing ? 'Atualize as informações do cliente.' : 'Preencha as informações abaixo para adicionar um novo cliente à base.')}</p>
                    </div>
                     <div className="flex gap-3">
                        {onCancel ? (
                            <Button type="button" variant="outline" onClick={onCancel} className="bg-white border border-gray-200 text-text-main font-medium py-2.5 px-5 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-300">
                                Cancelar
                            </Button>
                        ) : (
                            <Button asChild variant="outline" className="bg-white border border-gray-200 text-text-main font-medium py-2.5 px-5 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-300">
                                <Link href="/dashboard/clientes">Cancelar</Link>
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting} className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-3 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 pt-0">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <span className="material-symbols-outlined text-secondary">person</span>
                                Dados Pessoais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome Completo <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">badge</span>
                                                    <Input className="w-full pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Ex: Maria Oliveira" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="clientType"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Tipo de Cliente</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                     <select {...field} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                                        <option value="comprador">Comprador</option>
                                                        <option value="vendedor">Vendedor</option>
                                                    </select>
                                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <div>
                                     <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                        <FormItem>
                                             <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">E-mail</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">mail</span>
                                                    <Input className="w-full pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="cliente@email.com" type="email" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <div>
                                     <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Telefone / WhatsApp <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                 <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">call</span>
                                                    <Input className="w-full pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="(00) 00000-0000" type="tel" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <span className="material-symbols-outlined text-secondary">location_on</span>
                                Endereço (Opcional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                     <FormField
                                        control={form.control}
                                        name="address.street"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Logradouro</FormLabel>
                                            <FormControl>
                                                <Input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Rua, Avenida, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <div>
                                     <FormField
                                        control={form.control}
                                        name="address.complement"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Complemento</FormLabel>
                                            <FormControl>
                                                <Input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Apto 101, Bloco B" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <div>
                                     <FormField
                                        control={form.control}
                                        name="address.city"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Cidade</FormLabel>
                                            <FormControl>
                                                <Input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="São Paulo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <div>
                                     <FormField
                                        control={form.control}
                                        name="address.state"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Estado</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                     <select {...field} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                                        <option value="">Selecione...</option>
                                                        {brazilianStates.map((state) => (
                                                            <option key={state.value} value={state.value}>{state.label}</option>
                                                        ))}
                                                    </select>
                                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                         <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                             <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <span className="material-symbols-outlined text-secondary">groups</span>
                                Perfil do Cliente (Personas)
                            </h3>
                            <FormField
                                control={form.control}
                                name="personaIds"
                                render={() => (
                                <FormItem>
                                    <FormLabel className="text-sm text-text-secondary mb-3 block">Selecione as personas que melhor representam este cliente.</FormLabel>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {arePersonasLoading ? (
                                        <p>Carregando personas...</p>
                                    ) : (
                                        personas?.map((persona) => (
                                        <FormField
                                            key={persona.id}
                                            control={form.control}
                                            name="personaIds"
                                            render={({ field }) => {
                                            return (
                                                <FormItem
                                                key={persona.id}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 has-[:checked]:bg-primary/20 has-[:checked]:border-primary transition-all"
                                                >
                                                <FormControl>
                                                    <Checkbox
                                                    checked={field.value?.includes(persona.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...(field.value || []), persona.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (id) => id !== persona.id
                                                            )
                                                        );
                                                    }}
                                                    />
                                                </FormControl>
                                                <div className={`size-8 rounded-full ${persona.iconBackgroundColor} flex items-center justify-center`}>
                                                    <span className="material-symbols-outlined text-sm">{persona.icon}</span>
                                                </div>
                                                <FormLabel className="font-semibold text-sm m-0">
                                                    {persona.name}
                                                </FormLabel>
                                                </FormItem>
                                            );
                                            }}
                                        />
                                        ))
                                    )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <span className="material-symbols-outlined text-secondary">monetization_on</span>
                                Resultado Comercial
                            </h3>
                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="dealStatus"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Status do Negócio</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <select 
                                                    {...field} 
                                                    value={field.value || 'open'} 
                                                    className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="open">Em aberto</option>
                                                    <option value="won">Ganho</option>
                                                    <option value="lost">Perdido</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                {form.watch('dealStatus') === 'won' && (
                                    <FormField
                                        control={form.control}
                                        name="dealValue"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Valor da Venda (R$)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                                                    <Input 
                                                        type="number" 
                                                        step="0.01"
                                                        className="w-full pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" 
                                                        placeholder="0.00" 
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : Number(val));
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <span className="material-symbols-outlined text-secondary">interests</span>
                                Perfil de Interesse
                            </h3>
                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="propertyInterest"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Interesses em Imóveis</FormLabel>
                                        <FormControl>
                                            <Textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400 min-h-[100px]" placeholder="Descreva o que o cliente procura..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Como Conheceu</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <select {...field} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                                    <option value="">Selecione a origem...</option>
                                                    <option value="google">Google / Busca Orgânica</option>
                                                    <option value="social">Redes Sociais</option>
                                                    <option value="indication">Indicação</option>
                                                    <option value="portal">Portal Imobiliário</option>
                                                    <option value="other">Outro</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
            {isWonModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col p-6 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Negócio ganho</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Informe o valor final da venda fechada</p>
                            </div>
                            <button 
                                type="button"
                                onClick={handleCancelWon}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Valor da Venda (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        autoFocus
                                        className="w-full pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-slate-400"
                                        placeholder="0,00"
                                        value={modalDealValue}
                                        onChange={e => {
                                            setModalDealValue(e.target.value);
                                            setModalError('');
                                        }}
                                    />
                                </div>
                                {modalError && <p className="text-xs text-rose-500 font-medium mt-1.5">{modalError}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={handleCancelWon}
                                className="border-slate-200 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="button"
                                onClick={handleConfirmWon}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
                            >
                                Confirmar Negócio Ganho
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Form>
    );
}