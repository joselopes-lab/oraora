
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { type Property } from '@/app/dashboard/properties/page';
import PublicLayout from '@/components/public-layout';
import { Loader2, ShieldQuestion, ArrowLeft, ImageOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { queryInBatches } from '@/lib/firestoreUtils';


const displayBedrooms = (bedrooms: string[] | string | undefined) => {
    if (!bedrooms || bedrooms.length === 0) return 'N/A';
    if (Array.isArray(bedrooms)) {
      return bedrooms.join(', ');
    }
    return bedrooms;
  };

const formatPrice = (value: number | undefined) => {
    if (value === undefined || value === null) return "Sob consulta";
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

const characteristics = [
    { key: 'status', label: 'Status', path: 'informacoesbasicas.status' },
    { key: 'valor', label: 'Preço', path: 'informacoesbasicas.valor', format: formatPrice },
    { key: 'tipo', label: 'Tipo', path: 'caracteristicasimovel.tipo' },
    { key: 'tamanho', label: 'Tamanho', path: 'caracteristicasimovel.tamanho' },
    { key: 'quartos', label: 'Quartos', path: 'caracteristicasimovel.unidades.quartos', format: displayBedrooms },
    { key: 'vagas', label: 'Vagas', path: 'caracteristicasimovel.unidades.vagasgaragem' },
];

// Helper to get nested property value
const getDeepValue = (obj: any, path: string) => {
    return path.split('.').reduce((o, p) => (o ? o[p] : 'N/A'), obj);
};


function ComparisonTable({ properties }: { properties: Property[] }) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px] font-semibold text-lg">Características</TableHead>
                        {properties.map(prop => (
                            <TableHead key={prop.id} className="min-w-[250px]">
                                <div className="relative h-32 w-full rounded-md overflow-hidden mb-2">
                                  {prop.midia?.[0] ? (
                                    <Image src={prop.midia[0]} alt={prop.informacoesbasicas.nome} fill sizes="33vw" className="object-cover"/>
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center"><ImageOff className="h-8 w-8 text-muted-foreground"/></div>
                                  )}
                                </div>
                                <Link href={`/imoveis/${prop.slug}`} className="font-semibold text-base hover:underline print:no-underline print:text-black">
                                  {prop.informacoesbasicas.nome}
                                </Link>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {characteristics.map(char => (
                       <TableRow key={char.key}>
                           <TableCell className="font-medium">{char.label}</TableCell>
                           {properties.map(prop => {
                               const value = getDeepValue(prop, char.path);
                               return (
                                   <TableCell key={`${prop.id}-${char.key}`}>
                                       {char.format ? char.format(value) : (value || 'N/A')}
                                   </TableCell>
                               )
                           })}
                       </TableRow>
                   ))}
                   <TableRow>
                       <TableCell className="font-medium">Áreas Comuns</TableCell>
                       {properties.map(prop => (
                           <TableCell key={`${prop.id}-areas`}>
                               <ul className="list-disc pl-4 text-sm">
                                  {prop.areascomuns.length > 0 ? prop.areascomuns.map(area => <li key={area}>{area}</li>) : 'N/A'}
                               </ul>
                           </TableCell>
                       ))}
                   </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}


function ComparePageContent() {
    const { favorites, loading: authLoading } = useAuth();
    const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
    const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFavoriteProperties = async () => {
            if (authLoading || favorites.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const properties = await queryInBatches<Property>(
                    'properties',
                    documentId(),
                    favorites,
                    [where('isVisibleOnSite', '==', true)]
                );
                
                const orderedProperties = favorites
                    .map(id => properties.find(p => p.id === id))
                    .filter((p): p is Property => p !== undefined);

                setFavoriteProperties(orderedProperties);
                setSelectedProperties(orderedProperties.slice(0, 3));
            } catch (error) {
                console.error("Error fetching favorite properties: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFavoriteProperties();
    }, [favorites, authLoading]);

    const handleSelectProperty = (property: Property, isSelected: boolean) => {
        if (isSelected) {
            if (selectedProperties.length < 3) {
                setSelectedProperties([...selectedProperties, property]);
            }
        } else {
            setSelectedProperties(selectedProperties.filter(p => p.id !== property.id));
        }
    };
    

    if (isLoading || authLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (favoriteProperties.length < 2) {
         return (
            <div className="text-center py-16 rounded-lg bg-card border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
                <ShieldQuestion className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold">Adicione mais imóveis para comparar</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    Você precisa de pelo menos dois imóveis favoritados para usar a ferramenta de comparação.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/imoveis">Ver Imóveis</Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                 <Button asChild variant="outline" size="sm">
                    <Link href="/favoritos">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Voltar para Favoritos
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-semibold">Selecione para Comparar</h2>
                    <p className="text-sm text-muted-foreground">Escolha até 3 imóveis da sua lista de favoritos.</p>
                    <div className="space-y-3">
                        {favoriteProperties.map(prop => (
                            <div key={prop.id} className="flex items-center space-x-2 p-2 rounded-md bg-card border">
                                <Checkbox 
                                    id={`prop-${prop.id}`}
                                    checked={selectedProperties.some(p => p.id === prop.id)}
                                    onCheckedChange={(checked) => handleSelectProperty(prop, !!checked)}
                                    disabled={selectedProperties.length >= 3 && !selectedProperties.some(p => p.id === prop.id)}
                                />
                                <label htmlFor={`prop-${prop.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                    {prop.informacoesbasicas.nome}
                                </label>
                            </div>
                        ))}
                    </div>
                </aside>
                <div className="lg:col-span-3">
                    {selectedProperties.length > 0 ? (
                       <ComparisonTable properties={selectedProperties} />
                    ) : (
                        <div className="text-center py-16 rounded-lg bg-card border flex flex-col items-center justify-center min-h-[400px]">
                        <h2 className="text-xl font-semibold">Selecione um imóvel para começar</h2>
                        <p className="text-muted-foreground mt-2">Escolha na lista à esquerda para ver a comparação.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function ComparePage() {
    return (
        <PublicLayout>
            <main className="container mx-auto px-4 py-8 md:py-12 flex-grow">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Comparar Imóveis</h1>
                <ComparePageContent />
            </main>
        </PublicLayout>
    );
}
