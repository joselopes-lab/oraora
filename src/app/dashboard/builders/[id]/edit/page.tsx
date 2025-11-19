
'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Building2, FilePen, Upload, Trash2 } from 'lucide-react';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { type Builder } from '../../page';

export default function BuilderEditPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const [user] = useAuthState(auth);

    const builderId = params.id as string;

    const [currentBuilder, setCurrentBuilder] = useState<Partial<Builder>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);


    useEffect(() => {
        if (!builderId) {
            notFound();
            return;
        };

        const fetchBuilder = async () => {
            setIsLoading(true);
            const docRef = doc(db, 'builders', builderId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const builderData = { id: docSnap.id, ...docSnap.data() } as Builder;
                setCurrentBuilder(builderData);
                 if (builderData.state) {
                    await handleStateChange(builderData.state, false);
                }
            } else {
                toast({ variant: 'destructive', title: 'Construtora não encontrada.' });
                router.push('/dashboard/builders');
            }
            setIsLoading(false);
        };
        
        async function loadStates() {
            setIsLoadingStates(true);
            const statesData = await getStates();
            setStates(statesData);
            setIsLoadingStates(false);
        }

        loadStates();
        fetchBuilder();

    }, [builderId, router, toast]);
    

    const handleStateChange = async (stateAcronym: string, resetCity = true) => {
        setCurrentBuilder((prev) => ({
            ...prev,
            state: stateAcronym,
            ...(resetCity && { city: '' }),
        }));
        setIsLoadingCities(true);
        setCities([]);
        if (stateAcronym) {
            const citiesData = await getCitiesByState(stateAcronym);
            setCities(citiesData);
        }
        setIsLoadingCities(false);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setCurrentBuilder((prev) => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: 'state' | 'city', value: string) => {
        if (id === 'state') {
            handleStateChange(value, true);
        } else {
            setCurrentBuilder((prev) => ({ ...prev, [id]: value }));
        }
    };
    
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setIsUploading(true);
        try {
            const path = `builders_logos/${file.name}`;
            const downloadURL = await uploadFile(file, path);
            setCurrentBuilder(prev => ({...prev, logoUrl: downloadURL}));
            toast({ title: 'Logo carregado com sucesso!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível carregar a imagem.' });
        } finally {
            setIsUploading(false);
        }
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentBuilder.name || !currentBuilder.state || !currentBuilder.city) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome, estado e cidade são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const builderRef = doc(db, 'builders', builderId);
            await updateDoc(builderRef, { ...currentBuilder });
            toast({ title: 'Construtora Atualizada!', description: 'Os dados foram salvos.' });
            router.push('/dashboard/builders');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/builders">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                </Link>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    {currentBuilder.name || 'Editar Construtora'}
                </h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FilePen />
                        Editar Construtora
                    </CardTitle>
                    <CardDescription>
                        Altere as informações da construtora.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 py-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Construtora</Label>
                            <Input id="name" value={currentBuilder.name || ''} onChange={handleInputChange} placeholder="Ex: Construções & Cia" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoUpload">Logo da Construtora</Label>
                            <Input id="logoUpload" type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading}/>
                            {isUploading && <p className="text-xs text-muted-foreground">Enviando imagem...</p>}
                            {currentBuilder.logoUrl && (
                                <div className="mt-2 relative w-fit">
                                    <Image src={currentBuilder.logoUrl} alt="Pré-visualização do Logo" width={100} height={100} className="rounded-md border object-contain"/>
                                    <Button 
                                        type="button"
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute -top-2 -right-2 h-6 w-6"
                                        onClick={() => setCurrentBuilder(prev => ({...prev, logoUrl: ''}))}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input id="address" value={currentBuilder.address || ''} onChange={handleInputChange} placeholder="Ex: Rua das Obras, 123" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">Estado</Label>
                            <Select onValueChange={(value) => handleSelectChange('state', value)} value={currentBuilder.state || ''} required disabled={isLoadingStates}>
                                <SelectTrigger id="state">
                                    <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione um estado'} />
                                </SelectTrigger>
                                <SelectContent>{states.map((s) => (<SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Cidade</Label>
                            <Select onValueChange={(value) => handleSelectChange('city', value)} value={currentBuilder.city || ''} required disabled={!currentBuilder.state || isLoadingCities}>
                                <SelectTrigger id="city">
                                    <SelectValue placeholder={isLoadingCities ? 'Carregando...' : !currentBuilder.state ? 'Selecione um estado' : 'Selecione uma cidade'} />
                                </SelectTrigger>
                                <SelectContent>{cities.map((c) => (<SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" type="tel" value={currentBuilder.phone || ''} onChange={handleInputChange} placeholder="(99) 9999-9999" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input id="whatsapp" type="tel" value={currentBuilder.whatsapp || ''} onChange={handleInputChange} placeholder="(99) 99999-9999" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={currentBuilder.email || ''} onChange={handleInputChange} placeholder="contato@construtora.com" disabled />
                            <p className="text-xs text-muted-foreground">O e-mail de login não pode ser alterado.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input id="instagram" value={currentBuilder.instagram || ''} onChange={handleInputChange} placeholder="@construtora" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                        <Switch id="isVisibleOnSite" checked={currentBuilder.isVisibleOnSite} onCheckedChange={(checked) => setCurrentBuilder(prev => ({...prev, isVisibleOnSite: checked}))} />
                        <Label htmlFor="isVisibleOnSite">Visível no site público</Label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => router.push('/dashboard/builders')}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting || isUploading}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
