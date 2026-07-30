
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, forwardRef, useRef, useImperativeHandle } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
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
import { Loader2, Trash2, Plus, X, Star, GripVertical } from "lucide-react";
import locationData from '@/lib/location-data.json';
import { savePropertyServer } from '../actions.server';

// A simple rich text editor component
const MiniRichEditor = forwardRef<
  HTMLDivElement,
  { value?: string; onChange: (value: string) => void; onBlur: () => void; }
>(({ value, onChange, onBlur }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => editorRef.current!);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring text-left">
      <div className="p-1 border-b border-input flex items-center gap-1">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="p-2 rounded hover:bg-accent text-sm font-bold w-8 h-8"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCmd('italic')}
          className="p-2 rounded hover:bg-accent text-sm font-bold italic w-8 h-8"
        >
          I
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={onBlur}
        className="prose prose-sm dark:prose-invert max-w-none min-h-[120px] w-full rounded-md p-3 text-sm ring-offset-background focus-visible:outline-none"
      />
    </div>
  );
});
MiniRichEditor.displayName = 'MiniRichEditor';


const propertyFormSchema = z.object({
  builderId: z.string().optional(),
  brokerId: z.string().optional(),
  clientId: z.string().optional(),
  personaIds: z.array(z.string()).optional().default([]),
  link: z.string().optional(),
  informacoesbasicas: z.object({
    nome: z.string().min(1, "O nome do imóvel é obrigatório."),
    status: z.string().default('Em Construção'),
    slug: z.string().optional(),
    slogan: z.string().optional(),
    descricao: z.string().optional(),
    valor: z.coerce.number().optional(),
    salePrice: z.coerce.number().optional(),
    rentPrice: z.coerce.number().optional(),
    transactionTypes: z.array(z.string()).default(['sale']),
    previsaoentrega: z.string().optional(),
    condominio: z.coerce.number().optional(),
    iptu: z.coerce.number().optional(),
    nomeCondominio: z.string().optional(),
    exclusivo: z.boolean().default(false),
  }),
  caracteristicasimovel: z.object({
    tipo: z.string().default('Apartamento'),
    quartos: z.array(z.string()).optional(),
    suites: z.array(z.string()).optional(),
    tamanho: z.string().optional(),
    vagas: z.string().optional(),
  }),
  localizacao: z.object({
    cep: z.string().optional(),
    address: z.string().optional(),
    estado: z.string().min(1, "O estado é obrigatório"),
    cidade: z.string().min(1, "A cidade é obrigatória"),
    bairro: z.string().min(1, "O bairro é obrigatório"),
    googleMapsLink: z.string().optional(),
    googleStreetViewLink: z.string().optional(),
    exibirLocalizacao: z.boolean().default(true),
  }),
  midia: z.array(z.string()).optional().default([]),
  youtubeVideoUrl: z.string().optional(),
  areascomuns: z.array(z.string()).default([]),
  caracteristicas: z.array(z.string()).default([]),
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
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
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
const suiteOptions = ["1", "2", "3", "4+"];

const commonAreasOptions = [
  "Piscina",
  "Academia",
  "Salão de Festas",
  "Churrasqueira",
  "Playground",
  "Brinquedoteca",
  "Quadra Poliesportiva",
  "Portaria 24h",
  "Bicicletário",
  "SPA",
  "Pet Place",
  "Espaço Gourmet",
  "Cinema",
  "Coworking"
];

const propertyCharacteristicsOptions = [
  "Varanda",
  "Sacada",
  "Suíte",
  "Closet",
  "Lavabo",
  "Dependência de Empregada",
  "Escritório",
  "Sala de Estar",
  "Sala de Jantar",
  "Cozinha Americana",
  "Cozinha Planejada",
  "Área de Serviço",
  "Despensa",
  "Armário na Cozinha",
  "Armário no Banheiro",
  "Armário Embutido",
  "Móvel Planejado",
  "Box Blindex",
  "Ar Condicionado",
  "Aquecimento a Gás",
  "Aquecimento Solar",
  "Piso Porcelanato",
  "Piso Vinílico",
  "Piso Laminado",
  "Janela Grande",
  "Ventilação Natural",
  "Vista Livre",
  "Vista Mar",
  "Nascente",
  "Poente",
  "Ambientes Integrados",
  "Pé Direito Duplo",
  "Aceita Animais",
  "Mobiliado",
  "Semi Mobiliado",
  "Reformado",
  "Novo",
  "Depósito Privativo",
  "Fechadura Digital",
  "Automação Residencial"
];

type UploadState = {
  id: string;
  file: File;
  progress: number;
  error?: string;
};


export default function PropertyForm({ propertyData, onSave, isEditing, isSubmitting: parentSubmitting }: PropertyFormProps) {
    const { firestore, user, storage } = useFirebase();
    const pathname = usePathname();
    const isAvulso = pathname.includes('/avulso/');
    const cancelUrl = pathname.includes('/avulso/') ? '/dashboard/avulso' : '/dashboard/imoveis';

    const clientsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null, [firestore, user]);
    const { data: clients, isLoading: areClientsLoading } = useCollection<Client>(clientsQuery);
    
    const personasQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null, [firestore]);
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const constructorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'constructors')) : null, [firestore]);
    const { data: constructors, isLoading: areConstructorsLoading } = useCollection<Constructor>(constructorsQuery);

    const { toast } = useToast();
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [localSubmitting, setLocalSubmitting] = useState(false);
    
    const [imageUploads, setImageUploads] = useState<UploadState[]>([]);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditing);

    const states = locationData.states;
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    let defaultValues: PropertyFormData = {
        builderId: '',
        brokerId: user?.uid || '',
        clientId: '',
        personaIds: [],
        link: '',
        informacoesbasicas: { nome: '', status: 'Em Construção', valor: 0, salePrice: 0, rentPrice: 0, transactionTypes: ['sale'], slug: '', slogan: '', descricao: '', previsaoentrega: '', condominio: 0, iptu: 0, nomeCondominio: '', exclusivo: false },
        caracteristicasimovel: { tipo: 'Apartamento', quartos: [], suites: [], tamanho: '', vagas: '' },
        localizacao: { cep: '', estado: '', cidade: '', bairro: '', address: '', googleMapsLink: '', googleStreetViewLink: '', exibirLocalizacao: true },
        midia: [],
        youtubeVideoUrl: '',
        areascomuns: [],
        caracteristicas: [],
        proximidades: [],
        statusobra: { fundacao: 0, estrutura: 0, alvenaria: 0, acabamentos: 0 },
        seoTitle: '',
        seoKeywords: '',
        seoDescription: '',
        isVisibleOnSite: true,
    };

    const form = useForm<PropertyFormData>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: {
            ...defaultValues,
            ...propertyData,
            informacoesbasicas: { ...defaultValues.informacoesbasicas, ...propertyData?.informacoesbasicas },
            caracteristicasimovel: { ...defaultValues.caracteristicasimovel, ...propertyData?.caracteristicasimovel },
            localizacao: {
                ...defaultValues.localizacao,
                ...propertyData?.localizacao,
                exibirLocalizacao: propertyData?.localizacao?.exibirLocalizacao ?? (propertyData as any)?.exibirLocalizacao ?? true
            },
            statusobra: { ...defaultValues.statusobra, ...propertyData?.statusobra },
        }
    });

    const watchState = form.watch('localizacao.estado');
    const watchCity = form.watch('localizacao.cidade');
    const watchTransactionTypes = form.watch('informacoesbasicas.transactionTypes') || [];

    const handleInternalSave = async (data: PropertyFormData) => {
        if (!user) return;
        setLocalSubmitting(true);
        const colName = isAvulso ? 'brokerProperties' : 'properties';
        
        try {
            const res = await savePropertyServer(colName, (propertyData as any)?.id || null, data, user.uid);
            if (res.success) {
                toast({ title: isEditing ? 'Imóvel atualizado!' : 'Imóvel criado!', description: 'Cache de sitemap e portal revalidados.' });
                onSave(data);
            } else {
                toast({ variant: 'destructive', title: 'Erro ao salvar', description: res.message });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro de conexão' });
        } finally {
            setLocalSubmitting(false);
        }
    };

    const availableCities = useMemo(() => {
        if (!watchState) return [];
        const stateData = states.find(s => s.uf === watchState || s.name === watchState);
        return stateData?.cities || [];
    }, [watchState, states]);

    const availableNeighborhoods = useMemo(() => {
        if (!watchCity) return [];
        const cityData = availableCities.find(c => c.name === watchCity);
        return cityData?.neighborhoods || [];
    }, [watchCity, availableCities]);

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsLoadingCep(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
            const data = await response.json();
            form.setValue('localizacao.estado', data.state, { shouldValidate: true });
            form.setValue('localizacao.address', data.street || '', { shouldValidate: true });
            setTimeout(() => {
                form.setValue('localizacao.cidade', data.city, { shouldValidate: true });
                form.setValue('localizacao.bairro', data.neighborhood || '', { shouldValidate: true });
            }, 500);
        } catch (error) {
            toast({ variant: "destructive", title: "CEP não localizado" });
        } finally {
            setIsLoadingCep(false);
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
        uploadFile(storage, path, upload.file, (progress) => {
            setImageUploads(prev => prev.map(u => (u.id === upload.id ? { ...u, progress } : u)));
        })
            .then(downloadURL => {
            form.setValue('midia', [...(form.getValues('midia') || []), downloadURL], { shouldDirty: true });
            setTimeout(() => setImageUploads(prev => prev.filter(u => u.id !== upload.id)), 1000);
            })
            .catch(() => toast({ variant: "destructive", title: "Erro no Upload" }));
        });
    };

    const removeImage = (urlToRemove: string) => {
        const currentMidia = form.getValues('midia') || [];
        form.setValue('midia', currentMidia.filter(url => url !== urlToRemove), { shouldDirty: true });
    };

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const currentMidia = [...(form.getValues('midia') || [])];
        const itemToMove = currentMidia[draggedIndex];

        currentMidia.splice(draggedIndex, 1);
        currentMidia.splice(targetIndex, 0, itemToMove);

        form.setValue('midia', currentMidia, { shouldDirty: true });
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const setAsPrincipal = (indexToMakePrincipal: number) => {
        if (indexToMakePrincipal === 0) return;
        const currentMidia = [...(form.getValues('midia') || [])];
        const itemToMove = currentMidia[indexToMakePrincipal];

        currentMidia.splice(indexToMakePrincipal, 1);
        currentMidia.unshift(itemToMove);

        form.setValue('midia', currentMidia, { shouldDirty: true });
    };

    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleInternalSave)} className="space-y-6 text-left">
            <nav className="flex mb-6 text-sm font-medium text-text-secondary">
                <Link className="hover:text-text-main" href="/dashboard">Home</Link>
                <span className="mx-2">/</span>
                <Link className="hover:text-text-main" href={cancelUrl}>Imóveis</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main">{isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div className="text-left">
                    <h1 className="text-3xl font-black tracking-tight text-text-main mb-2">{isEditing ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</h1>
                    <p className="text-text-secondary max-w-2xl">O sitemap e o portal serão atualizados automaticamente após salvar.</p>
                </div>
                <div className="flex gap-3">
                    <Button type="submit" disabled={localSubmitting || parentSubmitting} className="px-5 py-2.5 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 border-none cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                         {localSubmitting ? 'Salvando...' : 'Salvar Imóvel'}
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
                                            <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary text-text-main h-11 px-3" disabled={areClientsLoading}>
                                                <option key="client-none" value="">{areClientsLoading ? 'Carregando clientes...' : 'Selecione um cliente...'}</option>
                                                {clients?.map((c) => <option key={`client-${c.id}`} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="lg:col-span-12">
                                <FormField
                                    control={form.control}
                                    name="builderId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Construtora Associada</FormLabel>
                                        <FormControl>
                                            <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary text-text-main h-11 px-3" disabled={areConstructorsLoading}>
                                                <option key="constructor-none" value="">{areConstructorsLoading ? 'Carregando...' : 'Selecione uma construtora...'}</option>
                                                {constructors?.map((c) => <option key={`builder-${c.id}`} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <div className="lg:col-span-12">
                                <FormField
                                    control={form.control}
                                    name="link"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link (URL do Imóvel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: https://www.exemplo.com/imovel" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormDescription className="text-xs text-text-secondary">Insira o link opcional para o site oficial ou apresentação do imóvel.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </>
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
                                  <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 px-3">
                                      <option value="Lançamento">Lançamento</option>
                                      <option value="Em Construção">Em Construção</option>
                                      <option value="Pronto para Morar">Pronto para Morar</option>
                                  </select>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                    <div className="lg:col-span-3">
                       <FormField control={form.control} name="informacoesbasicas.valor" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Preço de Referência</FormLabel>
                              <FormControl><Input type="number" {...field} value={field.value ?? 0} /></FormControl>
                              <FormMessage />
                          </FormItem>
                       )} />
                    </div>
                    
                    <div className="lg:col-span-12">
                      <FormField
                          control={form.control}
                          name="informacoesbasicas.transactionTypes"
                          render={() => (
                              <FormItem>
                                  <div className="mb-4">
                                      <FormLabel className="text-base font-bold">Tipo de Transação</FormLabel>
                                      <FormDescription>Selecione como este imóvel pode ser comercializado.</FormDescription>
                                  </div>
                                  <div className="flex flex-wrap gap-4">
                                      {['sale', 'rent'].map((item) => (
                                          <FormField
                                              key={item}
                                              control={form.control}
                                              name="informacoesbasicas.transactionTypes"
                                              render={({ field }) => {
                                                  return (
                                                      <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                                                          <FormControl>
                                                              <Checkbox
                                                                  checked={field.value?.includes(item)}
                                                                  onCheckedChange={(checked) => {
                                                                      return checked
                                                                          ? field.onChange([...field.value, item])
                                                                          : field.onChange(field.value?.filter((value) => value !== item))
                                                                  }}
                                                              />
                                                          </FormControl>
                                                          <FormLabel className="font-normal capitalize">
                                                              {item === 'sale' ? 'Venda' : 'Aluguel'}
                                                          </FormLabel>
                                                      </FormItem>
                                                  )
                                              }}
                                          />
                                      ))}
                                  </div>
                              </FormItem>
                          )}
                      />
                    </div>

                    {watchTransactionTypes.includes('sale') && (
                        <div className="lg:col-span-3">
                            <FormField control={form.control} name="informacoesbasicas.salePrice" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço de Venda (R$)</FormLabel>
                                    <FormControl><Input type="number" {...field} value={field.value ?? 0} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    )}
                    {watchTransactionTypes.includes('rent') && (
                        <div className="lg:col-span-3">
                            <FormField control={form.control} name="informacoesbasicas.rentPrice" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço de Aluguel (R$)</FormLabel>
                                    <FormControl><Input type="number" {...field} value={field.value ?? 0} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    )}

                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="informacoesbasicas.condominio" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condomínio (R$)</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? 0} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="informacoesbasicas.iptu" render={({ field }) => (
                            <FormItem>
                                <FormLabel>IPTU (Anual - R$)</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? 0} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="informacoesbasicas.nomeCondominio" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Condomínio</FormLabel>
                                <FormControl><Input placeholder="Ex: Splendor" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3 flex items-end">
                        <FormField control={form.control} name="informacoesbasicas.exclusivo" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0 h-11 border border-card-border rounded-lg bg-[#f7f8f5] px-3 w-full">
                                <FormLabel className="text-sm font-medium text-text-main cursor-pointer">Imóvel Exclusivo</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">location_on</span>
                        Localização
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="localizacao.cep" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input placeholder="00000-000" {...field} value={field.value || ''} onBlur={handleCepBlur} />
                                        {isLoadingCep && <Loader2 className="absolute right-3 top-3 animate-spin h-4 w-4 text-slate-400" />}
                                    </div>
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="localizacao.estado" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                    <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 px-3">
                                        <option value="">Selecione...</option>
                                        {states.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="localizacao.cidade" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                    <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 px-3" disabled={!watchState}>
                                        <option value="">Selecione...</option>
                                        {availableCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="localizacao.bairro" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                    <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 px-3" disabled={!watchCity}>
                                        <option value="">Selecione...</option>
                                        {availableNeighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                                        {field.value && !availableNeighborhoods.includes(field.value) && (
                                            <option key={field.value} value={field.value}>{field.value}</option>
                                        )}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-12">
                        <FormField control={form.control} name="localizacao.address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endereço Completo</FormLabel>
                                <FormControl><Input placeholder="Rua, número, complemento" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-12 flex items-center justify-between p-4 bg-[#f7f8f5] rounded-lg border border-card-border">
                        <div className="space-y-0.5">
                            <FormLabel className="text-sm font-bold text-text-main">Exibir localização no site</FormLabel>
                            <FormDescription className="text-xs text-text-secondary">
                                Quando desativado, oculta o mapa e o Street View na página pública do imóvel.
                            </FormDescription>
                        </div>
                        <FormField
                            control={form.control}
                            name="localizacao.exibirLocalizacao"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value !== false}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">home_work</span>
                        Características & Detalhes
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4">
                        <FormField control={form.control} name="caracteristicasimovel.tipo" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Imóvel</FormLabel>
                                <FormControl>
                                    <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 px-3">
                                        <option value="Apartamento">Apartamento</option>
                                        <option value="Apart Hotel">Apart Hotel</option>
                                        <option value="Bangalô">Bangalô</option>
                                        <option value="Casa">Casa</option>
                                        <option value="Casa de Campo">Casa de Campo</option>
                                        <option value="Casa de Praia">Casa de Praia</option>
                                        <option value="Casa de Vila">Casa de Vila</option>
                                        <option value="Casa Geminada">Casa Geminada</option>
                                        <option value="Chácara">Chácara</option>
                                        <option value="Cobertura">Cobertura</option>
                                        <option value="Cobertura Duplex">Cobertura Duplex</option>
                                        <option value="Cobertura Triplex">Cobertura Triplex</option>
                                        <option value="Comercial">Comercial</option>
                                        <option value="Duplex">Duplex</option>
                                        <option value="Flat">Flat</option>
                                        <option value="Kitnet">Kitnet</option>
                                        <option value="Loft">Loft</option>
                                        <option value="Lote">Lote</option>
                                        <option value="Lote em Condomínio">Lote em Condomínio</option>
                                        <option value="Sítio">Sítio</option>
                                        <option value="Sobrado">Sobrado</option>
                                        <option value="Studio">Studio</option>
                                        <option value="Terreno">Terreno</option>
                                        <option value="Terreno Residencial">Terreno Residencial</option>
                                        <option value="Triplex">Triplex</option>
                                    </select>
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-4">
                        <FormField control={form.control} name="caracteristicasimovel.tamanho" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Área Útil (m²)</FormLabel>
                                <FormControl><Input placeholder="Ex: 85" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-4">
                        <FormField control={form.control} name="caracteristicasimovel.vagas" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vagas de Garagem</FormLabel>
                                <FormControl><Input placeholder="Ex: 2" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <div className="lg:col-span-6">
                        <FormField
                            control={form.control}
                            name="caracteristicasimovel.quartos"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Dormitórios</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {bedroomOptions.map((opt) => (
                                            <FormField
                                                key={`bed-${opt}`}
                                                control={form.control}
                                                name="caracteristicasimovel.quartos"
                                                render={({ field }) => (
                                                    <FormItem key={`bed-${opt}`} className="flex items-center space-x-2">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(opt)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = field.value || [];
                                                                    return checked ? field.onChange([...current, opt]) : field.onChange(current.filter(v => v !== opt))
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-normal cursor-pointer">{opt}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="lg:col-span-6">
                        <FormField
                            control={form.control}
                            name="caracteristicasimovel.suites"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Suítes</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {suiteOptions.map((opt) => (
                                            <FormField
                                                key={`suite-${opt}`}
                                                control={form.control}
                                                name="caracteristicasimovel.suites"
                                                render={({ field }) => (
                                                    <FormItem key={`suite-${opt}`} className="flex items-center space-x-2">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(opt)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = field.value || [];
                                                                    return checked ? field.onChange([...current, opt]) : field.onChange(current.filter(v => v !== opt))
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-normal cursor-pointer">{opt}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <FormField
                            control={form.control}
                            name="caracteristicas"
                            render={({ field }) => {
                                const valueArray = field.value || [];
                                return (
                                    <FormItem>
                                        <div className="mb-2">
                                            <FormLabel className="text-base font-bold">Características do Imóvel</FormLabel>
                                            <FormDescription>Selecione as características internas do imóvel ou adicione uma personalizada.</FormDescription>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                                            {propertyCharacteristicsOptions.map((opt) => (
                                                <div key={`char-${opt}`} className="flex flex-row items-center space-x-2 space-y-0">
                                                    <Checkbox
                                                        id={`char-${opt}`}
                                                        checked={valueArray.includes(opt)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                field.onChange([...valueArray, opt]);
                                                            } else {
                                                                field.onChange(valueArray.filter((v: string) => v !== opt));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`char-${opt}`} className="text-sm font-normal cursor-pointer select-none">
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                            {valueArray.filter((v: string) => !propertyCharacteristicsOptions.includes(v)).map((opt: string) => (
                                                <div key={`char-${opt}`} className="flex flex-row items-center space-x-2 space-y-0 bg-primary/10 px-2 py-1 rounded">
                                                    <Checkbox
                                                        id={`char-${opt}`}
                                                        checked={true}
                                                        onCheckedChange={(checked) => {
                                                            if (!checked) {
                                                                field.onChange(valueArray.filter((v: string) => v !== opt));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`char-${opt}`} className="text-sm font-bold cursor-pointer select-none text-primary-dark">
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 max-w-md">
                                            <Input
                                                id="custom-char-input"
                                                placeholder="Adicionar característica personalizada..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const target = e.currentTarget;
                                                        const val = target.value.trim();
                                                        if (val && !valueArray.includes(val)) {
                                                            field.onChange([...valueArray, val]);
                                                            target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    const input = document.getElementById('custom-char-input') as HTMLInputElement;
                                                    const val = input?.value.trim();
                                                    if (val && !valueArray.includes(val)) {
                                                        field.onChange([...valueArray, val]);
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                    </FormItem>
                                );
                            }}
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <FormField
                            control={form.control}
                            name="areascomuns"
                            render={({ field }) => {
                                const valueArray = field.value || [];
                                return (
                                    <FormItem>
                                        <div className="mb-2">
                                            <FormLabel className="text-base font-bold">Áreas Comuns / Lazer</FormLabel>
                                            <FormDescription>Selecione as comodidades disponíveis no condomínio ou adicione uma personalizada.</FormDescription>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                                            {commonAreasOptions.map((opt) => (
                                                <div key={`area-${opt}`} className="flex flex-row items-center space-x-2 space-y-0">
                                                    <Checkbox
                                                        id={`area-${opt}`}
                                                        checked={valueArray.includes(opt)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                field.onChange([...valueArray, opt]);
                                                            } else {
                                                                field.onChange(valueArray.filter((v: string) => v !== opt));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`area-${opt}`} className="text-sm font-normal cursor-pointer select-none">
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                            {valueArray.filter((v: string) => !commonAreasOptions.includes(v)).map((opt: string) => (
                                                <div key={`area-${opt}`} className="flex flex-row items-center space-x-2 space-y-0 bg-primary/10 px-2 py-1 rounded">
                                                    <Checkbox
                                                        id={`area-${opt}`}
                                                        checked={true}
                                                        onCheckedChange={(checked) => {
                                                            if (!checked) {
                                                                field.onChange(valueArray.filter((v: string) => v !== opt));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`area-${opt}`} className="text-sm font-bold cursor-pointer select-none text-primary-dark">
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 max-w-md">
                                            <Input
                                                id="custom-area-input"
                                                placeholder="Adicionar área comum personalizada... Ex: Quadra de Tênis"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const target = e.currentTarget;
                                                        const val = target.value.trim();
                                                        if (val && !valueArray.includes(val)) {
                                                            field.onChange([...valueArray, val]);
                                                            target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    const input = document.getElementById('custom-area-input') as HTMLInputElement;
                                                    const val = input?.value.trim();
                                                    if (val && !valueArray.includes(val)) {
                                                        field.onChange([...valueArray, val]);
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                    </FormItem>
                                );
                            }}
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <FormField control={form.control} name="informacoesbasicas.descricao" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição do Imóvel</FormLabel>
                                <FormControl>
                                    <MiniRichEditor 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                        onBlur={field.onBlur} 
                                    />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">imagesmode</span>
                        Galeria de Fotos
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        {form.watch('midia')?.map((url, index) => (
                            <div
                                key={`${url}-${index}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "relative aspect-square group rounded-lg overflow-hidden border transition-all cursor-grab active:cursor-grabbing",
                                    draggedIndex === index ? "opacity-30 border-2 border-dashed border-primary scale-95" : "border-card-border hover:border-primary/50"
                                )}
                            >
                                <Image src={url} alt={`Foto ${index + 1}`} fill className="object-cover select-none pointer-events-none" />
                                
                                <div className="absolute top-1 right-1 flex gap-1 z-10">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                                        className="bg-white/90 hover:bg-red-500 hover:text-white p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                        title="Remover foto"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>

                                <div className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <GripVertical className="size-3.5" />
                                </div>

                                {index === 0 ? (
                                    <span className="absolute bottom-0 left-0 right-0 bg-primary text-black text-[10px] font-extrabold py-1 text-center flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider">
                                        <Star className="size-3 fill-black text-black" />
                                        PRINCIPAL
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setAsPrincipal(index); }}
                                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/80 hover:bg-primary hover:text-black text-white text-[10px] font-bold px-2 py-1 rounded transition-all opacity-0 group-hover:opacity-100 shadow-md flex items-center gap-1 whitespace-nowrap z-10"
                                    >
                                        <Star className="size-3" />
                                        Definir Principal
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {imageUploads.map(upload => (
                            <div key={upload.id} className="relative aspect-square flex flex-col items-center justify-center border border-dashed border-card-border rounded-lg bg-gray-50">
                                <Loader2 className="size-6 animate-spin text-primary mb-2" />
                                <span className="text-[10px] font-bold">{Math.round(upload.progress)}%</span>
                            </div>
                        ))}

                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-card-border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <Plus className="size-8 text-text-secondary" />
                            <span className="text-xs font-medium text-text-secondary mt-2">Adicionar Fotos</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUploads} />
                        </label>
                    </div>
                    <p className="text-xs text-text-secondary">Arraste os cards para reordenar as fotos. Clique em &quot;Definir Principal&quot; em qualquer foto para torná-la a foto de capa (posição 0).</p>
                    
                    <div className="border-t border-card-border pt-6 mt-6">
                        <FormField control={form.control} name="youtubeVideoUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Link de Vídeo do YouTube</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: https://www.youtube.com/watch?v=..." {...field} value={field.value || ''} />
                                </FormControl>
                                <FormDescription>Insira o link completo de um vídeo institucional ou tour virtual do imóvel no YouTube.</FormDescription>
                            </FormItem>
                        )} />
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">search</span>
                        Configurações de SEO & Sitemap
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="seoTitle" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Meta Title</FormLabel>
                              <FormControl><Input placeholder="Título para o Google" {...field} value={field.value || ''} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="seoKeywords" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Palavras-chave</FormLabel>
                              <FormControl><Input placeholder="imóveis, luxo, bairro" {...field} value={field.value || ''} /></FormControl>
                          </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="seoDescription" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl><Textarea rows={3} {...field} value={field.value || ''} /></FormControl>
                      </FormItem>
                    )} />
                </div>
            </section>

            <div className="flex justify-end gap-3 mt-6 pb-20">
                <Button type="button" variant="outline" asChild><Link href={cancelUrl}>Cancelar</Link></Button>
                <Button type="submit" disabled={localSubmitting || parentSubmitting} className="font-bold">
                    {localSubmitting ? 'Salvando...' : 'Salvar Imóvel'}
                </Button>
            </div>
        </form>
      </FormProvider>
    );
}
