'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';


const teamMemberSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).or(z.literal('')).optional(),
});

const sobreContentSchema = z.object({
  headerTagline: z.string().optional(),
  headerTitle: z.string().optional(),
  headerSubtitle: z.string().optional(),
  videoImageUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')).optional(),
  statAnunciados: z.string().optional(),
  statNegocios: z.string().optional(),
  statCidades: z.string().optional(),
  statAvaliacao: z.string().optional(),
  pilaresTitle: z.string().optional(),
  pilaresSubtitle: z.string().optional(),
  pilar1Icon: z.string().optional(),
  pilar1Title: z.string().optional(),
  pilar1Description: z.string().optional(),
  pilar2Icon: z.string().optional(),
  pilar2Title: z.string().optional(),
  pilar2Description: z.string().optional(),
  pilar3Icon: z.string().optional(),
  pilar3Title: z.string().optional(),
  pilar3Description: z.string().optional(),
  timeTitle: z.string().optional(),
  timeSubtitle: z.string().optional(),
  timeMembers: z.array(teamMemberSchema).optional(),
  ctaTitle: z.string().optional(),
  ctaSubtitle: z.string().optional(),
});

type SobreContentFormData = z.infer<typeof sobreContentSchema>;

type BrokerData = {
    oraoraSobre?: Partial<SobreContentFormData>;
}

type UploadState = {
    progress: number;
    isUploading: boolean;
    error: string | null;
};

export default function EditPortalSobrePage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  
  const siteContentDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  
  const { data: siteData, isLoading } = useDoc<BrokerData>(siteContentDocRef);

  const form = useForm<SobreContentFormData>({
    resolver: zodResolver(sobreContentSchema),
    defaultValues: {
      timeMembers: [],
    },
  });
  
  const { fields: timeMembers, append: appendMember, remove: removeMember } = useFieldArray({
    control: form.control,
    name: "timeMembers",
  });


  useEffect(() => {
    if (siteData?.oraoraSobre) {
      const data = siteData.oraoraSobre;
      form.reset({
        ...data,
        timeMembers: data.timeMembers || [],
      });
    }
  }, [siteData, form]);

  const handleFileChange = async (index: number, file: File) => {
    if (!file || !user || !storage) return;

    const fieldName = `timeMembers.${index}.imageUrl`;
    setUploads(prev => ({ ...prev, [fieldName]: { progress: 0, isUploading: true, error: null } }));

    try {
      const path = `sobre/team`;
      const onProgress = (progress: number) => {
        setUploads(prev => ({ ...prev, [fieldName]: { ...prev[fieldName], progress, isUploading: true } as UploadState }));
      };

      const downloadURL = await uploadFile(storage, path, file, onProgress);
      
      form.setValue(fieldName as `timeMembers.${number}.imageUrl`, downloadURL, { shouldDirty: true });
      setUploads(prev => ({ ...prev, [fieldName]: { progress: 100, isUploading: false, error: null } }));
      toast({ title: 'Upload Concluído!', description: 'A imagem foi enviada. Salve as alterações para publicar.' });

    } catch (error) {
      console.error('Upload error:', error);
      setUploads(prev => ({ ...prev, [fieldName]: { progress: 0, isUploading: false, error: 'Falha no upload.' } }));
      toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    }
  };

  const onSubmit = (data: SobreContentFormData) => {
    if (!siteContentDocRef) return;
    
    const sanitizedData = JSON.parse(JSON.stringify(data));
    const dataToSave = { oraoraSobre: sanitizedData };
    
    setDocumentNonBlocking(siteContentDocRef, dataToSave, { merge: true });
    toast({
        title: 'Página Sobre Atualizada!',
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Página Sobre</h1>
                    <p className="text-text-muted mt-2 text-sm md:text-base">Gerencie o conteúdo da página "Sobre" do portal Oraora.</p>
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
                            <FormControl><Input placeholder="Conectamos sonhos a..." {...field} value={field.value ?? ''} /></FormControl>
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
                        <FormLabel>Tagline</FormLabel>
                        <FormControl><Input placeholder="Revolucionando o Mercado" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="videoImageUrl" render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL da Imagem do Vídeo</FormLabel>
                        <FormControl><Input placeholder="https://..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">query_stats</span>
                        Estatísticas
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <FormField control={form.control} name="statAnunciados" render={({ field }) => (
                        <FormItem><FormLabel>Imóveis Anunciados</FormLabel><FormControl><Input placeholder="+2 Mi" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="statNegocios" render={({ field }) => (
                        <FormItem><FormLabel>Negócios Fechados</FormLabel><FormControl><Input placeholder="150k" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="statCidades" render={({ field }) => (
                        <FormItem><FormLabel>Cidades Atendidas</FormLabel><FormControl><Input placeholder="300+" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="statAvaliacao" render={({ field }) => (
                        <FormItem><FormLabel>Avaliação Média</FormLabel><FormControl><Input placeholder="4.9" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">foundation</span>
                        Pilares
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    <FormField control={form.control} name="pilaresTitle" render={({ field }) => (
                        <FormItem><FormLabel>Título da Seção</FormLabel><FormControl><Input placeholder="Nossos Pilares" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="pilaresSubtitle" render={({ field }) => (
                        <FormItem><FormLabel>Subtítulo da Seção</FormLabel><FormControl><Textarea placeholder="Descrição sobre os pilares..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                        <div className="space-y-4 p-4 border rounded-lg">
                           <FormField control={form.control} name="pilar1Icon" render={({ field }) => (
                                <FormItem><FormLabel>Ícone 1</FormLabel><FormControl><Input placeholder="verified_user" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="pilar1Title" render={({ field }) => (
                                <FormItem><FormLabel>Título 1</FormLabel><FormControl><Input placeholder="Segurança em Primeiro Lugar" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="pilar1Description" render={({ field }) => (
                                <FormItem><FormLabel>Descrição 1</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                         <div className="space-y-4 p-4 border rounded-lg">
                           <FormField control={form.control} name="pilar2Icon" render={({ field }) => (
                                <FormItem><FormLabel>Ícone 2</FormLabel><FormControl><Input placeholder="bolt" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="pilar2Title" render={({ field }) => (
                                <FormItem><FormLabel>Título 2</FormLabel><FormControl><Input placeholder="Tecnologia que Simplifica" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="pilar2Description" render={({ field }) => (
                                <FormItem><FormLabel>Descrição 2</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                         <div className="space-y-4 p-4 border rounded-lg">
                           <FormField control={form.control} name="pilar3Icon" render={({ field }) => (
                                <FormItem><FormLabel>Ícone 3</FormLabel><FormControl><Input placeholder="favorite" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="pilar3Title" render={({ field }) => (
                                <FormItem><FormLabel>Título 3</FormLabel><FormControl><Input placeholder="Feito para Pessoas" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="pilar3Description" render={({ field }) => (
                                <FormItem><FormLabel>Descrição 3</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </div>
                </div>
            </section>

             <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">groups</span>
                        Seção "Quem Faz Acontecer"
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 gap-6">
                    <FormField control={form.control} name="timeTitle" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl><Input placeholder="Quem faz acontecer" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="timeSubtitle" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subtítulo</FormLabel>
                            <FormControl><Textarea placeholder="Descrição da equipe" rows={2} {...field} value={field.value ?? ''}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel>Membros da Equipe</FormLabel>
                        <Button type="button" size="sm" onClick={() => appendMember({ name: '', title: '', description: '', imageUrl: '' })}>+ Adicionar Membro</Button>
                      </div>
                      {timeMembers.map((member, index) => (
                        <div key={member.id} className="p-4 border rounded-lg bg-gray-50/50 space-y-3 relative">
                          <FormField name={`timeMembers.${index}.imageUrl`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Foto do Membro</FormLabel>
                                    <FormControl>
                                        <label htmlFor={`member-image-upload-${index}`} className="flex items-center gap-4 cursor-pointer">
                                            <div className="relative w-24 h-24 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-primary transition-colors group">
                                                {field.value ? <Image src={field.value} alt={form.getValues(`timeMembers.${index}.name`) || 'Foto do Membro'} layout="fill" className="object-cover"/> : <span className="material-symbols-outlined text-gray-400">add_a_photo</span>}
                                            </div>
                                            <div className="flex flex-col gap-2 flex-1">
                                                {uploads[`timeMembers.${index}.imageUrl`]?.isUploading ? (
                                                    <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">Enviando...</p>
                                                    <Progress value={uploads[`timeMembers.${index}.imageUrl`].progress} className="h-2"/>
                                                    </div>
                                                ) : (
                                                    <>
                                                    <p className="text-xs text-muted-foreground">Clique para carregar uma nova imagem.</p>
                                                    <Button type="button" size="sm" variant="outline" className="w-fit pointer-events-none">
                                                        <span className="material-symbols-outlined text-sm mr-2">upload</span>
                                                        Carregar Imagem
                                                    </Button>
                                                    </>
                                                )}
                                                {uploads[`timeMembers.${index}.imageUrl`]?.error && <p className="text-xs text-red-500">{uploads[`timeMembers.${index}.imageUrl`].error}</p>}
                                            </div>
                                            <Input id={`member-image-upload-${index}`} accept="image/*" className="sr-only" type="file" onChange={(e) => e.target.files && handleFileChange(index, e.target.files[0])} />
                                        </label>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                          <FormField name={`timeMembers.${index}.name`} control={form.control} render={({ field }) => (
                              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do membro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <FormField name={`timeMembers.${index}.title`} control={form.control} render={({ field }) => (
                              <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input placeholder="Cargo do membro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <FormField name={`timeMembers.${index}.description`} control={form.control} render={({ field }) => (
                              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Breve descrição" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeMember(index)}>
                              <span className="material-symbols-outlined">delete</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                </div>
            </section>

             <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <span className="material-symbols-outlined text-primary-hover">campaign</span>
                        Chamada para Ação (CTA) Final
                    </h2>
                </div>
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="ctaTitle" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Título</FormLabel><FormControl><Input placeholder="Encontre seu lugar no mundo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="ctaSubtitle" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Subtítulo</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </section>
        </form>
        </FormProvider>
    </div>
  );
}
