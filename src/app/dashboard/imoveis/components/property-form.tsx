'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import locationData from '@/lib/location-data.json';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, useFirebase } from "@/firebase";
import { collection, query, where, serverTimestamp } from "firebase/firestore";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { generateSeoForProperty } from "@/ai/seo-generator";
import type { GenerateSeoInput } from "@/ai/genkit";
import ClientForm, { ClientFormData } from '../../clientes/components/client-form';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/lib/storage';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Zod Schema based on the new JSON structure
const propertyFormSchema = z.object({
  builderId: z.string().optional(), // Kept for associating property with constructors
  brokerId: z.string().optional(), // For one-off broker properties
  clientId: z.string().optional(), // New field for associating with a client
  personaIds: z.array(z.string()).optional().default([]),
  informacoesbasicas: z.object({
    nome: z.string().min(1, "O nome do imóvel é obrigatório."),
    status: z.string().default('Em Construção'),
    slug: z.string().optional(),
    slogan: z.string().optional(),
    descricao: z.string().optional(),
    valor: z.coerce.number().optional(),
    previsaoentrega: z.string().optional(),
  }),
  caracteristicasimovel: z.object({
    tipo: z.string().default('Apartamento'),
    quartos: z.array(z.string()).optional(),
    tamanho: z.string().optional(), // Now a string like "23m² a 48m²"
    vagas: z.string().optional(),
  }),
  localizacao: z.object({
    address: z.string().optional(),
    estado: z.string().min(1, "O estado é obrigatório"),
    cidade: z.string().min(1, "A cidade é obrigatória"),
    bairro: z.string().min(1, "O bairro é obrigatório"),
    googleMapsLink: z.string().optional(),
    googleStreetViewLink: z.string().optional(),
  }),
  midia: z.array(z.string()).optional().default([]),
  youtubeVideoUrl: z.string().optional(),
  areascomuns: z.array(z.string()).default([]),
  proximidades: z.array(z.string()).default([]),
  statusobra: z.object({
    fundacao: z.number().min(0).max(100).default(0),
    estrutura: z.number().min(0).max(100).default(0),
    alvenaria: z.number().min(0).max(100).default(0),
    acabamentos: z.number().min(0).max(100).default(0),
  }).default({ fundacao: 0, estrutura: 0, alvenaria: 0, acabamentos: 0 }),
  seoTitle: z.string().optional(),
  seoKeywords: z.string().optional(),
  seoDescription: z.string().optional(),
  isVisibleOnSite: z.boolean().default(true),
});

const generateSlug = (name: string) => {
    return name
        .toString()
        .toLowerCase()
        .normalize('NFD') // separate accent from letter
        .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/[^a-z0-9-]/g, '') // remove all chars not letters, numbers and -
        .replace(/-+/g, '-') // replace multiple - with single -
        .replace(/^-+/, '') // trim - from start of text
        .replace(/-+$/, ''); // trim - from end of text
}


export type PropertyFormData = z.infer<typeof propertyFormSchema>;

type Client = {
    id: string;
    name: string;
};

type Persona = {
    id: string;
    name: string;
    icon: string;
    iconBackgroundColor: string;
}

type Constructor = {
    id: string;
    name: string;
};

type PropertyFormProps = {
    propertyData?: Partial<PropertyFormData>;
    onSave: (data: PropertyFormData) => void;
    isEditing: boolean;
    isSubmitting?: boolean;
};

const bedroomOptions = ["1", "2", "3", "4", "5+"];

type UploadState = {
  id: string;
  file: File;
  progress: number;
  error?: string;
};


export default function PropertyForm({ propertyData, onSave, isEditing, isSubmitting }: PropertyFormProps) {
    const { firestore, user, storage } = useFirebase();
    const pathname = usePathname();
    const isAvulso = pathname.includes('/avulso/');
    const cancelUrl = pathname.includes('/avulso/') ? '/dashboard/avulso' : '/dashboard/imoveis';

    const clientsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null, [firestore, user]);
    const { data: clients, isLoading: areClientsLoading } = useCollection<Client>(clientsQuery);
    
    const personasQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null, [firestore]);
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const constructorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'constructors') : null, [firestore]);
    const { data: constructors, isLoading: areConstructorsLoading } = useCollection<Constructor>(constructorsQuery);

    const { toast } = useToast();
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    const [imageUploads, setImageUploads] = useState<UploadState[]>([]);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditing);


    let defaultValues: PropertyFormData = {
        builderId: '',
        brokerId: user?.uid || '',
        clientId: '',
        personaIds: [],
        informacoesbasicas: { nome: '', status: 'Em Construção', valor: 0, slug: '', slogan: '', descricao: '', previsaoentrega: '' },
        caracteristicasimovel: { tipo: 'Apartamento', quartos: [], tamanho: '', vagas: '' },
        localizacao: { estado: '', cidade: '', bairro: '', address: '', googleMapsLink: '', googleStreetViewLink: '' },
        midia: [],
        youtubeVideoUrl: '',
        areascomuns: [],
        proximidades: [],
        statusobra: { fundacao: 0, estrutura: 0, alvenaria: 0, acabamentos: 0 },
        seoTitle: '',
        seoKeywords: '',
        seoDescription: '',
        isVisibleOnSite: true,
    };

    if (isAvulso && !isEditing) {
        defaultValues.statusobra = { fundacao: 100, estrutura: 100, alvenaria: 100, acabamentos: 100 };
        defaultValues.informacoesbasicas.status = 'Pronto para Morar';
    }

    const form = useForm<PropertyFormData>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: {
            ...defaultValues,
            ...propertyData,
            informacoesbasicas: {
                ...defaultValues.informacoesbasicas,
                ...propertyData?.informacoesbasicas,
            },
            caracteristicasimovel: {
                ...defaultValues.caracteristicasimovel,
                ...propertyData?.caracteristicasimovel,
            },
            localizacao: {
                ...defaultValues.localizacao,
                ...propertyData?.localizacao,
            },
            statusobra: {
                 ...defaultValues.statusobra,
                ...propertyData?.statusobra,
            },
        }
    });

    const [states] = useState(locationData.states);
    const [cities, setCities] = useState<{ name: string; neighborhoods: string[] }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    
    const watchState = form.watch('localizacao.estado');
    const watchCity = form.watch('localizacao.cidade');
    const watchName = form.watch('informacoesbasicas.nome');

    // Populate cities when state changes
    useEffect(() => {
        if (watchState) {
            const stateData = states.find(s => s.name === watchState || s.uf === watchState);
            setCities(stateData?.cities || []);
        } else {
            setCities([]);
        }
    }, [watchState, states]);
    
    // Populate neighborhoods when city changes
    useEffect(() => {
        if (watchCity) {
            const cityData = cities.find(c => c.name === watchCity);
            setNeighborhoods(cityData?.neighborhoods || []);
        } else {
            setNeighborhoods([]);
        }
    }, [watchCity, cities]);

    const citiesWithOptions = useMemo(() => {
        const currentCity = form.getValues('localizacao.cidade');
        if (currentCity && !cities.some(c => c.name === currentCity)) {
            return [{ name: currentCity, neighborhoods: [] }, ...cities];
        }
        return cities;
    }, [cities, form.getValues('localizacao.cidade')]);

    const neighborhoodsWithOptions = useMemo(() => {
        const currentBairro = form.getValues('localizacao.bairro');
        if (currentBairro && !neighborhoods.includes(currentBairro)) {
            return [currentBairro, ...neighborhoods];
        }
        return neighborhoods;
    }, [neighborhoods, form.getValues('localizacao.bairro')]);

    // Handle initial form population for editing
    useEffect(() => {
      if (isEditing && propertyData) {
        // Deep merge to ensure all fields have a value
         const mergedData = {
            ...defaultValues,
            ...propertyData,
            informacoesbasicas: {
                ...defaultValues.informacoesbasicas,
                ...propertyData?.informacoesbasicas,
            },
            caracteristicasimovel: {
                ...defaultValues.caracteristicasimovel,
                ...propertyData?.caracteristicasimovel,
            },
            localizacao: {
                ...defaultValues.localizacao,
                ...propertyData?.localizacao,
            },
            statusobra: {
                 ...defaultValues.statusobra,
                ...propertyData?.statusobra,
            },
        };
        form.reset(mergedData);
        
        // Pre-populate cities and neighborhoods on initial load for edit
        if (propertyData.localizacao?.estado) {
            const stateData = states.find(s => s.name === propertyData.localizacao!.estado || s.uf === propertyData.localizacao!.estado);
            if (stateData) {
                setCities(stateData.cities);
                if (propertyData.localizacao.cidade) {
                    const cityData = stateData.cities.find(c => c.name === propertyData.localizacao!.cidade);
                    setNeighborhoods(cityData?.neighborhoods || []);
                }
            }
        }
      }
    }, [isEditing, propertyData, form, states]);
    

    const [newAmenity, setNewAmenity] = useState('');
    const [newNearby, setNewNearby] = useState('');
    const [newImageUrl, setNewImageUrl] = useState("");
    
    const handleAddAmenity = () => {
        if (newAmenity.trim()) {
            const currentAmenities = form.getValues('areascomuns');
            form.setValue('areascomuns', [...currentAmenities, newAmenity.trim()]);
            setNewAmenity('');
        }
    };
    const handleRemoveAmenity = (index: number) => {
        const currentAmenities = form.getValues('areascomuns');
        form.setValue('areascomuns', currentAmenities.filter((_, i) => i !== index));
    };

    const handleAddNearby = () => {
        if (newNearby.trim()) {
            const currentNearby = form.getValues('proximidades');
            form.setValue('proximidades', [...currentNearby, newNearby.trim()]);
            setNewNearby('');
        }
    };
    const handleRemoveNearby = (index: number) => {
        const currentNearby = form.getValues('proximidades');
        form.setValue('proximidades', currentNearby.filter((_, i) => i !== index));
    };

    const handleAddImage = () => {
        if (newImageUrl.trim()) {
           const currentImages = form.getValues('midia') || [];
           form.setValue('midia', [...currentImages, newImageUrl.trim()]);
           setNewImageUrl("");
        }
    };

    const handleRemoveImage = async (index: number) => {
        if (!storage) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Serviço de armazenamento não está disponível.',
            });
            return;
        }

        const currentImages = form.getValues('midia') || [];
        const imageUrl = currentImages[index];

        // Optimistically update the UI
        form.setValue('midia', currentImages.filter((_, i) => i !== index));

        // Check if it's a Firebase Storage URL before trying to delete
        if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                // Create a reference from the HTTPS URL
                const imageRef = storageRef(storage, imageUrl);
                
                // Delete the file
                await deleteObject(imageRef);

                toast({
                    title: 'Imagem Removida',
                    description: 'A imagem foi removida com sucesso do armazenamento.',
                });
            } catch (error) {
                console.error("Erro ao remover imagem do storage:", error);
                // Optional: Revert UI change if deletion fails. For now, just notify.
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Remover do Armazenamento',
                    description: 'A imagem foi removida da lista, mas falhou ao ser deletada do armazenamento.',
                });
            }
        }
    };
    
    const handleImageUploads = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || !user || !storage) return;

        const newUploads: UploadState[] = Array.from(files).map(file => ({
        id: uuidv4(),
        file,
        progress: 0,
        }));

        setImageUploads(prev => [...prev, ...newUploads]);

        newUploads.forEach(upload => {
        const path = `properties/${user.uid}`;
        const onProgress = (progress: number) => {
            setImageUploads(prev =>
            prev.map(u => (u.id === upload.id ? { ...u, progress } : u))
            );
        };

        uploadFile(storage, path, upload.file, onProgress)
            .then(downloadURL => {
            form.setValue('midia', [...(form.getValues('midia') || []), downloadURL], { shouldDirty: true });
            // Remove from upload list on success after a short delay
            setTimeout(() => {
                setImageUploads(prev => prev.filter(u => u.id !== upload.id));
            }, 1000);
            })
            .catch(error => {
            console.error('Upload error:', error);
            setImageUploads(prev =>
                prev.map(u =>
                u.id === upload.id ? { ...u, error: 'Falha no upload' } : u
                )
            );
            toast({
                variant: "destructive",
                title: "Erro no Upload",
                description: `Falha ao enviar ${upload.file.name}.`,
            });
            });
        });
    };



    const { areascomuns: watchedAmenities = [], proximidades: watchedNearby = [], midia: watchedMedia = [] } = form.watch();

    const handleGenerateSeo = async () => {
        setIsGeneratingSeo(true);
        toast({
            title: 'Gerando SEO com IA...',
            description: 'Aguarde um momento, estamos criando o conteúdo para você.',
        });

        try {
            const values = form.getValues();
            const input: GenerateSeoInput = {
                nome: values.informacoesbasicas.nome,
                descricao: values.informacoesbasicas.descricao,
                tipo: values.caracteristicasimovel.tipo,
                bairro: values.localizacao.bairro,
                cidade: values.localizacao.cidade,
                estado: values.localizacao.estado,
            };

            const result = await generateSeoForProperty(input);

            if (result) {
                form.setValue('seoTitle', result.seoTitle, { shouldValidate: true });
                form.setValue('seoDescription', result.seoDescription, { shouldValidate: true });
                form.setValue('seoKeywords', result.seoKeywords, { shouldValidate: true });
                toast({
                    title: 'SEO Gerado com Sucesso!',
                    description: 'Os campos de SEO foram preenchidos com as sugestões da IA.',
                });
            } else {
                throw new Error("A resposta da IA foi vazia.");
            }

        } catch (error) {
            console.error("Erro ao gerar SEO:", error);
            toast({
                variant: "destructive",
                title: 'Erro ao Gerar SEO',
                description: 'Não foi possível gerar o conteúdo de SEO. Tente novamente.',
            });
        } finally {
            setIsGeneratingSeo(false);
        }
    };

    const handleSaveNewClient = async (data: ClientFormData) => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado.' });
            return;
        }
        
        try {
            const leadsCollectionRef = collection(firestore, 'leads');
            const newData = {
                ...data,
                brokerId: user.uid,
                createdAt: serverTimestamp(),
                status: 'new',
                clientType: 'vendedor',
            };
            const docRef = await addDocumentNonBlocking(leadsCollectionRef, newData);
            
            if (docRef) {
                toast({
                    title: 'Cliente Criado!',
                    description: `O cliente "${data.name}" foi salvo e selecionado.`,
                });
                form.setValue('clientId', docRef.id, { shouldValidate: true });
                setIsClientModalOpen(false);
            }
    
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar o novo cliente.',
            });
        }
    };

    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <nav className="flex mb-6 text-sm font-medium text-text-secondary">
                <Link className="hover:text-text-main" href="/dashboard">Home</Link>
                <span className="mx-2">/</span>
                <Link className="hover:text-text-main" href={cancelUrl}>Imóveis</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main">{isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-main mb-2">{isEditing ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</h1>
                    <p className="text-text-secondary max-w-2xl">Preencha todos os detalhes abaixo para publicar o imóvel no sistema e website. Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
                </div>
                <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                         {isSubmitting ? 'Salvando...' : 'Salvar Imóvel'}
                    </Button>
                </div>
            </div>

            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">info</span>
                        Informações Básicas
                    </h3>
                    <FormField
                      control={form.control}
                      name="isVisibleOnSite"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-sm font-medium text-text-main">Visível no Site</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    {isAvulso ? (
                        <div className="lg:col-span-12">
                            <FormLabel>Cliente Associado (Proprietário)</FormLabel>
                            <div className="flex items-start gap-2">
                                <FormField
                                    control={form.control}
                                    name="clientId"
                                    render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary text-text-main h-11" disabled={areClientsLoading}>
                                                <option value="">{areClientsLoading ? 'Carregando clientes...' : 'Selecione um cliente...'}</option>
                                                {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" className="h-11">
                                            <span className="material-symbols-outlined text-[18px] mr-2">person_add</span>
                                            Novo Cliente
                                        </Button>
                                    </DialogTrigger>
                                     <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-y-auto">
                                        <VisuallyHidden>
                                            <DialogHeader>
                                                <DialogTitle>Cadastrar Novo Cliente (Vendedor)</DialogTitle>
                                                <DialogDescription>Este cliente será o proprietário do imóvel avulso.</DialogDescription>
                                            </DialogHeader>
                                        </VisuallyHidden>
                                      <div className="overflow-y-auto">
                                          <ClientForm 
                                              onSave={handleSaveNewClient} 
                                              isEditing={false} 
                                              clientData={{ clientType: 'vendedor' }}
                                              onCancel={() => setIsClientModalOpen(false)}
                                              title="Cadastrar Novo Cliente (Vendedor)"
                                              description="Este cliente será o proprietário do imóvel avulso."
                                          />
                                       </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-12">
                            <FormField
                                control={form.control}
                                name="builderId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Construtora Associada</FormLabel>
                                    <FormControl>
                                        <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary text-text-main h-11" disabled={areConstructorsLoading}>
                                            <option value="">{areConstructorsLoading ? 'Carregando construtoras...' : 'Selecione uma construtora...'}</option>
                                            {constructors?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}
                    <div className="lg:col-span-6">
                      <FormField control={form.control} name="informacoesbasicas.nome" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Imóvel <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Ex: Residencial Vista Verde" {...field} value={field.value || ''} onBlur={(e) => {
                                field.onBlur();
                                if (!isSlugManuallyEdited && e.target.value) {
                                    form.setValue('informacoesbasicas.slug', generateSlug(e.target.value));
                                }
                            }}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="lg:col-span-3">
                       <FormField control={form.control} name="informacoesbasicas.status" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Status</FormLabel>
                              <FormControl>
                                  <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 appearance-none px-3">
                                      <option>Lançamento</option>
                                      <option>Em Construção</option>
                                      <option>Pronto para Morar</option>
                                  </select>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                    <div className="lg:col-span-3">
                       <FormField control={form.control} name="informacoesbasicas.valor" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Valor do Imóvel</FormLabel>
                              <FormControl><Input type="number" placeholder="Ex: 347000" {...field} value={field.value ?? 0} /></FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                    <div className="lg:col-span-6">
                       <FormField control={form.control} name="informacoesbasicas.slug" render={({ field }) => (
                          <FormItem>
                              <FormLabel>URL Amigável (Slug)</FormLabel>
                              <FormControl>
                                <div className="flex rounded-lg shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-card-border bg-gray-50 text-text-secondary text-sm">
                                        site.com/imoveis/
                                    </span>
                                    <Input 
                                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border-card-border focus:ring-primary focus:border-primary sm:text-sm" 
                                      placeholder="residencial-vista-verde" 
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => {
                                        field.onChange(e);
                                        setIsSlugManuallyEdited(true);
                                      }}
                                    />
                                </div>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                     <div className="lg:col-span-3">
                       <FormField control={form.control} name="informacoesbasicas.slogan" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Slogan de Marketing</FormLabel>
                              <FormControl><Input placeholder="Onde a natureza encontra o conforto." {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                     <div className="lg:col-span-3">
                       <FormField control={form.control} name="informacoesbasicas.previsaoentrega" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Previsão de Entrega</FormLabel>
                              <FormControl><Input placeholder="Ex: Dez 28" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                     <div className="lg:col-span-12">
                       <FormField control={form.control} name="informacoesbasicas.descricao" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Descrição Completa</FormLabel>
                              <FormControl><Textarea placeholder="Descreva os detalhes do imóvel..." rows={4} {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                </div>
            </section>
            
            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">straighten</span>
                        Características
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <FormField control={form.control} name="caracteristicasimovel.tipo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11">
                              <option>Apartamento</option>
                              <option>Casa</option>
                              <option>Cobertura</option>
                              <option>Studio</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField
                        control={form.control}
                        name="caracteristicasimovel.quartos"
                        render={() => (
                            <FormItem>
                            <FormLabel>Quartos</FormLabel>
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                {bedroomOptions.map((item) => (
                                    <FormField
                                    key={item}
                                    control={form.control}
                                    name="caracteristicasimovel.quartos"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item}
                                            className="flex flex-row items-start space-x-2 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={Array.isArray(field.value) && field.value.includes(item)}
                                                onCheckedChange={(checked) => {
                                                    const currentValue = Array.isArray(field.value) ? field.value : [];
                                                    return checked
                                                    ? field.onChange([...currentValue, item])
                                                    : field.onChange(
                                                        currentValue.filter(
                                                            (value) => value !== item
                                                        )
                                                        );
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal text-sm">
                                                {item}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField control={form.control} name="caracteristicasimovel.tamanho" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área (m²)</FormLabel>
                        <FormControl><Input placeholder="Ex: 23m² a 48m²" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="caracteristicasimovel.vagas" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vagas Garagem</FormLabel>
                        <FormControl><Input placeholder="Ex: 1 ou 2" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
            </section>

             <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary">groups</span>
                            Público-Alvo (Personas)
                        </h3>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground">
                                        <span className="material-symbols-outlined text-base">help_outline</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        Esta seleção serve para categorizar o imóvel para o tipo de cliente, <br />
                                        permitindo que o sistema recomende os imóveis certos para as <br />
                                        personas corretas e vice-versa.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <div className="p-6">
                    <FormField
                        control={form.control}
                        name="personaIds"
                        render={() => (
                            <FormItem>
                                <FormLabel>Selecione as personas que se encaixam neste imóvel</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                    {arePersonasLoading ? <p>Carregando personas...</p> : personas?.map((persona) => (
                                        <FormField
                                            key={persona.id}
                                            control={form.control}
                                            name="personaIds"
                                            render={({ field }) => (
                                                <FormItem
                                                    key={persona.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 has-[:checked]:bg-primary/20 has-[:checked]:border-primary transition-all"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(persona.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), persona.id])
                                                                    : field.onChange(field.value?.filter(id => id !== persona.id))
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <div className={`size-8 rounded-full ${persona.iconBackgroundColor} flex items-center justify-center`}>
                                                        <span className="material-symbols-outlined text-sm">{persona.icon}</span>
                                                    </div>
                                                    <FormLabel className="font-semibold text-sm m-0">
                                                        {persona.name}
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </section>
            
             <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">location_on</span>
                        Localização
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control} name="localizacao.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Av. Exemplo, 123" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control} name="localizacao.estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <select {...field} onChange={(e) => { field.onChange(e); form.setValue('localizacao.cidade', ''); form.setValue('localizacao.bairro', ''); }} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11">
                            <option value="">Selecione um estado</option>
                            {states.map(state => <option key={state.uf} value={state.uf}>{state.name}</option>)}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} name="localizacao.cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <select {...field} onChange={(e) => { field.onChange(e); form.setValue('localizacao.bairro', ''); }} disabled={!watchState} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 disabled:bg-gray-200">
                            <option value="">Selecione uma cidade</option>
                            {citiesWithOptions.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} name="localizacao.bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <select {...field} disabled={!watchCity} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 disabled:bg-gray-200">
                             <option value="">Selecione um bairro</option>
                             {neighborhoodsWithOptions.map(neighborhood => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <FormField control={form.control} name="localizacao.googleMapsLink" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Embed Google Maps</FormLabel>
                            <FormControl><Textarea placeholder="Cole o código de incorporação do Google Maps aqui" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="localizacao.googleStreetViewLink" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Embed Street View</FormLabel>
                            <FormControl><Textarea placeholder="Cole o código de incorporação do Street View aqui" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
                </div>
            </section>
            
             <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">perm_media</span>
                        Mídia e Galeria
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <FormField control={form.control} name="youtubeVideoUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vídeo Promocional (YouTube/Vimeo)</FormLabel>
                        <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-text-main">Galeria de Imagens</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {watchedMedia.map((image, index) => (
                                <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border border-card-border bg-gray-100">
                                    <Image src={image} alt={`Property image ${index + 1}`} fill className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => handleRemoveImage(index)} type="button" className="text-white hover:text-red-400"><span className="material-symbols-outlined">delete</span></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="material-symbols-outlined text-gray-500 mb-2">cloud_upload</span>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para carregar</span> ou arraste e solte</p>
                                    <p className="text-xs text-gray-500">PNG, JPG, WEBP (Máx. 5MB por arquivo)</p>
                                </div>
                                <Input id="image-upload" type="file" className="hidden" multiple onChange={handleImageUploads} accept="image/png, image/jpeg, image/webp" />
                            </label>
                        </div>

                        {imageUploads.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <h4 className="text-xs font-bold uppercase text-gray-500">UPLOADS EM ANDAMENTO</h4>
                            {imageUploads.map(upload => (
                            <div key={upload.id}>
                                <div className="flex justify-between items-center text-xs mb-1">
                                <span className="truncate max-w-[200px]">{upload.file.name}</span>
                                <span className={cn(upload.error ? 'text-red-500' : 'text-gray-500')}>{Math.round(upload.progress)}%</span>
                                </div>
                                <Progress value={upload.progress} className="h-1.5" />
                                {upload.error && <p className="text-xs text-red-500 mt-1">{upload.error}</p>}
                            </div>
                            ))}
                        </div>
                        )}

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-4 text-xs text-gray-400">OU</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Adicione pela URL da imagem" />
                            <Button onClick={handleAddImage} type="button" size="sm">Adicionar URL</Button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden h-full">
                    <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary">engineering</span>
                            Status da Obra
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                         <Controller
                            name="statusobra.fundacao"
                            control={form.control}
                            render={({ field: { onChange, value } }) => (
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-sm font-medium text-text-main">Fundação</label>
                                        <span className="text-sm font-bold text-primary-hover">{value || 0}%</span>
                                    </div>
                                    <Slider defaultValue={[value || 0]} max={100} step={1} onValueChange={(vals) => onChange(vals[0])} />
                                </div>
                            )}
                        />
                         <Controller
                            name="statusobra.estrutura"
                            control={form.control}
                            render={({ field: { onChange, value } }) => (
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-sm font-medium text-text-main">Estrutura</label>
                                        <span className="text-sm font-bold text-primary-hover">{value || 0}%</span>
                                    </div>
                                    <Slider defaultValue={[value || 0]} max={100} step={1} onValueChange={(vals) => onChange(vals[0])} />
                                </div>
                            )}
                        />
                         <Controller
                            name="statusobra.alvenaria"
                            control={form.control}
                            render={({ field: { onChange, value } }) => (
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-sm font-medium text-text-main">Alvenaria</label>
                                        <span className="text-sm font-bold text-primary-hover">{value || 0}%</span>
                                    </div>
                                    <Slider defaultValue={[value || 0]} max={100} step={1} onValueChange={(vals) => onChange(vals[0])} />
                                </div>
                            )}
                        />
                         <Controller
                            name="statusobra.acabamentos"
                            control={form.control}
                            render={({ field: { onChange, value } }) => (
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-sm font-medium text-text-main">Acabamentos</label>
                                        <span className="text-sm font-bold text-primary-hover">{value || 0}%</span>
                                    </div>
                                    <Slider defaultValue={[value || 0]} max={100} step={1} onValueChange={(vals) => onChange(vals[0])} />
                                </div>
                            )}
                        />
                    </div>
                </section>
                <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary">pool</span>
                            Diferenciais
                        </h3>
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-text-main">Áreas Comuns</label>
                            <div className="flex gap-2">
                                <Input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Ex: Piscina" type="text"/>
                                <Button onClick={handleAddAmenity} type="button" size="icon"><span className="material-symbols-outlined text-sm">add</span></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {watchedAmenities.map((item, index) => (
                                     <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f2f5f0] text-text-main border border-card-border">
                                        {item}
                                        <button onClick={() => handleRemoveAmenity(index)} type="button" className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-card-border my-4"></div>
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-text-main">Proximidades</label>
                            <div className="flex gap-2">
                                <Input value={newNearby} onChange={(e) => setNewNearby(e.target.value)} placeholder="Ex: Metrô Santana" type="text"/>
                                <Button onClick={handleAddNearby} type="button" size="icon"><span className="material-symbols-outlined text-sm">add</span></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {watchedNearby.map((item, index) => (
                                    <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f2f5f0] text-text-main border border-card-border">
                                        {item}
                                        <button onClick={() => handleRemoveNearby(index)} type="button" className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            
             <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">search</span>
                        Configurações de SEO
                    </h3>
                    <Button type="button" onClick={handleGenerateSeo} disabled={isGeneratingSeo} size="sm" variant="outline" className="bg-white hover:bg-gray-100">
                        {isGeneratingSeo ? (
                            <>
                                <span className="material-symbols-outlined text-sm mr-2 animate-spin">progress_activity</span>
                                Gerando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm mr-2">auto_awesome</span>
                                Gerar com IA
                            </>
                        )}
                    </Button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="seoTitle" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Meta Title</FormLabel>
                              <FormControl><Input placeholder="Apartamento de Luxo em São Paulo | Construtora X" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="seoKeywords" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Palavras-chave (separadas por vírgula)</FormLabel>
                              <FormControl><Input placeholder="apartamento, luxo, são paulo, venda" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="seoDescription" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl><Textarea placeholder="Breve descrição para aparecer nos resultados de busca..." rows={3} {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                </div>
            </section>
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" asChild>
                    <Link href={cancelUrl}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {isSubmitting ? 'Salvando...' : 'Salvar Imóvel'}
                </Button>
            </div>
        </form>
      </FormProvider>
    );
}
