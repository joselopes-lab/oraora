
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

export default function EditUrbanPadraoPage() {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  
  const [uploads, setUploads] = useState<Record<string, UploadState>>({
    logoUrl: { progress: 0, isUploading: false, error: null },
    footerLogoUrl: { progress: 0, isUploading: false, error: null },
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'footerLogoUrl') => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploads(prev => ({ 
      ...prev, 
      [fieldName]: { progress: 0, isUploading: true, error: null } 
    }));

    const path = `brokers/${user.uid}/logos`;
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
        toast({ variant: "destructive", title: "Erro no Upload", description: `Não foi possível enviar o logo (${fieldName === 'logoUrl' ? 'Topo' : 'Rodapé'}).` });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        form.setValue(fieldName, downloadURL, { shouldDirty: true });
        setUploads(prev => ({ 
          ...prev, 
          [fieldName]: { progress: 100, isUploading: false, error: null } 
        }));
        toast({ title: 'Upload Concluído!', description: 'A logo foi enviada com sucesso.' });
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

    setDocumentNonBlocking(brokerDocRef, { ...formattedData, userId: user.uid }, { merge: true });
    toast({
      title: "Configurações Salvas!",
      description: "As configurações globais do seu site foram atualizadas.",
    });
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-4">
      <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      Carregando configurações do site...
    </div>;
  }

  const editablePages = [
    { name: "Home", description: "Página principal e vitrine.", href: "/dashboard/meu-site/inicio", icon: "home" },
    { name: "Busca", description: "Listagem e filtros de imóveis.", href: "/dashboard/imoveis", icon: "search" },
    { name: "Serviços", description: "O que sua agência oferece.", href: "/dashboard/meu-site/servicos", icon: "business_center" },
    { name: "Sobre", description: "História e equipe.", href: "/dashboard/meu-site/sobre", icon: "groups" },
    { name: "Contato", description: "Formulários e endereços.", href: "/dashboard/admin/site/contato", icon: "call" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gerenciar Site</h1>
              <p className="text-slate-500 mt-1">Gerencie a identidade visual e informações de contato da sua imobiliária.</p>
            </div>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              className="bg-primary hover:bg-primary-hover text-slate-900 px-6 h-11 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">save</span>
              {form.formState.isSubmitting ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Brand & Contact */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Section 1: Brand & Identity */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary font-bold">palette</span>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Brand & Identity</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Logo Topo */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Logo do Corretor (Topo)</label>
                      <label htmlFor="logo-top-upload" className="relative group cursor-pointer">
                        <div className="mt-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
                            {form.watch('logoUrl') ? (
                              <Image src={form.watch('logoUrl')!} alt="Logo Topo" fill className="object-contain p-2" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-3xl pointer-events-none">cloud_upload</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 text-center pointer-events-none">Clique para fazer upload ou arraste o arquivo</p>
                          <p className="text-xs text-slate-400 mt-1 pointer-events-none">PNG, JPG ou SVG (Máx. 2MB)</p>
                          
                          {uploads.logoUrl.isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-6 rounded-2xl">
                              <Progress value={uploads.logoUrl.progress} className="h-2 w-full" />
                            </div>
                          )}
                        </div>
                        <input id="logo-top-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                      </label>
                    </div>

                    {/* Logo Rodapé */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Logo do Corretor (Rodapé)</label>
                      <label htmlFor="logo-footer-upload" className="relative group cursor-pointer">
                        <div className="mt-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
                            {form.watch('footerLogoUrl') ? (
                              <Image src={form.watch('footerLogoUrl')!} alt="Logo Rodapé" fill className="object-contain p-2" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-3xl pointer-events-none">cloud_upload</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 text-center pointer-events-none">Clique para fazer upload ou arraste o arquivo</p>
                          <p className="text-xs text-slate-400 mt-1 pointer-events-none">PNG, JPG ou SVG (Máx. 2MB)</p>

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
                        <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Slogan do Rodapé</FormLabel>
                        <FormControl>
                          <Input className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-6 focus:ring-primary focus:border-primary" placeholder="Ex: Realizando sonhos, construindo o seu futuro." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Section 2: Contact Information */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary font-bold">contact_page</span>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Informações de Contato</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="footerContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">E-mail Comercial</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                            <Input className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-6 focus:ring-primary focus:border-primary" placeholder="contato@nextestate.com.br" {...field} />
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
                        <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">phone</span>
                            <Input className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-6 focus:ring-primary focus:border-primary" placeholder="(11) 99999-9999" {...field} />
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
                        <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Endereço Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
                            <Input className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-6 focus:ring-primary focus:border-primary" placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" {...field} />
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
                          <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Estado (UF)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary h-auto">
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
                          <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">CRECI (Registro)</FormLabel>
                          <FormControl>
                            <Input className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary h-auto" placeholder="123456-J" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Column 2: Social & Others */}
            <div className="space-y-8">
              
              {/* Section 3: Social Media */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary font-bold">share</span>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Redes Sociais</h2>
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Instagram</FormLabel>
                        <FormControl>
                          <div className="flex h-11">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-xs font-semibold">instagram.com/</span>
                            <Input className="rounded-l-none rounded-r-xl border-slate-200 bg-slate-50 focus:ring-primary focus:border-primary h-full px-4" placeholder="seuusuario" {...field} />
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
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">LinkedIn</FormLabel>
                        <FormControl>
                          <div className="flex h-11">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-xs font-semibold">linkedin.com/in/</span>
                            <Input className="rounded-l-none rounded-r-xl border-slate-200 bg-slate-50 focus:ring-primary focus:border-primary h-full px-4" placeholder="usuario" {...field} />
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
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp (Apenas Número)</FormLabel>
                        <FormControl>
                          <div className="flex h-11">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-xs font-semibold">wa.me/</span>
                            <Input className="rounded-l-none rounded-r-xl border-slate-200 bg-slate-50 focus:ring-primary focus:border-primary h-full px-4" placeholder="5511999999999" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Help Card */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-black mb-2">Dica Pro</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Mantenha suas informações de contato sempre atualizadas para não perder leads qualificados vindos do seu portal.</p>
                  <Link href="/ajuda" className="mt-4 text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                    Ver Central de Ajuda
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">lightbulb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Páginas Editáveis */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary font-bold">auto_stories</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Páginas Editáveis</h2>
              </div>
              <Link href="#" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Ver todas as páginas</Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {editablePages.map((page) => (
                <Link 
                  key={page.name} 
                  href={page.href}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-slate-700 font-bold group-hover:text-slate-900">{page.icon}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{page.name}</h3>
                  <p className="text-[10px] text-slate-500 mb-4 line-clamp-1">{page.description}</p>
                  <div className="mt-auto pt-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                      Editar Página
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Final Action Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-end">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => form.reset()} className="px-6 h-11 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                Descartar Alterações
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary-hover text-slate-900 px-8 h-11 rounded-xl font-black transition-all shadow-lg shadow-primary/20">
                Salvar Tudo
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
