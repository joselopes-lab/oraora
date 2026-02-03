
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

const serviceItemSchema = z.object({
  icon: z.string().min(1, 'Ícone é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
});

const processStepSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
});

const servicosContentSchema = z.object({
  headerTagline: z.string().optional(),
  headerTitle: z.string().optional(),
  headerSubtitle: z.string().optional(),
  servicesTitle: z.string().optional(),
  servicesSubtitle: z.string().optional(),
  serviceItems: z.array(serviceItemSchema).optional(),
  processTagline: z.string().optional(),
  processTitle: z.string().optional(),
  processSubtitle: z.string().optional(),
  processSteps: z.array(processStepSchema).optional(),
  processImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  finalCtaTitle: z.string().optional(),
  finalCtaSubtitle: z.string().optional(),
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
    defaultValues: {},
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
      form.reset(brokerData.urbanPadraoServicos);
    }
  }, [brokerData, form]);

  const onSubmit = (data: ServicosContentData) => {
    if (!user) return;
    const docRef = doc(firestore, 'brokers', user.uid);
    setDocumentNonBlocking(docRef, { urbanPadraoServicos: data }, { merge: true });
    toast({
      title: 'Página de Serviços Atualizada!',
      description: 'As alterações foram salvas e já estão visíveis no seu site.',
    });
  };

  if (isLoading) {
    return <p>Carregando dados da página...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between gap-4">
            <div>
                 <Link href="/dashboard/sites/urban-padrao/editar" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Voltar para Gerenciar Site
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
                <FormField name="processImageUrl" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto do Corretor</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                            <div className="relative size-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-colors group cursor-pointer">
                                {field.value ? <img src={field.value} alt="Preview" className="absolute inset-0 w-full h-full object-cover p-2"/> : <span className="material-symbols-outlined text-gray-400">add_a_photo</span>}
                                <Input accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            form.setValue('processImageUrl', reader.result as string);
                                        }
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <p className="text-xs text-muted-foreground">Arraste uma imagem ou clique para carregar. (PNG, JPG)</p>
                                <Button type="button" size="sm" variant="outline" className="w-fit">
                                  <span className="material-symbols-outlined text-sm mr-2">upload</span>
                                  Carregar Foto
                                </Button>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Seção de Serviços</h2>
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
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end p-4 border rounded-lg bg-gray-50/50">
                    <FormField name={`serviceItems.${index}.icon`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-1"><FormLabel>Ícone</FormLabel><FormControl><Input placeholder="analytics" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`serviceItems.${index}.title`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Título</FormLabel><FormControl><Input placeholder="Título do Serviço" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`serviceItems.${index}.description`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-4"><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descrição do serviço" {...field} rows={2} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeService(index)}>Remover</Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendService({ icon: 'add', title: '', description: '' })} className="mt-4">
                Adicionar Serviço
            </Button>
        </div>

         <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Seção de Processo</h2>
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
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end p-4 border rounded-lg bg-gray-50/50">
                    <FormField name={`processSteps.${index}.title`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-3"><FormLabel>Título da Etapa</FormLabel><FormControl><Input placeholder={`Etapa ${index + 1}`} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name={`processSteps.${index}.description`} control={form.control} render={({ field }) => (
                      <FormItem className="col-span-3"><FormLabel>Descrição da Etapa</FormLabel><FormControl><Textarea placeholder="Descrição da etapa" {...field} rows={2} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeStep(index)}>Remover</Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendStep({ title: '', description: '' })} className="mt-4">
                Adicionar Etapa
            </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Seção de CTA Final</h2>
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
