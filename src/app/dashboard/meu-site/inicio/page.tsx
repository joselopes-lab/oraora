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
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';


const homepageSchema = z.object({
  heroTagline: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  heroVideoUrl: z.string().url().optional().or(z.literal('')),
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
  ctaTitle: z.string().optional(),
  ctaSubtitle: z.string().optional(),
  // Domus specific fields
  value1Icon: z.string().optional(),
  value1Title: z.string().optional(),
  value1Description: z.string().optional(),
  value2Icon: z.string().optional(),
  value2Title: z.string().optional(),
  value2Description: z.string().optional(),
  value3Icon: z.string().optional(),
  value3Title: z.string().optional(),
  value3Description: z.string().optional(),
  value4Icon: z.string().optional(),
  value4Title: z.string().optional(),
  value4Description: z.string().optional(),
  aboutAwardTitle: z.string().optional(),
  aboutAwardText: z.string().optional(),
  aboutQuote: z.string().optional(),
  hideStats: z.boolean().optional(),
});


type HomepageData = z.infer<typeof homepageSchema>;

type BrokerData = {
    homepage?: HomepageData;
    layoutId?: string; // We need to know the active layout
}

type UploadState = {
  progress: number;
  isUploading: boolean;
  error: string | null;
};

export default function EditHomepagePage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const [heroImageUploadState, setHeroImageUploadState] = useState<UploadState>({ progress: 0, isUploading: false, error: null });

  const form = useForm<HomepageData>({
    resolver: zodResolver(homepageSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (brokerData?.homepage) {
       const existingData = brokerData.homepage;
       const defaultData = form.formState.defaultValues ?? {};
       const mergedData: HomepageData = {
          ...defaultData,
          ...existingData,
          heroTagline: existingData.heroTagline ?? '',
          heroTitle: existingData.heroTitle ?? '',
          heroSubtitle: existingData.heroSubtitle ?? '',
          heroImageUrl: existingData.heroImageUrl ?? '',
          heroVideoUrl: existingData.heroVideoUrl ?? '',
          statsSold: existingData.statsSold ?? '',
          statsExperience: existingData.statsExperience ?? '',
          statsSatisfaction: existingData.statsSatisfaction ?? '',
          statsSupport: existingData.statsSupport ?? '',
          featuredTagline: existingData.featuredTagline ?? '',
          featuredTitle: existingData.featuredTitle ?? '',
          featuredSubtitle: existingData.featuredSubtitle ?? '',
          aboutTagline: existingData.aboutTagline ?? '',
          aboutTitle: existingData.aboutTitle ?? '',
          aboutText: existingData.aboutText ?? '',
          aboutImageUrl: existingData.aboutImageUrl ?? '',
          ctaTitle: existingData.ctaTitle ?? '',
          ctaSubtitle: existingData.ctaSubtitle ?? '',
          value1Icon: existingData.value1Icon ?? '',
          value1Title: existingData.value1Title ?? '',
          value1Description: existingData.value1Description ?? '',
          value2Icon: existingData.value2Icon ?? '',
          value2Title: existingData.value2Title ?? '',
          value2Description: existingData.value2Description ?? '',
          value3Icon: existingData.value3Icon ?? '',
          value3Title: existingData.value3Title ?? '',
          value3Description: existingData.value3Description ?? '',
          value4Icon: existingData.value4Icon ?? '',
          value4Title: existingData.value4Title ?? '',
          value4Description: existingData.value4Description ?? '',
          aboutAwardTitle: existingData.aboutAwardTitle ?? '',
          aboutAwardText: existingData.aboutAwardText ?? '',
          aboutQuote: existingData.aboutQuote ?? '',
          hideStats: existingData.hideStats ?? false,
      };
      form.reset(mergedData);
    }
  }, [brokerData, form]);

  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) {
        toast({
            variant: "destructive",
            title: "Erro de Upload",
            description: "Não foi possível iniciar o upload. Tente novamente."
        });
        return;
    }

    setHeroImageUploadState({ progress: 0, isUploading: true, error: null });

    try {
        const path = `brokers/${user.uid}/site_images`;
        const onProgress = (progress: number) => {
            setHeroImageUploadState(prev => ({ ...prev, progress, isUploading: true }));
        };

        const downloadURL = await uploadFile(storage, path, file, onProgress);
        
        form.setValue('heroImageUrl', downloadURL, { shouldDirty: true });
        
        toast({ title: 'Upload Concluído!', description: 'A imagem foi enviada. Salve as alterações para publicar.' });

    } catch (error) {
        console.error('Upload error:', error);
        setHeroImageUploadState({ progress: 0, isUploading: false, error: 'Falha no upload.' });
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    } finally {
        setHeroImageUploadState(prev => ({ ...prev, isUploading: false }));
    }
  };


  const onSubmit = (data: HomepageData) => {
    if (!user) return;
    const sanitizedData = JSON.parse(JSON.stringify(data));
    const docRef = doc(firestore, 'brokers', user.uid);
    setDocumentNonBlocking(docRef, { homepage: sanitizedData, userId: user.uid }, { merge: true });
    toast({
        title: 'Página Inicial Atualizada!',
        description: 'As alterações foram salvas e já estão visíveis no seu site.',
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
                    <Link href="/dashboard/meu-site" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Voltar para Meu Site
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Página Inicial</h1>
                    <p className="text-text-muted mt-2 text-sm md:text-base">Gerencie o conteúdo do seu site. As alterações são aplicadas a todos os layouts.</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline" className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Link href="#">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Pré-visualizar
                        </Link>
                    </Button>
                     <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
            
              {/* Hero Section */}
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
                <FormControl><Textarea placeholder="Descrição curta abaixo do título" rows={3} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
           <FormField
              control={form.control}
              name="heroImageUrl"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Imagem de Fundo (Hero)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <div className="relative w-48 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {field.value ? (
                          <Image src={field.value} alt="Hero Background Preview" layout="fill" className="object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 text-4xl">
                            hide_image
                          </span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                         <label htmlFor="hero-image-upload" className="w-full">
                          <div className="w-full h-12 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="material-symbols-outlined text-base">upload</span>
                            Carregar nova imagem
                          </div>
                          <Input
                            id="hero-image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleHeroImageUpload}
                            disabled={heroImageUploadState.isUploading}
                          />
                        </label>
                        {heroImageUploadState.isUploading && (
                          <div className="space-y-1">
                            <Progress value={heroImageUploadState.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                              Enviando... {Math.round(heroImageUploadState.progress)}%
                            </p>
                          </div>
                        )}
                         {heroImageUploadState.error && (
                          <p className="text-xs text-red-500">{heroImageUploadState.error}</p>
                        )}
                        <Input
                          className="w-full h-10 border-gray-200"
                          placeholder="Ou cole a URL da imagem aqui"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField control={form.control} name="heroTagline" render={({ field }) => (
            <FormItem>
              <FormLabel>Tagline (texto de destaque)</FormLabel>
              <FormControl><Input type="text" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
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
      
      {/* Stats Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <span className="material-symbols-outlined text-primary-hover">analytics</span>
            Estatísticas em Números
          </h2>
           <FormField
              control={form.control}
              name="hideStats"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium">
                    Ocultar Seção
                  </FormLabel>
                </FormItem>
              )}
            />
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <FormField control={form.control} name="statsSold" render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Imóveis Vendidos</FormLabel>
              <FormControl><Input className="w-full h-auto text-3xl font-black text-primary" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="statsExperience" render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Anos de Mercado</FormLabel>
              <FormControl><Input className="w-full h-auto text-3xl font-black text-primary" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="statsSatisfaction" render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Clientes Satisfeitos</FormLabel>
              <FormControl><Input className="w-full h-auto text-3xl font-black text-primary" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="statsSupport" render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Suporte</FormLabel>
              <FormControl><Input className="w-full h-auto text-3xl font-black text-primary" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>
      </section>

      {/* Featured Section */}
       <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">star</span>
                Seção de Destaques
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

      {/* About Section */}
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
                        <FormLabel>Texto / Biografia</FormLabel>
                        <FormControl><Textarea rows={4} {...field} value={field.value ?? ''}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="aboutQuote" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Citação de Destaque (Layout Domus)</FormLabel>
                      <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
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
                            <Input placeholder="https://exemplo.com/imagem.jpg" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>
      </section>
        </form>
        </FormProvider>
    </div>
  );
}
