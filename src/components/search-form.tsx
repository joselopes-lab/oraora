
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { collection, getDocs, query, where, Query, DocumentData, doc, documentId, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationContext } from '@/context/location-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { queryInBatches } from '@/lib/firestoreUtils';
import { Input } from './ui/input';

interface SearchFormProps {
    isHomePage?: boolean;
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


export default function SearchForm({ isHomePage = false }: SearchFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedState } = useContext(LocationContext);

    const [city, setCity] = useState(searchParams.get('cidade') || '');
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [bedrooms, setBedrooms] = useState(searchParams.get('quartos') || '');
    const [valorMin, setValorMin] = useState(searchParams.get('valorMin') || '');
    const [valorMax, setValorMax] = useState(searchParams.get('valorMax') || '');
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [propertyStatus, setPropertyStatus] = useState(searchParams.get('status') || '');
    const [garageSpots, setGarageSpots] = useState(searchParams.get('vagas') || '');
    const [commonAreas, setCommonAreas] = useState<string[]>(searchParams.get('areas_comuns')?.split(',') || []);

    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPropertiesAndSetState = async () => {
            if (!selectedState) return;

            setIsLoading(true);

            const buildersQuery = query(collection(db, 'builders'), where('isVisibleOnSite', '==', true));
            const buildersSnapshot = await getDocs(buildersQuery);
            const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

            if (visibleBuilderIds.length === 0) {
                setAllProperties([]);
                setIsLoading(false);
                return;
            }

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
            setIsLoading(false);
        };
        fetchPropertiesAndSetState();
    }, [selectedState]);
    
     useEffect(() => {
        setCity(searchParams.get('cidade') || '');
        setNeighborhoods(searchParams.get('bairro')?.split(',').filter(Boolean) || []);
        setBedrooms(searchParams.get('quartos') || '');
        setPropertyTypes(searchParams.get('tipo')?.split(',').filter(Boolean) || []);
        setPropertyStatus(searchParams.get('status') || '');
        setGarageSpots(searchParams.get('vagas') || '');
        setCommonAreas(searchParams.get('areas_comuns')?.split(',').filter(Boolean) || []);
        setValorMin(searchParams.get('valorMin') || '');
        setValorMax(searchParams.get('valorMax') || '');

    }, [searchParams, selectedState]);


    const availableCities = useMemo(() => {
        if (!selectedState) return [];
        const cities = new Set(allProperties.map(p => p.localizacao.cidade).filter(Boolean));
        return Array.from(cities).sort();
    }, [allProperties, selectedState]);

    const availableNeighborhoods = useMemo(() => {
        if (!city) return [];
        const neighborhoods = new Set(allProperties.filter(p => p.localizacao.cidade === city).map(p => p.localizacao.bairro).filter(Boolean));
        return Array.from(neighborhoods).sort();
    }, [allProperties, city]);

    const availablePropertyTypes = useMemo(() => {
        if (isLoading) return [];
        const typesToExclude = ["Studios, Gardens, Flats e Beach Houses"];
        const types = new Set(allProperties.map(p => p.caracteristicasimovel?.tipo).filter(Boolean).filter(t => !typesToExclude.includes(t!)));
        return Array.from(types).sort();
    }, [allProperties, isLoading]);

    const availablePropertyStatuses = useMemo(() => {
        if (isLoading) return [];
        const statuses = new Set(allProperties.map(p => p.informacoesbasicas?.status).filter(Boolean));
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
        if (selectedState) params.set('estado', selectedState.sigla);
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
        
        router.push(`/imoveis?${params.toString()}`);
    };
    
    const labelBaseClass = 'text-foreground text-sm font-medium';
    
    const bedroomButtons = bedroomOptions.slice(0, 4);
    const garageButtons = garageOptions.slice(0, 4);

    if (isHomePage) {
        return (
             <form onSubmit={handleSubmit} className="grid gap-4 items-end grid-cols-1">
                <div className="space-y-1">
                    <Select onValueChange={handleCityChange} value={city}>
                        <SelectTrigger className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12">
                            <SelectValue placeholder="Cidade" />
                        </SelectTrigger>
                        <SelectContent>
                           {availableCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2" disabled={!city}>
                    <AccordionItem value="bairro" className="border-none">
                       <AccordionTrigger className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12 px-3 rounded-md hover:no-underline data-[state=open]:rounded-b-none disabled:opacity-50 disabled:cursor-not-allowed">
                           {neighborhoods.length > 0 ? `${neighborhoods.length} bairro(s)`: 'Bairro'}
                       </AccordionTrigger>
                       <AccordionContent className="bg-white p-4 rounded-b-md max-h-48 overflow-y-auto">
                           <div className="space-y-2">
                            {availableNeighborhoods.map(n => (
                                <div key={n} className="flex items-center gap-2">
                                    <Checkbox id={`hp-bairro-${n}`} checked={neighborhoods.includes(n!)} onCheckedChange={() => handleNeighborhoodChange(n!)} />
                                    <Label htmlFor={`hp-bairro-${n}`} className="font-normal">{n}</Label>
                                </div>
                            ))}
                           </div>
                       </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <Accordion type="single" collapsible className="w-full space-y-2">
                    <AccordionItem value="property-type" className="border-none">
                        <AccordionTrigger className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12 px-3 rounded-md hover:no-underline data-[state=open]:rounded-b-none">
                            {propertyTypes.length > 0 ? `${propertyTypes.length} tipo(s)`: 'Tipo de Imóvel'}
                        </AccordionTrigger>
                        <AccordionContent className="bg-white p-4 rounded-b-md max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                                {availablePropertyTypes.map(type => (
                                    <div key={type} className="flex items-center gap-2">
                                        <Checkbox id={`hp-type-${type}`} checked={propertyTypes.includes(type!)} onCheckedChange={() => handlePropertyTypeChange(type!)} />
                                        <Label htmlFor={`hp-type-${type}`} className="font-normal">{type}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div className="space-y-2">
                    <Label className="text-black text-sm font-medium px-1">Nº de Quartos</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {bedroomButtons.map(option => (
                            <Button
                                key={option.value}
                                type="button"
                                variant={bedrooms === option.value ? "secondary" : "outline"}
                                onClick={() => setBedrooms(bedrooms === option.value ? '' : option.value)}
                                className={cn(
                                    "font-normal h-12 bg-white/90 border-0 text-black",
                                    bedrooms === option.value && "bg-black text-white"
                                )}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-black text-sm font-medium px-1">Faixa de Preço</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            placeholder="A partir de"
                            value={formatCurrency(valorMin)}
                            onChange={(e) => setValorMin(unformatCurrency(e.target.value))}
                            className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"
                        />
                        <Input
                            placeholder="No máximo"
                            value={formatCurrency(valorMax)}
                            onChange={(e) => setValorMax(unformatCurrency(e.target.value))}
                            className="bg-white/90 text-black placeholder:text-gray-500 border-0 h-12"
                        />
                    </div>
                </div>
                <Button type="submit" className="w-full bg-black text-white hover:bg-black/80 h-12 text-base" size="lg">
                    <Search className="mr-2 h-5 w-5"/>
                    Explorar agora
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Accordion type="single" collapsible className="w-full space-y-1">
                <AccordionItem value="property-type" className="border-none">
                    <Label className={cn(labelBaseClass, isLoading && "text-muted-foreground")}>Tipo de Imóvel</Label>
                    <AccordionTrigger className="bg-white text-sm mt-1 flex h-10 w-full items-center justify-between rounded-md px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:no-underline data-[state=open]:rounded-b-none">
                        {propertyTypes.length > 0 ? `${propertyTypes.length} tipo(s) selecionado(s)`: 'Todos os tipos'}
                    </AccordionTrigger>
                    <AccordionContent className="bg-white p-4 rounded-b-md max-h-48 overflow-y-auto border border-t-0">
                        <div className="space-y-2">
                            {availablePropertyTypes.map(type => (
                                <div key={type} className="flex items-center gap-2">
                                    <Checkbox id={`type-${type}`} checked={propertyTypes.includes(type!)} onCheckedChange={() => handlePropertyTypeChange(type!)} />
                                    <Label htmlFor={`type-${type}`} className="font-normal">{type}</Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
             <div className="space-y-1">
                <Label htmlFor="search-status" className={cn(labelBaseClass)}>Status</Label>
                <Select onValueChange={setPropertyStatus} value={propertyStatus}>
                    <SelectTrigger id="search-status" className="bg-white">
                        <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePropertyStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-1">
                <Label htmlFor="search-city" className={cn(labelBaseClass)}>Cidade</Label>
                <Select onValueChange={handleCityChange} value={city}>
                    <SelectTrigger id="search-city" className="bg-white">
                        <SelectValue placeholder="Todas as cidades" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-1" disabled={!city || isLoading}>
                <AccordionItem value="bairro" className="border-none">
                    <Label className={cn(labelBaseClass, (!city || isLoading) && "text-muted-foreground")}>Bairro</Label>
                    <AccordionTrigger className="bg-white text-sm mt-1 flex h-10 w-full items-center justify-between rounded-md px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:no-underline data-[state=open]:rounded-b-none">
                         {!city ? 'Selecione uma cidade' : neighborhoods.length > 0 ? `${neighborhoods.length} bairro(s)`: 'Todos os bairros'}
                    </AccordionTrigger>
                    <AccordionContent className="bg-white p-4 rounded-b-md max-h-48 overflow-y-auto border border-t-0">
                        <div className="space-y-2">
                        {availableNeighborhoods.map(n => (
                            <div key={n} className="flex items-center gap-2">
                                <Checkbox id={`bairro-${n}`} checked={neighborhoods.includes(n!)} onCheckedChange={() => handleNeighborhoodChange(n!)} />
                                <Label htmlFor={`bairro-${n}`} className="font-normal">{n}</Label>
                            </div>
                        ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <div className="space-y-1">
                <Label className={cn(labelBaseClass)}>Faixa de Preço</Label>
                 <div className="grid grid-cols-2 gap-2">
                     <Input
                        placeholder="A partir de"
                        value={formatCurrency(valorMin)}
                        onChange={(e) => setValorMin(unformatCurrency(e.target.value))}
                        className="bg-white"
                    />
                     <Input
                        placeholder="No máximo"
                        value={formatCurrency(valorMax)}
                        onChange={(e) => setValorMax(unformatCurrency(e.target.value))}
                        className="bg-white"
                    />
                </div>
            </div>
             <div className="space-y-2">
                <Label className={cn(labelBaseClass)}>Nº de Quartos</Label>
                <div className="grid grid-cols-4 gap-2">
                    {bedroomButtons.map(option => (
                        <Button
                            key={option.value}
                            type="button"
                            variant={bedrooms === option.value ? "secondary" : "outline"}
                            onClick={() => setBedrooms(bedrooms === option.value ? '' : option.value)}
                            className="font-normal"
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label className={cn(labelBaseClass)}>Vagas de Garagem</Label>
                 <div className="grid grid-cols-4 gap-2">
                    {garageButtons.map(option => (
                        <Button
                            key={option.value}
                            type="button"
                            variant={garageSpots === option.value ? "secondary" : "outline"}
                            onClick={() => setGarageSpots(garageSpots === option.value ? '' : option.value)}
                             className="font-normal"
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
            <Accordion type="single" collapsible>
                <AccordionItem value="areas-comuns" className="border-none">
                    <AccordionTrigger className="p-0 text-base font-medium hover:no-underline">Áreas Comuns</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="flex flex-wrap gap-2">
                             {mainCommonAreas.map(area => (
                                <Button
                                    key={area}
                                    type="button"
                                    variant={commonAreas.includes(area) ? "secondary" : "outline"}
                                    onClick={() => handleCommonAreaChange(area)}
                                    className="font-normal rounded-full"
                                >
                                    {area}
                                </Button>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Button type="submit" className="w-full" size="lg">
                <Search className="mr-2 h-5 w-5"/>
                Buscar
            </Button>
        </form>
    );
}
