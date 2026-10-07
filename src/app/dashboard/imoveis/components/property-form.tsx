
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
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { generateSeoForProperty } from "@/ai/seo-generator";
import { generatePropertyDescription } from "@/ai/property-description-generator";
import { generatePropertySeo } from "@/ai/property-seo-generator";
import type { GenerateSeoInput } from "@/ai/genkit";
import ClientForm, { ClientFormData } from '../../clientes/components/client-form';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/lib/storage';
import { getAllProjectsServer } from '@/app/dashboard/construtoras/empreendimentos/actions.server';
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrencyDisplay, parseSmartCurrency, formatCepDisplay, normalizeCep } from "@/lib/utils";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Trash2, Plus, X, Star, GripVertical, AlertCircle } from "lucide-react";
import locationData from '@/lib/location-data.json';
import { savePropertyServer } from '../actions.server';
import PrivateNotesSection from '@/app/dashboard/avulso/components/private-notes-section';

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

function CurrencyInput({ value, onChange, placeholder }: { value: number | undefined; onChange: (val: number) => void; placeholder?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState(value !== undefined && value !== null ? String(value) : '');

  useEffect(() => {
    if (!isFocused) {
      setLocalText(value !== undefined && value !== null && value !== 0 ? String(value) : '');
    }
  }, [value, isFocused]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder || "R$ 0,00"}
      value={isFocused ? localText : (value !== undefined && value !== null && value !== 0 ? formatCurrencyDisplay(value) : '')}
      onFocus={() => {
        setIsFocused(true);
        setLocalText(value !== undefined && value !== null && value !== 0 ? String(value) : '');
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setLocalText(raw);
        const parsed = parseSmartCurrency(raw);
        onChange(parsed);
      }}
      onBlur={() => {
        setIsFocused(false);
        const parsed = parseSmartCurrency(localText);
        onChange(parsed);
      }}
    />
  );
}


const propertyFormSchema = z.object({
  builderId: z.string().optional(),
  brokerId: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(), // Added projectId
  personaIds: z.array(z.string()).optional().default([]),
  link: z.string().optional(),
  informacoesbasicas: z.object({
    tipo: z.string().optional(),
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
    tipo: z.string().optional(),
    quartos: z.array(z.string()).optional(),
    suites: z.array(z.string()).optional(),
    banheiros: z.string().optional(),
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
    isAvulso?: boolean;
    collectionName?: 'properties' | 'brokerProperties';
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
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
  order: number;
};


export default function PropertyForm({ propertyData, onSave, isEditing, isSubmitting: parentSubmitting, isAvulso: isAvulsoProp, collectionName }: PropertyFormProps) {
    const { firestore, user, storage } = useFirebase();
    const pathname = usePathname();
    const isAvulso = isAvulsoProp ?? pathname.includes('/avulso/');
    const cancelUrl = pathname.includes('/avulso/') ? '/dashboard/avulso' : '/dashboard/imoveis';

    const clientsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null, [firestore, user]);
    const { data: clients, isLoading: areClientsLoading } = useCollection<Client>(clientsQuery);
    
    const personasQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null, [firestore]);
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const constructorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'constructors')) : null, [firestore]);
    const { data: constructors, isLoading: areConstructorsLoading } = useCollection<Constructor>(constructorsQuery);

    const userDocRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userDocRef);

    const builderId = userProfile?.tenantId || userProfile?.id || user?.uid;
    const [projects, setProjects] = useState<any[]>([]);
    const [areProjectsLoading, setAreProjectsLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            if (isAvulso) {
                setProjects([]);
                setAreProjectsLoading(false);
                return;
            }
            try {
                const res = await getAllProjectsServer();
                const projectsList = res?.success ? res.projects : (Array.isArray(res) ? res : []);
                if (userProfile?.userType === 'admin') {
                    setProjects(projectsList || []);
                } else {
                    const bId = userProfile?.tenantId || userProfile?.id || user?.uid;
                    setProjects((projectsList || []).filter((p: any) => !bId || p.builderId === bId));
                }
            } catch (err) {
                console.error('Erro ao carregar projetos:', err);
                setProjects([]);
            } finally {
                setAreProjectsLoading(false);
            }
        }
        if (userProfile !== undefined) {
            loadProjects();
        }
    }, [userProfile, user, isAvulso]);

    const { toast } = useToast();
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [localSubmitting, setLocalSubmitting] = useState(false);
    
    const [imageUploads, setImageUploads] = useState<UploadState[]>([]);
    const hasPendingUploads = imageUploads.some(u => u.status === 'pending' || u.status === 'uploading' || u.status === 'error');
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
        caracteristicasimovel: { tipo: 'Apartamento', quartos: [], suites: [], banheiros: '', tamanho: '', vagas: '' },
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

    const { isDirty } = form.formState;
    const router = useRouter();
    const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
    const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);

    const handleInternalSave = async (data: PropertyFormData): Promise<boolean> => {
        if (!user) return false;
        if (imageUploads.some(u => u.status === 'pending' || u.status === 'uploading' || u.status === 'error')) {
            toast({ variant: 'destructive', title: 'Aguarde o término dos uploads', description: 'Existem imagens pendentes, em envio ou com erro.' });
            return false;
        }
        setLocalSubmitting(true);
        const colName = collectionName ?? (isAvulso ? 'brokerProperties' : 'properties');
        
        try {
            const res = await savePropertyServer(colName, (propertyData as any)?.id || null, data, user.uid);
            if (res.success) {
                toast({ title: isEditing ? 'Imóvel atualizado!' : 'Imóvel criado!', description: 'Cache de sitemap e portal revalidados.' });
                form.reset(data);
                onSave(data);
                return true;
            } else {
                toast({ variant: 'destructive', title: 'Erro ao salvar', description: res.message });
                return false;
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro de conexão' });
            return false;
        } finally {
            setLocalSubmitting(false);
        }
    };

    const saveAndNavigate = async (targetHref: string) => {
        let savedSuccessfully = false;
        await form.handleSubmit(async (data) => {
            const success = await handleInternalSave(data);
            if (success) {
                savedSuccessfully = true;
            }
        })();

        if (savedSuccessfully) {
            setIsExitDialogOpen(false);
            setPendingNavHref(null);
            router.push(targetHref);
        }
    };

    useEffect(() => {
        if (!isAvulso || !isDirty) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isAvulso, isDirty]);

    useEffect(() => {
        if (!isAvulso || !isDirty) return;

        const handleAnchorClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }

            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;

            const href = target.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || target.target === '_blank') {
                return;
            }

            const currentPath = window.location.pathname;
            if (href === currentPath) return;

            e.preventDefault();
            e.stopPropagation();

            setPendingNavHref(href);
            setIsExitDialogOpen(true);
        };

        document.addEventListener('click', handleAnchorClick, true);
        return () => {
            document.removeEventListener('click', handleAnchorClick, true);
        };
    }, [isAvulso, isDirty]);

    const watchState = form.watch('localizacao.estado');
    const watchCity = form.watch('localizacao.cidade');
    const watchTransactionTypes = form.watch('informacoesbasicas.transactionTypes') || [];

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

    const handleGenerateSeo = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Não autenticado',
                description: 'Você precisa estar logado para gerar o SEO com IA.',
            });
            return;
        }

        const values = form.getValues();
        const tipo = values.informacoesbasicas?.tipo?.trim();
        if (!tipo) {
            toast({
                variant: 'destructive',
                title: 'Tipo Obrigatório',
                description: 'O tipo do imóvel é obrigatório para gerar o SEO.',
            });
            return;
        }

        const relevantFieldsCount = [
            values.localizacao?.cidade?.trim(),
            values.localizacao?.bairro?.trim(),
            values.caracteristicasimovel?.tamanho?.trim(),
            values.caracteristicasimovel?.banheiros?.trim(),
            values.caracteristicasimovel?.vagas?.trim(),
            values.informacoesbasicas?.nome?.trim(),
            (values.caracteristicasimovel?.quartos && values.caracteristicasimovel.quartos.length > 0) ? true : undefined,
            (values.caracteristicasimovel?.suites && values.caracteristicasimovel.suites.length > 0) ? true : undefined,
            (values.caracteristicas && values.caracteristicas.length > 0) ? true : undefined,
            (values.areascomuns && values.areascomuns.length > 0) ? true : undefined,
            (values.informacoesbasicas?.salePrice !== undefined && values.informacoesbasicas?.salePrice !== null && values.informacoesbasicas.salePrice > 0) ? true : undefined,
            (values.informacoesbasicas?.rentPrice !== undefined && values.informacoesbasicas?.rentPrice !== null && values.informacoesbasicas.rentPrice > 0) ? true : undefined,
        ].filter(Boolean).length;

        if (relevantFieldsCount < 2) {
            toast({
                variant: 'destructive',
                title: 'Dados Insuficientes',
                description: 'Informações insuficientes para SEO. Preencha pelo menos o tipo e mais 2 características ou dados de localização do imóvel.',
            });
            return;
        }

        setIsGeneratingSeo(true);
        try {
            const idToken = await user.getIdToken();
            const result = await generatePropertySeo({
                tipo: values.informacoesbasicas?.tipo,
                finalidade: values.informacoesbasicas?.salePrice ? 'Venda' : values.informacoesbasicas?.rentPrice ? 'Aluguel' : 'Venda',
                status: values.informacoesbasicas?.status,
                nome: values.informacoesbasicas?.nome,
                salePrice: values.informacoesbasicas?.salePrice,
                rentPrice: values.informacoesbasicas?.rentPrice,
                cidade: values.localizacao?.cidade,
                bairro: values.localizacao?.bairro,
                estado: values.localizacao?.estado,
                tamanho: values.caracteristicasimovel?.tamanho,
                vagas: values.caracteristicasimovel?.vagas,
                banheiros: values.caracteristicasimovel?.banheiros,
                quartos: values.caracteristicasimovel?.quartos,
                suites: values.caracteristicasimovel?.suites,
                caracteristicas: Array.isArray(values.caracteristicas) ? values.caracteristicas : [],
                areascomuns: Array.isArray(values.areascomuns) ? values.areascomuns : [],
                existingDescription: values.informacoesbasicas?.descricao || '',
            }, idToken);

            if (result) {
                if (result.seoTitle) form.setValue('seoTitle', result.seoTitle, { shouldDirty: true });
                if (result.seoDescription) form.setValue('seoDescription', result.seoDescription, { shouldDirty: true });
                if (result.seoKeywords) form.setValue('seoKeywords', result.seoKeywords, { shouldDirty: true });
                toast({
                    title: 'SEO gerado com IA!',
                    description: 'Os campos de SEO foram preenchidos com sucesso.',
                });
            }
        } catch (error: any) {
            console.error('Erro ao gerar SEO com IA:', error);
            toast({
                variant: 'destructive',
                title: 'Não foi possível criar o SEO',
                description: error?.message || 'Não foi possível gerar o SEO agora. Tente novamente.',
            });
        } finally {
            setIsGeneratingSeo(false);
        }
    };

    const textToPlainTextHtml = (text: string) => {
        if (!text) return '';
        if (text.includes('<p>') || text.includes('<br>')) return text;
        const cleaned = text.replace(/[*#`_\\-]/g, '').trim();
        const paragraphs = cleaned.split(/\n\s*\n/).filter(Boolean);
        if (paragraphs.length <= 1) {
            const lines = cleaned.split('\n').filter(Boolean);
            if (lines.length > 1) {
                return lines.map(line => `<p>${line.trim()}</p>`).join('');
            }
            return `<p>${cleaned}</p>`;
        }
        return paragraphs.map(p => `<p>${p.trim().replace(/\n/g, ' ')}</p>`).join('');
    };

    const handleGenerateDescription = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Não autenticado',
                description: 'Você precisa estar logado para gerar a descrição com IA.',
            });
            return;
        }

        const values = form.getValues();
        const tipo = values.informacoesbasicas?.tipo?.trim();
        if (!tipo) {
            toast({
                variant: 'destructive',
                title: 'Tipo Obrigatório',
                description: 'O tipo do imóvel é obrigatório para gerar a descrição.',
            });
            return;
        }

        const relevantFieldsCount = [
            values.localizacao?.cidade?.trim(),
            values.localizacao?.bairro?.trim(),
            values.caracteristicasimovel?.tamanho?.trim(),
            values.caracteristicasimovel?.banheiros?.trim(),
            values.caracteristicasimovel?.vagas?.trim(),
            values.informacoesbasicas?.nome?.trim(),
            (values.caracteristicasimovel?.quartos && values.caracteristicasimovel.quartos.length > 0) ? true : undefined,
            (values.caracteristicasimovel?.suites && values.caracteristicasimovel.suites.length > 0) ? true : undefined,
            (values.caracteristicas && values.caracteristicas.length > 0) ? true : undefined,
            (values.areascomuns && values.areascomuns.length > 0) ? true : undefined,
            (values.informacoesbasicas?.salePrice !== undefined && values.informacoesbasicas?.salePrice !== null && values.informacoesbasicas.salePrice > 0) ? true : undefined,
            (values.informacoesbasicas?.rentPrice !== undefined && values.informacoesbasicas?.rentPrice !== null && values.informacoesbasicas.rentPrice > 0) ? true : undefined,
        ].filter(Boolean).length;

        if (relevantFieldsCount < 2) {
            toast({
                variant: 'destructive',
                title: 'Dados Insuficientes',
                description: 'Informações insuficientes. Preencha pelo menos o tipo e mais 2 características ou dados de localização do imóvel.',
            });
            return;
        }

        setIsGeneratingDescription(true);
        try {
            const idToken = await user.getIdToken();
            const result = await generatePropertyDescription({
                tipo: values.informacoesbasicas?.tipo,
                nome: values.informacoesbasicas?.nome,
                status: values.informacoesbasicas?.status,
                salePrice: values.informacoesbasicas?.salePrice,
                rentPrice: values.informacoesbasicas?.rentPrice,
                cidade: values.localizacao?.cidade,
                bairro: values.localizacao?.bairro,
                estado: values.localizacao?.estado,
                tamanho: values.caracteristicasimovel?.tamanho,
                vagas: values.caracteristicasimovel?.vagas,
                banheiros: values.caracteristicasimovel?.banheiros,
                quartos: values.caracteristicasimovel?.quartos,
                suites: values.caracteristicasimovel?.suites,
                caracteristicas: Array.isArray(values.caracteristicas) ? values.caracteristicas : [],
                areascomuns: Array.isArray(values.areascomuns) ? values.areascomuns : [],
                existingDescription: values.informacoesbasicas?.descricao || '',
            }, idToken);

            if (result?.description) {
                form.setValue('informacoesbasicas.descricao', result.description, { shouldDirty: true });
                toast({
                    title: 'Descrição gerada com IA!',
                    description: 'A descrição foi atualizada com sucesso.',
                });
            }
        } catch (error: any) {
            console.error('Erro ao gerar descrição com IA:', error);
            toast({
                variant: 'destructive',
                title: 'Não foi possível criar a descrição',
                description: error?.message || 'Não foi possível criar a descrição agora. Tente novamente.',
            });
        } finally {
            setIsGeneratingDescription(false);
        }
    };

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

    useEffect(() => {
        if (!user || !storage) return;

        const uploadingCount = imageUploads.filter(u => u.status === 'uploading').length;
        if (uploadingCount >= 3) return;

        const pendingItems = imageUploads.filter(u => u.status === 'pending');
        if (pendingItems.length === 0) return;

        const slotsAvailable = 3 - uploadingCount;
        const itemsToStart = pendingItems.slice(0, slotsAvailable);

        itemsToStart.forEach(item => {
            runUpload(item);
        });
    }, [imageUploads, user, storage]);

    const handleImageUploads = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || !user || !storage) return;

        const currentMaxOrder = imageUploads.length > 0 
            ? Math.max(...imageUploads.map(u => u.order || 0))
            : 0;

        const newUploads: UploadState[] = Array.from(files).map((file, idx) => ({
            id: uuidv4(),
            file,
            progress: 0,
            status: 'pending',
            order: currentMaxOrder + idx + 1,
        }));

        setImageUploads(prev => [...prev, ...newUploads]);
        event.target.value = '';
    };

    const runUpload = (upload: UploadState) => {
        if (!user || !storage) return;
        const path = `properties/${user.uid}`;

        setImageUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', error: undefined } : u));

        uploadFile(storage, path, upload.file, (progress) => {
            setImageUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress } : u));
        })
        .then(downloadURL => {
            setImageUploads(prev => {
                const updated = prev.map(u => u.id === upload.id ? { ...u, status: 'success' as const, progress: 100, url: downloadURL } : u);
                
                const successfulUrls = updated
                    .filter(u => u.status === 'success' && u.url)
                    .sort((a, b) => a.order - b.order)
                    .map(u => u.url!);

                const existingMidia = form.getValues('midia') || [];
                const combined = Array.from(new Set([...existingMidia, ...successfulUrls]));
                form.setValue('midia', combined, { shouldDirty: true });

                return updated.filter(u => u.id !== upload.id);
            });
        })
        .catch(err => {
            setImageUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' as const, error: err?.message || 'Erro no upload' } : u));
            toast({ variant: "destructive", title: "Erro no Upload", description: err?.message || 'Falha ao enviar imagem.' });
        });
    };

    const retryUpload = (upload: UploadState) => {
        setImageUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'pending', error: undefined, progress: 0 } : u));
    };

    const removeUpload = (id: string) => {
        setImageUploads(prev => prev.filter(u => u.id !== id));
    };

    const removeImage = (urlToRemove: string) => {
        const currentMidia = form.getValues('midia') || [];
        form.setValue('midia', currentMidia.filter(url => url !== urlToRemove), { shouldDirty: true });
        setImageUploads(prev => prev.filter(u => u.url !== urlToRemove));
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

    const watchedNome = form.watch('informacoesbasicas.nome');
    const watchedCep = form.watch('localizacao.cep');
    const watchedBairro = form.watch('localizacao.bairro');
    const watchedTipo = form.watch('informacoesbasicas.tipo');
    const watchedMidia = form.watch('midia');
    const watchedSlug = form.watch('informacoesbasicas.slug');

    const formSections = useMemo(() => [
        { id: 'secao-informacoes-basicas', label: 'Informações Básicas', icon: 'info', isDone: Boolean(watchedNome && watchedNome.trim().length > 0) },
        { id: 'secao-localizacao', label: 'Localização', icon: 'location_on', isDone: Boolean(watchedCep || watchedBairro) },
        { id: 'secao-caracteristicas', label: 'Características & Detalhes', icon: 'home_work', isDone: Boolean(watchedTipo) },
        { id: 'secao-fotos', label: 'Galeria de Fotos', icon: 'imagesmode', isDone: Boolean(watchedMidia && watchedMidia.length > 0) },
        { id: 'secao-seo', label: 'SEO & Sitemap', icon: 'search', isDone: Boolean(watchedSlug) },
    ], [watchedNome, watchedCep, watchedBairro, watchedTipo, watchedMidia, watchedSlug]);

    const completedSectionsCount = useMemo(() => {
        return formSections.filter(s => s.isDone).length;
    }, [formSections]);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
                    <Button type="submit" disabled={localSubmitting || parentSubmitting || hasPendingUploads} className="px-5 py-2.5 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 border-none cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                         {localSubmitting ? 'Salvando...' : 'Salvar Imóvel'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <section id="secao-informacoes-basicas" className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden scroll-mt-24">
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
                                    name="projectId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empreendimento Associado</FormLabel>
                                        <FormControl>
                                            <select {...field} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary text-text-main h-11 px-3" disabled={areProjectsLoading}>
                                                <option key="project-none" value="">{areProjectsLoading ? 'Carregando...' : 'Selecione um empreendimento...'}</option>
                                                {projects?.map((p) => <option key={`project-${p.id}`} value={p.id}>{p.nome || p.name || 'Sem nome'}</option>)}
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
                                    <FormControl>
                                        <CurrencyInput value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>
                    )}
                    {watchTransactionTypes.includes('rent') && (
                        <div className="lg:col-span-3">
                            <FormField control={form.control} name="informacoesbasicas.rentPrice" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço de Aluguel (R$)</FormLabel>
                                    <FormControl>
                                        <CurrencyInput value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>
                    )}

                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="informacoesbasicas.condominio" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condomínio (R$)</FormLabel>
                                <FormControl>
                                    <CurrencyInput value={field.value} onChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="lg:col-span-3">
                        <FormField control={form.control} name="informacoesbasicas.iptu" render={({ field }) => (
                            <FormItem>
                                <FormLabel>IPTU (Anual - R$)</FormLabel>
                                <FormControl>
                                    <CurrencyInput value={field.value} onChange={field.onChange} />
                                </FormControl>
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

            <section id="secao-localizacao" className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden scroll-mt-24">
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
                                        <Input 
                                            placeholder="00000-000" 
                                            {...field} 
                                            value={formatCepDisplay(field.value)} 
                                            onChange={(e) => {
                                                const normalized = normalizeCep(e.target.value);
                                                field.onChange(normalized);
                                            }}
                                            onBlur={handleCepBlur} 
                                        />
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

            <section id="secao-caracteristicas" className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden scroll-mt-24">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">home_work</span>
                        Características & Detalhes
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4">
                        <FormField control={form.control} name="informacoesbasicas.tipo" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Imóvel</FormLabel>
                                <FormControl>
                                    <select {...field} value={field.value || ''} className="w-full rounded-lg border-card-border bg-[#f7f8f5] focus:border-primary focus:ring-primary h-11 px-3">
                                        <option value="">Selecione o tipo...</option>
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
                                <FormMessage />
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
                    <div className="lg:col-span-4">
                        <FormField control={form.control} name="caracteristicasimovel.banheiros" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banheiros</FormLabel>
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
                                const valueArray = Array.isArray(field.value) 
                                    ? field.value 
                                    : typeof field.value === 'string' 
                                        ? field.value.split(',').map(s => s.trim()).filter(Boolean) 
                                        : [];
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
                                const valueArray = Array.isArray(field.value) 
                                    ? field.value 
                                    : typeof field.value === 'string' 
                                        ? field.value.split(',').map(s => s.trim()).filter(Boolean) 
                                        : [];
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
                                <div className="flex items-center justify-between mb-2">
                                    <FormLabel>Descrição do Imóvel</FormLabel>
                                    {isAvulso && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isGeneratingDescription}
                                            onClick={handleGenerateDescription}
                                            className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 gap-1.5 cursor-pointer transition-colors"
                                        >
                                            {isGeneratingDescription ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Criando descrição...
                                                </>
                                            ) : (
                                                <>
                                                    ✨ {field.value && field.value.trim().length > 0 ? 'Melhorar com IA' : 'Criar com IA'}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
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

            <section id="secao-fotos" className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden scroll-mt-24">
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
                            <div key={upload.id} className={cn(
                                "relative aspect-square flex flex-col items-center justify-center border rounded-lg p-2 text-center",
                                upload.status === 'error' ? "border-red-300 bg-red-50/50" : "border-dashed border-card-border bg-gray-50"
                            )}>
                                {upload.status === 'error' ? (
                                    <>
                                        <AlertCircle className="size-5 text-red-500 mb-1" />
                                        <span className="text-[9px] text-red-600 font-bold line-clamp-1 px-1">{upload.error || 'Erro'}</span>
                                        <div className="flex gap-1 mt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => retryUpload(upload)}
                                                className="px-1.5 py-0.5 bg-primary text-black font-bold text-[9px] rounded hover:bg-primary-hover transition-colors cursor-pointer"
                                            >
                                                Tentar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeUpload(upload.id)}
                                                className="px-1.5 py-0.5 bg-red-100 text-red-600 font-bold text-[9px] rounded hover:bg-red-200 transition-colors cursor-pointer"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="size-6 animate-spin text-primary mb-2" />
                                        <span className="text-[10px] font-bold">{Math.round(upload.progress)}%</span>
                                        <span className="text-[9px] text-text-secondary mt-0.5">Enviando...</span>
                                    </>
                                )}
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

            <section id="secao-seo" className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden scroll-mt-24">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">search</span>
                        Configurações de SEO & Sitemap
                    </h3>
                    {isAvulso && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isGeneratingSeo}
                            onClick={handleGenerateSeo}
                            className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 gap-1.5 cursor-pointer transition-colors"
                        >
                            {isGeneratingSeo ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Gerando SEO...
                                </>
                            ) : (
                                <>
                                    ✨ {(form.watch('seoTitle') || form.watch('seoDescription')) ? 'Melhorar SEO com IA' : 'Gerar SEO com IA'}
                                </>
                            )}
                        </Button>
                    )}
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

                </div>
                <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                    {/* Guia Lateral de Cadastro */}
                    <div className="bg-white rounded-xl border border-card-border shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-card-border pb-3">
                            <div>
                                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px]">list_alt</span>
                                    Guia do Imóvel
                                </h3>
                                <p className="text-[11px] text-text-secondary mt-0.5">Navegação pelas seções</p>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {completedSectionsCount}/{formSections.length}
                            </span>
                        </div>
                        <nav className="space-y-1">
                            {formSections.map((sec, idx) => (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => scrollToSection(sec.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left group cursor-pointer border-none bg-transparent"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={cn(
                                            "size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                                            sec.isDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                        )}>
                                            {sec.isDone ? "✓" : idx + 1}
                                        </span>
                                        <span className="truncate">{sec.label}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-slate-500 transition-colors shrink-0">
                                        chevron_right
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {isAvulso && (
                        <PrivateNotesSection propertyId={propertyData?.id} isAvulso={isAvulso} />
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pb-20">
                <Button type="button" variant="outline" asChild><Link href={cancelUrl}>Cancelar</Link></Button>
                <Button type="submit" disabled={localSubmitting || parentSubmitting || hasPendingUploads} className="font-bold">
                    {localSubmitting ? 'Salvando...' : 'Salvar Imóvel'}
                </Button>
            </div>

            {/* Floating Save Bar for Imóvel Avulso when dirty */}
            {isAvulso && isDirty && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-slate-900 text-white px-5 py-3.5 rounded-full shadow-2xl border border-slate-800 flex items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-2.5 text-sm font-semibold truncate">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                        </span>
                        <span className="truncate">Alterações não salvas</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            disabled={localSubmitting || parentSubmitting || hasPendingUploads}
                            onClick={() => form.handleSubmit(async (data) => { await handleInternalSave(data); })()}
                            className="bg-primary text-black font-bold hover:bg-primary-hover h-9 rounded-full px-5 text-xs shadow-md border-none cursor-pointer"
                        >
                            {localSubmitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar alterações'
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Exit Confirmation Dialog */}
            <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
                <DialogContent className="sm:max-w-[460px] p-6 gap-0 rounded-2xl border border-gray-100 shadow-2xl bg-white">
                    <DialogHeader className="space-y-2 text-left pr-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200/50 shadow-2xs">
                                <AlertCircle className="h-4.5 w-4.5" />
                            </div>
                            <DialogTitle className="text-base font-bold text-gray-900 tracking-tight">
                                Alterações não salvas
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-gray-600 leading-relaxed pt-1">
                            Você tem alterações neste imóvel que ainda não foram salvas. O que deseja fazer antes de sair?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mt-6 border-0 pt-0 pr-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsExitDialogOpen(false)}
                            className="order-2 sm:order-1 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium px-4 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors"
                        >
                            Continuar editando
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setIsExitDialogOpen(false);
                                if (pendingNavHref) {
                                    router.push(pendingNavHref);
                                    setPendingNavHref(null);
                                }
                            }}
                            className="order-3 sm:order-2 h-10 text-gray-600 hover:text-red-600 hover:bg-red-50/80 font-medium px-3 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors"
                        >
                            Sair sem salvar
                        </Button>
                        <Button
                            type="button"
                            disabled={localSubmitting || parentSubmitting || hasPendingUploads}
                            onClick={() => {
                                if (pendingNavHref) {
                                    saveAndNavigate(pendingNavHref);
                                }
                            }}
                            className="order-1 sm:order-3 h-10 bg-gray-900 text-white hover:bg-gray-800 font-semibold px-4 rounded-lg shadow-sm cursor-pointer text-xs sm:text-sm transition-colors"
                        >
                            {localSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar e sair'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
      </FormProvider>
    );
}
