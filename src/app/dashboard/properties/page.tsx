
'use client';

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home, PlusCircle, FilePen, Trash2, X, Upload, CheckCircle, XCircle, ImageOff, FilterX, ArrowLeft, ArrowRight, Sparkles, Eye, MousePointerClick, EyeOff, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getStates, getCitiesByState, getNeighborhoodsByCity, type State, type City, type Neighborhood } from '@/services/location';
import { handleGeneratePropertySeo } from './actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type Persona } from '../personas/page';


interface Builder {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  state: string;
  city: string;
}

// Based on the provided JSON
export interface Property {
  id: string;
  slug: string;
  builderId: string;
  isVisibleOnSite: boolean;
  views?: number;
  clicks?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  youtubeVideoUrl?: string;
  personaIds?: string[];
  informacoesbasicas: {
    nome: string;
    slogan?: string;
    descricao: string;
    status?: string;
    previsaoentrega?: string;
    valor?: number;
  };
  localizacao: {
    googleMapsLink?: string;
    googleStreetViewLink?: string;
    cidade?: string;
    estado?: string;
    bairro?: string;
  };
  caracteristicasimovel: {
    tamanho?: string;
    tipo?: string;
    unidades: {
      quartos?: string[] | string;
      vagasgaragem?: string;
    };
  };
  areascomuns: string[];
  proximidades?: string[];
  statusobra: {
    contencao?: string;
    escavacao?: string;
    pavimentacao?: string;
    fundacao?: string;
    portasejanelas?: string;
    pintura?: string;
    fachada?: string;
    alvenaria?: string;
    revestimentointerno?: string;
    forroegesso?: string;
    loucasemetais?: string;
    estrutura?: string;
    instalacoes?: string;
    total?: string;
  };
  documentacao: {
    memorialdescritivo?: string;
    alvaraconstrucao?: string;
    bookimovel?: string;
    registroincorporacao?: string;
    tabelaprecos?: string;
  };
  midia: string[];
  contato: {
    construtora: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    redessociais?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
    };
  };
}

interface ImportResult {
    successCount: number;
    skippedCount: number;
    skippedNames: string[];
}

const proximidadesOptions = {
    supermercado: { label: "Supermercado" },
    shopping: { label: "Shopping" },
    escola: { label: "Escola" },
    universidade: { label: "Universidade" },
    farmacia: { label: "Farmácia" },
    hospital: { label: "Hospital" },
    restaurante: { label: "Restaurante" },
    padaria: { label: "Padaria" },
    banco: { label: "Banco" },
    parque: { label: "Parque / Praça" },
    praia: { label: "Praia" },
    transporte: { label: "Transporte Público" },
    academia: { label: "Academia" },
    posto: { label: "Posto de Combustível" },
};

const getInitialState = (): Omit<Property, 'id'> => ({
  builderId: '',
  slug: '',
  isVisibleOnSite: true,
  views: 0,
  clicks: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  youtubeVideoUrl: '',
  personaIds: [],
  informacoesbasicas: { nome: '', descricao: '' },
  localizacao: { googleMapsLink: '', googleStreetViewLink: '', estado: '', cidade: '', bairro: '' },
  caracteristicasimovel: { unidades: { quartos: [] } },
  areascomuns: [],
  proximidades: [],
  statusobra: {},
  documentacao: {},
  midia: [],
  contato: { construtora: '' },
});

const PROPERTIES_PER_PAGE = 10;

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export default function PropertiesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterBuilder, setFilterBuilder] = useState('all');
  const [filterMissingPrice, setFilterMissingPrice] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Partial<Property>>(getInitialState());
  const [originalProperty, setOriginalProperty] = useState<Partial<Property> | null>(null);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // States for dynamic array inputs
  const [areaComumInput, setAreaComumInput] = useState('');
  const [midiaInput, setMidiaInput] = useState('');
  
  // Location states for form
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);

  // Builder filter states for dialog
  const [dialogBuilderState, setDialogBuilderState] = useState('');
  const [dialogBuilderCity, setDialogBuilderCity] = useState('');
  const [dialogBuilderCities, setDialogBuilderCities] = useState<City[]>([]);

  // Import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importBuilderId, setImportBuilderId] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Price modal states
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [propertyToEditPrice, setPropertyToEditPrice] = useState<Property | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

   useEffect(() => {
    async function handleUrlParams() {
      const editId = searchParams.get('edit');
      const deleteId = searchParams.get('delete');
      const importFlag = searchParams.get('import');
      const statusFilter = searchParams.get('status');
      const stateFilter = searchParams.get('estado');

      if (editId) {
        if (editId === 'new') {
          await openDialog(null);
        } else {
          const propDoc = await getDoc(doc(db, 'properties', editId));
          if (propDoc.exists()) {
            const propData = { id: propDoc.id, ...propDoc.data() } as Property;
            await openDialog(propData);
          }
        }
      } else if (deleteId) {
        const propDoc = await getDoc(doc(db, 'properties', deleteId));
         if (propDoc.exists()) {
          const propData = { id: propDoc.id, ...propDoc.data() } as Property;
          openDeleteAlert(propData);
        }
      } else if (importFlag === 'true') {
        setIsImportDialogOpen(true);
      }
      
      if (statusFilter === 'inactive') {
        setFilterStatus('inactive');
      }
      if (stateFilter) {
        setFilterState(stateFilter);
      }
    }
    handleUrlParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setAllProperties(data);
        setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar imóveis: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar imóveis', description: error.message });
        setIsLoading(false);
    });

    const unsubscribeBuilders = onSnapshot(collection(db, 'builders'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder));
        setBuilders(data);
    });

    const unsubscribePersonas = onSnapshot(collection(db, 'personas'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona));
        setPersonas(data);
    });
    
     async function loadStates() {
      setIsLoadingStates(true);
      const statesData = await getStates();
      setStates(statesData);
      setIsLoadingStates(false);
    }
    loadStates();

    return () => {
      unsubscribeProps();
      unsubscribeBuilders();
      unsubscribePersonas();
    };
  }, [toast]);

  // Filtering Logic
  useEffect(() => {
      let result = allProperties;

      if (searchTerm) {
        result = result.filter(p => 
            p.informacoesbasicas.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterState && filterState !== 'all') {
          result = result.filter(p => p.localizacao.estado === filterState);
      }
      if (filterBuilder && filterBuilder !== 'all') {
          result = result.filter(p => p.builderId === filterBuilder);
      }
      if (filterMissingPrice) {
          result = result.filter(p => !p.informacoesbasicas.valor);
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') {
             result = result.filter(p => p.isVisibleOnSite === true);
        } else if (filterStatus === 'inactive') {
             result = result.filter(p => !p.isVisibleOnSite);
        }
      }
      setFilteredProperties(result);
  }, [searchTerm, filterState, filterBuilder, filterMissingPrice, filterStatus, allProperties]);

  const filteredBuildersForSelect = useMemo(() => {
    let filtered = builders;
    if (filterState && filterState !== 'all') {
        filtered = filtered.filter(b => b.state === filterState);
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [builders, filterState]);

  useEffect(() => {
    setCurrentPage(1); // Reset page only when filters change
  }, [searchTerm, filterState, filterBuilder, filterMissingPrice, filterStatus]);
  
  // Pagination Logic
  const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
  const paginatedProperties = useMemo(() => {
      const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
      const endIndex = startIndex + PROPERTIES_PER_PAGE;
      return filteredProperties.slice(startIndex, endIndex);
  }, [filteredProperties, currentPage]);


  const resetFilters = () => {
      setSearchTerm('');
      setFilterState('all');
      setFilterBuilder('all');
      setFilterMissingPrice(false);
      setFilterStatus('all');
      router.push('/dashboard/properties');
  };
  
  const handleInputChange = (section: keyof Property, field: string, value: any) => {
    setCurrentProperty(prev => {
        const newState: Partial<Property> = { ...prev };
         if (section === 'youtubeVideoUrl' || section === 'slug') {
            (newState as any)[section] = value;
            return newState;
        }

        if (typeof newState[section] === 'object' && newState[section] !== null && !Array.isArray(newState[section])) {
            let processedValue = value;
            if (section === 'informacoesbasicas' && field === 'valor') {
                processedValue = value === '' ? null : Number(value);
            }
             if (section === 'informacoesbasicas' && field === 'nome' && !isEditing) {
                const newSlug = slugify(value);
                newState.slug = newSlug;
            }
            (newState[section] as any)[field] = processedValue;
        } else {
            (newState as any)[section] = value;
        }
        return newState;
    });
  };
  
  const handleLocationChange = (field: 'estado' | 'cidade' | 'bairro', value: string) => {
    setCurrentProperty(prev => ({
        ...prev,
        localizacao: {
            ...prev?.localizacao,
            [field]: value
        }
    }));
  };

  const handleCityChange = async (cityName: string) => {
    handleLocationChange('cidade', cityName);
    handleLocationChange('bairro', ''); // Reset neighborhood
    setIsLoadingNeighborhoods(true);
    setNeighborhoods([]);
    if (cityName) {
        const selectedCity = cities.find(c => c.nome === cityName);
        if (selectedCity) {
            const neighborhoodsData = await getNeighborhoodsByCity(selectedCity.id, selectedCity.nome);
            setNeighborhoods(neighborhoodsData);
        }
    }
    setIsLoadingNeighborhoods(false);
  };

  const handleStateChange = async (stateAcronym: string) => {
    handleLocationChange('estado', stateAcronym);
    handleLocationChange('cidade', '');
    handleLocationChange('bairro', '');
    setIsLoadingCities(true);
    setCities([]);
    setNeighborhoods([]);
    if(stateAcronym){
      const citiesData = await getCitiesByState(stateAcronym);
      setCities(citiesData);
    }
    setIsLoadingCities(false);
  };

  const handleNestedInputChange = (section: keyof Property, subSection: string, field: string, value: any) => {
      setCurrentProperty(prev => {
        const newState = { ...prev };
        if (typeof newState[section] === 'object' && newState[section] !== null) {
          const sectionObject = newState[section] as any;
          if (typeof sectionObject[subSection] === 'object' && sectionObject[subSection] !== null) {
            sectionObject[subSection][field] = value;
          }
        }
        return newState;
    });
  }
  
  const handleBedroomChange = (bedroom: string, isChecked: boolean) => {
    setCurrentProperty(prev => {
        const currentBedrooms = prev?.caracteristicasimovel?.unidades?.quartos || [];
        const newBedrooms = isChecked
            ? [...currentBedrooms, bedroom]
            : (currentBedrooms as string[]).filter(b => b !== bedroom);
        
        newBedrooms.sort();

        return {
            ...prev,
            caracteristicasimovel: {
                ...prev.caracteristicasimovel,
                unidades: {
                    ...prev.caracteristicasimovel?.unidades,
                    quartos: newBedrooms,
                }
            }
        };
    });
  };


  const handleAddItemToArray = (field: 'areascomuns' | 'midia') => {
    const inputState = field === 'areascomuns' ? areaComumInput : midiaInput;
    if (!inputState.trim()) return;

    setCurrentProperty(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), inputState]
    }));
    
    if (field === 'areascomuns') setAreaComumInput('');
    if (field === 'midia') setMidiaInput('');
  };

  const handleRemoveItemFromArray = (field: 'areascomuns' | 'midia', index: number) => {
    setCurrentProperty(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const handleProximidadesChange = (item: string, isChecked: boolean) => {
    setCurrentProperty(prev => {
        const currentItems = prev?.proximidades || [];
        const newItems = isChecked
            ? [...currentItems, item]
            : currentItems.filter(i => i !== item);
        
        return {
            ...prev,
            proximidades: newItems,
        };
    });
  };

  const handlePersonaChange = (personaId: string, isChecked: boolean) => {
    setCurrentProperty(prev => {
        const currentPersonas = prev?.personaIds || [];
        const newPersonas = isChecked
            ? [...currentPersonas, personaId]
            : currentPersonas.filter(id => id !== personaId);
        
        return { ...prev, personaIds: newPersonas };
    });
  };

  const handleBuilderChange = (builderId: string) => {
    const selectedBuilder = builders.find(b => b.id === builderId);
    if (selectedBuilder) {
      setCurrentProperty(prev => ({
        ...prev,
        builderId: selectedBuilder.id,
        contato: {
          construtora: selectedBuilder.name,
          telefone: selectedBuilder.phone,
          whatsapp: selectedBuilder.whatsapp,
          email: selectedBuilder.email,
          redessociais: {
            instagram: selectedBuilder.instagram
          }
        }
      }));
    }
  };

  const openDialog = async (property: Property | null = null) => {
    if (property) {
      setIsEditing(true);
      const propertyForEdit = {
        ...getInitialState(),
        ...property,
        proximidades: property.proximidades || [],
        personaIds: property.personaIds || [],
      };

      if (propertyForEdit.caracteristicasimovel?.unidades?.quartos && !Array.isArray(propertyForEdit.caracteristicasimovel.unidades.quartos)) {
        propertyForEdit.caracteristicasimovel.unidades.quartos = [propertyForEdit.caracteristicasimovel.unidades.quartos];
      }
      setCurrentProperty(propertyForEdit);
      setOriginalProperty(JSON.parse(JSON.stringify(propertyForEdit))); // Deep copy for comparison

      if (propertyForEdit.localizacao?.estado) {
        setIsLoadingCities(true);
        setIsLoadingNeighborhoods(true);
        try {
          const citiesData = await getCitiesByState(propertyForEdit.localizacao.estado);
          setCities(citiesData);
          if (propertyForEdit.localizacao.cidade) {
             const selectedCity = citiesData.find(c => c.nome === propertyForEdit.localizacao.cidade);
             if (selectedCity) {
                const neighborhoodsData = await getNeighborhoodsByCity(selectedCity.id, selectedCity.nome);
                setNeighborhoods(neighborhoodsData);
             }
          }
        } catch (error) {
          console.error("Failed to load location data for dialog:", error);
          setCities([]);
          setNeighborhoods([]);
        } finally {
          setIsLoadingCities(false);
          setIsLoadingNeighborhoods(false);
        }
      }

    } else {
      setIsEditing(false);
      const initialState = getInitialState();
      setCurrentProperty(initialState);
      setOriginalProperty(JSON.parse(JSON.stringify(initialState)));
      setCities([]);
      setNeighborhoods([]);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentProperty({});
    setOriginalProperty(null);
    setDialogBuilderState('');
    setDialogBuilderCity('');
    setDialogBuilderCities([]);
    router.push('/dashboard/properties');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setIsDialogOpen(true);
    } else {
      const hasChanges = JSON.stringify(currentProperty) !== JSON.stringify(originalProperty);
      if (hasChanges) {
        setIsConfirmCloseOpen(true);
      } else {
        closeDialog();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProperty.builderId || !currentProperty.informacoesbasicas?.nome) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Construtora e Nome do Imóvel são obrigatórios.' });
      return;
    }
    setIsSubmitting(true);
    
    const propertyData: Partial<Property> = { ...currentProperty };
    
    if (!propertyData.slug && propertyData.informacoesbasicas?.nome) {
        propertyData.slug = slugify(propertyData.informacoesbasicas.nome);
    }

    delete propertyData.id;

    try {
      if (isEditing && currentProperty.id) {
        await updateDoc(doc(db, 'properties', currentProperty.id), propertyData);
        toast({ title: 'Imóvel Atualizado!', description: 'Os dados foram atualizados.' });
      } else {
        await addDoc(collection(db, 'properties'), { ...propertyData, createdAt: new Date() });
        toast({ title: 'Imóvel Salvo!', description: 'O novo imóvel foi cadastrado.' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openDeleteAlert = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeleteAlertOpen(true);
  };
  
  const closeDeleteAlert = () => {
    setPropertyToDelete(null);
    setIsDeleteAlertOpen(false);
    router.push('/dashboard/properties');
  }

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteDoc(doc(db, 'properties', propertyToDelete.id));
      toast({ title: 'Imóvel Deletado' });
      closeDeleteAlert();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

   const handleVisibilityToggle = async (property: Property) => {
    const propertyRef = doc(db, 'properties', property.id);
    const newVisibility = !property.isVisibleOnSite;
    try {
        await updateDoc(propertyRef, { isVisibleOnSite: newVisibility });
        setAllProperties(prevProps => 
            prevProps.map(p => 
                p.id === property.id ? { ...p, isVisibleOnSite: newVisibility } : p
            )
        );
        toast({
            title: 'Visibilidade Atualizada',
            description: `${property.informacoesbasicas.nome} agora está ${newVisibility ? 'visível' : 'oculto'} no site.`
        })
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Falha na Atualização', description: 'Não foi possível alterar a visibilidade.' });
    }
  };
  
  const closeImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportBuilderId('');
    setImportFile(null);
    setImportResult(null);
    setIsImporting(false);
    setDialogBuilderState('');
    setDialogBuilderCity('');
    setDialogBuilderCities([]);
    router.push('/dashboard/properties');
  }

  const handleImport = async () => {
    if (!importBuilderId || !importFile) {
      toast({ variant: 'destructive', title: 'Faltam informações', description: 'Selecione uma construtora e um arquivo JSON.' });
      return;
    }
    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const jsonContent = JSON.parse(event.target?.result as string);
            const propertiesToImport: Omit<Property, 'id'>[] = Array.isArray(jsonContent) ? jsonContent : [jsonContent];

            const q = query(collection(db, 'properties'), where('builderId', '==', importBuilderId));
            const existingPropsSnapshot = await getDocs(q);
            const existingPropNames = new Set(existingPropsSnapshot.docs.map(doc => doc.data().informacoesbasicas.nome));

            const batch = writeBatch(db);
            let successCount = 0;
            const skippedNames: string[] = [];

            const selectedBuilder = builders.find(b => b.id === importBuilderId);

            for (const propData of propertiesToImport) {
                if (existingPropNames.has(propData.informacoesbasicas.nome)) {
                    skippedNames.push(propData.informacoesbasicas.nome);
                } else {
                    const newDocRef = doc(collection(db, 'properties'));
                    
                    const slug = slugify(propData.informacoesbasicas.nome || '');

                    const fullPropData = {
                        ...propData,
                        slug: slug,
                        builderId: importBuilderId,
                        isVisibleOnSite: false, 
                        views: 0,
                        clicks: 0,
                        contato: {
                            ...propData.contato,
                            construtora: selectedBuilder?.name || propData.contato.construtora,
                        },
                        createdAt: new Date()
                    };
                    delete (fullPropData as any).id;
                    batch.set(newDocRef, fullPropData);
                    successCount++;
                }
            }
            
            await batch.commit();

            setImportResult({ successCount, skippedCount: skippedNames.length, skippedNames });
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao processar JSON', description: error.message });
            setImportResult(null);
        } finally {
            setIsImporting(false);
        }
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: 'Não foi possível ler o arquivo selecionado.'});
        setIsImporting(false);
    }
    reader.readAsText(importFile);
  }

  const getBuilderName = (builderId: string) => builders.find(b => b.id === builderId)?.name || 'Desconhecida';
  
  const displayBedrooms = (bedrooms: string[] | string | undefined) => {
    if (Array.isArray(bedrooms)) {
      return bedrooms.join(', ');
    }
    return bedrooms || '';
  };

  const openPriceModal = (property: Property) => {
    setPropertyToEditPrice(property);
    setNewPrice(property.informacoesbasicas.valor?.toString() || '');
    setIsPriceModalOpen(true);
  };
  
  const handleSavePrice = async () => {
    if (!propertyToEditPrice) return;
    
    setIsSavingPrice(true);
    const propertyRef = doc(db, 'properties', propertyToEditPrice.id);
    const priceAsNumber = newPrice === '' ? null : Number(newPrice);
    
    try {
        await updateDoc(propertyRef, {
            'informacoesbasicas.valor': priceAsNumber,
        });
        
        setAllProperties(prevProps => 
            prevProps.map(p => 
                p.id === propertyToEditPrice.id 
                ? { ...p, informacoesbasicas: { ...p.informacoesbasicas, valor: priceAsNumber as number } }
                : p
            )
        );

        toast({ title: 'Preço Atualizado!', description: 'O valor do imóvel foi salvo.' });
        setIsPriceModalOpen(false);
        setPropertyToEditPrice(null);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Falha ao Salvar', description: 'Não foi possível atualizar o preço.' });
    } finally {
        setIsSavingPrice(false);
    }
  };

  const onGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    
    const plainPropertyData = {
      nome: currentProperty.informacoesbasicas?.nome || '',
      tipo: currentProperty.caracteristicasimovel?.tipo || '',
      cidade: currentProperty.localizacao?.cidade || '',
      estado: currentProperty.localizacao?.estado || '',
      quartos: displayBedrooms(currentProperty.caracteristicasimovel?.unidades?.quartos),
      descricao: currentProperty.informacoesbasicas?.descricao || ''
    };

    const result = await handleGeneratePropertySeo(plainPropertyData);
    if (result.success && result.data) {
        setCurrentProperty(prev => ({
            ...prev,
            seoTitle: result.data!.title,
            seoDescription: result.data!.description,
            seoKeywords: result.data!.keywords,
        }));
        toast({ title: "SEO Gerado!", description: "Os campos de SEO foram preenchidos pela IA." });
    } else {
        toast({ variant: 'destructive', title: 'Falha na Geração', description: result.error });
    }
    setIsGeneratingSeo(false);
  };

  const handleSuggestPersonas = () => {
    if (!currentProperty || personas.length === 0) return;

    const propPrice = currentProperty.informacoesbasicas?.valor;
    const propType = currentProperty.caracteristicasimovel?.tipo;
    const propBedroomsRaw = currentProperty.caracteristicasimovel?.unidades?.quartos;
    const propGarageRaw = currentProperty.caracteristicasimovel?.unidades?.vagasgaragem;
    const propLocation = {
        city: currentProperty.localizacao?.cidade,
        state: currentProperty.localizacao?.estado,
    };
    const propCommonAreas = currentProperty.areascomuns || [];

    const getNumericValue = (val: string | undefined): number => {
        if (!val) return 0;
        return parseInt(val.replace(/\D/g, ''), 10) || 0;
    };

    const propBeds = Array.isArray(propBedroomsRaw) ? propBedroomsRaw.map(getNumericValue) : [getNumericValue(propBedroomsRaw as string)];
    const propGarage = getNumericValue(propGarageRaw);

    const matchedPersonaIds = personas.filter(persona => {
        const { criteria } = persona;
        if (!criteria) return false;

        if (propPrice) {
            if (criteria.priceMin && propPrice < criteria.priceMin) return false;
            if (criteria.priceMax && propPrice > criteria.priceMax) return false;
        }

        if (propType && criteria.propertyTypes?.length && !criteria.propertyTypes.includes(propType)) {
            return false;
        }

        if (propBeds.length > 0 && criteria.bedrooms?.length) {
            const personaBeds = criteria.bedrooms.map(getNumericValue);
            if (!propBeds.some(pBed => personaBeds.some(cBed => pBed >= cBed))) {
                return false;
            }
        }
        
        if (propGarage && criteria.garageSpots?.length) {
            const personaGarages = criteria.garageSpots.map(getNumericValue);
            if (!personaGarages.some(pGarage => propGarage >= pGarage)) {
                return false;
            }
        }

        if (propLocation.city && propLocation.state && criteria.locations?.length) {
            if (!criteria.locations.some(loc => loc.city === propLocation.city && loc.state === propLocation.state)) {
                return false;
            }
        }

        if (criteria.commonAreas?.length) {
            if (!criteria.commonAreas.every(area => propCommonAreas.includes(area))) {
                return false;
            }
        }

        return true;
    }).map(p => p.id);

    setCurrentProperty(prev => ({ ...prev, personaIds: matchedPersonaIds }));
    toast({ title: "Personas Sugeridas!", description: `${matchedPersonaIds.length} personas foram selecionadas.`});
  };
  
  const handleDialogBuilderStateChange = async (stateAcronym: string) => {
    setDialogBuilderState(stateAcronym);
    setDialogBuilderCity('');
    setDialogBuilderCities([]);
    if (stateAcronym) {
        const cities = await getCitiesByState(stateAcronym);
        setDialogBuilderCities(cities);
    }
  };

  const filteredBuildersForDialog = useMemo(() => {
    let result = builders;
    if (dialogBuilderState) {
        result = result.filter(b => b.state === dialogBuilderState);
    }
    if (dialogBuilderCity) {
        result = result.filter(b => b.city === dialogBuilderCity);
    }
    return result;
  }, [builders, dialogBuilderState, dialogBuilderCity]);

  const propertyTypes = ["Apartamento", "Casa em Condomínio", "Casa", "Flat", "Terreno", "Sala Comercial", "Loja"];
  const bedroomOptions = ["1", "2", "3", "4", "5", "Mais de 5"];
  const garageOptions = ["Nenhuma", "1", "2", "3", "4", "Mais de 4"];
  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return "Não definido";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Home /> Imóveis</CardTitle>
            <CardDescription>Cadastre e gerencie os imóveis de cada construtora.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4" /> Importar Imóveis
            </Button>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-4 w-4" /> Cadastrar Imóvel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                  <div className="relative lg:col-span-2">
                      <Label htmlFor="search-name" className="sr-only">Buscar por nome</Label>
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          id="search-name"
                          placeholder="Buscar pelo nome do empreendimento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                      />
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs">Estado</Label>
                      <Select value={filterState} onValueChange={setFilterState} disabled={isLoadingStates}>
                          <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos os Estados</SelectItem>
                              {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs">Construtora</Label>
                      <Select value={filterBuilder} onValueChange={setFilterBuilder}>
                          <SelectTrigger><SelectValue placeholder="Filtrar por construtora..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todas as Construtoras</SelectItem>
                              {filteredBuildersForSelect.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs">Status no Site</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger><SelectValue placeholder="Filtrar por status..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="active">Ativos</SelectItem>
                              <SelectItem value="inactive">Inativos</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="flex items-center space-x-2 pt-5">
                        <Checkbox id="filter-missing-price" checked={filterMissingPrice} onCheckedChange={(checked) => setFilterMissingPrice(!!checked)} />
                        <Label htmlFor="filter-missing-price" className="text-sm font-normal">
                            Sem valor
                        </Label>
                    </div>
                  <Button variant="outline" onClick={resetFilters} className="col-start-1 lg:col-start-auto">
                      <FilterX className="mr-2 h-4 w-4"/>
                      Limpar Filtros
                  </Button>
              </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome do Imóvel</TableHead>
                  <TableHead>Métricas</TableHead>
                  <TableHead>Construtora</TableHead>
                  <TableHead>Visível</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProperties.length > 0 ? paginatedProperties.map((prop) => {
                  const featuredImage = prop.midia && prop.midia.length > 0 ? prop.midia[0] : null;
                  const hasSeo = prop.seoTitle && prop.seoDescription && prop.seoKeywords;
                  return (
                    <TableRow key={prop.id}>
                       <TableCell>
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            {featuredImage ? (
                              <Image 
                                src={featuredImage} 
                                alt={prop.informacoesbasicas.nome} 
                                width={64} 
                                height={64} 
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <ImageOff className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                           <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className={`h-2.5 w-2.5 rounded-full ${hasSeo ? 'bg-green-500' : 'bg-red-500'}`} />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{hasSeo ? 'SEO Preenchido' : 'SEO Pendente'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          <Link href={`/dashboard/properties/${prop.slug || prop.id}`} className="hover:underline">
                              {prop.informacoesbasicas.nome}
                          </Link>
                        </div>
                         <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span>{formatPrice(prop.informacoesbasicas.valor)}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openPriceModal(prop)}>
                                <FilePen className="h-3 w-3" />
                                <span className="sr-only">Editar Preço</span>
                            </Button>
                          </div>
                      </TableCell>
                       <TableCell>
                          <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-sm">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  <span>{prop.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                  <span>{prop.clicks || 0}</span>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>{getBuilderName(prop.builderId)}</TableCell>
                      <TableCell>
                          <Switch
                            checked={prop.isVisibleOnSite}
                            onCheckedChange={() => handleVisibilityToggle(prop)}
                            aria-label="Visibilidade no site"
                          />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(prop)}><FilePen className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(prop)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum imóvel encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                    <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                    </Button>
                    <span className="text-sm font-medium">
                        Página {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Próxima
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
             <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</DialogTitle>
                <DialogDescription>{isEditing ? 'Atualize os dados do imóvel.' : 'Preencha os dados para cadastrar um novo imóvel.'}</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6">
              <div className="grid gap-4 py-4">
                  <div className="p-4 border rounded-lg space-y-4">
                      <Label>Filtro de Construtora</Label>
                      <div className="grid grid-cols-2 gap-4">
                          <Select onValueChange={handleDialogBuilderStateChange} value={dialogBuilderState}>
                              <SelectTrigger><SelectValue placeholder="Filtrar por Estado"/></SelectTrigger>
                              <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select onValueChange={setDialogBuilderCity} value={dialogBuilderCity} disabled={!dialogBuilderState}>
                              <SelectTrigger><SelectValue placeholder="Filtrar por Cidade"/></SelectTrigger>
                              <SelectContent>{dialogBuilderCities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="builderId">Construtora Responsável</Label>
                    <Select onValueChange={handleBuilderChange} value={currentProperty.builderId || ''} required disabled={isSubmitting}>
                      <SelectTrigger id="builderId"><SelectValue placeholder="Selecione uma construtora" /></SelectTrigger>
                      <SelectContent>
                        {filteredBuildersForDialog.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Accordion type="multiple" className="w-full" defaultValue={['item-1', 'item-2']}>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Informações Básicas</AccordionTrigger>
                      <AccordionContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nome do Imóvel</Label><Input value={currentProperty.informacoesbasicas?.nome || ''} onChange={e => handleInputChange('informacoesbasicas', 'nome', e.target.value)} required /></div>
                        <div className="space-y-2"><Label>URL Amigável (slug)</Label><Input value={currentProperty.slug || ''} onChange={e => handleInputChange('slug', '', e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Slogan</Label><Input value={currentProperty.informacoesbasicas?.slogan || ''} onChange={e => handleInputChange('informacoesbasicas', 'slogan', e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Descrição</Label><Textarea value={currentProperty.informacoesbasicas?.descricao || ''} onChange={e => handleInputChange('informacoesbasicas', 'descricao', e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={currentProperty.informacoesbasicas?.valor || ''} onChange={e => handleInputChange('informacoesbasicas', 'valor', e.target.value)} placeholder="Ex: 550000.00"/></div>
                        <div className="space-y-2"><Label>Status</Label><Input value={currentProperty.informacoesbasicas?.status || ''} onChange={e => handleInputChange('informacoesbasicas', 'status', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Previsão de Entrega</Label><Input value={currentProperty.informacoesbasicas?.previsaoentrega || ''} onChange={e => handleInputChange('informacoesbasicas', 'previsaoentrega', e.target.value)} /></div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Localização</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                           <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                  <Label htmlFor="state">Estado</Label>
                                  <Select onValueChange={handleStateChange} value={currentProperty.localizacao?.estado || ''} disabled={isLoadingStates}>
                                      <SelectTrigger id="state">
                                          <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione um estado'} />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {states.map((s) => (
                                          <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="city">Cidade</Label>
                                  <Select onValueChange={handleCityChange} value={currentProperty.localizacao?.cidade || ''} disabled={!currentProperty.localizacao?.estado || isLoadingCities}>
                                      <SelectTrigger id="city">
                                          <SelectValue placeholder={
                                          isLoadingCities ? 'Carregando...' : 'Selecione uma cidade'
                                          } />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {cities.map((c) => (
                                          <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="neighborhood">Bairro</Label>
                                  <Select onValueChange={(value) => handleLocationChange('bairro', value)} value={currentProperty.localizacao?.bairro || ''} disabled={!currentProperty.localizacao?.cidade || isLoadingNeighborhoods}>
                                      <SelectTrigger id="neighborhood">
                                          <SelectValue placeholder={
                                              isLoadingNeighborhoods ? 'Carregando...' : 'Selecione um bairro'
                                          } />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {neighborhoods.map((n) => (
                                              <SelectItem key={n.id} value={n.nome}>{n.nome}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                           </div>
                            <div className="space-y-2">
                                <Label>Código de Incorporação do Google Maps</Label>
                                <Textarea value={currentProperty.localizacao?.googleMapsLink || ''} onChange={e => handleInputChange('localizacao', 'googleMapsLink', e.target.value)} placeholder='Cole o código <iframe> do Google Maps aqui' />
                            </div>
                             <div className="space-y-2">
                                <Label>Código de Incorporação do Google Street View</Label>
                                <Textarea value={currentProperty.localizacao?.googleStreetViewLink || ''} onChange={e => handleInputChange('localizacao', 'googleStreetViewLink', e.target.value)} placeholder='Cole o código <iframe> do Street View aqui' />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-personas">
                        <AccordionTrigger>Personas</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">Selecione as personas que se encaixam neste imóvel.</p>
                                    <Button type="button" variant="outline" size="sm" onClick={handleSuggestPersonas}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Sugerir Personas
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                    {personas.map(persona => (
                                        <div key={persona.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`persona-${persona.id}`}
                                                checked={currentProperty.personaIds?.includes(persona.id)}
                                                onCheckedChange={checked => handlePersonaChange(persona.id, !!checked)}
                                            />
                                            <Label htmlFor={`persona-${persona.id}`} className="font-normal">{persona.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Características do Imóvel</AccordionTrigger>
                      <AccordionContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Tamanho (m²)</Label><Input value={currentProperty.caracteristicasimovel?.tamanho || ''} onChange={e => handleInputChange('caracteristicasimovel', 'tamanho', e.target.value)} /></div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select onValueChange={value => handleInputChange('caracteristicasimovel', 'tipo', value)} value={currentProperty.caracteristicasimovel?.tipo || ''}>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo de imóvel" /></SelectTrigger>
                            <SelectContent>
                              {propertyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>Quartos</Label>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {bedroomOptions.map(option => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`bedroom-${option}`}
                                            checked={Array.isArray(currentProperty.caracteristicasimovel?.unidades?.quartos) && currentProperty.caracteristicasimovel.unidades.quartos.includes(option)}
                                            onCheckedChange={(checked) => handleBedroomChange(option, !!checked)}
                                        />
                                        <Label htmlFor={`bedroom-${option}`} className="font-normal">{option}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Vagas de Garagem</Label>
                           <Select onValueChange={value => handleNestedInputChange('caracteristicasimovel', 'unidades', 'vagasgaragem', value)} value={currentProperty.caracteristicasimovel?.unidades?.vagasgaragem || ''}>
                            <SelectTrigger><SelectValue placeholder="Selecione o número de vagas" /></SelectTrigger>
                            <SelectContent>
                              {garageOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Áreas Comuns</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex gap-2 mb-2">
                          <Input value={areaComumInput} onChange={e => setAreaComumInput(e.target.value)} placeholder="Adicionar item" />
                          <Button type="button" onClick={() => handleAddItemToArray('areascomuns')}>Adicionar</Button>
                        </div>
                        <div className="space-y-2">
                          {currentProperty.areascomuns?.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                              <span>{item}</span>
                              <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItemFromArray('areascomuns', index)}><X className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-5">
                      <AccordionTrigger>Documentação</AccordionTrigger>
                       <AccordionContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Memorial Descritivo (URL)</Label><Input value={currentProperty.documentacao?.memorialdescritivo || ''} onChange={e => handleInputChange('documentacao', 'memorialdescritivo', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Alvará de Construção (URL)</Label><Input value={currentProperty.documentacao?.alvaraconstrucao || ''} onChange={e => handleInputChange('documentacao', 'alvaraconstrucao', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Book do Imóvel (URL)</Label><Input value={currentProperty.documentacao?.bookimovel || ''} onChange={e => handleInputChange('documentacao', 'bookimovel', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Registro de Incorporação (URL)</Label><Input value={currentProperty.documentacao?.registroincorporacao || ''} onChange={e => handleInputChange('documentacao', 'registroincorporacao', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Tabela de Preços (URL)</Label><Input value={currentProperty.documentacao?.tabelaprecos || ''} onChange={e => handleInputChange('documentacao', 'tabelaprecos', e.target.value)} /></div>
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-6">
                      <AccordionTrigger>Mídia (Links de Imagens e Vídeo)</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>URL do Vídeo do YouTube</Label>
                          <Input 
                            value={currentProperty.youtubeVideoUrl || ''} 
                            onChange={e => handleInputChange('youtubeVideoUrl', '', e.target.value)} 
                            placeholder="https://www.youtube.com/watch?v=..." 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Links de Imagens</Label>
                          <div className="flex gap-2 mb-2">
                            <Input value={midiaInput} onChange={e => setMidiaInput(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
                            <Button type="button" onClick={() => handleAddItemToArray('midia')}>Adicionar Imagem</Button>
                          </div>
                          <div className="space-y-2">
                            {currentProperty.midia?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                <span className="truncate text-xs">{item}</span>
                                <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItemFromArray('midia', index)}><X className="h-4 w-4" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-7">
                        <AccordionTrigger>Contato</AccordionTrigger>
                        <AccordionContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Nome Construtora</Label><Input value={currentProperty.contato?.construtora || ''} onChange={e => handleInputChange('contato', 'construtora', e.target.value)} disabled /></div>
                            <div className="space-y-2"><Label>Telefone</Label><Input value={currentProperty.contato?.telefone || ''} onChange={e => handleInputChange('contato', 'telefone', e.target.value)} /></div>
                            <div className="space-y-2"><Label>WhatsApp</Label><Input value={currentProperty.contato?.whatsapp || ''} onChange={e => handleInputChange('contato', 'whatsapp', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" value={currentProperty.contato?.email || ''} onChange={e => handleInputChange('contato', 'email', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Website</Label><Input type="url" value={currentProperty.contato?.website || ''} onChange={e => handleInputChange('contato', 'website', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Facebook</Label><Input type="url" value={currentProperty.contato?.redessociais?.facebook || ''} onChange={e => handleNestedInputChange('contato', 'redessociais', 'facebook', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Instagram</Label><Input type="url" value={currentProperty.contato?.redessociais?.instagram || ''} onChange={e => handleNestedInputChange('contato', 'redessociais', 'instagram', e.target.value)} /></div>
                            <div className="space-y-2"><Label>YouTube</Label><Input type="url" value={currentProperty.contato?.redessociais?.youtube || ''} onChange={e => handleNestedInputChange('contato', 'redessociais', 'youtube', e.target.value)} /></div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-8">
                      <AccordionTrigger>SEO</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                         <div className="flex justify-between items-center">
                            <Label>Otimização para Google</Label>
                            <Button type="button" variant="outline" size="sm" onClick={onGenerateSeo} disabled={isGeneratingSeo}>
                                {isGeneratingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2"/>}
                                Gerar com IA
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seoTitle">Meta Title</Label>
                            <Input id="seoTitle" name="seoTitle" value={currentProperty.seoTitle || ''} onChange={(e) => handleInputChange('seoTitle', '', e.target.value)} disabled={isSubmitting} maxLength={60} />
                             <p className="text-xs text-muted-foreground">Recomendado: 50-60 caracteres.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seoDescription">Meta Description</Label>
                            <Textarea id="seoDescription" name="seoDescription" value={currentProperty.seoDescription || ''} onChange={(e) => handleInputChange('seoDescription', '', e.target.value)} disabled={isSubmitting} maxLength={160} />
                             <p className="text-xs text-muted-foreground">Recomendado: 150-160 caracteres.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seoKeywords">Palavras-chave</Label>
                            <Input id="seoKeywords" name="seoKeywords" value={currentProperty.seoKeywords || ''} onChange={(e) => handleInputChange('seoKeywords', '', e.target.value)} disabled={isSubmitting} />
                            <p className="text-xs text-muted-foreground">Separadas por vírgula.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-9">
                        <AccordionTrigger>Proximidades e Conveniências</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(proximidadesOptions).map(([key, { label }]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`proximidade-${key}`}
                                            checked={currentProperty.proximidades?.includes(label) ?? false}
                                            onCheckedChange={(checked) => handleProximidadesChange(label, !!checked)}
                                        />
                                        <Label htmlFor={`proximidade-${key}`} className="font-normal">{label}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <div className="flex items-center space-x-2 pt-4">
                      <Switch 
                        id="isVisibleOnSite" 
                        checked={currentProperty.isVisibleOnSite ?? true} 
                        onCheckedChange={(checked) => handleInputChange('isVisibleOnSite', '', checked)} 
                      />
                      <Label htmlFor="isVisibleOnSite">Visível no site público</Label>
                    </div>
                  </Accordion>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t mt-auto">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(isOpen) => { if (!isOpen) closeDeleteAlert()}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o imóvel {' '}
              <strong>{propertyToDelete?.informacoesbasicas.nome}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteAlert}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) closeImportDialog()}}>
        <DialogContent>
           <DialogHeader>
                <DialogTitle>Importar Imóveis via JSON</DialogTitle>
                <DialogDescription>
                    Selecione a construtora e o arquivo JSON para importar os imóveis em massa.
                </DialogDescription>
            </DialogHeader>
            {!importResult ? (
                <div className="grid gap-4 py-4">
                    <div className="p-4 border rounded-lg space-y-4">
                      <Label>Filtro de Construtora</Label>
                      <div className="grid grid-cols-2 gap-4">
                          <Select onValueChange={handleDialogBuilderStateChange} value={dialogBuilderState}>
                              <SelectTrigger><SelectValue placeholder="Filtrar por Estado"/></SelectTrigger>
                              <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select onValueChange={setDialogBuilderCity} value={dialogBuilderCity} disabled={!dialogBuilderState}>
                              <SelectTrigger><SelectValue placeholder="Filtrar por Cidade"/></SelectTrigger>
                              <SelectContent>{dialogBuilderCities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="import-builder">Construtora</Label>
                        <Select onValueChange={setImportBuilderId} value={importBuilderId} required disabled={isImporting}>
                            <SelectTrigger id="import-builder"><SelectValue placeholder="Selecione uma construtora" /></SelectTrigger>
                            <SelectContent>
                                {filteredBuildersForDialog.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="import-file">Arquivo JSON</Label>
                        <Input id="import-file" type="file" accept=".json" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} disabled={isImporting} />
                    </div>
                </div>
            ) : (
                <div className="py-4 space-y-4">
                    <h3 className="text-lg font-medium text-center">Relatório de Importação</h3>
                    <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <p><strong>{importResult.successCount}</strong> imóveis cadastrados com sucesso.</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-amber-600">
                       <XCircle className="h-5 w-5" />
                       <p><strong>{importResult.skippedCount}</strong> imóveis ignorados (já existiam).</p>
                    </div>
                    {importResult.skippedCount > 0 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-sm font-semibold">Imóveis ignorados:</p>
                            <div className="max-h-32 overflow-y-auto rounded-md bg-muted p-2 text-xs">
                                <ul className="list-disc pl-4">
                                    {importResult.skippedNames.map(name => <li key={name}>{name}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter>
                {importResult ? (
                    <Button onClick={closeImportDialog}>Fechar</Button>
                ) : (
                    <>
                    <Button variant="outline" onClick={closeImportDialog} disabled={isImporting}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={isImporting || !importBuilderId || !importFile}>
                        {isImporting ? <Loader2 className="animate-spin" /> : 'Importar'}
                    </Button>
                    </>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Price Edit Dialog */}
        <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Preço do Imóvel</DialogTitle>
                    <DialogDescription>
                        Alterando o valor para: <strong>{propertyToEditPrice?.informacoesbasicas.nome}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="price-input">Valor (R$)</Label>
                        <Input 
                            id="price-input" 
                            type="number" 
                            placeholder="Ex: 550000.00"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            disabled={isSavingPrice}
                        />
                         <p className="text-xs text-muted-foreground">Deixe em branco para remover o valor (exibirá "Sob consulta").</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPriceModalOpen(false)} disabled={isSavingPrice}>Cancelar</Button>
                    <Button onClick={handleSavePrice} disabled={isSavingPrice}>
                        {isSavingPrice ? <Loader2 className="animate-spin" /> : "Salvar Preço"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Unsaved Changes Confirmation */}
        <AlertDialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Você tem alterações não salvas. Se você sair agora, perderá todo o seu progresso.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
                    <AlertDialogAction onClick={closeDialog}>Sair e Descartar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

    
