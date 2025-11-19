'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Upload, Sparkles, DollarSign, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, getDoc, query, where, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { getStates, getCitiesByState, type State, type City, type Neighborhood, getNeighborhoodsByCity } from '@/services/location';
import { handleGeneratePropertySeo } from '@/app/dashboard/properties/actions';
import { type Property } from '@/app/dashboard/properties/page';
import { type Builder } from '@/app/dashboard/builders/page';
import { type Persona } from '@/app/dashboard/personas/page';
import { uploadFile } from '@/lib/storage';
import { useAuth } from '@/context/auth-context';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import Image from 'next/image';

const bedroomOptions = ["1", "2", "3", "4", "5+"];
const garageOptions = ["1", "2", "3", "4+"];
const propertyTypes = ["Apartamento", "Casa em Condomínio", "Casa", "Flat", "Terreno", "Sala Comercial", "Loja"];
const commonAreasOptions = ["Academia", "Piscina", "Salão de Festas", "Espaço Gourmet", "Brinquedoteca", "Playground", "Quadra Esportiva", "Churrasqueira"];

const getInitialState = (): Partial<Property> => ({
  builderId: '',
  slug: '',
  isVisibleOnSite: true,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  youtubeVideoUrl: '',
  personaIds: [],
  informacoesbasicas: { nome: '', descricao: '' },
  localizacao: { googleMapsLink: '', googleStreetViewLink: '' },
  caracteristicasimovel: { unidades: { quartos: [] } },
  areascomuns: [],
  proximidades: [],
  statusobra: {},
  documentacao: {},
  midia: [],
  contato: { construtora: '' },
});


function slugify(text: string) {
  if (!text) return '';
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

interface PropertyFormProps {
    initialData: Partial<Property> | null;
    onSave: () => void;
    onCancel: () => void;
}

export default function PropertyForm({ initialData, onSave, onCancel }: PropertyFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { user, panelUserType } = useAuth();

    const [currentProperty, setCurrentProperty] = useState<Partial<Property>>(getInitialState());
    const [isEditing, setIsEditing] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

    const [areaComumInput, setAreaComumInput] = useState('');
    const [proximidadeInput, setProximidadeInput] = useState('');
    const [midiaInput, setMidiaInput] = useState('');
    
    const [builders, setBuilders] = useState<Builder[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
    
    const [isUploading, setIsUploading] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            const dataToSet = {...getInitialState(), ...initialData};
            if (dataToSet.id) {
                setIsEditing(true);
            }
             if (dataToSet.caracteristicasimovel?.unidades?.quartos && !Array.isArray(dataToSet.caracteristicasimovel.unidades.quartos)) {
                dataToSet.caracteristicasimovel.unidades.quartos = [dataToSet.caracteristicasimovel.unidades.quartos];
            }
            setCurrentProperty(dataToSet);

            if (dataToSet.localizacao?.estado) {
                handleStateChange(dataToSet.localizacao.estado, false);
                if (dataToSet.localizacao.cidade) {
                    handleCityChange(dataToSet.localizacao.cidade, false);
                }
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (!user) return;
        
        if (panelUserType === 'builder' && !isEditing) {
            setCurrentProperty(prev => ({...prev, builderId: user.uid }));
        }
        
        const unsubBuilders = onSnapshot(collection(db, 'builders'), (snapshot) => {
            setBuilders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder)));
        });
        const unsubPersonas = onSnapshot(collection(db, 'personas'), (snapshot) => {
            setPersonas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona)));
        });
        async function loadStates() {
            setIsLoadingStates(true);
            const statesData = await getStates();
            setStates(statesData);
            setIsLoadingStates(false);
        }
        loadStates();
        
        return () => { unsubBuilders(); unsubPersonas(); }
    }, [user, panelUserType, isEditing]);


    const handleStateChange = async (stateAcronym: string, resetCity = true) => {
        setCurrentProperty((prev) => ({ 
      ...prev, 
      localizacao: { ...prev.localizacao, estado: stateAcronym, ...(resetCity && { cidade: '', bairro: '' }) }}));
        
        setIsLoadingCities(true);
        setCities([]);
        setNeighborhoods([]);
        if(stateAcronym){
            const citiesData = await getCitiesByState(stateAcronym);
            setCities(citiesData);
        }
        setIsLoadingCities(false);
    };

    const handleCityChange = async (cityName: string, resetNeighborhood = true) => {
        setCurrentProperty((prev) => ({...prev, localizacao: { ...prev.localizacao, cidade: cityName, ...(resetNeighborhood && { bairro: '' }) } }));
        setIsLoadingNeighborhoods(true);
        setNeighborhoods([]);
        if (cityName) {
            const selectedCity = cities.find(c => c.nome === cityName);
            const stateId = states.find(s => s.sigla === currentProperty.localizacao?.estado)?.id;
            if (selectedCity || (stateId && cityName)) {
                const cityId = selectedCity ? selectedCity.id : 0; 
                const neighborhoodsData = await getNeighborhoodsByCity(cityId, cityName);
                setNeighborhoods(neighborhoodsData);
            }
        }
        setIsLoadingNeighborhoods(false);
    };
    
    const handleInputChange = (section: keyof Property | 'slug' | 'builderId' | 'isVisibleOnSite' | 'youtubeVideoUrl' | 'seoTitle' | 'seoDescription' | 'seoKeywords', field: string, value: any) => {
        setCurrentProperty(prev => {
            const newState: Partial<Property> = { ...prev };
            if (['slug', 'builderId', 'isVisibleOnSite', 'youtubeVideoUrl', 'seoTitle', 'seoDescription', 'seoKeywords'].includes(section)) {
                (newState as any)[section] = value;
                return newState;
            }

            if (typeof newState[section as keyof Property] === 'object' && newState[section as keyof Property] !== null && !Array.isArray(newState[section as keyof Property])) {
                let processedValue = value;
                if (section === 'informacoesbasicas' && field === 'valor') {
                    processedValue = value === '' ? undefined : Number(value);
                }
                if (section === 'informacoesbasicas' && field === 'nome' && !isEditing) {
                    const newSlug = slugify(value);
                    newState.slug = newSlug;
                }
                (newState[section as keyof Property] as any)[field] = processedValue;
            } else {
                (newState as any)[section] = value;
            }
            return newState;
        });
    };

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
                    unidades: { ...prev.caracteristicasimovel?.unidades, quartos: newBedrooms }
                }
            };
        });
    };

    const handleAddItemToArray = (field: 'areascomuns' | 'proximidades' | 'midia') => {
        const inputMap = { areascomuns: areaComumInput, proximidades: proximidadeInput, midia: midiaInput };
        const setInputMap = { areascomuns: setAreaComumInput, proximidades: setProximidadeInput, midia: setMidiaInput };
        
        const inputState = inputMap[field];
        if (!inputState.trim()) return;

        setCurrentProperty(prev => ({ ...prev, [field]: [...((prev[field as keyof Property] as any[]) || []), inputState] }));
        setInputMap[field]('');
    };

    const handleRemoveItemFromArray = (field: keyof Property, index: number) => {
        setCurrentProperty(prev => {
            const currentArray = (prev[field] as any[]) || [];
            return { ...prev, [field]: currentArray.filter((_: any, i: number) => i !== index) };
        });
    };
    
    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, field: keyof Property['documentacao']) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setIsUploading(field);
        try {
            const path = `properties/${currentProperty.id || 'new_property'}/${field}`;
            const downloadURL = await uploadFile(file, path);
            handleInputChange('documentacao', field, downloadURL);
            toast({ title: 'Arquivo carregado!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no Upload' });
        } finally {
            setIsUploading(null);
        }
    };

    const handlePersonaChange = (personaId: string, isChecked: boolean) => {
        setCurrentProperty(prev => {
            const currentPersonas = prev.personaIds || [];
            const newPersonas = isChecked ? [...currentPersonas, personaId] : currentPersonas.filter(id => id !== personaId);
            return { ...prev, personaIds: newPersonas };
        });
    };
    
    const displayBedrooms = (bedrooms: string[] | string | undefined) => {
        if (!bedrooms) return 'não informado';
        if (Array.isArray(bedrooms)) {
            if (bedrooms.length === 0) return 'não informado';
            return bedrooms.join(' e ');
        }
        return bedrooms;
    };

    const onGenerateSeo = async () => {
        setIsGeneratingSeo(true);
        const result = await handleGeneratePropertySeo({
            nome: currentProperty.informacoesbasicas?.nome || '',
            tipo: currentProperty.caracteristicasimovel?.tipo || '',
            cidade: currentProperty.localizacao?.cidade || '',
            estado: currentProperty.localizacao?.estado || '',
            quartos: displayBedrooms(currentProperty.caracteristicasimovel?.unidades?.quartos),
            descricao: currentProperty.informacoesbasicas?.descricao || ''
        });
        if (result.success && result.data) {
            setCurrentProperty(prev => ({
                ...prev,
                seoTitle: result.data!.title,
                seoDescription: result.data!.description,
                seoKeywords: result.data!.keywords,
            }));
            toast({ title: "SEO Gerado!", description: "Os campos de SEO foram preenchidos." });
        } else {
            toast({ variant: 'destructive', title: 'Falha na Geração', description: result.error });
        }
        setIsGeneratingSeo(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentProperty.informacoesbasicas?.nome || !currentProperty.builderId) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome do Imóvel e Construtora são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);
        
        const builder = builders.find(b => b.id === currentProperty.builderId);
        const propertyData: Partial<Property> = { 
            ...currentProperty,
            contato: {
                ...currentProperty.contato,
                construtora: builder?.name || ''
            }
        };
        if (!propertyData.slug) propertyData.slug = slugify(propertyData.informacoesbasicas.nome);
        
        try {
            if (isEditing) {
                const propertyRef = doc(db, 'properties', currentProperty.id!);
                await updateDoc(propertyRef, propertyData);
                toast({ title: 'Imóvel Atualizado!' });
            } else {
                await addDoc(collection(db, 'properties'), { ...propertyData, createdAt: Timestamp.now() });
                toast({ title: 'Imóvel Salvo!' });
            }
            onSave();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</DialogTitle>
                <DialogDescription>
                    {isEditing ? `Alterando dados do imóvel: ${currentProperty?.informacoesbasicas?.nome || ''}` : 'Preencha os dados do novo empreendimento.'}
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 space-y-8 py-4">
                <Accordion type="multiple" className="w-full space-y-4" defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7', 'item-8', 'item-9', 'item-10', 'item-11']}>
                    
                    <AccordionItem value="item-1" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Informações Básicas</AccordionTrigger>
                        <AccordionContent className="pt-6 grid md:grid-cols-2 gap-4">
                            {panelUserType === 'admin' && (
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Construtora*</Label>
                                    <Select 
                                        onValueChange={(value) => handleInputChange('builderId', '', value)} 
                                        value={currentProperty.builderId || ''} 
                                        required
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecione a construtora" /></SelectTrigger>
                                        <SelectContent>
                                            {builders.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2"><Label>Nome do Imóvel*</Label><Input value={currentProperty.informacoesbasicas?.nome || ''} onChange={e => handleInputChange('informacoesbasicas', 'nome', e.target.value)} required /></div>
                            <div className="space-y-2"><Label>URL Amigável (slug)</Label><Input value={currentProperty.slug || ''} onChange={e => handleInputChange('slug', '', e.target.value)} /></div>
                            <div className="space-y-2 md:col-span-2"><Label>Descrição*</Label><Textarea value={currentProperty.informacoesbasicas?.descricao || ''} onChange={e => handleInputChange('informacoesbasicas', 'descricao', e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Slogan</Label><Input value={currentProperty.informacoesbasicas?.slogan || ''} onChange={e => handleInputChange('informacoesbasicas', 'slogan', e.target.value)} /></div>
                            <div className="space-y-2">
                                <Label>Valor (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" value={currentProperty.informacoesbasicas?.valor || ''} onChange={e => handleInputChange('informacoesbasicas', 'valor', e.target.value)} placeholder="550000.00" className="pl-9"/>
                                </div>
                            </div>
                            <div className="space-y-2"><Label>Status</Label><Input value={currentProperty.informacoesbasicas?.status || ''} onChange={e => handleInputChange('informacoesbasicas', 'status', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Previsão de Entrega</Label><Input value={currentProperty.informacoesbasicas?.previsaoentrega || ''} onChange={e => handleInputChange('informacoesbasicas', 'previsaoentrega', e.target.value)} /></div>
                            <div className="flex items-center space-x-2 pt-4 md:col-span-2"><Switch id="isVisibleOnSite" name="isVisibleOnSite" checked={currentProperty.isVisibleOnSite} onCheckedChange={c=>handleInputChange('isVisibleOnSite', '', c)} /><Label htmlFor="isVisibleOnSite">Visível no site público</Label></div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-2" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Localização</AccordionTrigger>
                        <AccordionContent className="pt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Estado</Label><Select onValueChange={(value) => handleStateChange(value)} value={currentProperty.localizacao?.estado || ''}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{states.map(s=><SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Cidade</Label><Select onValueChange={(value) => handleCityChange(value)} value={currentProperty.localizacao?.cidade || ''} disabled={!currentProperty.localizacao?.estado}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{cities.map(c=><SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Bairro</Label><Select onValueChange={value => handleInputChange('localizacao', 'bairro', value)} value={currentProperty.localizacao?.bairro || ''} disabled={!currentProperty.localizacao?.cidade}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{neighborhoods.map(n=><SelectItem key={n.id} value={n.nome}>{n.nome}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Link Google Maps (incorporar/embed)</Label><Textarea value={currentProperty.localizacao?.googleMapsLink || ''} onChange={e => handleInputChange('localizacao', 'googleMapsLink', e.target.value)} /></div>
                            <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Link Street View (incorporar/embed)</Label><Textarea value={currentProperty.localizacao?.googleStreetViewLink || ''} onChange={e => handleInputChange('localizacao', 'googleStreetViewLink', e.target.value)} /></div>
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="item-3" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Características do Imóvel</AccordionTrigger>
                        <AccordionContent className="pt-6 grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2"><Label>Tipo de Imóvel</Label><Select onValueChange={v => handleInputChange('caracteristicasimovel', 'tipo', v)} value={currentProperty.caracteristicasimovel?.tipo || ''}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{propertyTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Tamanho (m²)</Label><Input value={currentProperty.caracteristicasimovel?.tamanho || ''} onChange={e => handleInputChange('caracteristicasimovel', 'tamanho', e.target.value)} placeholder="Ex: 75m² ou 55 - 75m²"/></div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2"><Label>Quartos</Label><div className="flex flex-wrap gap-x-6 gap-y-2">{bedroomOptions.map(o=><div key={o} className="flex items-center space-x-2"><Checkbox id={`bed-${o}`} checked={Array.isArray(currentProperty.caracteristicasimovel?.unidades?.quartos) && currentProperty.caracteristicasimovel.unidades.quartos.includes(o)} onCheckedChange={c=>handleBedroomChange(o, !!c)} /><Label htmlFor={`bed-${o}`} className="font-normal">{o}</Label></div>)}</div></div>
                                <div className="space-y-2"><Label>Vagas de Garagem</Label><Select onValueChange={v => handleInputChange('caracteristicasimovel', 'unidades', { ...currentProperty.caracteristicasimovel?.unidades, vagasgaragem: v })} value={currentProperty.caracteristicasimovel?.unidades?.vagasgaragem || ''}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{garageOptions.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-10" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Mídia</AccordionTrigger>
                        <AccordionContent className="pt-6 space-y-4">
                            <div className="space-y-2"><Label>URL do Vídeo (YouTube, Vimeo, etc.)</Label><Input value={currentProperty.youtubeVideoUrl || ''} onChange={e => handleInputChange('youtubeVideoUrl', '', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></div>
                            <div className="space-y-2"><Label>Links de Imagens</Label><div className="flex gap-2 mb-2"><Input value={midiaInput} onChange={e => setMidiaInput(e.target.value)} placeholder="https://.../imagem.jpg" /><Button type="button" onClick={() => handleAddItemToArray('midia')}>Adicionar</Button></div><div className="space-y-2">{currentProperty.midia?.map((item, index) => (<div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md"><span className="truncate text-xs">{item}</span><Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItemFromArray('midia', index)}><Trash2 className="h-4 w-4" /></Button></div>))}</div></div>
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="item-4" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">SEO</AccordionTrigger>
                        <AccordionContent className="pt-6 space-y-4">
                            <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={onGenerateSeo} disabled={isGeneratingSeo}>{isGeneratingSeo ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2"/>}Gerar com IA</Button></div>
                            <div className="space-y-2"><Label>Meta Title</Label><Input value={currentProperty.seoTitle || ''} onChange={e => handleInputChange('seoTitle', '', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Meta Description</Label><Textarea value={currentProperty.seoDescription || ''} onChange={e => handleInputChange('seoDescription', '', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Palavras-chave</Label><Input value={currentProperty.seoKeywords || ''} onChange={e => handleInputChange('seoKeywords', '', e.target.value)} /></div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Áreas Comuns</AccordionTrigger>
                        <AccordionContent className="pt-6 space-y-4">
                          <div className="space-y-2"><Label>Adicionar Área</Label><div className="flex gap-2 mb-2"><Input value={areaComumInput} onChange={e => setAreaComumInput(e.target.value)} placeholder="Ex: Academia" /><Button type="button" onClick={() => handleAddItemToArray('areascomuns')}>Adicionar</Button></div></div>
                          <div className="space-y-2">{currentProperty.areascomuns?.map((item, index) => (<div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md"><span className="text-sm">{item}</span><Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItemFromArray('areascomuns', index)}><X className="h-4 w-4" /></Button></div>))}</div>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Proximidades</AccordionTrigger>
                        <AccordionContent className="pt-6 space-y-4">
                          <div className="space-y-2"><Label>Adicionar Proximidade</Label><div className="flex gap-2 mb-2"><Input value={proximidadeInput} onChange={e => setProximidadeInput(e.target.value)} placeholder="Ex: Supermercado" /><Button type="button" onClick={() => handleAddItemToArray('proximidades')}>Adicionar</Button></div></div>
                          <div className="space-y-2">{currentProperty.proximidades?.map((item, index) => (<div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md"><span className="text-sm">{item}</span><Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItemFromArray('proximidades', index)}><X className="h-4 w-4" /></Button></div>))}</div>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-7" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Status da Obra (%)</AccordionTrigger>
                        <AccordionContent className="pt-6 grid md:grid-cols-3 gap-4">
                          {['fundacao', 'estrutura', 'alvenaria', 'revestimentointerno', 'fachada', 'acabamentos'].map(field => (
                            <div key={field} className="space-y-2">
                              <Label className="capitalize">{field.replace('revestimentointerno', 'revest. interno')}</Label>
                              <Input type="number" min="0" max="100" value={(currentProperty.statusobra as any)?.[field] || ''} onChange={e => handleInputChange('statusobra', field, e.target.value)} />
                            </div>
                          ))}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-8" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Documentação (PDF)</AccordionTrigger>
                        <AccordionContent className="pt-6 grid md:grid-cols-2 gap-6">
                            {(['memorialdescritivo', 'alvaraconstrucao', 'bookimovel', 'registroincorporacao', 'tabelaprecos'] as const).map(field => (
                                <div key={field} className="space-y-2">
                                    <Label htmlFor={field} className="capitalize">{field.replace('registroincorporacao', 'Reg. Incorporação').replace('alvaraconstrucao', 'Alvará')}</Label>
                                    <Input id={field} type="file" onChange={e => handleFileUpload(e, field)} disabled={isUploading !== null} />
                                    {isUploading === field && <p className="text-xs flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-3 w-3"/>Enviando...</p>}
                                    {currentProperty.documentacao?.[field] && <a href={currentProperty.documentacao[field]} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Ver arquivo atual</a>}
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-9" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Contato</AccordionTrigger>
                        <AccordionContent className="pt-6 grid md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Telefone</Label><Input value={currentProperty.contato?.telefone || ''} onChange={e => handleInputChange('contato', 'telefone', e.target.value)} /></div>
                            <div className="space-y-2"><Label>WhatsApp</Label><Input value={currentProperty.contato?.whatsapp || ''} onChange={e => handleInputChange('contato', 'whatsapp', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" value={currentProperty.contato?.email || ''} onChange={e => handleInputChange('contato', 'email', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Website</Label><Input value={currentProperty.contato?.website || ''} onChange={e => handleInputChange('contato', 'website', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Facebook</Label><Input value={currentProperty.contato?.redessociais?.facebook || ''} onChange={e => handleInputChange('contato', 'redessociais', { ...currentProperty.contato?.redessociais, facebook: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Instagram</Label><Input value={currentProperty.contato?.redessociais?.instagram || ''} onChange={e => handleInputChange('contato', 'redessociais', { ...currentProperty.contato?.redessociais, instagram: e.target.value })} /></div>
                            <div className="space-y-2 md:col-span-2"><Label>YouTube</Label><Input value={currentProperty.contato?.redessociais?.youtube || ''} onChange={e => handleInputChange('contato', 'redessociais', { ...currentProperty.contato?.redessociais, youtube: e.target.value })} /></div>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-11" className="border rounded-lg p-4">
                        <AccordionTrigger className="text-lg font-semibold py-0">Personas</AccordionTrigger>
                        <AccordionContent className="pt-6 space-y-2">
                            <Label>Selecione as personas para este imóvel</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {personas.map(persona => (
                                    <div key={persona.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`persona-${persona.id}`}
                                            checked={currentProperty.personaIds?.includes(persona.id)}
                                            onCheckedChange={(checked) => handlePersonaChange(persona.id, !!checked)}
                                        />
                                        <Label htmlFor={`persona-${persona.id}`} className="font-normal">{persona.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                  </Accordion>
            </div>
             <DialogFooter className="pt-4 border-t mt-auto">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Imóvel'}</Button>
             </DialogFooter>
        </form>
    );
}
