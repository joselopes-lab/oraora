
'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import Link from 'next/link';

const contactContentSchema = z.object({
  headerTagline: z.string().optional(),
  headerTitle: z.string().optional(),
  headerSubtitle: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  addressHint: z.string().optional(),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
});

type ContactContentFormData = z.infer<typeof contactContentSchema>;

type BrokerData = {
    oraoraContato?: Partial<ContactContentFormData>;
}

export default function EditPortalContactPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const siteContentDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  
  const { data: siteData, isLoading } = useDoc<BrokerData>(siteContentDocRef);

  const form = useForm<ContactContentFormData>({
    resolver: zodResolver(contactContentSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (siteData?.oraoraContato) {
      form.reset(siteData.oraoraContato);
    }
  }, [siteData, form]);

  const onSubmit = (data: ContactContentFormData) => {
    if (!siteContentDocRef) return;
    
    const sanitizedData = JSON.parse(JSON.stringify(data));
    const dataToSave = { oraoraContato: sanitizedData };
    
    setDocumentNonBlocking(siteContentDocRef, dataToSave, { merge: true });
    toast({
        title: 'Página de Contato Atualizada!',
        description: 'As alterações foram salvas.',
    });
  };
  
  if (isLoading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto p-6 md:p-10">
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Página de Contato</h1>
                    <p className="text-text-muted mt-2 text-sm md:text-base">Gerencie o conteúdo da página de contato do portal Oraora.</p>
                </div>
                <div className="flex gap-3">
                     <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
            
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="material-symbols-outlined text-primary-hover">article</span>
                    Cabeçalho da Página
                </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <FormField control={form.control} name="headerTitle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Título Principal</FormLabel>
                        <FormControl><Input placeholder="Vamos conversar sobre seu..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}/>
                </div>
                <div className="md:col-span-2">
                    <FormField control={form.control} name="headerSubtitle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subtítulo</FormLabel>
                        <FormControl><Textarea placeholder="Descrição curta abaixo do título" rows={2} {...field} value={field.value ?? ''}/></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="headerTagline" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tagline (texto de destaque)</FormLabel>
                    <FormControl><Input type="text" placeholder="Estamos Online" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                </div>
            </section>

             <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="material-symbols-outlined text-primary-hover">contact_phone</span>
                    Informações de Contato
                </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(11) 4002-8922" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input placeholder="contato@broker.com" type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="addressLine1" render={({ field }) => (
                        <FormItem><FormLabel>Endereço (Linha 1)</FormLabel><FormControl><Input placeholder="Av. Paulista, 1000 - Bela Vista" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="addressLine2" render={({ field }) => (
                        <FormItem><FormLabel>Endereço (Linha 2)</FormLabel><FormControl><Input placeholder="São Paulo - SP, 01310-100" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="addressHint" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Dica do Endereço</FormLabel><FormControl><Input placeholder="Estacionamento conveniado no local" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </section>

             <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">share</span>
                        Redes Sociais
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                        <FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                        <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                        <FormItem><FormLabel>Twitter/X URL</FormLabel><FormControl><Input placeholder="https://x.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </section>
        </form>
        </FormProvider>
    </div>
  );
}
