
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, onSnapshot, updateDoc, arrayRemove, documentId } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Briefcase, Building2, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { type Property } from '@/app/dashboard/properties/page';
import PropertyCard from '@/components/property-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryInBatches } from '@/lib/firestoreUtils';

const PROPERTIES_PER_PAGE = 10;

interface Builder {
    id: string;
    name: string;
}

export default function CorretorCarteiraPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [propertyIds, setPropertyIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBuilderFilter, setSelectedBuilderFilter] = useState<string>('all');

    useEffect(() => {
        if (loadingAuth || !user) {
            if (!loadingAuth) setIsLoading(false);
            return;
        };

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const portfolioIds = doc.data().portfolioPropertyIds || [];
                setPropertyIds(portfolioIds);
            } else {
                setPropertyIds([]);
            }
        });

        return () => unsubscribe();
    }, [user, loadingAuth]);

    useEffect(() => {
        const fetchProperties = async () => {
            if (propertyIds.length === 0) {
                setProperties([]);
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);

            try {
                const propertiesData = await queryInBatches<Property>(
                    'properties',
                    documentId(),
                    propertyIds,
                    [where('isVisibleOnSite', '==', true)]
                );
                setProperties(propertiesData);
            } catch (error) {
                console.error("Erro ao buscar imóveis da carteira: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!loadingAuth && user) {
            fetchProperties();
        }

    }, [propertyIds, user, loadingAuth]);
    
     useEffect(() => {
        setCurrentPage(1);
    }, [properties, selectedBuilderFilter]);

    const uniqueBuilders = useMemo(() => {
        const buildersMap = new Map<string, Builder>();
        properties.forEach(prop => {
            if (prop.builderId && prop.contato?.construtora && !buildersMap.has(prop.builderId)) {
                buildersMap.set(prop.builderId, { id: prop.builderId, name: prop.contato.construtora });
            }
        });
        return Array.from(buildersMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [properties]);

    const filteredProperties = useMemo(() => {
        if (selectedBuilderFilter === 'all') {
            return properties;
        }
        return properties.filter(p => p.builderId === selectedBuilderFilter);
    }, [properties, selectedBuilderFilter]);

    const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = filteredProperties.slice(
        (currentPage - 1) * PROPERTIES_PER_PAGE,
        currentPage * PROPERTIES_PER_PAGE
    );
    
    const handleRemoveFromPortfolio = async (propertyId: string) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, { portfolioPropertyIds: arrayRemove(propertyId) });
            toast({ title: 'Imóvel removido da carteira.' });
            // The onSnapshot listener will automatically update the properties list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao remover da carteira.' });
        }
    };


    if (isLoading || loadingAuth) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Carregando sua carteira...</p>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase />
                            Minha Carteira de Imóveis
                        </CardTitle>
                        <CardDescription>
                            Aqui estão os imóveis que você adicionou à sua carteira.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {user && (
                             <Button asChild variant="outline">
                                <Link href={`/corretor-publico/${user.uid}`} target="_blank">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver Meu Site Público
                                </Link>
                            </Button>
                        )}
                        {properties.length > 0 && (
                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                <Select onValueChange={setSelectedBuilderFilter} value={selectedBuilderFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por construtora..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Construtoras</SelectItem>
                                        {uniqueBuilders.map(builder => (
                                            <SelectItem key={builder.id} value={builder.id}>{builder.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredProperties.length > 0 ? (
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 gap-6">
                            {paginatedProperties.map(prop => (
                                <PropertyCard 
                                    key={prop.id} 
                                    property={prop} 
                                    layout="horizontal" 
                                    variant="portfolio"
                                    onRemoveFromPortfolio={handleRemoveFromPortfolio}
                                    hideClientActions
                                />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 pt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Anterior
                                </Button>
                                <span className="text-sm font-medium">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Próxima
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                     properties.length > 0 && filteredProperties.length === 0 ? (
                         <div className="text-center py-16 rounded-lg bg-muted/50 border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
                            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-semibold">Nenhum imóvel encontrado</h2>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Não há imóveis para a construtora selecionada.
                            </p>
                        </div>
                     ) : (
                        <div className="text-center py-16 rounded-lg bg-muted/50 border-2 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
                            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-semibold">Sua carteira está vazia</h2>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                               Vá para a seção de construtoras para adicionar imóveis à sua carteira de vendas.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/corretor/construtoras">Ver Construtoras</Link>
                            </Button>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
