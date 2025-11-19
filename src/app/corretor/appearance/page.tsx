
'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Paintbrush, Image as ImageIcon, Palette, UploadCloud, Monitor, Smartphone, Star, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, collection, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { uploadFile } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Property } from '@/app/dashboard/properties/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { queryInBatches } from '@/lib/firestoreUtils';

interface AppearanceSettings {
    logoUrl?: string;
    backgroundColor?: string;
    theme?: 'light' | 'dark';
    verMaisButtonColor?: string;
    verMaisButtonBackgroundColor?: string;
    faleAgoraButtonColor?: string;
    faleAgoraButtonBackgroundColor?: string;
    bannerDesktopUrl?: string;
    bannerMobileUrl?: string;
    featuredPropertyIds?: string[];
    videoCoverUrl?: string;
    youtubeUrl?: string;
}

export default function CorretorAppearancePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [settings, setSettings] = useState<AppearanceSettings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState<'logo' | 'desktop' | 'mobile' | 'video' | null>(null);
    const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);

    useEffect(() => {
        if (!user || authLoading) return;

        const fetchAppearanceAndProperties = async () => {
            setIsLoading(true);
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setSettings({
                        logoUrl: userData.logoUrl || '',
                        backgroundColor: userData.backgroundColor || '#FFFFFF',
                        theme: userData.theme || 'light',
                        verMaisButtonColor: userData.verMaisButtonColor || '#000000',
                        verMaisButtonBackgroundColor: userData.verMaisButtonBackgroundColor || '#83e800',
                        faleAgoraButtonColor: userData.faleAgoraButtonColor || '#000000',
                        faleAgoraButtonBackgroundColor: userData.faleAgoraButtonBackgroundColor || '#ffffff',
                        bannerDesktopUrl: userData.bannerDesktopUrl || '',
                        bannerMobileUrl: userData.bannerMobileUrl || '',
                        featuredPropertyIds: userData.featuredPropertyIds || [],
                        videoCoverUrl: userData.videoCoverUrl || '',
                        youtubeUrl: userData.youtubeUrl || '',
                    });

                    const propertyIds = userData.portfolioPropertyIds || [];
                    if (propertyIds.length > 0) {
                        const properties = await queryInBatches<Property>('properties', documentId(), propertyIds, [where('isVisibleOnSite', '==', true)]);
                        setPortfolioProperties(properties);
                    }
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Não foi possível buscar as configurações e imóveis.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchAppearanceAndProperties();
    }, [user, authLoading, toast]);


    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'desktop' | 'mobile' | 'video') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(type);
        try {
            const path = `corretor_uploads/${user.uid}/${type}`;
            const downloadURL = await uploadFile(file, path);
            
            if (type === 'logo') setSettings(prev => ({...prev, logoUrl: downloadURL}));
            else if (type === 'desktop') setSettings(prev => ({...prev, bannerDesktopUrl: downloadURL}));
            else if (type === 'mobile') setSettings(prev => ({...prev, bannerMobileUrl: downloadURL}));
            else if (type === 'video') setSettings(prev => ({ ...prev, videoCoverUrl: downloadURL }));

            toast({ title: 'Imagem carregada com sucesso!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível carregar a imagem.' });
        } finally {
            setIsUploading(null);
        }
    }

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, settings);
            toast({ title: 'Configurações salvas com sucesso!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    const handleFieldChange = (field: keyof AppearanceSettings, value: any) => {
        setSettings(prev => ({...prev, [field]: value}));
    }

    const getAvailableProperties = () => {
        const selectedIds = new Set(settings.featuredPropertyIds?.filter(Boolean));
        return portfolioProperties.filter(p => !selectedIds.has(p.id));
    }


    if (isLoading || authLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Paintbrush className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Aparência</h1>
                    <p className="font-light text-[23px] text-black">Personalize como sua página de corretor é exibida para os clientes.</p>
                </div>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <CardContent className="pt-6">
                        <Tabs defaultValue="appearance">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="appearance">Aparência</TabsTrigger>
                                <TabsTrigger value="featured">Destaques</TabsTrigger>
                                <TabsTrigger value="video">Vídeo</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="appearance" className="pt-6 space-y-8">
                                {/* Logo Section */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Logo</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                            {settings.logoUrl ? (
                                                <Image src={settings.logoUrl} alt="Pré-visualização do Logo" width={96} height={96} className="object-contain" />
                                            ) : (
                                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                            )}
                                        </div>
                                    <div className="flex-1 space-y-2">
                                            <Label htmlFor="logoUrl">URL da Logo</Label>
                                            <Input
                                                id="logoUrl"
                                                value={settings.logoUrl || ''}
                                                onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                                                placeholder="https://exemplo.com/sua-logo.png"
                                                className="border"
                                            />
                                            <div className="relative">
                                                <p className="text-sm text-center text-muted-foreground">ou</p>
                                                <Input
                                                    id="logoUpload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'logo')}
                                                    className="mt-1"
                                                    disabled={isUploading !== null}
                                                />
                                                {isUploading === 'logo' && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />
                                
                                {/* Banner Section */}
                                <div className="space-y-6">
                                    <h3 className="font-semibold text-lg">Banner da Página</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Desktop Banner */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium flex items-center gap-2"><Monitor className="h-5 w-5"/> Banner para Desktop/Tablet</h4>
                                            <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                {settings.bannerDesktopUrl ? (
                                                    <Image src={settings.bannerDesktopUrl} alt="Banner Desktop" width={400} height={225} className="object-cover w-full h-full"/>
                                                ): <ImageIcon className="h-10 w-10 text-muted-foreground" />}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bannerDesktopUrl">URL do Banner</Label>
                                                <Input id="bannerDesktopUrl" value={settings.bannerDesktopUrl || ''} onChange={(e) => handleFieldChange('bannerDesktopUrl', e.target.value)} className="border" />
                                                <div className="relative">
                                                    <p className="text-sm text-center text-muted-foreground">ou</p>
                                                    <Input id="desktopBannerUpload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'desktop')} disabled={isUploading !== null} className="mt-1" />
                                                    {isUploading === 'desktop' && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mobile Banner */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium flex items-center gap-2"><Smartphone className="h-5 w-5"/> Banner para Celular</h4>
                                            <div className="aspect-[9/16] w-full max-w-[200px] mx-auto rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                {settings.bannerMobileUrl ? (
                                                    <Image src={settings.bannerMobileUrl} alt="Banner Mobile" width={200} height={355} className="object-cover w-full h-full"/>
                                                ): <ImageIcon className="h-10 w-10 text-muted-foreground" />}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bannerMobileUrl">URL do Banner</Label>
                                                <Input id="bannerMobileUrl" value={settings.bannerMobileUrl || ''} onChange={(e) => handleFieldChange('bannerMobileUrl', e.target.value)} className="border" />
                                                <div className="relative">
                                                    <p className="text-sm text-center text-muted-foreground">ou</p>
                                                    <Input id="mobileBannerUpload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'mobile')} disabled={isUploading !== null} className="mt-1" />
                                                    {isUploading === 'mobile' && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />
                                
                                {/* Theme and Colors Section */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Tema e Cores</h3>
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" className="gap-2">
                                                <Palette />
                                                Personalizar Cores
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left">
                                            <SheetHeader>
                                                <SheetTitle>Editor de Cores</SheetTitle>
                                            </SheetHeader>
                                            <div className="py-8 space-y-6">
                                                <div className="flex flex-col gap-2">
                                                    <Label>Tema da página</Label>
                                                    <div className="flex gap-2">
                                                        <Button variant={settings.theme === 'light' ? 'secondary': 'outline'} onClick={() => handleFieldChange('theme', 'light')}>Claro</Button>
                                                        <Button variant={settings.theme === 'dark' ? 'secondary': 'outline'} onClick={() => handleFieldChange('theme', 'dark')}>Escuro</Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <Label>Cor do fundo</Label>
                                                    <Input type="color" className="w-16 h-10 p-1" value={settings.backgroundColor} onChange={(e) => handleFieldChange('backgroundColor', e.target.value)} />
                                                </div>
                                                <Separator />
                                                <div>
                                                    <h4 className="font-semibold mb-4">Botão "Ver mais"</h4>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between gap-4"><Label>Cor da fonte</Label><Input type="color" className="w-16 h-10 p-1" value={settings.verMaisButtonColor} onChange={(e) => handleFieldChange('verMaisButtonColor', e.target.value)} /></div>
                                                        <div className="flex items-center justify-between gap-4"><Label>Cor do fundo</Label><Input type="color" className="w-16 h-10 p-1" value={settings.verMaisButtonBackgroundColor} onChange={(e) => handleFieldChange('verMaisButtonBackgroundColor', e.target.value)} /></div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <h4 className="font-semibold mb-4">Botão "Fale agora"</h4>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between gap-4"><Label>Cor da fonte</Label><Input type="color" className="w-16 h-10 p-1" value={settings.faleAgoraButtonColor} onChange={(e) => handleFieldChange('faleAgoraButtonColor', e.target.value)} /></div>
                                                        <div className="flex items-center justify-between gap-4"><Label>Cor do fundo</Label><Input type="color" className="w-16 h-10 p-1" value={settings.faleAgoraButtonBackgroundColor} onChange={(e) => handleFieldChange('faleAgoraButtonBackgroundColor', e.target.value)} /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                    <p className="text-xs text-muted-foreground">Abra o painel para personalizar o esquema de cores da sua página.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="featured" className="pt-6">
                                <div className="space-y-8 max-w-2xl mx-auto">
                                    {[0, 1, 2].map(index => {
                                        const featuredId = settings.featuredPropertyIds?.[index];
                                        const selectedProp = featuredId ? portfolioProperties.find(p => p.id === featuredId) : null;
                                        const availableProps = getAvailableProperties();
                                        
                                        return (
                                            <div key={index} className="space-y-2">
                                                <Label className="font-bold text-lg flex items-center gap-2"><Star className="h-5 w-5 text-amber-400"/> Destaque {index + 1}</Label>
                                                <Select
                                                    value={featuredId || 'none'}
                                                    onValueChange={(value) => {
                                                        const newIds = [...(settings.featuredPropertyIds || [])];
                                                        while (newIds.length < 3) {
                                                            newIds.push('');
                                                        }
                                                        newIds[index] = value === 'none' ? '' : value;
                                                        handleFieldChange('featuredPropertyIds', newIds);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-14">
                                                        <SelectValue>
                                                            {selectedProp ? (
                                                                <div className="flex items-center gap-3">
                                                                    <Image src={selectedProp.midia?.[0] || 'https://placehold.co/40x40.png'} width={40} height={40} className="h-10 w-10 rounded-md object-cover" alt={selectedProp.informacoesbasicas.nome} />
                                                                    <span className="font-semibold">{selectedProp.informacoesbasicas.nome}</span>
                                                                </div>
                                                            ) : (
                                                                <span>Selecione um imóvel...</span>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Nenhum</SelectItem>
                                                        {selectedProp && <SelectItem key={selectedProp.id} value={selectedProp.id}>{selectedProp.informacoesbasicas.nome}</SelectItem>}
                                                        {availableProps.map(prop => <SelectItem key={prop.id} value={prop.id}>{prop.informacoesbasicas.nome}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </TabsContent>
                            <TabsContent value="video" className="pt-6 space-y-8">
                                <div className="space-y-6">
                                    <h3 className="font-semibold text-lg">Capa do Vídeo</h3>
                                    <div className="space-y-4">
                                        <div className="aspect-video w-full max-w-md rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                            {settings.videoCoverUrl ? (
                                                <Image src={settings.videoCoverUrl} alt="Capa do vídeo" width={400} height={225} className="object-cover w-full h-full"/>
                                            ): <Youtube className="h-10 w-10 text-muted-foreground" />}
                                        </div>
                                        <div className="space-y-2 max-w-md">
                                            <Label htmlFor="videoCoverUrl">URL da Imagem da Capa</Label>
                                            <Input id="videoCoverUrl" value={settings.videoCoverUrl || ''} onChange={(e) => handleFieldChange('videoCoverUrl', e.target.value)} className="border" />
                                            <div className="relative">
                                                <p className="text-sm text-center text-muted-foreground">ou</p>
                                                <Input id="videoCoverUpload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'video')} disabled={isUploading !== null} className="mt-1" />
                                                {isUploading === 'video' && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2 max-w-md">
                                    <h3 className="font-semibold text-lg">Link do Vídeo</h3>
                                    <Label htmlFor="youtubeUrl">URL do YouTube</Label>
                                    <Input id="youtubeUrl" value={settings.youtubeUrl || ''} onChange={(e) => handleFieldChange('youtubeUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                                    <p className="text-xs text-muted-foreground">Insira o link completo do vídeo do YouTube que deve ser aberto ao clicar na imagem.</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSaving || isUploading !== null}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

    

    