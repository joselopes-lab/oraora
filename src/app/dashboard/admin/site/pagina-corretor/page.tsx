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

const corretorPageSchema = z.object({
  corretorPageHeaderImageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
  corretorPageHeaderImage02Url: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
  corretorPageCentralBgImageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
  corretorPageAsteriskImageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
  corretorPageFooterBgImageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
  corretorPageSystemScreenImageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal('')),
});

type CorretorPageFormData = z.infer<typeof corretorPageSchema>;

type BrokerData = {
    corretorPageHeaderImageUrl?: string;
    corretorPageHeaderImage02Url?: string;
    corretorPageCentralBgImageUrl?: string;
    corretorPageAsteriskImageUrl?: string;
    corretorPageFooterBgImageUrl?: string;
    corretorPageSystemScreenImageUrl?: string;
};

type UploadState = {
    progress: number;
    isUploading: boolean;
    error: string | null;
};

export default function CorretorPageAdminSettings() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  
  // Upload states for each field
  const [uploadHeader, setUploadHeader] = useState<UploadState>({ progress: 0, isUploading: false, error: null });
  const [uploadHeader02, setUploadHeader02] = useState<UploadState>({ progress: 0, isUploading: false, error: null });
  const [uploadCentral, setUploadCentral] = useState<UploadState>({ progress: 0, isUploading: false, error: null });
  const [uploadAsterisk, setUploadAsterisk] = useState<UploadState>({ progress: 0, isUploading: false, error: null });
  const [uploadFooter, setUploadFooter] = useState<UploadState>({ progress: 0, isUploading: false, error: null });
  const [uploadSystemScreen, setUploadSystemScreen] = useState<UploadState>({ progress: 0, isUploading: false, error: null });

  const siteContentDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  
  const { data: siteData, isLoading } = useDoc<BrokerData>(siteContentDocRef);

  const form = useForm<CorretorPageFormData>({
    resolver: zodResolver(corretorPageSchema),
    defaultValues: {
      corretorPageHeaderImageUrl: '',
      corretorPageHeaderImage02Url: '',
      corretorPageCentralBgImageUrl: '',
      corretorPageAsteriskImageUrl: '',
      corretorPageFooterBgImageUrl: '',
      corretorPageSystemScreenImageUrl: '',
    },
  });

  useEffect(() => {
    if (siteData) {
      form.reset({
        corretorPageHeaderImageUrl: siteData.corretorPageHeaderImageUrl || '',
        corretorPageHeaderImage02Url: siteData.corretorPageHeaderImage02Url || '',
        corretorPageCentralBgImageUrl: siteData.corretorPageCentralBgImageUrl || '',
        corretorPageAsteriskImageUrl: siteData.corretorPageAsteriskImageUrl || '',
        corretorPageFooterBgImageUrl: siteData.corretorPageFooterBgImageUrl || '',
        corretorPageSystemScreenImageUrl: siteData.corretorPageSystemScreenImageUrl || '',
      });
    }
  }, [siteData, form]);
  
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    fieldName: keyof CorretorPageFormData,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setter({ progress: 0, isUploading: true, error: null });

    try {
      const path = `site-assets/corretor-page`;
      const onProgress = (progress: number) => {
        setter(prev => ({ ...prev, progress, isUploading: true }));
      };

      const downloadURL = await uploadFile(storage, path, file, onProgress);
      
      form.setValue(fieldName, downloadURL, { shouldDirty: true });
      setter({ progress: 100, isUploading: false, error: null });
      toast({ title: 'Upload Concluído!', description: 'A imagem foi carregada com sucesso.' });

    } catch (error) {
      console.error('Upload error:', error);
      setter({ progress: 0, isUploading: false, error: 'Falha no upload.' });
      toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    }
  };

  const onSubmit = (data: CorretorPageFormData) => {
    if (!siteContentDocRef) return;
    
    setDocumentNonBlocking(siteContentDocRef, data, { merge: true });

    toast({
      title: 'Configurações Salvas!',
      description: 'As imagens da página de corretores foram atualizadas.',
    });
  };

  if (isLoading) {
    return <div className="p-10 text-center">Carregando configurações...</div>;
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
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Página do Corretor</h1>
              <p className="text-text-muted mt-2 text-sm md:text-base">Configure o visual da página pública de recrutamento de corretores (/corretor).</p>
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
                Imagens do Cabeçalho
              </h2>
            </div>
            <div className="p-6 space-y-10">
                {/* Image 01 - Header Background */}
                <FormField
                    control={form.control}
                    name="corretorPageHeaderImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Imagem de Fundo Principal (Hero)</FormLabel>
                            <p className="text-xs text-muted-foreground mb-4">Esta imagem aparecerá como fundo na seção principal da página de corretores.</p>
                            <div className="flex flex-col gap-6">
                                 <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
                                    {field.value ? (
                                        <Image src={field.value} alt="Header Preview" fill className="object-cover transition-transform group-hover:scale-105 duration-500"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-5xl">landscape</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="header-image-upload" className="w-full">
                                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-bold text-sm cursor-pointer hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                                                <span className="material-symbols-outlined">upload</span>
                                                Fazer Upload da Imagem
                                            </div>
                                            <Input
                                                id="header-image-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, "corretorPageHeaderImageUrl", setUploadHeader)}
                                                disabled={uploadHeader.isUploading}
                                            />
                                        </label>
                                        {uploadHeader.isUploading && (
                                            <div className="space-y-1">
                                                <Progress value={uploadHeader.progress} className="h-1.5" />
                                                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">{Math.round(uploadHeader.progress)}% ENVIANDO</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            className="w-full h-12 rounded-xl border-gray-200"
                                            placeholder="Ou cole a URL direta da imagem aqui"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Image 02 - Floating Highlight */}
                <FormField
                    control={form.control}
                    name="corretorPageHeaderImage02Url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Imagem de Destaque Flutuante (Hero)</FormLabel>
                            <p className="text-xs text-muted-foreground mb-4">Segunda imagem de destaque (geralmente sem fundo) que flutua ao lado do título.</p>
                            <div className="flex flex-col gap-6">
                                 <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
                                    {field.value ? (
                                        <Image src={field.value} alt="Header 02 Preview" fill className="object-contain transition-transform group-hover:scale-105 duration-500"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-5xl">image</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="header-image-02-upload" className="w-full">
                                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-black transition-all shadow-lg">
                                                <span className="material-symbols-outlined">upload</span>
                                                Upload Imagem Flutuante
                                            </div>
                                            <Input
                                                id="header-image-02-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, "corretorPageHeaderImage02Url", setUploadHeader02)}
                                                disabled={uploadHeader02.isUploading}
                                            />
                                        </label>
                                        {uploadHeader02.isUploading && (
                                            <div className="space-y-1">
                                                <Progress value={uploadHeader02.progress} className="h-1.5" />
                                                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">{Math.round(uploadHeader02.progress)}% ENVIANDO</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            className="w-full h-12 rounded-xl border-gray-200"
                                            placeholder="URL da Imagem Flutuante"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </section>

          {/* Section: Central and Asterisk */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">center_focus_strong</span>
                Corpo da Página e Ícones
              </h2>
            </div>
            <div className="p-6 space-y-10">
                {/* Central Background */}
                <FormField
                    control={form.control}
                    name="corretorPageCentralBgImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Background Central (Seção Benefícios)</FormLabel>
                            <p className="text-xs text-muted-foreground mb-4">Imagem de fundo para a seção central da página.</p>
                            <div className="flex flex-col gap-6">
                                 <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
                                    {field.value ? (
                                        <Image src={field.value} alt="Central BG Preview" fill className="object-cover"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-5xl">wallpaper</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="central-bg-upload" className="w-full">
                                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm cursor-pointer hover:bg-gray-200 transition-all">
                                                <span className="material-symbols-outlined">upload</span>
                                                Upload Background Central
                                            </div>
                                            <Input
                                                id="central-bg-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, "corretorPageCentralBgImageUrl", setUploadCentral)}
                                                disabled={uploadCentral.isUploading}
                                            />
                                        </label>
                                        {uploadCentral.isUploading && <Progress value={uploadCentral.progress} className="h-1.5 mt-2" />}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            className="w-full h-12 rounded-xl border-gray-200"
                                            placeholder="URL do Background Central"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Custom Asterisk */}
                <FormField
                    control={form.control}
                    name="corretorPageAsteriskImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Ícone Asterisco Personalizado</FormLabel>
                            <p className="text-xs text-muted-foreground mb-4">Substitui o ícone de asterisco padrão por uma imagem customizada.</p>
                            <div className="flex flex-col gap-6">
                                 <div className="relative size-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
                                    {field.value ? (
                                        <Image src={field.value} alt="Asterisk Preview" fill className="object-contain"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-3xl">star</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="asterisk-upload" className="w-full">
                                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm cursor-pointer hover:bg-gray-200 transition-all">
                                                <span className="material-symbols-outlined">upload</span>
                                                Upload Ícone Asterisco
                                            </div>
                                            <Input
                                                id="asterisk-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, "corretorPageAsteriskImageUrl", setUploadAsterisk)}
                                                disabled={uploadAsterisk.isUploading}
                                            />
                                        </label>
                                        {uploadAsterisk.isUploading && <Progress value={uploadAsterisk.progress} className="h-1.5 mt-2" />}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            className="w-full h-12 rounded-xl border-gray-200"
                                            placeholder="URL do Ícone Asterisco"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </section>

          {/* Section: System Screen */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">desktop_windows</span>
                Demonstração da Plataforma
              </h2>
            </div>
            <div className="p-6 space-y-10">
                <FormField
                    control={form.control}
                    name="corretorPageSystemScreenImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Tela do Sistema (Dashboard)</FormLabel>
                            <p className="text-xs text-muted-foreground mb-4">Imagem que ilustra a interface do sistema para o corretor.</p>
                            <div className="flex flex-col gap-6">
                                 <div className="relative w-full aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
                                    {field.value ? (
                                        <Image src={field.value} alt="System Screen Preview" fill className="object-cover"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-5xl">screenshot_monitor</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="system-screen-upload" className="w-full">
                                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm cursor-pointer hover:bg-gray-200 transition-all">
                                                <span className="material-symbols-outlined">upload</span>
                                                Upload Tela do Sistema
                                            </div>
                                            <Input
                                                id="system-screen-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, "corretorPageSystemScreenImageUrl", setUploadSystemScreen)}
                                                disabled={uploadSystemScreen.isUploading}
                                            />
                                        </label>
                                        {uploadSystemScreen.isUploading && <Progress value={uploadSystemScreen.progress} className="h-1.5 mt-2" />}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            className="w-full h-12 rounded-xl border-gray-200"
                                            placeholder="URL da Tela do Sistema"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </section>

          {/* Section: Footer Background */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-primary-hover">view_agenda</span>
                Rodapé da Página
              </h2>
            </div>
            <div className="p-6 space-y-10">
                {/* Footer Background */}
                <FormField
                    control={form.control}
                    name="corretorPageFooterBgImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Imagem de Fundo do Rodapé (CTA Final)</FormLabel>
                            <p className="text-xs text-muted-foreground mb-4">Imagem de fundo para a seção final de formulário no rodapé.</p>
                            <div className="flex flex-col gap-6">
                                 <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
                                    {field.value ? (
                                        <Image src={field.value} alt="Footer BG Preview" fill className="object-cover"/>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-5xl">photo_album</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="footer-bg-upload" className="w-full">
                                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm cursor-pointer hover:bg-gray-200 transition-all">
                                                <span className="material-symbols-outlined">upload</span>
                                                Upload Background Rodapé
                                            </div>
                                            <Input
                                                id="footer-bg-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, "corretorPageFooterBgImageUrl", setUploadFooter)}
                                                disabled={uploadFooter.isUploading}
                                            />
                                        </label>
                                        {uploadFooter.isUploading && <Progress value={uploadFooter.progress} className="h-1.5 mt-2" />}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            className="w-full h-12 rounded-xl border-gray-200"
                                            placeholder="URL do Background Rodapé"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </section>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4 items-start mb-10">
              <span className="material-symbols-outlined text-blue-600">lightbulb</span>
              <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900">Dica de Design</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                      Utilize imagens panorâmicas (aspecto 21:9) com resolução mínima de 1920x800px. 
                      Para o ícone de asterisco, prefira arquivos PNG com fundo transparente ou formatos SVG.
                  </p>
              </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
