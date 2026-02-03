'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const imageSchema = z.object({
  heroImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  aboutImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  processImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
});

type ImageData = z.infer<typeof imageSchema>;

type BrokerData = {
    homepage?: {
      heroImageUrl?: string;
      aboutImageUrl?: string;
    };
    urbanPadraoServicos?: {
        processImageUrl?: string;
    }
};

type UploadState = {
  progress: number;
  isUploading: boolean;
  error: string | null;
};

export default function GerenciarImagensPage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const [uploads, setUploads] = useState<Record<string, UploadState>>({
      heroImage: { progress: 0, isUploading: false, error: null },
      aboutImage: { progress: 0, isUploading: false, error: null },
      processImage: { progress: 0, isUploading: false, error: null }
  });

  const form = useForm<ImageData>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      heroImageUrl: '',
      aboutImageUrl: '',
      processImageUrl: '',
    },
  });

  useEffect(() => {
    if (brokerData) {
      form.reset({ 
          heroImageUrl: brokerData.homepage?.heroImageUrl || '',
          aboutImageUrl: brokerData.homepage?.aboutImageUrl || '',
          processImageUrl: brokerData.urbanPadraoServicos?.processImageUrl || ''
      });
    }
  }, [brokerData, form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ImageData, uploadKey: string) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploads(prev => ({ ...prev, [uploadKey]: { progress: 0, isUploading: true, error: null } }));

    try {
        const path = `brokers/${user.uid}/site_images`;
        const onProgress = (progress: number) => {
            setUploads(prev => ({ ...prev, [uploadKey]: { ...prev[uploadKey], progress, isUploading: true } }));
        };

        const downloadURL = await uploadFile(storage, path, file, onProgress);
        
        form.setValue(fieldName, downloadURL, { shouldDirty: true });
        
        toast({ title: 'Upload Concluído!', description: 'A imagem foi enviada. Salve as alterações para publicar.' });

    } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev => ({ ...prev, [uploadKey]: { progress: 0, isUploading: false, error: 'Falha no upload.' } }));
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    } finally {
        setUploads(prev => ({ ...prev, [uploadKey]: { ...prev[uploadKey], isUploading: false } }));
    }
  };


  const onSubmit = (data: ImageData) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'brokers', user.uid);
    setDocumentNonBlocking(docRef, { 
        homepage: { 
            heroImageUrl: data.heroImageUrl, 
            aboutImageUrl: data.aboutImageUrl 
        },
        urbanPadraoServicos: {
            processImageUrl: data.processImageUrl
        }
    }, { merge: true });
    toast({
      title: 'Imagens Atualizadas!',
      description: 'As imagens do seu site foram atualizadas.',
    });
  };
  
  if (isLoading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="min-h-screen w-full max-w-2xl mx-auto p-6 md:p-10">
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <Link href="/dashboard/meu-site" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Voltar para Meu Site
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Imagens</h1>
                    <p className="text-text-muted mt-2 text-sm md:text-base">Atualize as imagens principais do seu site.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                     <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                        {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
            
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">image</span>
                        Imagem de Fundo (Hero)
                    </h2>
                </div>
                <div className="p-6">
                    <FormField
                    control={form.control}
                    name="heroImageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <div className="flex flex-col items-center gap-4">
                            <div className="relative w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                {field.value ? (
                                <Image src={field.value} alt="Hero Background Preview" layout="fill" className="object-cover" />
                                ) : (
                                <span className="material-symbols-outlined text-gray-400 text-4xl">
                                    hide_image
                                </span>
                                )}
                            </div>
                            <div className="w-full space-y-2">
                                <label htmlFor="hero-image-upload" className="w-full">
                                <div className="w-full h-12 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined text-base">upload</span>
                                    Carregar nova imagem de fundo
                                </div>
                                <Input
                                    id="hero-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => handleFileUpload(e, 'heroImageUrl', 'heroImage')}
                                    disabled={uploads.heroImage?.isUploading}
                                />
                                </label>
                                {uploads.heroImage?.isUploading && (
                                <div className="space-y-1">
                                    <Progress value={uploads.heroImage.progress} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-center">
                                    Enviando... {Math.round(uploads.heroImage.progress)}%
                                    </p>
                                </div>
                                )}
                                {uploads.heroImage?.error && (
                                <p className="text-xs text-red-500">{uploads.heroImage.error}</p>
                                )}
                                <div className="flex items-center gap-2">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs text-gray-400">OU</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                                </div>
                                <Input
                                className="w-full h-10 border-gray-200"
                                placeholder="Cole a URL da imagem aqui"
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
                </div>
            </section>

             <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">person_box</span>
                        Imagem da Seção "Sobre"
                    </h2>
                </div>
                <div className="p-6">
                     <FormField
                        control={form.control}
                        name="aboutImageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <div className="flex flex-col items-center gap-4">
                                <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {field.value ? (
                                    <Image src={field.value} alt="About Me Image Preview" layout="fill" className="object-cover" />
                                    ) : (
                                    <span className="material-symbols-outlined text-gray-400 text-4xl">
                                        portrait
                                    </span>
                                    )}
                                </div>
                                <div className="w-full space-y-2">
                                    <label htmlFor="about-image-upload" className="w-full">
                                    <div className="w-full h-12 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                                        <span className="material-symbols-outlined text-base">upload</span>
                                        Carregar imagem "Sobre Mim"
                                    </div>
                                    <Input
                                        id="about-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(e) => handleFileUpload(e, 'aboutImageUrl', 'aboutImage')}
                                        disabled={uploads.aboutImage?.isUploading}
                                    />
                                    </label>
                                    {uploads.aboutImage?.isUploading && (
                                    <div className="space-y-1">
                                        <Progress value={uploads.aboutImage.progress} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-center">
                                        Enviando... {Math.round(uploads.aboutImage.progress)}%
                                        </p>
                                    </div>
                                    )}
                                    {uploads.aboutImage?.error && (
                                    <p className="text-xs text-red-500">{uploads.aboutImage.error}</p>
                                    )}
                                    <div className="flex items-center gap-2">
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    <span className="text-xs text-gray-400">OU</span>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>
                                    <Input
                                    className="w-full h-10 border-gray-200"
                                    placeholder="Cole a URL da imagem aqui"
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
                </div>
            </section>

             <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">engineering</span>
                        Imagem da Seção "Processo"
                    </h2>
                </div>
                <div className="p-6">
                     <FormField
                        control={form.control}
                        name="processImageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <div className="flex flex-col items-center gap-4">
                                <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {field.value ? (
                                    <Image src={field.value} alt="Process Image Preview" layout="fill" className="object-cover" />
                                    ) : (
                                    <span className="material-symbols-outlined text-gray-400 text-4xl">
                                        image
                                    </span>
                                    )}
                                </div>
                                <div className="w-full space-y-2">
                                    <label htmlFor="process-image-upload" className="w-full">
                                    <div className="w-full h-12 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                                        <span className="material-symbols-outlined text-base">upload</span>
                                        Carregar imagem da seção "Processo"
                                    </div>
                                    <Input
                                        id="process-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(e) => handleFileUpload(e, 'processImageUrl', 'processImage')}
                                        disabled={uploads.processImage?.isUploading}
                                    />
                                    </label>
                                    {uploads.processImage?.isUploading && (
                                    <div className="space-y-1">
                                        <Progress value={uploads.processImage.progress} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-center">
                                        Enviando... {Math.round(uploads.processImage.progress)}%
                                        </p>
                                    </div>
                                    )}
                                    {uploads.processImage?.error && (
                                    <p className="text-xs text-red-500">{uploads.processImage.error}</p>
                                    )}
                                    <div className="flex items-center gap-2">
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    <span className="text-xs text-gray-400">OU</span>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>
                                    <Input
                                    className="w-full h-10 border-gray-200"
                                    placeholder="Cole a URL da imagem aqui"
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
                </div>
            </section>
        </form>
        </FormProvider>
    </div>
  );
}
