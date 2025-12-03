
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search as SearchIcon, CheckCircle, PlusCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { type Builder } from '@/app/dashboard/builders/page';
import { type Property } from '@/app/dashboard/properties/page';
import { getStates, type State } from '@/services/location';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

const PROPERTIES_PER_PAGE = 12;

export default function ExplorarImoveisPage() {
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const { propertyCount, propertyLimit, portfolioPropertyIds, loading: authLoading } = useAuth();

    const [allBuilders, setAllBuilders] = useState<Builder[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    
    const [states, setStates] = useState<State[]>([]);
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedBuilder, setSelectedBuilder] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        const qBuilders = query(collection(db, 'builders'), where('isVisibleOnSite', '==', true));
        const unsubscribeBuilders = onSnapshot(qBuilders, (snapshot) => {
            setAllBuilders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder)));
        });
        
        const qProperties = query(collection(db, 'properties'), where('isVisibleOnSite', '==', true));
        const unsubscribeProperties = onSnapshot(qProperties, (snapshot) => {
            setAllProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
            setIsLoading(false);
        });

        const fetchStates = async () => {
            const statesData = await getStates();
            setStates(statesData);
        };
        fetchStates();

        return () => { unsubscribeBuilders(); unsubscribeProperties(); };
    }, []);

    const handleTogglePortfolio = async (propertyId: string) => {
        if (!user) return;

        const isInPortfolio = portfolioPropertyIds.includes(propertyId);
        const userDocRef = doc(db, 'users', user.uid);

        try {
             if (isInPortfolio) {
                await updateDoc(userDocRef, { portfolioPropertyIds: arrayRemove(propertyId) });
                toast({ title: "Removido da Carteira!" });
            } else {
                if (propertyLimit !== null && propertyCount >= propertyLimit) {
                    toast({ variant: 'destructive', title: "Limite do plano atingido!", description: "Você não pode adicionar mais imóveis."});
                    return;
                }
                await updateDoc(userDocRef, { portfolioPropertyIds: arrayUnion(propertyId) });
                toast({ title: "Adicionado à Carteira!" });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro ao atualizar a carteira." });
        }
    };
    
    const isLimitReached = propertyLimit !== null && propertyCount >= propertyLimit;

    const filteredProperties = useMemo(() => {
        let tempProperties = allProperties;
        if(selectedState !== 'all') {
            tempProperties = tempProperties.filter(p => p.localizacao.estado === selectedState);
        }
        if(selectedBuilder !== 'all') {
            tempProperties = tempProperties.filter(p => p.builderId === selectedBuilder);
        }
        if(searchTerm) {
            tempProperties = tempProperties.filter(p => p.informacoesbasicas.nome.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return tempProperties;
    }, [allProperties, selectedState, selectedBuilder, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredProperties]);

    const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = filteredProperties.slice(
        (currentPage - 1) * PROPERTIES_PER_PAGE,
        currentPage * PROPERTIES_PER_PAGE
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <SearchIcon className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Explorar Imóveis</h1>
                    <p className="font-light text-[23px] text-black">Encontre os melhores imóveis para sua carteira.</p>
                </div>
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Filtros de Busca</CardTitle>
                 </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                     <div className="space-y-2">
                        <Label>Buscar por nome</Label>
                         <Input 
                            placeholder="Nome do imóvel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                      <div className="space-y-2">
                        <Label>Filtrar por Estado</Label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Estados</SelectItem>
                                {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="space-y-2">
                        <Label>Filtrar por Construtora</Label>
                        <Select value={selectedBuilder} onValueChange={setSelectedBuilder}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Construtoras</SelectItem>
                                {allBuilders.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                 </CardContent>
            </Card>

            {isLoading || authLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedProperties.map(prop => {
                             const isInPortfolio = portfolioPropertyIds.includes(prop.id);
                             return (
                                <Card key={prop.id} className="overflow-hidden h-full flex flex-col">
                                    <div className="relative aspect-video bg-muted">
                                        {prop.midia?.[0] && <Image src={prop.midia[0]} alt={prop.informacoesbasicas.nome} fill className="object-cover" />}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-semibold text-lg">{prop.informacoesbasicas.nome}</h3>
                                        <p className="text-sm text-muted-foreground">{prop.localizacao.cidade} - {prop.localizacao.estado}</p>
                                    </div>
                                    <CardContent className="mt-auto p-4">
                                        <Button
                                            variant={isInPortfolio ? 'secondary' : 'default'}
                                            className="w-full"
                                            onClick={() => handleTogglePortfolio(prop.id)}
                                            disabled={isLimitReached && !isInPortfolio}
                                        >
                                             {isInPortfolio ? <CheckCircle className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                                             {isInPortfolio ? 'Na sua carteira' : 'Adicionar à carteira'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
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
            )}
        </div>
    );
}
