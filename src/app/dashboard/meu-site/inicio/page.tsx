'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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
  featuredPropertyIds: z.array(z.string()).optional().default([]),
  aboutTagline: z.string().optional(),
  aboutTitle: z.string().optional(),
  aboutText: z.string().optional(),
  aboutImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  ctaTitle: z.string().optional(),
  ctaSubtitle: z.string().optional(),
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
    layoutId?: string;
}

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
  };
  midia: string[];
};

type Portfolio = {
  propertyIds: string[];
}

type UploadState = {
  progress: number;
  isUploading: boolean;
  error: string | null;
};

export default function EditHomepagePage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const [heroImageUploadState, setHeroImageUploadState] = useState<UploadState>({ progress: 0, isUploading: false, error: null });

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  const { data: brokerData, isLoading: isBrokerLoading } = useDoc<BrokerData>(brokerDocRef);

  // --- Fetching Available Properties for Selection ---
  const brokerPropertiesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: avulsoProperties, isLoading: areAvulsoLoading } = useCollection<Property>(brokerPropertiesQuery);

  const portfolioDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'portfolios', user.uid) : null),
    [user, firestore]
  );
  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);

  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
  const [arePortfolioPropertiesLoading, setArePortfolioPropertiesLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioProperties = async () => {
      if (!firestore || !portfolio) {
        setPortfolioProperties([]);
        setArePortfolioPropertiesLoading(false);
        return;
      }
      const ids = portfolio.propertyIds || [];
      if (ids.length === 0) {
        setPortfolioProperties([]);
        setArePortfolioPropertiesLoading(false);
        return;
      }
      setArePortfolioPropertiesLoading(true);
      const results: Property[] = [];
      const propertiesRef = collection(firestore, 'properties');
      for (let i = 0; i < ids.length; i += 30) {
        const batch = ids.slice(i, i + 30);
        const q = query(propertiesRef, where('__name__', 'in', batch));
        const snap = await getDocs(q);
        snap.forEach(d => results.push({ id: d.id, ...d.data() } as Property));
      }
      setPortfolioProperties(results);
      setArePortfolioPropertiesLoading(false);
    };
    if (!isPortfolioLoading) fetchPortfolioProperties();
  }, [firestore, portfolio, isPortfolioLoading]);

  const allAvailableProperties = useMemo(() => {
    return [...(avulsoProperties || []), ...portfolioProperties];
  }, [avulsoProperties, portfolioProperties]);

  const form = useForm<HomepageData>({
    resolver: zodResolver(homepageSchema),
    defaultValues: {
      featuredPropertyIds: [],
    },
  });

  useEffect(() => {
    if (brokerData?.homepage) {
      form.reset({
        ...form.formState.defaultValues,
        ...brokerData.homepage,
        featuredPropertyIds: brokerData.homepage.featuredPropertyIds || [],
      });
    }
  }, [brokerData, form]);

  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;
    setHeroImageUploadState({ progress: 0, isUploading: true, error: null });
    try {
        const path = `brokers/${user.uid}/site_images`;
        const onProgress = (progress: number) => {
            setHeroImageUploadState(prev => ({ ...prev, progress, isUploading: true }));
        };
        const downloadURL = await uploadFile(storage, path, file, onProgress);
        form.setValue('heroImageUrl', downloadURL, { shouldDirty: true });
        toast({ title: 'Upload Concluído!', description: 'A imagem foi enviada.' });
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
        description: 'As alterações foram salvas.',
    });
  };

  const selectedFeaturedIds = form.watch('featuredPropertyIds') || [];

  const handlePropertyToggle = (id: string) => {
    const current = [...selectedFeaturedIds];
    if (current.includes(id)) {
      form.setValue('featuredPropertyIds', current.filter(i => i !== id));
    } else {
      if (current.length >= 6) {
        toast({
          variant: "destructive",
          title: "Limite Atingido",
          description: "Você pode selecionar no máximo 6 imóveis para destaque."
        });
        return;
      }
      form.setValue('featuredPropertyIds', [...current, id]);
    }
  };

  const isLoadingData = isBrokerLoading || areAvulsoLoading || arePortfolioPropertiesLoading;

  if (isLoadingData) {
    return <p>Carregando configurações...</p>;
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
                          </div>
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

      {/* Featured Section with Property Picker */}
       <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">star</span>
                Seção de Destaques
            </h2>
        </div>
         <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="border-t pt-6">
              <FormLabel className="text-base font-bold">Selecionar Imóveis em Destaque (Máx. 6)</FormLabel>
              <p className="text-sm text-muted-foreground mb-4">Escolha os imóveis que aparecerão na vitrine da sua página inicial. Caso nenhum seja selecionado, o sistema exibirá imóveis aleatórios do seu catálogo.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                {allAvailableProperties.map(property => (
                  <div 
                    key={property.id} 
                    onClick={() => handlePropertyToggle(property.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group",
                      selectedFeaturedIds.includes(property.id) 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-100 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className="relative size-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <Image 
                        src={property.midia?.[0] || 'https://placehold.co/100x100'} 
                        alt={property.informacoesbasicas.nome} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-text-main uppercase">{property.informacoesbasicas.nome}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {property.id.substring(0, 6)}</p>
                    </div>
                    <div className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedFeaturedIds.includes(property.id) ? "bg-primary border-primary" : "border-gray-300"
                    )}>
                      {selectedFeaturedIds.includes(property.id) && <span className="material-symbols-outlined text-xs text-black font-bold">check</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-xs font-bold text-muted-foreground">
                  {selectedFeaturedIds.length} de 6 selecionados
                </span>
              </div>
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