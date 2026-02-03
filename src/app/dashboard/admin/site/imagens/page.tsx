
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

// Schema for just the category images
const imageSettingsSchema = z.object({
  categoryImageUrlApartamento: z.string().url().optional().or(z.literal('')),
  categoryImageUrlCasa: z.string().url().optional().or(z.literal('')),
  categoryImageUrlCobertura: z.string().url().optional().or(z.literal('')),
  categoryImageUrlTerreno: z.string().url().optional().or(z.literal('')),
  categoryImageUrlComercial: z.string().url().optional().or(z.literal('')),
  categoryImageUrlAluguel: z.string().url().optional().or(z.literal('')),
  categoryImageUrlFlat: z.string().url().optional().or(z.literal('')),
  categoryImageUrlStudio: z.string().url().optional().or(z.literal('')),
  categoryImageUrlCasaEmCondominio: z.string().url().optional().or(z.literal('')),
});

type ImageSettingsFormData = z.infer<typeof imageSettingsSchema>;

// Type matching the nested structure in Firestore for the homepage part
type BrokerData = {
    homepage?: Partial<ImageSettingsFormData>;
};

type UploadState = {
    progress: number;
    isUploading: boolean;
    error: string | null;
};

const imageFields: { name: keyof ImageSettingsFormData, label: string, uploadKey: string }[] = [
    { name: 'categoryImageUrlApartamento', label: 'Apartamento', uploadKey: 'apartamento' },
    { name: 'categoryImageUrlCasa', label: 'Casa', uploadKey: 'casa' },
    { name: 'categoryImageUrlCobertura', label: 'Cobertura', uploadKey: 'cobertura' },
    { name: 'categoryImageUrlTerreno', label: 'Terreno', uploadKey: 'terreno' },
    { name: 'categoryImageUrlComercial', label: 'Comercial', uploadKey: 'comercial' },
    { name: 'categoryImageUrlAluguel', label: 'Aluguel', uploadKey: 'aluguel' },
    { name: 'categoryImageUrlFlat', label: 'Flat', uploadKey: 'flat' },
    { name: 'categoryImageUrlStudio', label: 'Studio', uploadKey: 'studio' },
    { name: 'categoryImageUrlCasaEmCondominio', label: 'Casa em Condomínio', uploadKey: 'casaemcondominio' },
];


export default function EditPortalImagesPage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});

  // Document reference for the main site content
  const siteContentDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  
  const { data: siteData, isLoading } = useDoc<BrokerData>(siteContentDocRef);

  const defaultValues: ImageSettingsFormData = {
    categoryImageUrlApartamento: '',
    categoryImageUrlCasa: '',
    categoryImageUrlCobertura: '',
    categoryImageUrlTerreno: '',
    categoryImageUrlComercial: '',
    categoryImageUrlAluguel: '',
    categoryImageUrlFlat: '',
    categoryImageUrlStudio: '',
    categoryImageUrlCasaEmCondominio: '',
  };
  
  const form = useForm<ImageSettingsFormData>({
    resolver: zodResolver(imageSettingsSchema),
    defaultValues,
  });

  // When site data loads, populate the form, ensuring all fields have a default value
  useEffect(() => {
    if (siteData?.homepage) {
      form.reset({ ...defaultValues, ...siteData.homepage });
    }
  }, [siteData, form]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ImageSettingsFormData, uploadKey: string) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploads(prev => ({ ...prev, [uploadKey]: { progress: 0, isUploading: true, error: null } }));

    try {
      const path = `site-assets/categories`;
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
    
    // Sanitize data to remove undefined values, which Firestore doesn't support
    const sanitizedData = JSON.parse(JSON.stringify(data));
    const dataToSave = { homepage: sanitizedData };

    setDocumentNonBlocking(siteContentDocRef, dataToSave, { merge: true });

    toast({
      title: 'Imagens Atualizadas!',
      description: 'As imagens das categorias foram salvas com sucesso.',
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
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Imagens das Categorias</h1>
              <p className="text-text-muted mt-2 text-sm md:text-base">Atualize as imagens que aparecem no carrossel de categorias na página inicial.</p>
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
                <span className="material-symbols-outlined text-primary-hover">category</span>
                Imagens das Categorias Populares
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {imageFields.map(({ name, label, uploadKey }) => (
                    <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{label}</FormLabel>
                                <div className="flex items-center gap-4 mt-2">
                                     <div className="relative w-32 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                        {field.value ? (
                                            <Image src={field.value} alt={`${label} Preview`} layout="fill" className="object-cover"/>
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-400">image</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label htmlFor={`${uploadKey}-upload`} className="w-full">
                                            <div className="w-full px-3 h-9 flex items-center justify-center gap-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                                <span className="material-symbols-outlined text-sm">upload</span>
                                                Carregar
                                            </div>
                                            <Input
                                                id={`${uploadKey}-upload`}
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(e, name, uploadKey)}
                                                disabled={uploads[uploadKey]?.isUploading}
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
                                {uploads[uploadKey]?.isUploading && (
                                    <div className="space-y-1 mt-2">
                                        <Progress value={uploads[uploadKey].progress} className="h-1.5" />
                                    </div>
                                )}
                                {uploads[uploadKey]?.error && (
                                    <p className="text-xs text-red-500 mt-1">{uploads[uploadKey].error}</p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
          </section>
        </form>
      </FormProvider>
    </div>
  );
}
