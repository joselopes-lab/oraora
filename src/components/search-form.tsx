
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { type Property } from '@/app/dashboard/properties/page';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationContext } from '@/context/location-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from './ui/dropdown-menu';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryInBatches } from '@/lib/firestoreUtils';

interface SearchFormProps {
    isHomePage?: boolean;
    properties?: Property[];
    brokerId?: string;
    onSearch?: () => void;
}

const bedroomOptions = [
    { value: "1", label: "+1" },
    { value: "2", label: "+2" },
    { value: "3", label: "+3" },
    { value: "4", label: "+4" },
    { value: "5+", label: "+5" }
];

const garageOptions = [
    { value: "1", label: "+1" },
    { value: "2", label: "+2" },
    { value: "3", label: "+3" },
    { value: "4+", label: "+4" }
];

const mainCommonAreas = [
    "Academia",
    "Brinquedoteca",
    "Piscina",
    "Salão de Festas",
    "Salão de Jogos",
    "Espaço Gourmet",
    "Espaço Pet",
];

const formatCurrency = (value: string) => {
    if (!value) return '';
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numberValue);
};

const unformatCurrency = (value: string) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
};

const allPropertyTypes = ["Apartamento", "Casa em Condomínio", "Casa", "Flat", "Terreno", "Sala Comercial", "Loja"];

export default function SearchForm({ isHomePage = false, properties: providedProperties, brokerId, onSearch }: SearchFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedState } = useContext(LocationContext);

    const [allProperties, setAllProperties] = useState<Property[]>(providedProperties || []);
    const [isLoading, setIsLoading] = useState(!providedProperties);

    const [city, setCity] = useState(searchParams.get('cidade') || '');
    const [neighborhoods, setNeighborhoods] = useState<string[]>(searchParams.get('bairro')?.split(',').filter(Boolean) || []);
    const [bedrooms, setBedrooms] = useState(searchParams.get('quartos') || '');
    const [valorMin, setValorMin] = useState(searchParams.get('valorMin') || '');
    const [valorMax, setValorMax] = useState(searchParams.get('valorMax') || '');
    const [propertyTypes, setPropertyTypes] = useState<string[]>(searchParams.get('tipo')?.split(',').filter(Boolean) || []);
    const [propertyStatus, setPropertyStatus] = useState(searchParams.get('status') || '');
    const [garageSpots, setGarageSpots] = useState(searchParams.get('vagas') || '');
    const [commonAreas, setCommonAreas] = useState<string[]>(searchParams.get('areas_comuns')?.split(',') || []);
    
    useEffect(() => {
        if (providedProperties) {
            setAllProperties(providedProperties);
            setIsLoading(false);
        } else if (selectedState) {
            // Fetch properties if not provided (for modal case)
            const fetchPropertiesForModal = async () => {
                setIsLoading(true);
                const buildersSnapshot = await getDocs(query(collection(db, 'builders'), where('isVisibleOnSite', '==', true)));
                const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

                if (visibleBuilderIds.length > 0) {
                     const propsData = await queryInBatches<Property>(
                        'properties', 
                        'builderId', 
                        visibleBuilderIds,
                        [
                            where('localizacao.estado', '==', selectedState.sigla),
                            where('isVisibleOnSite', '==', true),
                        ]
                    );
                    setAllProperties(propsData);
                } else {
                    setAllProperties([]);
                }
                setIsLoading(false);
            };
            fetchPropertiesForModal();
        }
    }, [providedProperties, selectedState]);


     useEffect(() => {
        const paramsCity = searchParams.get('cidade') || '';
        const paramsNeighborhoods = searchParams.get('bairro')?.split(',').filter(Boolean) || [];

        setCity(paramsCity);
        setNeighborhoods(paramsNeighborhoods);
        setBedrooms(searchParams.get('quartos') || '');
        setPropertyTypes(searchParams.get('tipo')?.split(',').filter(Boolean) || []);
        setPropertyStatus(searchParams.get('status') || '');
        setGarageSpots(searchParams.get('vagas') || '');
        setCommonAreas(searchParams.get('areas_comuns')?.split(',').filter(Boolean) || []);
        setValorMin(searchParams.get('valorMin') || '');
        setValorMax(searchParams.get('valorMax') || '');

    }, [searchParams]);


    const availableCities = useMemo(() => {
        const citiesSet = new Set(allProperties.map(p => p.localizacao.cidade).filter(c => c && c.trim() !== ''));
        const searchCity = searchParams.get('cidade');
        if (searchCity && !citiesSet.has(searchCity)) {
            citiesSet.add(searchCity);
        }
        return Array.from(citiesSet).sort();
    }, [allProperties, searchParams]);

    const availableNeighborhoods = useMemo(() => {
        if (!city) return [];
        const neighborhoodsSet = new Set(allProperties.filter(p => p.localizacao.cidade === city).map(p => p.localizacao.bairro).filter(n => n && n.trim() !== ''));
        return Array.from(neighborhoodsSet).sort();
    }, [allProperties, city]);

    const availablePropertyStatuses = useMemo(() => {
        if (isLoading) return [];
        const statuses = new Set(allProperties.map(p => p.informacoesbasicas?.status).filter(s => s && s.trim() !== ''));
        return Array.from(statuses).sort();
    }, [allProperties, isLoading]);

    const handleCityChange = (cityName: string) => {
        setCity(cityName);
        setNeighborhoods([]);
    };
    
    const handleNeighborhoodChange = (neighborhoodName: string) => {
        setNeighborhoods(prev => {
            const newNeighborhoods = new Set(prev);
            if(newNeighborhoods.has(neighborhoodName)) {
                newNeighborhoods.delete(neighborhoodName)
            } else {
                newNeighborhoods.add(neighborhoodName)
            }
            return Array.from(newNeighborhoods);
        });
    };

    const handlePropertyTypeChange = (type: string) => {
        setPropertyTypes(prev => {
            const newTypes = new Set(prev);
            if (newTypes.has(type)) {
                newTypes.delete(type);
            } else {
                newTypes.add(type);
            }
            return Array.from(newTypes);
        });
    };

    const handleCommonAreaChange = (area: string) => {
        setCommonAreas(prev => {
            const newAreas = new Set(prev);
            if (newAreas.has(area)) {
                newAreas.delete(area);
            } else {
                newAreas.add(area);
            }
            return Array.from(newAreas);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (selectedState && !brokerId) params.set('estado', selectedState.sigla); // Don't set state for broker search
        if (city) params.set('cidade', city);
        if (neighborhoods.length > 0) params.set('bairro', neighborhoods.join(','));
        if (bedrooms) params.set('quartos', bedrooms);
        if (propertyTypes.length > 0) params.set('tipo', propertyTypes.join(','));
        if (propertyStatus) params.set('status', propertyStatus);
        if (garageSpots) params.set('vagas', garageSpots);
        if (commonAreas.length > 0) params.set('areas_comuns', commonAreas.join(','));
        
        const min = unformatCurrency(valorMin);
        const max = unformatCurrency(valorMax);
        if (min) params.set('valorMin', min);
        if (max) params.set('valorMax', max);
        
        const searchPath = brokerId ? `/corretor/${brokerId}/imoveis` : '/imoveis';
        router.push(`${searchPath}?${params.toString()}`);

        if (onSearch) {
            onSearch();
        }
    };
    
    const labelBaseClass = 'text-foreground text-sm font-medium';
    
    const bedroomButtons = bedroomOptions.slice(0, 5);

    if (isHomePage) {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="city" className={cn(labelBaseClass, 'text-black')}>Cidade</Label>
                    <Select onValueChange={handleCityChange} value={city} disabled={isLoading}>
                        <SelectTrigger id="city" className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"><SelectValue placeholder="Selecione uma cidade" /></SelectTrigger>
                        <SelectContent>
                            {availableCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label className={cn(labelBaseClass, 'text-black')}>Bairro</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start font-normal bg-white/90 text-black placeholder:text-gray-500 border-0 h-12 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!city}>
                                {neighborhoods.length > 0 ? `${neighborhoods.length} bairro(s) selecionado(s)` : 'Selecione um ou mais bairros'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                            <div className="p-2 space-y-1">
                                {availableNeighborhoods.map(n => (
                                    <div key={n} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted">
                                        <Checkbox id={`hp-bairro-${n}`} checked={neighborhoods.includes(n!)} onCheckedChange={() => handleNeighborhoodChange(n!)} />
                                        <Label htmlFor={`hp-bairro-${n}`} className="font-normal w-full cursor-pointer">{n}</Label>
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="space-y-2">
                    <Label className={cn(labelBaseClass, 'text-black')}>Nº de Quartos</Label>
                    <div className="flex flex-wrap gap-2">
                        {bedroomButtons.map(opt => (
                            <Button 
                                key={opt.value} 
                                type="button" 
                                variant={bedrooms === opt.value ? 'default': 'outline'} 
                                onClick={() => setBedrooms(bedrooms === opt.value ? '' : opt.value)} 
                                className={cn(
                                    "bg-white/90 text-black",
                                    bedrooms === opt.value && "bg-black text-white hover:bg-black/90"
                                )}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label className={cn(labelBaseClass, 'text-black')}>Faixa de Preço</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            placeholder="Mínimo"
                            value={formatCurrency(valorMin)}
                            onChange={(e) => setValorMin(unformatCurrency(e.target.value))}
                            className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"
                        />
                        <Input
                            placeholder="Máximo"
                            value={formatCurrency(valorMax)}
                            onChange={(e) => setValorMax(unformatCurrency(e.target.value))}
                            className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"
                        />
                    </div>
                </div>
                <Button type="submit" className="w-full !mt-6 bg-black text-white hover:bg-black/80 h-12 text-base" size="lg">
                    <Search className="mr-2 h-5 w-5"/>
                    Explorar
                </Button>
            </form>
        )
    }

    if (brokerId) {
        return (
             <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-1 w-full md:w-auto md:flex-1">
                    <Label className="text-sm font-medium text-black">Selecione a</Label>
                    <Select onValueChange={handleCityChange} value={city}>
                        <SelectTrigger className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12">
                            <SelectValue placeholder="Cidade" />
                        </SelectTrigger>
                        <SelectContent>
                           {availableCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className='w-full md:w-auto md:flex-1'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12 w-full justify-start font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!city}
                            >
                                {neighborhoods.length > 0 ? `${neighborhoods.length} bairro(s)` : 'Bairro'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                            <div className="p-2 space-y-1">
                                {availableNeighborhoods.map(n => (
                                    <div key={n} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted">
                                        <Checkbox id={`hp-bairro-${n}`} checked={neighborhoods.includes(n!)} onCheckedChange={() => handleNeighborhoodChange(n!)} />
                                        <Label htmlFor={`hp-bairro-${n}`} className="font-normal w-full cursor-pointer">{n}</Label>
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="space-y-1 w-full md:w-auto md:flex-1">
                     <Select onValueChange={setBedrooms} value={bedrooms}>
                        <SelectTrigger className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12">
                            <SelectValue placeholder="Quartos" />
                        </SelectTrigger>
                        <SelectContent>
                           {bedroomOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className='flex items-end gap-2 w-full md:w-auto md:flex-2'>
                     <div className='space-y-1 w-full'>
                         <Label className="text-sm font-medium text-black">Faixa de Preço</Label>
                         <div className="grid grid-cols-2 gap-2">
                             <Input
                                 placeholder="Mínimo"
                                 value={formatCurrency(valorMin)}
                                 onChange={(e) => setValorMin(unformatCurrency(e.target.value))}
                                 className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"
                             />
                             <Input
                                 placeholder="Máximo"
                                 value={formatCurrency(valorMax)}
                                 onChange={(e) => setValorMax(unformatCurrency(e.target.value))}
                                 className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"
                             />
                         </div>
                     </div>
                 </div>
                <Button type="submit" className="w-full md:w-auto bg-black text-white hover:bg-black/80 h-12 text-base" size="lg">
                    <Search className="mr-2 h-5 w-5"/>
                    Buscar
                </Button>
            </form>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="city" className={labelBaseClass}>Cidade</Label>
                <Select onValueChange={handleCityChange} value={city} disabled={isLoading}>
                    <SelectTrigger id="city"><SelectValue placeholder="Selecione uma cidade" /></SelectTrigger>
                    <SelectContent>
                        {availableCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
             <Accordion type="multiple" className="w-full space-y-4">
                 <AccordionItem value="neighborhood" className="border-b-0">
                    <Label className={labelBaseClass}>Bairro</Label>
                    <div className="p-4 border rounded-md mt-2 max-h-60 overflow-y-auto space-y-2">
                        {availableNeighborhoods.map(n => (
                            <div key={n} className="flex items-center gap-2">
                                <Checkbox id={`bairro-${n}`} checked={neighborhoods.includes(n!)} onCheckedChange={() => handleNeighborhoodChange(n!)} />
                                <Label htmlFor={`bairro-${n}`} className="font-normal w-full cursor-pointer">{n}</Label>
                            </div>
                        ))}
                    </div>
                </AccordionItem>
                 <AccordionItem value="type" className="border-b-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="space-y-2 w-full">
                                <Label className={cn(labelBaseClass)}>Tipo de Imóvel</Label>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    {propertyTypes.length > 0 ? `${propertyTypes.length} selecionado(s)` : 'Selecione os tipos'}
                                </Button>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                            {allPropertyTypes.map(type => (
                                <div key={type} className="flex items-center gap-2 p-2">
                                    <Checkbox id={`type-${type}`} checked={propertyTypes.includes(type)} onCheckedChange={() => handlePropertyTypeChange(type)} />
                                    <Label htmlFor={`type-${type}`} className="font-normal w-full cursor-pointer">{type}</Label>
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </AccordionItem>
                 <AccordionItem value="status" className="border-b-0">
                     <div className="space-y-2">
                        <Label htmlFor="status" className={labelBaseClass}>Status do Imóvel</Label>
                        <Select onValueChange={setPropertyStatus} value={propertyStatus} disabled={isLoading}>
                            <SelectTrigger id="status"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                            <SelectContent>
                                {availablePropertyStatuses.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </AccordionItem>
            </Accordion>

            <div className="space-y-2">
                <Label className={labelBaseClass}>Quartos</Label>
                <div className="flex flex-wrap gap-2">
                    {bedroomOptions.map(opt => (
                        <Button key={opt.value} type="button" variant={bedrooms === opt.value ? 'default': 'outline'} onClick={() => setBedrooms(bedrooms === opt.value ? '' : opt.value)}>{opt.label}</Button>
                    ))}
                </div>
            </div>
             <div className="space-y-2">
                <Label className={labelBaseClass}>Vagas na Garagem</Label>
                <div className="flex flex-wrap gap-2">
                    {garageOptions.map(opt => (
                        <Button key={opt.value} type="button" variant={garageSpots === opt.value ? 'default': 'outline'} onClick={() => setGarageSpots(garageSpots === opt.value ? '' : opt.value)}>{opt.label}</Button>
                    ))}
                </div>
            </div>
             <div className="space-y-2">
                <Label className={labelBaseClass}>Faixa de Preço</Label>
                 <div className="grid grid-cols-2 gap-2">
                     <Input placeholder="Mínimo" value={formatCurrency(valorMin)} onChange={e => setValorMin(unformatCurrency(e.target.value))} />
                     <Input placeholder="Máximo" value={formatCurrency(valorMax)} onChange={e => setValorMax(unformatCurrency(e.target.value))} />
                 </div>
            </div>
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="common-areas">
                    <AccordionTrigger className="text-base font-semibold">Áreas Comuns</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {mainCommonAreas.map(area => (
                            <div key={area} className="flex items-center gap-2">
                                <Checkbox id={`area-${area}`} checked={commonAreas.includes(area)} onCheckedChange={() => handleCommonAreaChange(area)} />
                                <Label htmlFor={`area-${area}`} className="font-normal">{area}</Label>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <Button type="submit" className="w-full !mt-8" size="lg">
                <Search className="mr-2 h-4 w-4"/>
                Buscar Imóveis
            </Button>
        </form>
    );
}
