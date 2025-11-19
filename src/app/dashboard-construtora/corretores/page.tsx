'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Query, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Mail, Phone, Instagram, Building, Home, Briefcase, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';


interface Broker {
    id: string;
    uid: string;
    name: string;
    email: string;
    whatsapp?: string;
    instagram?: string;
    logoUrl?: string;
    portfolioProperties: { id: string; name: string, slug?: string }[];
}

interface PropertySummary {
    id: string;
    name: string;
    imageUrl?: string;
    brokerCount: number;
}

const BROKERS_PER_PAGE = 10;

const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function ConstrutoraCorretoresPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [propertySummary, setPropertySummary] = useState<PropertySummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (loadingAuth) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchBrokers = async () => {
            setIsLoading(true);
            try {
                // 1. Find all properties for the current builder
                const propertiesQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
                const propertiesSnapshot = await getDocs(propertiesQuery);
                const builderProperties = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as {id: string, informacoesbasicas: { nome: string }, midia: string[], slug?: string}));
                const builderPropertyIds = builderProperties.map(p => p.id);

                if (builderPropertyIds.length === 0) {
                    setBrokers([]);
                    setPropertySummary([]);
                    setIsLoading(false);
                    return;
                }

                // 2. Find all brokers (users with role 'Corretor') who have at least one of the builder's properties
                const brokersQuery = query(collection(db, 'users'), where('role', '==', 'Corretor'), where('portfolioPropertyIds', 'array-contains-any', builderPropertyIds));
                const brokersSnapshot = await getDocs(brokersQuery);
                
                // 3. Filter brokers and map their properties from the builder's portfolio
                const relevantBrokers: Broker[] = [];
                const propertyCounts: Record<string, number> = {};

                builderProperties.forEach(prop => propertyCounts[prop.id] = 0);

                brokersSnapshot.forEach(doc => {
                    const brokerData = doc.data();
                    const portfolio: string[] = brokerData.portfolioPropertyIds || [];
                    
                    const matchingProperties = builderProperties.filter(prop => portfolio.includes(prop.id));

                    if (matchingProperties.length > 0) {
                        relevantBrokers.push({
                            id: doc.id,
                            ...brokerData,
                            portfolioProperties: matchingProperties.map(p => ({id: p.id, name: p.informacoesbasicas.nome, slug: p.slug}))
                        } as Broker);

                        matchingProperties.forEach(prop => {
                            propertyCounts[prop.id]++;
                        });
                    }
                });

                const summaryData: PropertySummary[] = builderProperties.map(prop => ({
                    id: prop.id,
                    name: prop.informacoesbasicas.nome,
                    imageUrl: prop.midia?.[0],
                    brokerCount: propertyCounts[prop.id] || 0,
                })).sort((a,b) => b.brokerCount - a.brokerCount);

                setBrokers(relevantBrokers);
                setPropertySummary(summaryData);

            } catch (error) {
                console.error("Erro ao buscar corretores:", error);
                toast({ variant: 'destructive', title: 'Erro ao carregar', description: 'Não foi possível buscar os corretores.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrokers();

    }, [user, loadingAuth, toast]);
    
    const filteredBrokers = useMemo(() => {
        if (!searchTerm) {
            return brokers;
        }
        return brokers.filter(broker => 
            broker.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [brokers, searchTerm]);

    const totalPages = Math.ceil(filteredBrokers.length / BROKERS_PER_PAGE);
    const paginatedBrokers = useMemo(() => {
        const startIndex = (currentPage - 1) * BROKERS_PER_PAGE;
        const endIndex = startIndex + BROKERS_PER_PAGE;
        return filteredBrokers.slice(startIndex, endIndex);
    }, [filteredBrokers, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredBrokers]);

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Users className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Corretores Parceiros</h1>
                    <p className="font-light text-[23px] text-black">Gerencie os corretores que trabalham com seus imóveis.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> Resumo de Imóveis na Carteira</CardTitle>
                    <CardDescription>
                        Contagem de quantos corretores adicionaram cada um dos seus imóveis à carteira de vendas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : propertySummary.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {propertySummary.map(prop => (
                                <Card key={prop.id} className="flex items-center p-4 gap-4">
                                     <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                                        {prop.imageUrl && <Image src={prop.imageUrl} alt={prop.name} fill className="object-cover"/>}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold line-clamp-2">{prop.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4"/>
                                            <span>{prop.brokerCount} {prop.brokerCount === 1 ? 'corretor' : 'corretores'}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhum imóvel seu foi encontrado na carteira de corretores.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Users /> Corretores com seus Imóveis</CardTitle>
                            <CardDescription>
                                Lista de corretores que adicionaram pelo menos um dos seus imóveis à carteira de vendas.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:max-w-xs">
                             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome do corretor..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Corretor</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Imóveis na Carteira</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBrokers.length > 0 ? (
                                    paginatedBrokers.map((broker) => (
                                        <TableRow key={broker.id}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={broker.logoUrl} alt={broker.name} />
                                                    <AvatarFallback>{getInitials(broker.name)}</AvatarFallback>
                                                </Avatar>
                                                <span>{broker.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <a href={`mailto:${broker.email}`} className="flex items-center gap-1.5 hover:underline text-sm">
                                                        <Mail className="h-4 w-4" />
                                                        {broker.email}
                                                    </a>
                                                     {broker.whatsapp && (
                                                        <a href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline text-sm">
                                                            <Phone className="h-4 w-4" />
                                                            {broker.whatsapp}
                                                        </a>
                                                    )}
                                                    {broker.instagram && (
                                                        <a href={`https://instagram.com/${broker.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline text-sm">
                                                            <Instagram className="h-4 w-4" />
                                                            {broker.instagram}
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {broker.portfolioProperties.length > 0 ? (
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {broker.portfolioProperties.map(prop => (
                                                            <li key={prop.id} className="text-sm">
                                                                <Link href={`/imoveis/${prop.slug || prop.id}`} target="_blank" className="hover:underline text-primary">
                                                                    {prop.name}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Nenhum imóvel seu na carteira.</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {searchTerm ? `Nenhum corretor encontrado com o nome "${searchTerm}".` : "Nenhum corretor trabalhando com seus imóveis no momento."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-center items-center gap-4 pt-6 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>
                        <span className="text-sm font-medium">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Próxima <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
