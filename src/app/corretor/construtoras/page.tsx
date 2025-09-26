
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc, arrayUnion, arrayRemove, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building, ImageOff, PlusCircle, CheckCircle } from 'lucide-react';
import { type Builder as BuilderType } from '@/app/dashboard/builders/page';
import { getStates, type State } from '@/services/location';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { type Property } from '@/app/dashboard/properties/page';
import Image from 'next/image';

export default function CorretorConstrutorasPage() {
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const [allBuilders, setAllBuilders] = useState<BuilderType[]>([]);
    const [filteredBuilders, setFilteredBuilders] = useState<BuilderType[]>([]);
    const [portfolioPropertyIds, setPortfolioPropertyIds] = useState<string[]>([]);
    const [propertiesByBuilder, setPropertiesByBuilder] = useState<Record<string, string[]>>({});
    const [states, setStates] = useState<State[]>([]);
    const [selectedState, setSelectedState] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStates = async () => {
            const statesData = await getStates();
            setStates(statesData);
        };
        fetchStates();

        const savedState = localStorage.getItem('corretorConstrutorasStateFilter');
        if (savedState) {
            setSelectedState(savedState);
        }
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'builders'), where('isVisibleOnSite', '==', true));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const buildersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuilderType));
            setAllBuilders(buildersData.sort((a, b) => a.name.localeCompare(b.name)));
            
            // Fetch properties for each builder
            if (buildersData.length > 0) {
                const propsQuery = query(collection(db, 'properties'), where('isVisibleOnSite', '==', true));
                const propsSnapshot = await getDocs(propsQuery);
                const properties = propsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                
                const propsMap: Record<string, string[]> = {};
                properties.forEach(prop => {
                    if (prop.builderId) {
                        if (!propsMap[prop.builderId]) {
                            propsMap[prop.builderId] = [];
                        }
                        propsMap[prop.builderId].push(prop.id);
                    }
                });
                setPropertiesByBuilder(propsMap);
            }
            
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setPortfolioPropertyIds(doc.data().portfolioPropertyIds || []);
            }
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (selectedState && selectedState !== 'all') {
            setFilteredBuilders(allBuilders.filter(builder => builder.state === selectedState));
        } else {
            setFilteredBuilders(allBuilders);
        }
    }, [selectedState, allBuilders]);

    const handleStateChange = (stateAcronym: string) => {
        setSelectedState(stateAcronym);
        localStorage.setItem('corretorConstrutorasStateFilter', stateAcronym);
    };

    const togglePortfolio = async (builderId: string, isInPortfolio: boolean) => {
        if (!user) return;
        
        const builderPropertyIds = propertiesByBuilder[builderId] || [];
        if (builderPropertyIds.length === 0) {
            toast({ variant: 'destructive', title: "Nenhum imóvel encontrado para esta construtora." });
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        try {
            if (isInPortfolio) {
                await updateDoc(userDocRef, { portfolioPropertyIds: arrayRemove(...builderPropertyIds) });
                toast({ title: "Removido da Carteira!" });
            } else {
                await updateDoc(userDocRef, { portfolioPropertyIds: arrayUnion(...builderPropertyIds) });
                toast({ title: "Adicionado à Carteira!" });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao atualizar a carteira." });
        }
    };

    const isBuilderInPortfolio = (builderId: string) => {
        const builderPropertyIds = propertiesByBuilder[builderId] || [];
        if (builderPropertyIds.length === 0) return false;
        return builderPropertyIds.every(id => portfolioPropertyIds.includes(id));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building />
                            Construtoras Parceiras
                        </CardTitle>
                        <CardDescription>
                            Explore os imóveis de nossas construtoras parceiras.
                        </CardDescription>
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[200px]">
                         <Label htmlFor="state-filter" className="sr-only">Filtrar por Estado</Label>
                         <Select onValueChange={handleStateChange} value={selectedState}>
                            <SelectTrigger id="state-filter">
                                <SelectValue placeholder="Filtrar por estado..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Estados</SelectItem>
                                {states.map(state => (
                                    <SelectItem key={state.id} value={state.sigla}>{state.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBuilders.length > 0 ? filteredBuilders.map(builder => {
                            const isInPortfolio = isBuilderInPortfolio(builder.id);
                            return (
                                <Card key={builder.id} className="overflow-hidden h-full flex flex-col">
                                    <Link href={`/corretor/construtoras/${builder.id}`} className="group block">
                                        <div className="relative aspect-video bg-muted flex items-center justify-center">
                                            {builder.logoUrl ? (
                                                <Image src={builder.logoUrl} alt={builder.name} fill className="object-contain p-4"/>
                                            ) : (
                                                <ImageOff className="h-10 w-10 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg group-hover:text-primary">{builder.name}</h3>
                                            <p className="text-sm text-muted-foreground">{builder.city} - {builder.state}</p>
                                        </div>
                                    </Link>
                                    <CardFooter className="mt-auto p-4">
                                        <Button 
                                            variant={isInPortfolio ? 'secondary' : 'default'} 
                                            className="w-full"
                                            onClick={() => togglePortfolio(builder.id, isInPortfolio)}
                                        >
                                            {isInPortfolio ? <CheckCircle className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                                            {isInPortfolio ? 'Na sua carteira' : 'Adicionar à carteira'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        }) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-muted-foreground">Nenhuma construtora encontrada para o estado selecionado.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
