
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, onSnapshot, updateDoc, arrayRemove, arrayUnion, documentId } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Briefcase, Building2, ArrowLeft, ArrowRight, ExternalLink, Download } from 'lucide-react';
import { type Property } from '@/app/dashboard/properties/page';
import PropertyCard from '@/components/property-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryInBatches } from '@/lib/firestoreUtils';
import { usePropertyActions } from '@/hooks/use-property-actions';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Progress } from '@/components/ui/progress';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROPERTIES_PER_PAGE = 10;

interface Builder {
    id: string;
    name: string;
}

interface PropertyTable {
    id: string;
    tableName: string;
    fileUrl: string;
    propertyId: string;
}

export default function CorretorCarteiraPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const { propertyCount, propertyLimit } = useAuth();
    
    const { 
        selectedProperty, 
        isSheetOpen, 
        handleViewDetails, 
        setIsSheetOpen,
        PropertyDetailSheet
    } = usePropertyActions({ id: user?.uid || '', name: user?.displayName || '', email: user?.email || ''}, 'broker-panel');

    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [propertyIds, setPropertyIds] = useState<string[]>([]);
    const [hiddenPropertyIds, setHiddenPropertyIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBuilderFilter, setSelectedBuilderFilter] = useState<string>('all');
    const [propertyTables, setPropertyTables] = useState<Record<string, PropertyTable[]>>({});
    
    const [isMaterialsSheetOpen, setIsMaterialsSheetOpen] = useState(false);
    const [selectedPropertyForMaterials, setSelectedPropertyForMaterials] = useState<Property | null>(null);

    const handleViewMaterials = (property: Property) => {
        setSelectedPropertyForMaterials(property);
        setIsMaterialsSheetOpen(true);
    }

    useEffect(() => {
        if (loadingAuth || !user) {
            if (!loadingAuth) setIsLoading(false);
            return;
        };

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setPropertyIds(data.portfolioPropertyIds || []);
                setHiddenPropertyIds(data.hiddenPortfolioPropertyIds || []);
            } else {
                setPropertyIds([]);
                setHiddenPropertyIds([]);
            }
        });

        return () => unsubscribe();
    }, [user, loadingAuth]);

    useEffect(() => {
        const fetchPropertiesAndTables = async () => {
            if (propertyIds.length === 0) {
                setProperties([]);
                setPropertyTables({});
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

                // Fetch tables for these properties
                const tablesData = await queryInBatches<PropertyTable>(
                    'property_tables',
                    'propertyId',
                    propertyIds
                );
                
                const tablesMap: Record<string, PropertyTable[]> = {};
                tablesData.forEach(table => {
                    if (!tablesMap[table.propertyId]) {
                        tablesMap[table.propertyId] = [];
                    }
                    tablesMap[table.propertyId].push(table);
                });
                setPropertyTables(tablesMap);

            } catch (error) {
                console.error("Erro ao buscar imóveis e tabelas da carteira: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!loadingAuth && user) {
            fetchPropertiesAndTables();
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
            await updateDoc(userDocRef, { 
                portfolioPropertyIds: arrayRemove(propertyId),
                hiddenPortfolioPropertyIds: arrayRemove(propertyId) // Also remove from hidden list if present
            });
            toast({ title: 'Imóvel removido da carteira.' });
            // The onSnapshot listener will automatically update the properties list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao remover da carteira.' });
        }
    };

    const handleToggleVisibility = async (propertyId: string, isVisible: boolean) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            if (isVisible) {
                await updateDoc(userDocRef, { hiddenPortfolioPropertyIds: arrayRemove(propertyId) });
                toast({ title: 'Imóvel agora está visível no seu site.' });
            } else {
                await updateDoc(userDocRef, { hiddenPortfolioPropertyIds: arrayUnion(propertyId) });
                toast({ title: 'Imóvel agora está oculto no seu site.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao alterar visibilidade.' });
        }
    };

    const usagePercentage = propertyLimit !== null && propertyLimit > 0 ? (propertyCount / propertyLimit) * 100 : (propertyLimit === 0 ? 100 : 0);
    const isLimitReached = propertyLimit !== null && propertyCount >= propertyLimit;


    if (isLoading || loadingAuth) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Carregando sua carteira...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Briefcase className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Minha Carteira</h1>
                    <p className="font-light text-[23px] text-black">Aqui estão os imóveis que você adicionou à sua carteira.</p>
                </div>
            </div>
            {propertyLimit !== null && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Uso do Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-sm text-muted-foreground">
                                Você está usando <span className="font-bold text-foreground">{propertyCount}</span> de <span className="font-bold text-foreground">{propertyLimit}</span> imóveis permitidos no seu plano.
                           </p>
                           <Button asChild variant="link" className="p-0 h-auto">
                               <Link href="/corretor/meu-plano">Ver planos</Link>
                           </Button>
                        </div>
                        <Progress value={usagePercentage} className={cn(isLimitReached && "[&>div]:bg-destructive")} />
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                           {/*  <CardTitle className="flex items-center gap-2">
                                <Briefcase />
                                Minha Carteira de Imóveis
                            </CardTitle>
                            <CardDescription>
                                Aqui estão os imóveis que você adicionou à sua carteira.
                            </CardDescription> */}
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
                                        onToggleVisibility={handleToggleVisibility}
                                        isPubliclyVisible={!hiddenPropertyIds.includes(prop.id)}
                                        onViewDetails={() => handleViewDetails(prop)}
                                        onViewMaterials={() => handleViewMaterials(prop)}
                                        tables={propertyTables[prop.id] || []}
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
             {selectedProperty && user && (
                <PropertyDetailSheet
                    property={selectedProperty}
                    brokerId={user.uid}
                    brokerWhatsApp={user.phoneNumber}
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    source="broker-panel"
                />
            )}
            
             <Sheet open={isMaterialsSheetOpen} onOpenChange={setIsMaterialsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-[90vw] flex flex-col">
                    {selectedPropertyForMaterials && (
                        <>
                            <SheetHeader>
                                <SheetTitle>Materiais de Divulgação</SheetTitle>
                                <SheetDescription>
                                    Acesse os materiais para o imóvel: {selectedPropertyForMaterials.informacoesbasicas.nome}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex-grow overflow-y-auto pr-4 -mr-6">
                                <Tabs defaultValue="images" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="images">Imagens</TabsTrigger>
                                        <TabsTrigger value="plans">Plantas</TabsTrigger>
                                        <TabsTrigger value="docs">Documentos</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="images" className="mt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {selectedPropertyForMaterials.midia?.map((url, index) => (
                                                <a key={index} href={url} download target="_blank" rel="noopener noreferrer" className="relative aspect-square group">
                                                    <Image src={url} alt={`Imagem ${index+1}`} fill sizes="33vw" className="rounded-lg object-cover"/>
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Download className="h-8 w-8 text-white"/>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="plans" className="mt-4">
                                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {selectedPropertyForMaterials.documentacao?.plantas?.map((url, index) => (
                                                <a key={index} href={url} download target="_blank" rel="noopener noreferrer" className="relative aspect-square group">
                                                    <Image src={url} alt={`Planta ${index+1}`} fill sizes="33vw" className="rounded-lg object-cover"/>
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Download className="h-8 w-8 text-white"/>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </TabsContent>
                                     <TabsContent value="docs" className="mt-4 space-y-4">
                                        {selectedPropertyForMaterials.documentacao?.materiaisDivulgacao?.map((url, index) => (
                                             <a key={index} href={url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted">
                                                <FileText className="h-6 w-6 text-primary"/>
                                                <div className="flex-grow">
                                                    <p className="font-semibold truncate">Material de Divulgação {index+1}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{url}</p>
                                                </div>
                                                <Download className="h-5 w-5 text-muted-foreground"/>
                                            </a>
                                        ))}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
