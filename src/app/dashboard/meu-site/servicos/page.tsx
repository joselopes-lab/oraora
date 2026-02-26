
'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

const serviceItemSchema = z.object({
  icon: z.string().min(1, 'Ícone é obrigatório').nullable().optional().or(z.literal('')),
  title: z.string().min(1, 'Título é obrigatório').nullable().optional().or(z.literal('')),
  description: z.string().min(1, 'Descrição é obrigatória').nullable().optional().or(z.literal('')),
  isVisible: z.boolean().nullable().optional().default(true),
});

const processStepSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').nullable().optional().or(z.literal('')),
  description: z.string().min(1, 'Descrição é obrigatória').nullable().optional().or(z.literal('')),
});

const servicosContentSchema = z.object({
  headerTagline: z.string().nullable().optional().or(z.literal('')),
  headerTitle: z.string().nullable().optional().or(z.literal('')),
  headerSubtitle: z.string().nullable().optional().or(z.literal('')),
  showServicesSection: z.boolean().nullable().optional().default(true),
  servicesTitle: z.string().nullable().optional().or(z.literal('')),
  servicesSubtitle: z.string().nullable().optional().or(z.literal('')),
  serviceItems: z.array(serviceItemSchema).nullable().optional().default([]),
  showProcessSection: z.boolean().nullable().optional().default(true),
  processTagline: z.string().nullable().optional().or(z.literal('')),
  processTitle: z.string().nullable().optional().or(z.literal('')),
  processSubtitle: z.string().nullable().optional().or(z.literal('')),
  processSteps: z.array(processStepSchema).nullable().optional().default([]),
  processImageUrl: z.string().nullable().optional().or(z.literal('')).or(z.string().url("URL inválida.")),
  showFinalCtaSection: z.boolean().nullable().optional().default(true),
  finalCtaTitle: z.string().nullable().optional().or(z.literal('')),
  finalCtaSubtitle: z.string().nullable().optional().or(z.literal('')),
});

type ServicosContentData = z.infer<typeof servicosContentSchema>;

type BrokerData = {
    urbanPadraoServicos?: ServicosContentData;
};

export default function EditUrbanPadraoServicosPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const form = useForm<ServicosContentData>({
    resolver: zodResolver(servicosContentSchema),
    defaultValues: {
        serviceItems: [],
        processSteps: [],
        showServicesSection: true,
        showProcessSection: true,
        showFinalCtaSection: true,
    },
  });

  const { fields: serviceItems, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "serviceItems",
  });

  const { fields: processSteps, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: "processSteps",
  });


  useEffect(() => {
    if (brokerData?.urbanPadraoServicos) {
      // Deeply convert nulls to undefined to avoid Zod validation errors on optional fields
      const cleanedData = JSON.parse(JSON.stringify(brokerData.urbanPadraoServicos), (key, value) => {
        if (value === null) return undefined;
        return value;
      });
      form.reset(cleanedData);
    }
  }, [brokerData, form]);

  const onSubmit = (data: ServicosContentData) => {
    if (!user) return;
    const docRef = doc(firestore, 'brokers', user.uid);
    
    // Sanitize data to remove undefined before saving
    const dataToSave = JSON.parse(JSON.stringify(data));
    
    setDocumentNonBlocking(docRef, { urbanPadraoServicos: dataToSave, userId: user.uid }, { merge: true });
    toast({
      title: 'Página de Serviços Atualizada!',
      description: 'As alterações foram salvas e já estão visíveis no seu site.',
    });
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Erro ao Salvar",
      description: "Por favor, verifique se todos os campos obrigatórios foram preenchidos corretamente.",
    });
  };

  if (isLoading) {
    return <p>Carregando dados da página...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
        <div className="flex items-center justify-between gap-4">
            <div>
                 <Link href="/dashboard/meu-site" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Voltar para Meu Site
                </Link>
                <h1 className="text-3xl font-bold">Editar Página de Serviços</h1>
                <p className="text-muted-foreground">Atualize os textos e seções da sua página de serviços.</p>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Cabeçalho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="headerTagline" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Tagline</FormLabel><FormControl><Input placeholder="Excelência em Cada Detalhe" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="headerTitle" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Título Principal</FormLabel><FormControl><Textarea placeholder="Use <span> para destacar texto" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="headerSubtitle" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Subtítulo</FormLabel><FormControl><Textarea placeholder="Descrição abaixo do título" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-xl font-bold">Seção de Serviços</h2>
                <FormField name="showServicesSection" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className="text-sm font-medium">Seção Ativa</FormLabel>
                        <FormControl>
                            <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField name="servicesTitle" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Título da Seção</FormLabel><FormControl><Input placeholder="Nossos Serviços Exclusivos" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="servicesSubtitle" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Subtítulo da Seção</FormLabel><FormControl><Input placeholder="Explore como podemos ajudar..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            <div className="space-y-4">
              {serviceItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-4 items-start p-4 border rounded-lg bg-gray-50/50">
                    <FormField name={`serviceItems.${index}.icon`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-1"><FormLabel>Ícone</FormLabel><FormControl><Input placeholder="analytics" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`serviceItems.${index}.title`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Título</FormLabel><FormControl><Input placeholder="Título do Serviço" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`serviceItems.${index}.description`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-3"><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descrição do serviço" {...field} rows={2} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`serviceItems.${index}.isVisible`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-1 flex flex-col items-center justify-start pt-2">
                        <FormLabel className="text-[10px] mb-1">Visível</FormLabel>
                        <FormControl>
                          <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}/>
                    <div className="col-span-1 flex justify-end pt-8">
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeService(index)}>Remover</Button>
                    </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendService({ icon: 'add', title: '', description: '', isVisible: true })} className="mt-4">
                Adicionar Serviço
            </Button>
        </div>

         <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-xl font-bold">Seção de Processo</h2>
                <FormField name="showProcessSection" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className="text-sm font-medium">Seção Ativa</FormLabel>
                        <FormControl>
                            <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField name="processTagline" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Tagline do Processo</FormLabel><FormControl><Input placeholder="Metodologia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="processTitle" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Título do Processo</FormLabel><FormControl><Input placeholder="Como Funciona Nosso Processo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField name="processSubtitle" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Subtítulo do Processo</FormLabel><FormControl><Textarea placeholder="Descrição da seção de processo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            <div className="space-y-4">
              {processSteps.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start p-4 border rounded-lg bg-gray-50/50">
                    <FormField name={`processSteps.${index}.title`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-3"><FormLabel>Título da Etapa</FormLabel><FormControl><Input placeholder={`Etapa ${index + 1}`} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`processSteps.${index}.description`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-3"><FormLabel>Descrição da Etapa</FormLabel><FormControl><Textarea placeholder="Descrição da etapa" {...field} rows={2} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="flex justify-end pt-8">
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeStep(index)}>Remover</Button>
                    </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendStep({ title: '', description: '' })} className="mt-4">
                Adicionar Etapa
            </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-xl font-bold">Seção de CTA Final</h2>
                <FormField name="showFinalCtaSection" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className="text-sm font-medium">Seção Ativa</FormLabel>
                        <FormControl>
                            <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="finalCtaTitle" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Título do CTA</FormLabel><FormControl><Input placeholder="Pronto para transformar seus planos?" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="finalCtaSubtitle" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Subtítulo do CTA</FormLabel><FormControl><Textarea placeholder="Descrição do CTA final" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
