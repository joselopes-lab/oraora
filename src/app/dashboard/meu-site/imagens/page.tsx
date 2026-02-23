
'use client';

import { useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';

// Schema for the image settings
const imageSettingsSchema = z.object({
  heroImageUrl: z.string().url("URL da imagem de Hero inválida.").optional().or(z.literal('')),
  aboutImageUrl: z.string().url("URL da imagem 'Sobre' inválida.").optional().or(z.literal('')),
  footerLogoUrl: z.string().url("URL do logo do rodapé inválida").optional().or(z.literal('')),
  processImageUrl: z.string().url("URL da imagem do processo inválida.").optional().or(z.literal('')),
});

type ImageSettingsFormData = z.infer<typeof imageSettingsSchema>;

// Type matching the structure in Firestore
type BrokerData = {
    homepage?: {
        heroImageUrl?: string;
        aboutImageUrl?: string;
    };
    footerLogoUrl?: string;
    urbanPadraoServicos?: {
      processImageUrl?: string;
    }
};

type UploadState = {
    progress: number;
    isUploading: boolean;
    error: string | null;
};

export default function EditSiteImagesPage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Record<string, UploadState>>({
    heroImage: { progress: 0, isUploading: false, error: null },
    aboutImage: { progress: 0, isUploading: false, error: null },
    footerLogo: { progress: 0, isUploading: false, error: null },
    processImage: { progress: 0, isUploading: false, error: null },
  });

  const siteContentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  
  const { data: siteData, isLoading } = useDoc<BrokerData>(siteContentDocRef);

  const defaultValues: ImageSettingsFormData = {
    heroImageUrl: '',
    aboutImageUrl: '',
    footerLogoUrl: '',
    processImageUrl: '',
  };
  
  const form = useForm<ImageSettingsFormData>({
    resolver: zodResolver(imageSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    if (siteData) {
      form.reset({
        heroImageUrl: siteData.homepage?.heroImageUrl || '',
        aboutImageUrl: siteData.homepage?.aboutImageUrl || '',
        footerLogoUrl: siteData.footerLogoUrl || '',
        processImageUrl: siteData.urbanPadraoServicos?.processImageUrl || '',
      });
    }
  }, [siteData, form]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ImageSettingsFormData, uploadKey: string) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploads(prev => ({ ...prev, [uploadKey]: { progress: 0, isUploading: true, error: null } }));

    try {
      const path = `brokers/${user.uid}/site_assets`;
      const onProgress = (progress: number) => {
        setUploads(prev => ({ ...prev, [uploadKey]: { ...prev[uploadKey], progress, isUploading: true } as UploadState }));
      };

      const downloadURL = await uploadFile(storage, path, file, onProgress);
      
      form.setValue(fieldName, downloadURL, { shouldDirty: true });
      setUploads(prev => ({ ...prev, [uploadKey]: { progress: 100, isUploading: false, error: null } }));
      toast({ title: 'Upload Concluído!', description: 'A imagem foi enviada. Salve as alterações para publicar.' });

    } catch (error) {
      console.error('Upload error:', error);
      setUploads(prev => ({ ...prev, [uploadKey]: { progress: 0, isUploading: false, error: 'Falha no upload.' } }));
      toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    }
  };

  const onSubmit = (data: ImageSettingsFormData) => {
    if (!siteContentDocRef) return;
    
    const { footerLogoUrl, heroImageUrl, aboutImageUrl, processImageUrl } = data;
    
    // Sanitize data to remove undefined values, which Firestore doesn't support.
    const dataToSave = {
        homepage: {
            heroImageUrl: heroImageUrl || '',
            aboutImageUrl: aboutImageUrl || '',
        },
        footerLogoUrl: footerLogoUrl || '',
        urbanPadraoServicos: {
            processImageUrl: processImageUrl || ''
        }
    }

    setDocumentNonBlocking(siteContentDocRef, dataToSave, { merge: true });

    toast({
      title: 'Imagens Atualizadas!',
      description: 'As imagens do seu site foram salvas com sucesso.',
    });
  };

  if (isLoading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto p-6 md:p-10">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <Link href="/dashboard/meu-site" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Voltar para Meu Site
              </Link>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Imagens do Site</h1>
              <p className="text-text-muted mt-2 text-sm md:text-base">Atualize as imagens principais do seu template Urban Padrão.</p>
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
                Imagens do Layout
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-8">
                {/* Hero Image */}
                <FormField
                    key="heroImageUrl"
                    control={form.control}
                    name="heroImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagem de Fundo da Seção Hero</FormLabel>
                            <div className="flex items-center gap-4 mt-2">
                                 <div className="relative w-48 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {field.value ? (
                                        <Image src={field.value} alt="Hero Preview" layout="fill" className="object-cover"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label htmlFor="hero-image-upload" className="w-full">
                                        <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Carregar Imagem Hero
                                        </div>
                                        <Input
                                            id="hero-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, "heroImageUrl", "heroImage")}
                                            disabled={uploads.heroImage?.isUploading}
                                        />
                                    </label>
                                    <Input
                                        className="w-full h-9 text-xs"
                                        placeholder="Ou cole a URL da imagem"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </div>
                            {uploads.heroImage?.isUploading && (
                                <div className="space-y-1 mt-2">
                                    <Progress value={uploads.heroImage.progress} className="h-1.5" />
                                </div>
                            )}
                            {uploads.heroImage?.error && (
                                <p className="text-xs text-red-500 mt-1">{uploads.heroImage.error}</p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* About Image */}
                <FormField
                    key="aboutImageUrl"
                    control={form.control}
                    name="aboutImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagem da Seção "Sobre"</FormLabel>
                            <div className="flex items-center gap-4 mt-2">
                                 <div className="relative w-48 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {field.value ? (
                                        <Image src={field.value} alt="About Preview" layout="fill" className="object-cover"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label htmlFor="about-image-upload" className="w-full">
                                        <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Carregar Imagem Sobre
                                        </div>
                                        <Input
                                            id="about-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, "aboutImageUrl", "aboutImage")}
                                            disabled={uploads.aboutImage?.isUploading}
                                        />
                                    </label>
                                    <Input
                                        className="w-full h-9 text-xs"
                                        placeholder="Ou cole a URL da imagem"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </div>
                            {uploads.aboutImage?.isUploading && (
                                <div className="space-y-1 mt-2">
                                    <Progress value={uploads.aboutImage.progress} className="h-1.5" />
                                </div>
                            )}
                            {uploads.aboutImage?.error && (
                                <p className="text-xs text-red-500 mt-1">{uploads.aboutImage.error}</p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 {/* Footer Logo */}
                <FormField
                    key="footerLogoUrl"
                    control={form.control}
                    name="footerLogoUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo do Rodapé</FormLabel>
                            <div className="flex items-center gap-4 mt-2">
                                 <div className="relative w-48 h-28 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden p-2">
                                    {field.value ? (
                                        <Image src={field.value} alt="Footer Logo Preview" layout="fill" className="object-contain"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label htmlFor="footer-logo-upload" className="w-full">
                                        <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Carregar Logo Rodapé
                                        </div>
                                        <Input
                                            id="footer-logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, "footerLogoUrl", "footerLogo")}
                                            disabled={uploads.footerLogo?.isUploading}
                                        />
                                    </label>
                                    <Input
                                        className="w-full h-9 text-xs"
                                        placeholder="Ou cole a URL do logo"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </div>
                            {uploads.footerLogo?.isUploading && (
                                <div className="space-y-1 mt-2">
                                    <Progress value={uploads.footerLogo.progress} className="h-1.5" />
                                </div>
                            )}
                            {uploads.footerLogo?.error && (
                                <p className="text-xs text-red-500 mt-1">{uploads.footerLogo.error}</p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Process Image */}
                <FormField
                    key="processImageUrl"
                    control={form.control}
                    name="processImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagem da Seção "Processo" (Página de Serviços)</FormLabel>
                            <div className="flex items-center gap-4 mt-2">
                                 <div className="relative w-48 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {field.value ? (
                                        <Image src={field.value} alt="Process Preview" layout="fill" className="object-cover"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label htmlFor="process-image-upload" className="w-full">
                                        <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Carregar Imagem Processo
                                        </div>
                                        <Input
                                            id="process-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, "processImageUrl", "processImage")}
                                            disabled={uploads.processImage?.isUploading}
                                        />
                                    </label>
                                    <Input
                                        className="w-full h-9 text-xs"
                                        placeholder="Ou cole a URL da imagem"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </div>
                            {uploads.processImage?.isUploading && (
                                <div className="space-y-1 mt-2">
                                    <Progress value={uploads.processImage.progress} className="h-1.5" />
                                </div>
                            )}
                            {uploads.processImage?.error && (
                                <p className="text-xs text-red-500 mt-1">{uploads.processImage.error}</p>
                            )}
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
