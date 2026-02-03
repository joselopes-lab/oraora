
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
import { Switch } from '@/components/ui/switch';


const homepageContentSchema = z.object({
  heroTagline: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  heroVideoUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  statsSold: z.string().optional(),
  statsExperience: z.string().optional(),
  statsSatisfaction: z.string().optional(),
  statsSupport: z.string().optional(),
  featuredTagline: z.string().optional(),
  featuredTitle: z.string().optional(),
  featuredSubtitle: z.string().optional(),
  aboutTagline: z.string().optional(),
  aboutTitle: z.string().optional(),
  aboutText: z.string().optional(),
  aboutImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  aboutAwardTitle: z.string().optional(),
  aboutAwardText: z.string().optional(),
});


type HomepageContentData = z.infer<typeof homepageContentSchema>;

type BrokerData = {
    urbanPadraoHomepage?: HomepageContentData;
}

export default function EditUrbanPadraoHomepage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);


  const form = useForm<HomepageContentData>({
    resolver: zodResolver(homepageContentSchema),
    defaultValues: {
      heroTagline: '',
      heroTitle: '',
      heroSubtitle: '',
      heroImageUrl: '',
      heroVideoUrl: '',
      statsSold: '',
      statsExperience: '',
      statsSatisfaction: '',
      statsSupport: '',
      featuredTagline: '',
      featuredTitle: '',
      featuredSubtitle: '',
      aboutTagline: '',
      aboutTitle: '',
      aboutText: '',
      aboutImageUrl: '',
      aboutAwardTitle: '',
      aboutAwardText: '',
    },
  });

  useEffect(() => {
    if (brokerData?.urbanPadraoHomepage) {
      const existingData = brokerData.urbanPadraoHomepage;
      const defaultData = form.formState.defaultValues;
      const mergedData = { ...defaultData, ...existingData };
      
      // Ensure no undefined values are passed to the form
      for (const key in mergedData) {
        if (mergedData[key as keyof HomepageContentData] === undefined) {
          mergedData[key as keyof HomepageContentData] = defaultData[key as keyof HomepageContentData];
        }
      }

      form.reset(mergedData);
    }
  }, [brokerData, form]);

  const onSubmit = (data: HomepageContentData) => {
    if (!user) return;
    
    // Convert undefined values to null to prevent Firestore errors
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === undefined ? null : value])
    );

    const docRef = doc(firestore, 'brokers', user.uid);
    setDocumentNonBlocking(docRef, { urbanPadraoHomepage: sanitizedData }, { merge: true });
    toast({
      title: 'Página Inicial Atualizada!',
      description: 'As alterações foram salvas e já estão visíveis no seu site.',
    });
  };

  if (isLoading) {
    return <p>Carregando dados da página...</p>;
  }

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto p-6 md:p-10">
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Home Page</h1>
                    <p className="text-text-muted mt-2 text-sm md:text-base">Gerencie todo o conteúdo visível na página inicial do seu site de corretor.</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline" className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Link href="#">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Pré-visualizar
                        </Link>
                    </Button>
                </div>
            </div>
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">video_library</span>
                        Seção Hero (Principal)
                    </h2>
                    <span className="material-symbols-outlined text-gray-400 cursor-help" title="Configurações da área principal com vídeo">help</span>
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
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="heroImageUrl" render={({ field }) => (
                          <FormItem>
                              <FormLabel>URL da Imagem de Fundo (Hero)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} value={field.value ?? ''}/>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                    <div>
                         <FormField control={form.control} name="heroTagline" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Texto do Botão do Vídeo</FormLabel>
                               <FormControl><Input type="text" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                     <div className="md:col-span-2">
                        <FormField control={form.control} name="heroVideoUrl" render={({ field }) => (
                            <FormItem>
                            <FormLabel>URL do Vídeo (Youtube/Vimeo)</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400">link</span>
                                    <Input placeholder="https://youtube.com/watch?v=..." type="url" {...field} value={field.value ?? ''} />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                </div>
            </section>
            
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">analytics</span>
                        Estatísticas em Números
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <FormField control={form.control} name="statsSold" render={({ field }) => (
                        <FormItem className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Imóveis Vendidos</FormLabel>
                            <FormControl><Input className="text-sm font-bold" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="statsExperience" render={({ field }) => (
                        <FormItem className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Anos de Mercado</FormLabel>
                            <FormControl><Input className="text-sm font-bold" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="statsSatisfaction" render={({ field }) => (
                        <FormItem className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Clientes Satisfeitos</FormLabel>
                            <FormControl><Input className="text-sm font-bold" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="statsSupport" render={({ field }) => (
                        <FormItem className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Suporte</FormLabel>
                            <FormControl><Input className="text-sm font-bold" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">star</span>
                        Seção Imóveis Selecionados
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
                        <span className="material-symbols-outlined text-primary-hover">person</span>
                        Sobre Mim
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                         <FormField control={form.control} name="aboutTitle" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="aboutText" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição Bio</FormLabel>
                                <FormControl><Textarea rows={4} {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="aboutTagline" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tagline (texto acima do título)</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="aboutAwardText" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Texto do Prêmio</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="aboutAwardTitle" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título do Prêmio</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                     <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="aboutImageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL da Imagem da Seção "Sobre"</FormLabel>
                              <FormControl>
                                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} value={field.value ?? ''}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <div className="border-t border-gray-100 pt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-4">Destaques (Ícones e Textos)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <Input className="w-full rounded-md border-gray-200 text-sm" type="text" defaultValue="Avaliação Precisa"/>
                                <Input className="w-full rounded-md border-gray-200 text-sm" type="text" defaultValue="Assessoria Jurídica"/>
                                <Input className="w-full rounded-md border-gray-200 text-sm" type="text" defaultValue="Tour Virtual 360°"/>
                                <Input className="w-full rounded-md border-gray-200 text-sm" type="text" defaultValue="Negociação Segura"/>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4 border-t border-gray-200 pb-10">
                <Button type="button" variant="outline" className="w-full md:w-auto px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors">
                    Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full md:w-auto px-8 py-3 rounded-lg bg-primary text-black font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all transform active:scale-95">
                    {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
        </FormProvider>
    </div>
  );
}
