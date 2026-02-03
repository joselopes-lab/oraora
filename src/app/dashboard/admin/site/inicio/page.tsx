
'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import Link from 'next/link';

const siteContentSchema = z.object({
  heroTagline: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  featuredTagline: z.string().optional(),
  featuredTitle: z.string().optional(),
  featuredSubtitle: z.string().optional(),
  ctaTitle: z.string().optional(),
  ctaSubtitle: z.string().optional(),
  // New fields for the features section
  featuresTitle: z.string().optional(),
  featuresSubtitle: z.string().optional(),
  featuresItem1: z.string().optional(),
  featuresItem2: z.string().optional(),
  featuresItem3: z.string().optional(),
  featuresButtonText: z.string().optional(),
  featuresCard1Title: z.string().optional(),
  featuresCard1Description: z.string().optional(),
  featuresCard1Icon: z.string().optional(),
  featuresCard2Title: z.string().optional(),
  featuresCard2Description: z.string().optional(),
  featuresCard2Icon: z.string().optional(),
  featuresCard3Title: z.string().optional(),
  featuresCard3Description: z.string().optional(),
  featuresCard3Icon: z.string().optional(),
  featuresCard4Title: z.string().optional(),
  featuresCard4Description: z.string().optional(),
  featuresCard4Icon: z.string().optional(),
  footerSlogan: z.string().optional(),
});


type SiteContentFormData = z.infer<typeof siteContentSchema>;

type SiteContentData = {
    homepage?: Partial<Omit<SiteContentFormData, 'footerSlogan'>>;
    footerSlogan?: string;
}

export default function EditMainSiteHomepage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const siteContentDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  
  const { data: siteData, isLoading } = useDoc<SiteContentData>(siteContentDocRef);

  const form = useForm<SiteContentFormData>({
    resolver: zodResolver(siteContentSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (siteData) {
      const homepageData = siteData.homepage || {};
      form.reset({
        ...homepageData,
        footerSlogan: siteData.footerSlogan || '',
      });
    }
  }, [siteData, form]);

  const onSubmit = (data: SiteContentFormData) => {
    if (!siteContentDocRef) return;
    
    const { footerSlogan, ...homepageData } = data;
    const sanitizedHomepageData = JSON.parse(JSON.stringify(homepageData));

    const dataToSave = {
        homepage: sanitizedHomepageData,
        footerSlogan: footerSlogan,
    };
    
    setDocumentNonBlocking(siteContentDocRef, dataToSave, { merge: true });
    toast({
        title: 'Página Inicial Atualizada!',
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Página Inicial do Portal</h1>
                    <p className="text-text-muted mt-2 text-sm md:text-base">Gerencie o conteúdo principal da homepage do Oraora.</p>
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
            <span className="material-symbols-outlined text-primary-hover">home</span>
            Seção Hero (Principal)
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField control={form.control} name="heroTitle" render={({ field }) => (
              <FormItem>
                <FormLabel>Título Principal</FormLabel>
                <FormControl><Input placeholder="Ex: Encontre o lar dos seus sonhos" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
          <div className="md:col-span-2">
            <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
              <FormItem>
                <FormLabel>Subtítulo</FormLabel>
                <FormControl><Textarea placeholder="Descrição curta abaixo do título" rows={3} {...field} value={field.value ?? ''}/></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
          <FormField control={form.control} name="heroTagline" render={({ field }) => (
            <FormItem>
              <FormLabel>Tagline (texto de destaque)</FormLabel>
              <FormControl><Input type="text" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>
      </section>
      
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">star</span>
                Seção Imóveis em Destaque
            </h2>
        </div>
         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <FormField control={form.control} name="featuredTitle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Título da Seção</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
            <div className="md:col-span-2">
                <FormField control={form.control} name="featuredSubtitle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
             <div className="md:col-span-2">
                <FormField control={form.control} name="featuredTagline" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tagline (texto pequeno acima do título)</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <span className="material-symbols-outlined text-primary-hover">auto_awesome</span>
            Seção "Inteligente"
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <FormField control={form.control} name="featuresTitle" render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="featuresSubtitle" render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo</FormLabel>
              <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="featuresItem1" render={({ field }) => (
              <FormItem>
                <FormLabel>Item da Lista 1</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="featuresItem2" render={({ field }) => (
              <FormItem>
                <FormLabel>Item da Lista 2</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="featuresItem3" render={({ field }) => (
              <FormItem>
                <FormLabel>Item da Lista 3</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
          <FormField control={form.control} name="featuresButtonText" render={({ field }) => (
            <FormItem>
              <FormLabel>Texto do Botão</FormLabel>
              <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* Card 1 */}
              <div className="space-y-2 p-4 border rounded-lg">
                  <FormLabel className="font-semibold">Card 1</FormLabel>
                  <FormField control={form.control} name="featuresCard1Icon" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Ícone (ex: search)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard1Title" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Título" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard1Description" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Descrição" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>
              {/* Card 2 */}
              <div className="space-y-2 p-4 border rounded-lg">
                  <FormLabel className="font-semibold">Card 2</FormLabel>
                   <FormField control={form.control} name="featuresCard2Icon" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Ícone (ex: rocket_launch)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard2Title" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Título" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard2Description" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Descrição" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>
              {/* Card 3 */}
              <div className="space-y-2 p-4 border rounded-lg">
                  <FormLabel className="font-semibold">Card 3</FormLabel>
                   <FormField control={form.control} name="featuresCard3Icon" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Ícone (ex: handshake)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard3Title" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Título" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard3Description" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Descrição" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>
              {/* Card 4 */}
              <div className="space-y-2 p-4 border rounded-lg">
                  <FormLabel className="font-semibold">Card 4</FormLabel>
                   <FormField control={form.control} name="featuresCard4Icon" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Ícone (ex: support_agent)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard4Title" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Título" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="featuresCard4Description" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Descrição" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">campaign</span>
                Seção de CTA (Chamada para Ação)
            </h2>
        </div>
        <div className="p-6 grid grid-cols-1 gap-6">
            <FormField control={form.control} name="ctaTitle" render={({ field }) => (
                <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="ctaSubtitle" render={({ field }) => (
                <FormItem>
                    <FormLabel>Subtítulo</FormLabel>
                    <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>
      </section>

       <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">foundation</span>
                Rodapé
            </h2>
        </div>
        <div className="p-6 grid grid-cols-1 gap-6">
            <FormField control={form.control} name="footerSlogan" render={({ field }) => (
                <FormItem>
                    <FormLabel>Slogan do Rodapé</FormLabel>
                    <FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl>
                    <FormDescription>
                        Você pode usar tags HTML básicas como &lt;b&gt; para negrito e &lt;br /&gt; para quebras de linha.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>
      </section>

        </form>
        </FormProvider>
    </div>
  );
}
