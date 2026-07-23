
'use client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helpers to clean and format social links
const cleanSocial = (url: string | undefined, domain: string) => {
    if (!url) return '';
    return url.replace(new RegExp(`^https?:\\/\\/(www\\.)?${domain}\\/`, 'i'), '').replace(/\/$/, '');
};

const formatSocial = (handle: string | undefined, domain: string) => {
    if (!handle) return '';
    if (handle.startsWith('http')) return handle; 
    return `https://${domain}/${handle.replace(/^@/, '')}`;
};

const cleanWhatsApp = (url: string | undefined) => {
    if (!url) return '';
    return url.replace(/^https?:\/\/wa\.me\//i, '').replace(/\D/g, '');
};

const formatWhatsApp = (number: string | undefined) => {
    if (!number) return '';
    if (number.startsWith('http')) return number;
    const digits = number.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
};

const brazilianUFs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const globalSettingsSchema = z.object({
  logoUrl: z.string().optional().or(z.literal('')),
  footerLogoUrl: z.string().optional().or(z.literal('')),
  faviconUrl: z.string().optional().or(z.literal('')),
  siteTitle: z.string().optional(),
  footerSlogan: z.string().optional(),
  footerContactEmail: z.string().email("E-mail inválido").or(z.literal('')),
  footerContactPhone: z.string().optional(),
  footerContactAddress: z.string().optional(),
  creci: z.string().optional(),
  creciState: z.string().optional(),
  whatsappUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

type GlobalSettingsFormData = z.infer<typeof globalSettingsSchema>;

type BrokerData = {
    logoUrl?: string;
    footerLogoUrl?: string;
    faviconUrl?: string;
    siteTitle?: string;
    footerSlogan?: string;
    footerContactEmail?: string;
    footerContactPhone?: string;
    footerContactAddress?: string;
    creci?: string;
    creciState?: string;
    whatsappUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
}

type UploadState = {
  progress: number;
  isUploading: boolean;
  error: string | null;
};

const pageEditors = [
    { title: 'Página Inicial', description: 'Edite o banner, textos e destaques da home.', href: '/dashboard/meu-site/inicio', icon: 'home' },
    { title: 'Sobre Mim', description: 'Atualize sua biografia, fotos e trajetória.', href: '/dashboard/meu-site/sobre', icon: 'person' },
    { title: 'Serviços', description: 'Detalhe os diferenciais do seu atendimento.', href: '/dashboard/meu-site/servicos', icon: 'concierge' },
    { title: 'Cores do Site', description: 'Personalize a paleta de cores da interface.', href: '/dashboard/meu-site/cores', icon: 'palette' },
    { title: 'Imagens do Layout', description: 'Gerencie as fotos de fundo e banners.', href: '/dashboard/meu-site/imagens', icon: 'image' },
    { title: 'Negócio Imobiliário', description: 'Defina as modalidades de venda e aluguel.', href: '/dashboard/meu-site/negocio', icon: 'business_center' },
];

export default function EditUrbanPadraoPage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  
  const [uploads, setUploads] = useState<Record<string, UploadState>>({
    logoUrl: { progress: 0, isUploading: false, error: null },
    footerLogoUrl: { progress: 0, isUploading: false, error: null },
    faviconUrl: { progress: 0, isUploading: false, error: null },
  });

  const brokerDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user?.uid]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const form = useForm<GlobalSettingsFormData>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      logoUrl: '',
      footerLogoUrl: '',
      faviconUrl: '',
      siteTitle: '',
      footerSlogan: '',
      footerContactEmail: '',
      footerContactPhone: '',
      footerContactAddress: '',
      creci: '',
      creciState: '',
      whatsappUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
    },
  });

  useEffect(() => {
    if (brokerData) {
      form.reset({
          ...brokerData,
          instagramUrl: cleanSocial(brokerData.instagramUrl, 'instagram.com'),
          linkedinUrl: cleanSocial(brokerData.linkedinUrl, 'linkedin.com/in'),
          whatsappUrl: cleanWhatsApp(brokerData.whatsappUrl),
      });
    }
  }, [brokerData, form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'footerLogoUrl' | 'faviconUrl') => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploads(prev => ({ 
      ...prev, 
      [fieldName]: { progress: 0, isUploading: true, error: null } 
    }));

    const path = `brokers/${user.uid}/site-assets`;
    const fileId = uuidv4();
    const sRef = ref(storage, `${path}/${fileId}-${file.name}`);
    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploads(prev => ({ 
          ...prev, 
          [fieldName]: { ...prev[fieldName], progress, isUploading: true } 
        }));
      },
      (error) => {
        console.error('Upload error:', error);
        setUploads(prev => ({ 
          ...prev, 
          [fieldName]: { progress: 0, isUploading: false, error: 'Falha no upload.' } 
        }));
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar o arquivo." });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        form.setValue(fieldName, downloadURL, { shouldDirty: true });
        setUploads(prev => ({ 
          ...prev, 
          [fieldName]: { progress: 100, isUploading: false, error: null } 
        }));
        toast({ title: 'Upload Concluído!', description: 'O arquivo foi enviado com sucesso.' });
      }
    );
  };

  const onSubmit = (data: GlobalSettingsFormData) => {
    if (!brokerDocRef || !user) return;

    const formattedData = {
        ...data,
        instagramUrl: formatSocial(data.instagramUrl, 'instagram.com'),
        linkedinUrl: formatSocial(data.linkedinUrl, 'linkedin.com/in'),
        whatsappUrl: formatWhatsApp(data.whatsappUrl),
    };

    const sanitizedData = JSON.parse(JSON.stringify(formattedData));

    setDocumentNonBlocking(brokerDocRef, { ...sanitizedData, userId: user.uid }, { merge: true });
    toast({
      title: "Configurações Salvas!",
      description: "As configurações globais do seu site foram atualizadas.",
    });
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-4">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      <p className="font-medium">Carregando configurações do site...</p>
    </div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciar Site</h1>
              <p className="text-slate-500 mt-1">Gerencie a identidade visual, o conteúdo das páginas e as informações de contato.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="h-11 px-6 rounded-xl border-slate-200 font-bold">
                 <Link href={`/sites/${brokerData?.slug || user?.uid}`} target="_blank">
                    <span className="material-symbols-outlined mr-2">visibility</span>
                    Ver Site Público
                 </Link>
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="bg-primary hover:bg-primary-hover text-slate-900 px-8 h-11 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 border-none"
              >
                <span className="material-symbols-outlined">save</span>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>

          {/* Page Editors Navigation */}
          <section className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Conteúdo e Design das Páginas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {pageEditors.map((page) => (
                    <Link 
                        key={page.href} 
                        href={page.href}
                        className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-soft hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-start gap-4"
                    >
                        <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary-hover transition-colors">
                            <span className="material-symbols-outlined text-xl">{page.icon}</span>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-900 group-hover:text-primary-hover transition-colors">{page.title}</h3>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">{page.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              
              <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 text-left">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-hover">
                    <span className="material-symbols-outlined font-bold">palette</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Identidade da Marca</h2>
                </div>
                
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="siteTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Título da Página (SEO)</FormLabel>
                        <FormControl>
                          <Input className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 h-12 focus:ring-primary focus:border-primary font-bold text-slate-900" placeholder="Ex: João Silva | Imóveis de Luxo em João Pessoa" {...field} />
                        </FormControl>
                        <FormDescription className="text-[10px] text-slate-400 pl-1 font-medium">Este título aparecerá na aba do navegador e nos resultados de busca.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Topo */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Logo Principal (Topo)</label>
                      <label htmlFor="logo-top-upload" className="relative group cursor-pointer">
                        <div className="mt-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
                            {form.watch('logoUrl') ? (
                              <Image src={form.watch('logoUrl')!} alt="Logo Topo" fill className="object-contain p-2" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-3xl pointer-events-none">cloud_upload</span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter text-center pointer-events-none">Fazer upload da logo</p>
                          
                          {uploads.logoUrl.isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-6 rounded-2xl">
                              <Progress value={uploads.logoUrl.progress} className="h-2 w-full" />
                            </div>
                          )}
                        </div>
                        <input id="logo-top-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                      </label>
                    </div>

                    {/* Favicon */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Favicon (Ícone da Aba)</label>
                      <label htmlFor="favicon-upload" className="relative group cursor-pointer">
                        <div className="mt-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="w-16 h-16 rounded-lg bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
                            {form.watch('faviconUrl') ? (
                              <Image src={form.watch('faviconUrl')!} alt="Favicon" fill className="object-contain p-3" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-3xl pointer-events-none">favicon</span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter text-center pointer-events-none">Fazer upload do ícone</p>
                          
                          {uploads.faviconUrl.isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-6 rounded-2xl">
                              <Progress value={uploads.faviconUrl.progress} className="h-2 w-full" />
                            </div>
                          )}
                        </div>
                        <input id="favicon-upload" type="file" className="sr-only" accept="image/x-icon,image/png,image/svg+xml" onChange={(e) => handleFileUpload(e, 'faviconUrl')} />
                      </label>
                    </div>

                    {/* Logo Rodapé */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Logo do Rodapé (Opcional)</label>
                      <label htmlFor="logo-footer-upload" className="relative group cursor-pointer">
                        <div className="mt-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
                            {form.watch('footerLogoUrl') ? (
                              <Image src={form.watch('footerLogoUrl')!} alt="Logo Rodapé" fill className="object-contain p-2" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-3xl pointer-events-none">cloud_upload</span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter text-center pointer-events-none">Fazer upload da logo do rodapé</p>

                          {uploads.footerLogoUrl.isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-6 rounded-2xl">
                              <Progress value={uploads.footerLogoUrl.progress} className="h-2 w-full" />
                            </div>
                          )}
                        </div>
                        <input id="logo-footer-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'footerLogoUrl')} />
                      </label>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="footerSlogan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Slogan do Rodapé</FormLabel>
                        <FormControl>
                          <Input className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 h-12 focus:ring-primary focus:border-primary font-medium" placeholder="Ex: Realizando sonhos, construindo o seu futuro." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 text-left">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                   <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-hover">
                    <span className="material-symbols-outlined font-bold">contact_page</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Informações de Contato</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="footerContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Comercial</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                            <Input className="w-full pl-12 bg-slate-50 border-slate-100 rounded-xl h-12 focus:ring-primary focus:border-primary font-bold text-slate-900" placeholder="contato@exemplo.com.br" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">phone</span>
                            <Input className="w-full pl-12 bg-slate-50 border-slate-100 rounded-xl h-12 focus:ring-primary focus:border-primary font-bold text-slate-900" placeholder="(11) 99999-9999" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerContactAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Endereço Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
                            <Input className="w-full pl-12 bg-slate-50 border-slate-100 rounded-xl h-12 focus:ring-primary focus:border-primary font-bold text-slate-900" placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="creciState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Estado (UF)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 h-12 focus:ring-primary focus:border-primary font-bold text-slate-900">
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brazilianUFs.map((uf) => (
                                <SelectItem key={uf} value={uf}>
                                  {uf}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creci"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CRECI (Registro)</FormLabel>
                          <FormControl>
                            <Input className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 h-12 focus:ring-primary focus:border-primary font-bold text-slate-900" placeholder="123456-J" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 text-left">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-hover">
                    <span className="material-symbols-outlined font-bold">share</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Redes Sociais</h2>
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instagram (Usuário)</FormLabel>
                        <FormControl>
                          <div className="flex h-11">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-black">ig/</span>
                            <Input className="rounded-l-none rounded-r-xl border-slate-100 bg-slate-50 focus:ring-primary focus:border-primary h-full px-4 font-bold text-slate-900" placeholder="seuusuario" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LinkedIn (Usuário)</FormLabel>
                        <FormControl>
                          <div className="flex h-11">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-black">in/</span>
                            <Input className="rounded-l-none rounded-r-xl border-slate-100 bg-slate-50 focus:ring-primary focus:border-primary h-full px-4 font-bold text-slate-900" placeholder="usuario" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp (Número)</FormLabel>
                        <FormControl>
                          <div className="flex h-11">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-black">wa/</span>
                            <Input className="rounded-l-none rounded-r-xl border-slate-100 bg-slate-50 focus:ring-primary focus:border-primary h-full px-4 font-bold text-slate-900" placeholder="5511999999999" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
                <div className="absolute top-0 right-0 size-32 bg-primary/10 blur-[60px] opacity-20 pointer-events-none"></div>
                <div className="relative z-10 text-left">
                  <h3 className="text-xl font-black mb-3 flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined">lightbulb</span>
                      Dica Profissional
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">As logos e ícones personalizados elevam a percepção de valor da sua marca. Certifique-se de usar imagens de alta qualidade e com fundo transparente (PNG).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => form.reset()} className="px-6 h-11 rounded-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer">
                Descartar Alterações
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary-hover text-slate-900 px-10 h-11 rounded-xl font-black transition-all shadow-lg shadow-primary/20 border-none cursor-pointer">
                Salvar Configurações
              </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
