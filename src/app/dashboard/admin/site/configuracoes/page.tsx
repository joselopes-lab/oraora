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

// Schema for the logo settings
const logoSettingsSchema = z.object({
  logoUrl: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
  logoUrlWhite: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
});

type LogoSettingsFormData = z.infer<typeof logoSettingsSchema>;

// Type matching the structure in Firestore
type BrokerData = {
    logoUrl?: string;
    logoUrlWhite?: string;
};

type UploadState = {
    progress: number;
    isUploading: boolean;
    error: string | null;
};

export default function EditPortalSettingsPage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Record<string, UploadState>>({
    mainLogo: { progress: 0, isUploading: false, error: null },
    whiteLogo: { progress: 0, isUploading: false, error: null },
  });

  const siteContentDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  
  const { data: siteData, isLoading } = useDoc<BrokerData>(siteContentDocRef);

  const defaultValues: LogoSettingsFormData = {
    logoUrl: '',
    logoUrlWhite: '',
  };
  
  const form = useForm<LogoSettingsFormData>({
    resolver: zodResolver(logoSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    if (siteData) {
      form.reset({ ...defaultValues, ...siteData });
    }
  }, [siteData, form]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof LogoSettingsFormData, uploadKey: string) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploads(prev => ({ ...prev, [uploadKey]: { progress: 0, isUploading: true, error: null } }));

    try {
      const path = `site-assets/logos`;
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

  const onSubmit = (data: LogoSettingsFormData) => {
    if (!siteContentDocRef) return;
    
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    setDocumentNonBlocking(siteContentDocRef, sanitizedData, { merge: true });

    toast({
      title: 'Configurações Salvas!',
      description: 'As logos do site foram atualizadas com sucesso.',
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
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Voltar para o Dashboard
              </Link>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações do Site</h1>
              <p className="text-text-muted mt-2 text-sm md:text-base">Gerencie as logos e outras configurações globais do portal Oraora.</p>
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
                Logos do Portal
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    key="logoUrl"
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo Principal (Escura)</FormLabel>
                            <p className="text-xs text-muted-foreground mb-2">Usada no topo e rodapé do portal.</p>
                            <div className="flex items-center gap-4 mt-2">
                                 <div className="relative w-32 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden p-2">
                                    {field.value ? (
                                        <Image src={field.value} alt="Logo Principal Preview" layout="fill" className="object-contain"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label htmlFor="main-logo-upload" className="w-full">
                                        <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Carregar
                                        </div>
                                        <Input
                                            id="main-logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, "logoUrl", "mainLogo")}
                                            disabled={uploads.mainLogo?.isUploading}
                                        />
                                    </label>
                                    <Input
                                        className="w-full h-9 text-xs"
                                        placeholder="Ou cole a URL"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </div>
                            {uploads.mainLogo?.isUploading && (
                                <div className="space-y-1 mt-2">
                                    <Progress value={uploads.mainLogo.progress} className="h-1.5" />
                                </div>
                            )}
                            {uploads.mainLogo?.error && (
                                <p className="text-xs text-red-500 mt-1">{uploads.mainLogo.error}</p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    key="logoUrlWhite"
                    control={form.control}
                    name="logoUrlWhite"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo Branca</FormLabel>
                             <p className="text-xs text-muted-foreground mb-2">Usada na página "Para Corretores".</p>
                            <div className="flex items-center gap-4 mt-2">
                                 <div className="relative w-32 h-20 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden p-2">
                                    {field.value ? (
                                        <Image src={field.value} alt="Logo Branca Preview" layout="fill" className="object-contain"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label htmlFor="white-logo-upload" className="w-full">
                                        <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Carregar
                                        </div>
                                        <Input
                                            id="white-logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, "logoUrlWhite", "whiteLogo")}
                                            disabled={uploads.whiteLogo?.isUploading}
                                        />
                                    </label>
                                    <Input
                                        className="w-full h-9 text-xs"
                                        placeholder="Ou cole a URL"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </div>
                            {uploads.whiteLogo?.isUploading && (
                                <div className="space-y-1 mt-2">
                                    <Progress value={uploads.whiteLogo.progress} className="h-1.5" />
                                </div>
                            )}
                            {uploads.whiteLogo?.error && (
                                <p className="text-xs text-red-500 mt-1">{uploads.whiteLogo.error}</p>
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
