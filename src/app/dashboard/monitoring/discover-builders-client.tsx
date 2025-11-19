
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Building, Link as LinkIcon, PlusCircle } from 'lucide-react';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Builder } from '@/app/dashboard/builders/page';
import { discoverBuilders, type DiscoverBuildersOutput } from '@/ai/flows/discover-builders-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useActionState } from 'react';
import { handleRegisterBuilder } from './actions';
import { useFormStatus } from 'react-dom';


type DiscoveredBuilder = DiscoverBuildersOutput['discoveredBuilders'][0];

const initialRegisterState = { success: false, error: null, message: null };


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : 'Cadastrar Construtora'}
        </Button>
    )
}

export default function DiscoverBuildersClient() {
    const { toast } = useToast();
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveredBuilders, setDiscoveredBuilders] = useState<DiscoveredBuilder[]>([]);
    
    // Modal state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [builderToRegister, setBuilderToRegister] = useState<DiscoveredBuilder | null>(null);

    const [registerState, registerAction] = useActionState(handleRegisterBuilder, initialRegisterState);

    useEffect(() => {
        if (registerState.success) {
            toast({ title: "Sucesso!", description: registerState.message });
            setIsDialogOpen(false);
            setBuilderToRegister(null);
            setDiscoveredBuilders(prev => prev.filter(b => b.name !== builderToRegister?.name)); // Remove from list after register
        } else if (registerState.error) {
            const errorMessages = Object.values(registerState.error).flat().join('\n');
            toast({ variant: 'destructive', title: "Erro no Cadastro", description: errorMessages });
        }
    }, [registerState, toast, builderToRegister]);


    useEffect(() => {
        async function loadStates() {
            setIsLoadingStates(true);
            const statesData = await getStates();
            setStates(statesData);
            setIsLoadingStates(false);
        }
        loadStates();
    }, []);

    const handleStateChange = async (stateAcronym: string) => {
        setSelectedState(stateAcronym);
        setSelectedCity('all');
        setIsLoadingCities(true);
        setCities([]);
        if (stateAcronym) {
          const citiesData = await getCitiesByState(stateAcronym);
          setCities(citiesData);
        }
        setIsLoadingCities(false);
      };

    const handleDiscover = async () => {
        if (!selectedState) {
            toast({ variant: 'destructive', title: 'Selecione um estado.' });
            return;
        }

        setIsDiscovering(true);
        setDiscoveredBuilders([]);

        try {
            const buildersQuery = query(collection(db, 'builders'));
            const buildersSnapshot = await getDocs(buildersQuery);
            const existingBuilderNames = buildersSnapshot.docs.map(doc => (doc.data() as Builder).name);
            
            const result = await discoverBuilders({ 
                existingBuilderNames, 
                state: selectedState,
                city: selectedCity !== 'all' ? selectedCity : undefined,
            });
            
            if (result.discoveredBuilders.length === 0) {
                 toast({ title: 'Nenhuma nova construtora encontrada.', description: 'A IA não encontrou novas empresas para a localidade selecionada.' });
            } else {
                setDiscoveredBuilders(result.discoveredBuilders);
                toast({ title: `Descoberta concluída!`, description: `${result.discoveredBuilders.length} novas construtoras encontradas.` });
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro na Descoberta', description: error.message });
        } finally {
            setIsDiscovering(false);
        }
    };
    
    const handleRegisterClick = (builder: DiscoveredBuilder) => {
        setBuilderToRegister(builder);
        setIsDialogOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-end gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                    <Label htmlFor="state-select">Estado *</Label>
                    <Select onValueChange={handleStateChange} value={selectedState} disabled={isLoadingStates || isDiscovering}>
                        <SelectTrigger id="state-select">
                            <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione'} />
                        </SelectTrigger>
                        <SelectContent>
                            {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="city-select">Cidade (Opcional)</Label>
                     <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedState || isLoadingCities || isDiscovering}>
                        <SelectTrigger id="city-select">
                            <SelectValue placeholder={isLoadingCities ? 'Carregando...' : 'Todas as cidades'} />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Todas as cidades</SelectItem>
                             {cities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleDiscover} disabled={isDiscovering || !selectedState} className="w-full sm:w-auto">
                    {isDiscovering ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                    {isDiscovering ? 'Descobrindo...' : 'Descobrir Construtoras'}
                </Button>
            </div>
            
            {isDiscovering && (
                 <div className="text-center p-8">
                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary"/>
                     <p className="mt-4 text-muted-foreground">Aguarde, a IA está investigando o mercado...</p>
                 </div>
            )}
            
            {discoveredBuilders.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Resultados da Descoberta</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Construtora</TableHead>
                                <TableHead>Website</TableHead>
                                <TableHead>Localização</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discoveredBuilders.map((builder, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{builder.name}</TableCell>
                                    <TableCell>
                                        <a href={builder.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                            <LinkIcon className="h-4 w-4" />
                                            Visitar
                                        </a>
                                    </TableCell>
                                    <TableCell>{builder.city} - {builder.state}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => handleRegisterClick(builder)}>
                                            <PlusCircle className="mr-2 h-4 w-4"/>
                                            Cadastrar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                     <DialogHeader>
                        <DialogTitle>Cadastrar Nova Construtora</DialogTitle>
                        <DialogDescription>
                            As informações abaixo foram preenchidas pela IA. Verifique e salve para criar a construtora e seu usuário de acesso.
                        </DialogDescription>
                    </DialogHeader>
                    {builderToRegister && (
                        <form action={registerAction} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="name">Nome da Construtora</Label>
                                    <Input id="name" name="name" defaultValue={builderToRegister.name} required />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="email">E-mail (para login)</Label>
                                    <Input id="email" name="email" type="email" defaultValue={builderToRegister.email} required placeholder="contato@construtora.com" />
                                     <p className="text-xs text-muted-foreground">Será criada uma conta com a senha padrão: <strong>@Construtora2025</strong></p>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input id="website" name="website" defaultValue={builderToRegister.website} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Input id="address" name="address" defaultValue={builderToRegister.address} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input id="city" name="city" defaultValue={builderToRegister.city} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado (Sigla)</Label>
                                    <Input id="state" name="state" defaultValue={builderToRegister.state} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" name="phone" defaultValue={builderToRegister.phone} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp</Label>
                                    <Input id="whatsapp" name="whatsapp" defaultValue={builderToRegister.whatsapp} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input id="instagram" name="instagram" defaultValue={builderToRegister.instagram} placeholder="@usuario_instagram"/>
                                </div>
                                 <div className="flex items-center space-x-2 pt-4">
                                    <Switch id="isVisibleOnSite" name="isVisibleOnSite" defaultChecked={true} />
                                    <Label htmlFor="isVisibleOnSite">Visível no site público</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <SubmitButton />
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
