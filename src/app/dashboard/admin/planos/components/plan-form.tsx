
'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

const planSchema = z.object({
  name: z.string().min(1, 'O nome do plano é obrigatório.'),
  type: z.enum(['corretor', 'construtora'], { required_error: 'Selecione o tipo de público.' }),
  badge: z.string().optional(),
  price: z.coerce.number().min(0, 'O preço deve ser um valor positivo.'),
  promoPrice: z.coerce.number().optional(),
  propertyLimit: z.coerce.number().optional(),
  billingCycle: z.enum(['mensal', 'anual']).default('mensal'),
  offerEndDate: z.string().optional(),
  features: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type PlanFormData = z.infer<typeof planSchema>;

type PlanFormProps = {
  onSave: (data: PlanFormData) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  planData?: Partial<PlanFormData>;
};

export default function PlanForm({ onSave, isEditing, isSubmitting, planData }: PlanFormProps) {
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: planData || {
      name: '',
      type: 'corretor',
      badge: '',
      price: 0,
      promoPrice: 0,
      propertyLimit: 0,
      billingCycle: 'mensal',
      offerEndDate: '',
      features: [],
      description: '',
      isActive: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard/admin/planos">Gestão de Planos</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">{isEditing ? 'Editar Plano' : 'Novo Plano'}</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-main tracking-tight">{isEditing ? 'Editar Plano' : 'Cadastro de Novo Plano'}</h1>
              <p className="text-text-secondary mt-1">Defina as características, preços e benefícios do pacote de serviços.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-text-secondary text-lg">info</span>
            <h2 className="font-bold text-text-main">1. Informações Básicas</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome do Plano</FormLabel><FormControl><Input placeholder="Ex: Premium Plus, Corretor Elite" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div>
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Público</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-lg border-gray-200 text-sm py-2.5 px-4 focus:ring-primary focus:border-primary transition-all">
                      <option value="corretor">Corretor</option>
                      <option value="construtora">Construtora</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div>
              <FormField control={form.control} name="badge" render={({ field }) => (
                <FormItem><FormLabel>Badge / Destaque</FormLabel><FormControl><Input placeholder="Ex: Popular, Mais Vendido, Oferta" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="col-span-full">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva os principais benefícios do plano" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex items-center justify-between col-span-full bg-gray-50 p-4 rounded-lg">
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between w-full">
                  <div>
                    <FormLabel>Status Inicial</FormLabel>
                    <p className="text-xs text-text-secondary">O plano ficará disponível imediatamente após a criação?</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-text-secondary text-lg">payments</span>
            <h2 className="font-bold text-text-main">2. Precificação e Vigência</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel>Valor Normal (R$)</FormLabel><FormControl><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span><Input type="number" step="0.01" className="pl-12" {...field} value={field.value ?? ''} /></div></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="promoPrice" render={({ field }) => (
              <FormItem><FormLabel>Valor Promocional (R$)</FormLabel><FormControl><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span><Input type="number" step="0.01" className="pl-12" {...field} value={field.value ?? ''} /></div></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="billingCycle" render={({ field }) => (
              <FormItem>
                <FormLabel>Ciclo de Cobrança</FormLabel>
                <FormControl>
                  <select {...field} className="w-full rounded-lg border-gray-200 text-sm py-2.5 px-4 focus:ring-primary focus:border-primary transition-all">
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="offerEndDate" render={({ field }) => (
              <FormItem><FormLabel>Data de Validade da Oferta</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="propertyLimit" render={({ field }) => (
                <FormItem>
                    <FormLabel>Limite de Imóveis</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm material-symbols-outlined">home_work</span>
                            <Input type="number" className="pl-12" placeholder="Ex: 50" {...field} value={field.value ?? ''} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-text-secondary text-lg">featured_play_list</span>
            <h2 className="font-bold text-text-main">3. Funcionalidades e Benefícios</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <FormField control={form.control} name={`features.${index}`} render={({ field }) => (
                    <FormItem className="flex-grow"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="button" variant="ghost" className="text-text-secondary hover:text-red-500 transition-colors p-1" onClick={() => remove(index)}>
                    <span className="material-symbols-outlined">delete</span>
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="flex items-center gap-2 text-primary-hover font-bold text-sm hover:underline transition-all" onClick={() => append('')}>
              <span className="material-symbols-outlined text-[20px] bg-primary/20 p-1 rounded-md">add</span>
              Adicionar Benefício
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-4 pt-4 pb-10">
          <Button asChild type="button" variant="outline" className="px-8 py-3 rounded-lg border-gray-200 text-sm font-bold text-text-secondary hover:bg-gray-50 transition-colors">
            <Link href="/dashboard/admin/planos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-hover text-text-main text-sm font-bold shadow-soft transition-all">
            {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
