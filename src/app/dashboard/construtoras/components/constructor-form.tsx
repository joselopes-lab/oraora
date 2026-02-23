
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import locationData from '@/lib/location-data.json';


const constructorSchema = z.object({
  name: z.string().min(1, "O nome da construtora é obrigatório."),
  cnpj: z.string().optional(),
  stateRegistration: z.string().optional(),
  address: z.string().optional(),
  state: z.string().min(1, "Selecione um estado."),
  city: z.string().min(1, "Selecione uma cidade."),
  zip: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().url("Insira uma URL válida.").optional().or(z.literal('')),
  publicEmail: z.string().email("Insira um e-mail público válido.").optional().or(z.literal('')),
  isVisibleOnSite: z.boolean().default(true),
  logoUrl: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
    if (data.newPassword) {
        return data.newPassword === data.confirmPassword;
    }
    return true;
}, {
    message: "As novas senhas não coincidem.",
    path: ["confirmPassword"],
});


export type ConstructorFormData = z.infer<typeof constructorSchema>;

type ConstructorFormProps = {
    constructorData?: Partial<ConstructorFormData & { accessEmail?: string }>;
    onSave: (data: ConstructorFormData) => void;
    isEditing: boolean;
    isSubmitting?: boolean;
};

export default function ConstructorForm({ constructorData, onSave, isEditing, isSubmitting }: ConstructorFormProps) {
    const form = useForm<ConstructorFormData>({
        resolver: zodResolver(constructorSchema),
        defaultValues: {
            name: '',
            cnpj: '',
            stateRegistration: '',
            address: '',
            state: '',
            city: '',
            zip: '',
            phone: '',
            whatsapp: '',
            instagram: '',
            website: '',
            publicEmail: '',
            isVisibleOnSite: true,
            logoUrl: '',
            ...constructorData,
        }
    });

    const [states] = useState(locationData.states);
    const [cities, setCities] = useState<{ name: string; neighborhoods: string[] }[]>([]);
    
    const selectedState = form.watch('state');

    useEffect(() => {
        const stateToLoad = selectedState || constructorData?.state;
        if (stateToLoad) {
            const stateData = states.find(s => s.name === stateToLoad || s.uf === stateToLoad);
            if (stateData) {
                setCities(stateData.cities);
            } else {
                setCities([]);
            }
        } else {
            setCities([]);
        }
    }, [selectedState, constructorData?.state, states]);
    
    useEffect(() => {
      if (isEditing && constructorData) {
        form.reset({
          ...constructorData
        });
      }
    }, [isEditing, constructorData, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link className="text-text-secondary hover:text-primary transition-colors text-sm flex items-center gap-1" href="/dashboard/construtoras">
                                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                Voltar para Listagem
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">{isEditing ? 'Editar Construtora' : 'Nova Construtora'}</h1>
                        <p className="text-text-secondary mt-1">{isEditing ? 'Atualize os dados cadastrais, contato e credenciais da construtora.' : 'Preencha os dados para cadastrar uma nova construtora.'}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" type="button" asChild className="bg-white border border-gray-200 hover:bg-gray-50 text-text-main font-medium py-2.5 px-5 rounded-lg transition-all duration-300">
                            <Link href="/dashboard/construtoras">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4">Identidade &amp; Dados Gerais</h3>
                            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                                <div className="w-full md:w-auto flex flex-col items-center gap-3">
                                    <div className="relative size-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-colors group cursor-pointer">
                                        {constructorData?.logoUrl && <img alt="Logo Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" src={constructorData.logoUrl} />}
                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary z-10 text-[32px]">cloud_upload</span>
                                        <span className="text-xs text-gray-400 font-medium z-10 group-hover:text-text-main mt-1">Alterar Logo</span>
                                        <Input accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file" />
                                    </div>
                                    <p className="text-[10px] text-text-secondary text-center max-w-[128px]">JPG ou PNG até 2MB</p>
                                </div>
                                <div className="flex-1 w-full space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="col-span-1 md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nome da Construtora</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ex: Nome da Construtora" {...field} value={field.value ?? ''} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField control={form.control} name="cnpj" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CNPJ</FormLabel>
                                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} value={field.value ?? ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="stateRegistration" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Inscrição Estadual</FormLabel>
                                                <FormControl><Input placeholder="Isento ou número" {...field} value={field.value ?? ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>
                            <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 text-text-secondary/80">Localização</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="col-span-1 md:col-span-2">
                                     <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Endereço Completo</FormLabel>
                                            <FormControl><Input placeholder="Rua, Número, Bairro, Complemento" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="state" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <select {...field} onChange={(e) => {
                                                  field.onChange(e);
                                                  form.setValue('city', '');
                                                }} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                                    <option value="">Selecione um estado</option>
                                                    {states.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
                                                </select>
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl>
                                             <div className="relative">
                                                <select {...field} disabled={cities.length === 0} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer disabled:bg-gray-200 disabled:cursor-not-allowed">
                                                    <option value="">Selecione uma cidade</option>
                                                    {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                </select>
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="zip" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CEP</FormLabel>
                                        <FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary">lock</span>
                                Credenciais de Acesso
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {isEditing && (
                                <div className="col-span-1 md:col-span-2">
                                    <FormItem>
                                        <FormLabel>Email de Acesso (Login)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                                                <Input type="email" value={constructorData?.accessEmail || ''} disabled className="cursor-not-allowed pl-10"/>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                </div>
                                )}
                                <FormField control={form.control} name="newPassword" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nova Senha</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">key</span>
                                                <Input type="password" placeholder="********" className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        {isEditing && <p className="text-xs text-text-secondary mt-1">Preencha apenas para alterar.</p>}
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmar Nova Senha</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock_reset</span>
                                                <Input type="password" placeholder="********" className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8 h-full">
                            <h3 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4">Canais de Contato</h3>
                            <div className="space-y-5">
                               <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone Comercial</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">call</span>
                                                <Input type="tel" className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-[20px]">chat</span>
                                                <Input type="tel" className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="instagram" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-pink-600 text-[20px]">photo_camera</span>
                                                <Input className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="website" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">language</span>
                                                <Input type="url" className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="publicEmail" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Público</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">alternate_email</span>
                                                <Input type="email" className="pl-10" {...field} value={field.value ?? ''} />
                                            </div>
                                        </FormControl>
                                        <p className="text-xs text-text-secondary mt-1">Visível para corretores.</p>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <div className="pt-4 border-t border-gray-100">
                                   <FormField
                                        control={form.control}
                                        name="isVisibleOnSite"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-3 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="m-0">
                                                    Visível no site
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <p className="text-xs text-text-secondary mt-2 pl-12">Quando desativada, a construtora não aparecerá nas buscas para corretores.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}
