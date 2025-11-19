
'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Handshake, Instagram, Search, User, PlusCircle, Building, BedDouble, Car, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface BrokerLocation {
    state: string;
    city: string;
}

interface Broker {
    id: string;
    uid: string;
    name: string;
    email: string;
    whatsapp?: string;
    instagram?: string;
    logoUrl?: string;
    locations?: BrokerLocation[];
}

interface PropertyRequest {
    id: string;
    brokerId: string;
    brokerName: string;
    brokerLogoUrl?: string;
    brokerWhatsapp?: string;
    clientDescription: string;
    propertyCriteria: {
        tipo: string;
        quartos: string;
        vagas: string;
        cidade: string;
        estado: string;
        bairro: string;
        faixaPreco: string;
        area: string;
    };
    createdAt: Timestamp;
}

const propertyTypes = ["Apartamento", "Casa em Condomínio", "Casa", "Flat", "Terreno", "Sala Comercial", "Loja"];
const bedroomOptions = ["1", "2", "3", "4", "5+"];
const garageOptions = ["Nenhuma", "1", "2", "3", "4+"];


function getInitials(name: string) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function BrokerList({ brokers }: { brokers: Broker[] }) {
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedState, setSelectedState] = useState('all');
    const [selectedCity, setSelectedCity] = useState('all');
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    
    const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
    const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);


    useEffect(() => {
        setIsLoading(brokers.length === 0);
        async function loadStates() {
            setIsLoadingStates(true);
            const statesData = await getStates();
            setStates(statesData);
            setIsLoadingStates(false);
        }
        loadStates();
    }, [brokers]);
    
    const handleOpenBrokerModal = (broker: Broker) => {
        setSelectedBroker(broker);
        setIsBrokerModalOpen(true);
    }

    const handleStateChange = async (stateAcronym: string) => {
        setSelectedState(stateAcronym);
        setSelectedCity('all');
        if (stateAcronym && stateAcronym !== 'all') {
            setIsLoadingCities(true);
            setCities([]);
            const citiesData = await getCitiesByState(stateAcronym);
            setCities(citiesData);
            setIsLoadingCities(false);
        } else {
             setCities([]);
        }
    };

    const filteredBrokers = brokers.filter(broker => {
        const nameMatch = broker.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const locationMatch = 
            selectedState === 'all' || 
            (broker.locations && broker.locations.some(loc => 
                loc.state === selectedState && (selectedCity === 'all' || loc.city === selectedCity)
            ));

        return nameMatch && locationMatch;
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        )
    }

    return (
      <>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filtros da Rede</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar corretor por nome..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Filtrar por Estado</Label>
                            <Select onValueChange={handleStateChange} value={selectedState} disabled={isLoadingStates}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione um estado'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Estados</SelectItem>
                                    {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Filtrar por Cidade</Label>
                            <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedState || selectedState === 'all' || isLoadingCities}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCities ? 'Carregando...' : 'Selecione uma cidade'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Cidades</SelectItem>
                                    {cities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {filteredBrokers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBrokers.map(broker => (
                        <Card key={broker.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleOpenBrokerModal(broker)}>
                            <CardHeader className="flex flex-col items-center text-center gap-4">
                                <Avatar className="h-24 w-24 border-2 border-primary">
                                    <AvatarImage src={broker.logoUrl} alt={broker.name} />
                                    <AvatarFallback className="text-3xl">{getInitials(broker.name)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{broker.name}</CardTitle>
                                    <CardDescription>{broker.email}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex justify-center items-center gap-4">
                                {broker.instagram && (
                                     <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                        <a href={`https://instagram.com/${broker.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer">
                                            <Instagram className="mr-2 h-4 w-4" /> Instagram
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="h-64 flex flex-col items-center justify-center text-center">
                        <User className="h-12 w-12 text-muted-foreground mb-4"/>
                        <h3 className="text-xl font-semibold">Nenhum outro corretor encontrado</h3>
                        <p className="text-muted-foreground">Tente remover os filtros ou convide mais colegas para a plataforma.</p>
                    </CardContent>
                </Card>
            )}
        </div>
        <Dialog open={isBrokerModalOpen} onOpenChange={setIsBrokerModalOpen}>
            <DialogContent>
                {selectedBroker && (
                    <>
                    <DialogHeader className="items-center text-center pt-6">
                         <Avatar className="h-28 w-28 border-4 border-primary">
                            <AvatarImage src={selectedBroker.logoUrl} alt={selectedBroker.name} />
                            <AvatarFallback className="text-4xl">{getInitials(selectedBroker.name)}</AvatarFallback>
                        </Avatar>
                        <DialogTitle className="text-2xl pt-4">{selectedBroker.name}</DialogTitle>
                        <DialogDescription>{selectedBroker.email}</DialogDescription>
                    </DialogHeader>
                     <div className="py-4 space-y-4">
                        {selectedBroker.locations && selectedBroker.locations.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 text-center">Cidades de Atuação</h4>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {selectedBroker.locations.map((loc, index) => (
                                        <Badge key={index} variant="secondary">{loc.city} - {loc.state}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                         <div className="flex justify-center items-center gap-4 pt-4">
                            {selectedBroker.whatsapp && (
                                <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white flex-1">
                                    <a href={`https://wa.me/55${selectedBroker.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                        <FaWhatsapp className="mr-2 h-5 w-5" /> WhatsApp
                                    </a>
                                </Button>
                            )}
                            {selectedBroker.instagram && (
                                <Button asChild variant="outline" size="lg" className="flex-1">
                                    <a href={`https://instagram.com/${selectedBroker.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer">
                                        <Instagram className="mr-2 h-5 w-5" /> Instagram
                                    </a>
                                </Button>
                            )}
                        </div>
                     </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
      </>
    );
}

function PropertyRequestList({ brokers }: { brokers: Broker[] }) {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [requests, setRequests] = useState<PropertyRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [newRequest, setNewRequest] = useState<PropertyRequest['propertyCriteria']>({
        tipo: '', quartos: '', vagas: '', cidade: '', estado: '', bairro: '', faixaPreco: '', area: ''
    });
    const [clientDescription, setClientDescription] = useState('');
    
    // Form location state
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    useEffect(() => {
        async function loadStates() {
            const statesData = await getStates();
            setStates(statesData);
        }
        loadStates();
        
        const q = query(collection(db, 'property_requests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyRequest)));
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar solicitações: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStateChange = async (stateAcronym: string) => {
        setNewRequest(prev => ({ ...prev, estado: stateAcronym, cidade: '', bairro: ''}));
        setIsLoadingCities(true);
        setCities([]);
        if(stateAcronym){
          const citiesData = await getCitiesByState(stateAcronym);
          setCities(citiesData);
        }
        setIsLoadingCities(false);
    };
    
    const resetForm = () => {
        setNewRequest({ tipo: '', quartos: '', vagas: '', cidade: '', estado: '', bairro: '', faixaPreco: '', area: '' });
        setClientDescription('');
        setCities([]);
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !newRequest.tipo || !newRequest.cidade || !newRequest.estado) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Tipo, Estado e Cidade são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'property_requests'), {
                brokerId: user.uid,
                brokerName: user.displayName,
                brokerLogoUrl: user.photoURL || '',
                clientDescription: clientDescription,
                propertyCriteria: newRequest,
                createdAt: Timestamp.now(),
            });
            toast({ title: "Solicitação publicada com sucesso!" });
            resetForm();
            setIsDialogOpen(false);
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Erro ao publicar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWhatsappClick = (e: React.MouseEvent, request: PropertyRequest) => {
        e.stopPropagation();
        const broker = brokers.find(b => b.uid === request.brokerId);
        if (broker && broker.whatsapp) {
            const message = `Olá, ${broker.name}. Vi sua solicitação no portal Oraora para um cliente que procura um imóvel (${request.propertyCriteria.tipo} em ${request.propertyCriteria.cidade}). Acredito que tenho algo que pode interessar!`;
            const whatsappUrl = `https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: 'destructive', title: 'WhatsApp não disponível', description: 'Este corretor não forneceu um número de WhatsApp.'});
        }
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="text-right">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/>Publicar Solicitação</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                         <DialogHeader>
                            <DialogTitle>Publicar Solicitação de Imóvel</DialogTitle>
                            <DialogDescription>Descreva o imóvel que seu cliente está procurando para que outros corretores possam ajudar.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                            <div className="space-y-2">
                                <Label htmlFor="clientDescription">Descrição do Cliente/Necessidade</Label>
                                <Textarea id="clientDescription" value={clientDescription} onChange={(e) => setClientDescription(e.target.value)} placeholder="Ex: Casal jovem buscando primeiro imóvel, preferência por área de lazer completa..."/>
                            </div>
                            <h3 className="font-semibold text-lg border-t pt-4">Critérios do Imóvel</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select value={newRequest.estado} onValueChange={handleStateChange} required>
                                        <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                                        <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Cidade</Label>
                                    <Select value={newRequest.cidade} onValueChange={(v) => setNewRequest(prev => ({...prev, cidade: v, bairro: ''}))} required disabled={!newRequest.estado || isLoadingCities}>
                                        <SelectTrigger><SelectValue placeholder={isLoadingCities ? 'Carregando...' : 'Selecione...'}/></SelectTrigger>
                                        <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Bairro(s) de preferência</Label>
                                    <Input value={newRequest.bairro} onChange={(e) => setNewRequest(p => ({...p, bairro: e.target.value}))} placeholder="Ex: Manaíra, Bessa"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Imóvel</Label>
                                    <Select value={newRequest.tipo} onValueChange={(v) => setNewRequest(p => ({...p, tipo: v}))} required>
                                        <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                                        <SelectContent>{propertyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quartos</Label>
                                    <Select value={newRequest.quartos} onValueChange={(v) => setNewRequest(p => ({...p, quartos: v}))}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                                        <SelectContent>{bedroomOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Vagas de Garagem</Label>
                                    <Select value={newRequest.vagas} onValueChange={(v) => setNewRequest(p => ({...p, vagas: v}))}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                                        <SelectContent>{garageOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Área (m²)</Label>
                                    <Input value={newRequest.area} onChange={(e) => setNewRequest(p => ({...p, area: e.target.value}))} placeholder="Ex: 70-90m²"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Faixa de Preço</Label>
                                    <Input value={newRequest.faixaPreco} onChange={(e) => setNewRequest(p => ({...p, faixaPreco: e.target.value}))} placeholder="Ex: 500mil a 700mil"/>
                                </div>
                            </div>
                             <DialogFooter className="mt-6 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Publicar'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map(req => (
                    <Card key={req.id}>
                        <CardHeader className="flex-row gap-4 items-center">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={req.brokerLogoUrl} />
                                <AvatarFallback>{getInitials(req.brokerName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{req.brokerName}</CardTitle>
                                <CardDescription>{format(req.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", {locale: ptBR})}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {req.clientDescription && (
                                <p className="text-sm italic text-muted-foreground border-l-4 pl-4">"{req.clientDescription}"</p>
                            )}
                            <div className="space-y-2 text-sm pt-2">
                                <h4 className="font-semibold">Busca por:</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <p><strong className="font-medium text-muted-foreground">Tipo:</strong> {req.propertyCriteria.tipo}</p>
                                    <p><strong className="font-medium text-muted-foreground">Local:</strong> {req.propertyCriteria.cidade}-{req.propertyCriteria.estado}</p>
                                    <p><strong className="font-medium text-muted-foreground">Quartos:</strong> {req.propertyCriteria.quartos || 'N/A'}</p>
                                    <p><strong className="font-medium text-muted-foreground">Vagas:</strong> {req.propertyCriteria.vagas || 'N/A'}</p>
                                    <p><strong className="font-medium text-muted-foreground">Área:</strong> {req.propertyCriteria.area || 'N/A'}</p>
                                    <p><strong className="font-medium text-muted-foreground">Preço:</strong> {req.propertyCriteria.faixaPreco || 'N/A'}</p>
                                </div>
                            </div>
                              {user?.uid !== req.brokerId && (
                                <Button className="w-full bg-green-500 hover:bg-green-600" onClick={(e) => handleWhatsappClick(e, req)}>
                                    <FaWhatsapp className="mr-2 h-4 w-4"/> Tenho esse imóvel!
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}


export default function ParceriasPage() {
    const [user] = useAuthState(auth);
    const [allBrokers, setAllBrokers] = useState<Broker[]>([]);

    useEffect(() => {
        if (!user) return;
        
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'Corretor'),
            where('uid', '!=', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const brokersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broker));
            setAllBrokers(brokersData.sort((a,b) => a.name.localeCompare(b.name)));
        }, (error) => {
            console.error("Erro ao buscar corretores: ", error);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Handshake className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Rede de Parcerias</h1>
                    <p className="font-light text-[23px] text-black">Conecte-se com outros corretores e encontre oportunidades de negócio.</p>
                </div>
            </div>

            <Tabs defaultValue="brokers">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="brokers">Rede de Corretores</TabsTrigger>
                    <TabsTrigger value="requests">Cliente Procura</TabsTrigger>
                </TabsList>
                <TabsContent value="brokers" className="mt-6">
                    <BrokerList brokers={allBrokers} />
                </TabsContent>
                <TabsContent value="requests" className="mt-6">
                    <PropertyRequestList brokers={allBrokers} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

    

    