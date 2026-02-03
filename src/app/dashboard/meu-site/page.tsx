
'use client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";


const globalSettingsSchema = z.object({
  logoUrl: z.string().url("URL da imagem inválida").or(z.literal('')),
  footerSlogan: z.string().optional(),
  footerContactEmail: z.string().email("E-mail inválido").or(z.literal('')),
  footerContactPhone: z.string().optional(),
  footerContactAddress: z.string().optional(),
  creci: z.string().optional(),
  whatsappUrl: z.string().url("URL do WhatsApp inválida").or(z.literal('')),
  instagramUrl: z.string().url("URL do Instagram inválida").or(z.literal('')),
  linkedinUrl: z.string().url("URL do LinkedIn inválida").or(z.literal('')),
});

type GlobalSettingsFormData = z.infer<typeof globalSettingsSchema>;

type BrokerData = {
    logoUrl?: string;
    footerSlogan?: string;
    footerContactEmail?: string;
    footerContactPhone?: string;
    footerContactAddress?: string;
    creci?: string;
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
  const [logoUploadState, setLogoUploadState] = useState<UploadState>({ progress: 0, isUploading: false, error: null });

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const form = useForm<GlobalSettingsFormData>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      logoUrl: '',
      footerSlogan: '',
      footerContactEmail: '',
      footerContactPhone: '',
      footerContactAddress: '',
      creci: '',
      whatsappUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
    },
  });

  useEffect(() => {
    if (brokerData) {
      form.reset(brokerData);
    }
  }, [brokerData, form]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setLogoUploadState({ progress: 0, isUploading: true, error: null });

    const path = `brokers/${user.uid}/logos`;
    const fileId = uuidv4();
    const storageRef = ref(storage, `${path}/${fileId}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setLogoUploadState(prev => ({ ...prev, progress, isUploading: true }));
      },
      (error) => {
        console.error('Upload error:', error);
        setLogoUploadState({ progress: 0, isUploading: false, error: 'Falha no upload.' });
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar o logo." });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        form.setValue('logoUrl', downloadURL, { shouldDirty: true });
        setLogoUploadState({ progress: 100, isUploading: false, error: null });
        toast({ title: 'Upload Concluído!', description: 'Sua logo foi enviada. Salve as alterações para publicar.' });
      }
    );
  };

  const onSubmit = (data: GlobalSettingsFormData) => {
    if (!brokerDocRef || !user) return;
    setDocumentNonBlocking(brokerDocRef, { ...data, userId: user.uid }, { merge: true });
    toast({
      title: "Configurações Salvas!",
      description: "As configurações globais do seu site foram atualizadas.",
    });
  };


  const pages = [
    { name: "Conteúdo da Home", description: "Edite os textos e seções da página inicial.", href: "/dashboard/meu-site/inicio", icon: "home" },
    { name: "Gerenciar Imagens", description: "Altere as imagens de fundo e de seções do seu site.", href: "/dashboard/meu-site/imagens", icon: "image" },
    { name: "Esquema de Cores", description: "Personalize as cores do seu site.", href: "/dashboard/meu-site/cores", icon: "palette" },
    { name: "Página de Serviços", description: "Detalhe os serviços que você oferece.", href: "/dashboard/meu-site/servicos", icon: "concierge" },
    { name: "Página Sobre", description: "Conte sua história e seus diferenciais.", href: "/dashboard/meu-site/sobre", icon: "badge" },
    { name: "Página de Contato", description: "Atualize suas informações de contato.", href: "#", icon: "mail" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <nav className="flex mb-6 text-sm font-medium text-text-secondary">
        <Link className="hover:text-text-main" href="/dashboard">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-text-main">Meu Site</span>
      </nav>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main mb-2">Gerenciar Site</h1>
          <p className="text-text-secondary max-w-2xl">Edite as configurações globais e o conteúdo das páginas do seu site.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/loja">
            <span className="material-symbols-outlined text-[18px] mr-2">store</span>
            Mudar Layout na Loja
          </Link>
        </Button>
      </div>

       <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 border-b pb-4">Configurações Globais</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload da Marca</FormLabel>
                       <FormControl>
                          <label htmlFor="logo-upload" className="flex items-center gap-4 cursor-pointer">
                              <div className="relative size-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-colors group cursor-pointer">
                                  {field.value ? <Image src={field.value} alt="Logo Preview" fill className="absolute inset-0 w-full h-full object-contain p-2"/> : <span className="material-symbols-outlined text-gray-400">photo_library</span>}
                              </div>
                              <div className="flex flex-col gap-2 flex-1">
                                  {logoUploadState.isUploading ? (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Enviando...</p>
                                        <Progress value={logoUploadState.progress} className="h-2"/>
                                    </div>
                                  ) : (
                                      <>
                                      <p className="text-xs text-muted-foreground">Arraste uma imagem ou clique para carregar. (PNG, JPG, SVG)</p>
                                      <Button type="button" size="sm" variant="outline" className="w-fit">
                                          <span className="material-symbols-outlined text-sm mr-2">upload</span>
                                          Carregar Logo
                                      </Button>
                                      </>
                                  )}
                                  {logoUploadState.error && <p className="text-xs text-red-500">{logoUploadState.error}</p>}
                              </div>
                              <Input id="logo-upload" accept="image/*" className="sr-only" type="file" onChange={handleLogoUpload} />
                          </label>
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                    <FormField control={form.control} name="footerSlogan" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slogan do Rodapé</FormLabel>
                            <FormControl><Input placeholder="Excelência em imóveis de luxo." {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium mb-2 block">Contatos do Rodapé</h4>
                        <div className="space-y-2">
                           <FormField control={form.control} name="footerContactEmail" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="E-mail: contato@corretorpremium.com" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                           <FormField control={form.control} name="footerContactPhone" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="Telefone: +55 (11) 99999-9999" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                           <FormField control={form.control} name="footerContactAddress" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="Endereço: Av. Paulista, 1000" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                           <FormField control={form.control} name="creci" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="CRECI 12345-J" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-medium mb-2 block">Redes Sociais</h4>
                        <div className="space-y-2">
                           <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="URL do Instagram" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                           <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="URL do LinkedIn" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                           <FormField control={form.control} name="whatsappUrl" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="URL do WhatsApp" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                           )}/>
                        </div>
                    </div>
                </div>
            </div>
             <div className="flex justify-end mt-6">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar Configurações"}
                </Button>
            </div>
          </Card>
        </form>
      </FormProvider>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Páginas Editáveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
            <Card key={page.name} className="p-0 overflow-hidden hover:border-primary/50 transition-colors group">
                <Link href={page.href} className="flex flex-col h-full">
                <div className="p-6">
                    <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-3xl">{page.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-main">{page.name}</h3>
                        <p className="text-sm text-text-secondary line-clamp-2">{page.description}</p>
                    </div>
                    </div>
                </div>
                <div className="mt-auto px-6 py-3 bg-muted/50 border-t flex items-center justify-end text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">
                    Editar Página
                    <span className="material-symbols-outlined text-[18px] ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
                </Link>
            </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
