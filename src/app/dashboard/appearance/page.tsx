
'use client';

import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getAppearanceSettings, revalidateHomepage, handleGenerateSeo, type AppearanceSettings, type CategoryImages } from './actions';
import { Loader2, Paintbrush, Sparkles, Facebook, Instagram, Twitter, Youtube, Monitor, Smartphone, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadFile } from '@/lib/storage';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';

const settingsSchema = z.object({
  logoUrl: z.string().url('URL do logo é inválida.').or(z.literal('')),
  faviconUrl: z.string().url('URL do favicon é inválida.').or(z.literal('')),
  heroTitle: z.string().min(1, 'Título principal é obrigatório.'),
  searchFormTitle: z.string().min(1, 'Título do formulário de busca é obrigatório.'),
  heroBackgroundImage: z.string().url('URL da imagem de fundo é inválida.'),
  footerAboutText: z.string().min(1, 'O texto do rodapé é obrigatório.'),
  newsletterTitle: z.string().min(1, 'Título da newsletter é obrigatório.'),
  newsletterSubtitle: z.string().min(1, 'Subtítulo da newsletter é obrigatório.'),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialYoutube: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  brokerCallDesktopImage: z.string().url('URL inválida.').or(z.literal('')),
  brokerCallMobileImage: z.string().url('URL inválida.').or(z.literal('')),
  brokerCallLink: z.string().url('URL do link inválida.').or(z.literal('')),
  brokerCallLinkTargetBlank: z.preprocess((val) => val === 'on' || val === true, z.boolean()),
});

const allPropertyTypes = [
  'Apartamento',
  'Casa em Condomínio',
  'Casa',
  'Terreno',
  'Sala Comercial',
  'Flat',
  'Loja',
];

export default function AppearancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    getAppearanceSettings().then(setSettings);
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, fieldName: string, subField?: keyof CategoryImages) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const uniqueId = subField ? `${fieldName}-${subField}` : fieldName;
    setIsUploading(uniqueId);
    
    try {
        const path = `appearance/${fieldName}/${file.name}`;
        const downloadURL = await uploadFile(file, path);
        
        if (subField) {
            setSettings(prev => prev ? ({ 
                ...prev, 
                categoryImages: {
                    ...prev.categoryImages,
                    [subField]: downloadURL
                }
            }) : null);
        } else {
            setSettings(prev => prev ? ({ ...prev, [fieldName]: downloadURL }) : null);
        }

        toast({ title: 'Imagem carregada com sucesso!' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível carregar a imagem.' });
    } finally {
        setIsUploading(null);
    }
  };
  
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formRef.current || !settings) return;

    setIsSaving(true);
    
    const dataToSave = { ...settings };

    try {
      const settingsRef = doc(db, 'settings', 'homepage');
      await setDoc(settingsRef, dataToSave, { merge: true });
      await revalidateHomepage();
      
      toast({ title: 'Sucesso!', description: 'Configurações salvas com sucesso!' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      let message = 'Ocorreu um erro ao salvar as configurações.';
      if (error.code === 'permission-denied') {
        message = 'Permissão negada. Verifique as regras de segurança do Firestore.'
      }
      toast({ variant: 'destructive', title: 'Erro!', description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const onGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    const result = await handleGenerateSeo();
    if(result.success && result.data) {
        setSettings(prev => prev ? ({ ...prev, seoTitle: result.data!.title, seoDescription: result.data!.description, seoKeywords: result.data!.keywords }) : null);
        toast({ title: "SEO Gerado!", description: "Os campos de SEO foram preenchidos pela IA." });
    } else {
        toast({ variant: 'destructive', title: 'Falha na Geração', description: result.error });
    }
    setIsGeneratingSeo(false);
  }
  
  if (!settings) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Aparência e SEO</CardTitle>
            <CardDescription>Carregando configurações...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSave}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush />
            Aparência e Conteúdo
          </CardTitle>
          <CardDescription>
            Personalize o conteúdo da sua página inicial e rodapé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="banners">Banners</TabsTrigger>
                    <TabsTrigger value="categories">Imagens das Categorias</TabsTrigger>
                    <TabsTrigger value="footer">Rodapé</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="pt-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="logoUrl">URL do Logo</Label>
                        <Input id="logoUrl" name="logoUrl" value={settings.logoUrl || ''} onChange={(e) => setSettings(prev => ({...prev!, logoUrl: e.target.value}))} placeholder="https://exemplo.com/logo.png" disabled={isSaving} />
                        <p className="text-xs text-muted-foreground">Usado no cabeçalho e rodapé. Deixe em branco para usar o logo padrão.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="faviconUrl">URL do Favicon</Label>
                        <Input id="faviconUrl" name="faviconUrl" value={settings.faviconUrl || ''} onChange={(e) => setSettings(prev => ({...prev!, faviconUrl: e.target.value}))} placeholder="https://exemplo.com/favicon.ico" disabled={isSaving} />
                        <p className="text-xs text-muted-foreground">Ícone que aparece na aba do navegador. Use um link para um arquivo .ico ou .png.</p>
                    </div>
                    <Separator />
                    <h3 className="text-lg font-medium pt-2">Seção Principal (Homepage)</h3>
                    <div className="space-y-4 pl-2 border-l-2 border-primary">
                        <div className="space-y-2">
                            <Label htmlFor="heroTitle">Título Principal</Label>
                            <Textarea id="heroTitle" name="heroTitle" value={settings.heroTitle} onChange={(e) => setSettings(prev => ({...prev!, heroTitle: e.target.value}))} className="min-h-[100px]" disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="searchFormTitle">Título do Formulário de Busca</Label>
                            <Input id="searchFormTitle" name="searchFormTitle" value={settings.searchFormTitle} onChange={(e) => setSettings(prev => ({...prev!, searchFormTitle: e.target.value}))} disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroBackgroundImage">URL da Imagem de Fundo</Label>
                            <Input id="heroBackgroundImage" name="heroBackgroundImage" value={settings.heroBackgroundImage} onChange={(e) => setSettings(prev => ({...prev!, heroBackgroundImage: e.target.value}))} placeholder="https://exemplo.com/imagem.png" disabled={isSaving}/>
                        </div>
                    </div>
                </TabsContent>
                                
                <TabsContent value="banners" className="pt-6 space-y-6">
                     <h3 className="text-lg font-medium">Chamada para Corretores</h3>
                     <div className="space-y-4 pl-2 border-l-2 border-primary">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="brokerCallDesktopImage" className="flex items-center gap-2"><Monitor className="h-4 w-4"/> Imagem para Desktop</Label>
                                <Input id="brokerCallDesktopImage" name="brokerCallDesktopImage" value={settings.brokerCallDesktopImage || ''} onChange={(e) => setSettings(prev => ({...prev!, brokerCallDesktopImage: e.target.value}))} placeholder="https://exemplo.com/imagem-desktop.png" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brokerCallMobileImage" className="flex items-center gap-2"><Smartphone className="h-4 w-4"/> Imagem para Celular</Label>
                                <Input id="brokerCallMobileImage" name="brokerCallMobileImage" value={settings.brokerCallMobileImage || ''} onChange={(e) => setSettings(prev => ({...prev!, brokerCallMobileImage: e.target.value}))} placeholder="https://exemplo.com/imagem-mobile.png" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brokerCallLink">Link de Destino do Banner</Label>
                            <Input id="brokerCallLink" name="brokerCallLink" value={settings.brokerCallLink || ''} onChange={(e) => setSettings(prev => ({...prev!, brokerCallLink: e.target.value}))} placeholder="https://exemplo.com/pagina" disabled={isSaving} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="brokerCallLinkTargetBlank" name="brokerCallLinkTargetBlank" checked={settings.brokerCallLinkTargetBlank} onCheckedChange={(checked) => setSettings(prev => prev ? ({ ...prev, brokerCallLinkTargetBlank: checked }) : null)} />
                            <Label htmlFor="brokerCallLinkTargetBlank">Abrir em nova aba</Label>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="categories" className="pt-6 space-y-6">
                    <h3 className="text-lg font-medium">Imagens das Categorias</h3>
                    <p className="text-sm text-muted-foreground">
                        Personalize as imagens para cada tipo de imóvel na seção "Procure por tipo" da página inicial.
                        A dimensão recomendada é <strong>400x500 pixels</strong>.
                    </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(allPropertyTypes as (keyof CategoryImages)[]).map(type => (
                            <div key={type} className="space-y-3 p-4 border rounded-lg">
                                <Label className="font-semibold">{type}</Label>
                                <div className="aspect-[4/5] w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                    {settings.categoryImages?.[type] ? (
                                        <Image src={settings.categoryImages[type]!} alt={`Preview ${type}`} width={200} height={250} className="object-cover w-full h-full"/>
                                    ): <ImageIcon className="h-10 w-10 text-muted-foreground" />}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${type}-url`} className="text-xs">URL da Imagem</Label>
                                    <Input id={`${type}-url`} value={settings.categoryImages?.[type] || ''} onChange={(e) => setSettings(prev => prev ? ({ ...prev, categoryImages: {...prev.categoryImages, [type]: e.target.value }}) : null)} className="h-8" />
                                     <div className="relative">
                                        <p className="text-sm text-center text-muted-foreground">ou</p>
                                        <Input id={`${type}-upload`} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'categoryImages', type)} disabled={isUploading !== null} className="mt-1" />
                                        {isUploading === `categoryImages-${type}` && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="footer" className="pt-6 space-y-6">
                     <div className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="footerAboutText">Texto "Sobre"</Label>
                        <Textarea id="footerAboutText" name="footerAboutText" value={settings.footerAboutText || ''} onChange={(e) => setSettings(prev => ({...prev!, footerAboutText: e.target.value}))} className="min-h-[150px]" disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="newsletterTitle">Título da Newsletter</Label>
                        <Input id="newsletterTitle" name="newsletterTitle" value={settings.newsletterTitle || ''} onChange={(e) => setSettings(prev => ({...prev!, newsletterTitle: e.target.value}))} disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="newsletterSubtitle">Subtítulo da Newsletter</Label>
                        <Textarea id="newsletterSubtitle" name="newsletterSubtitle" value={settings.newsletterSubtitle || ''} onChange={(e) => setSettings(prev => ({...prev!, newsletterSubtitle: e.target.value}))} className="min-h-[80px]" disabled={isSaving} />
                        </div>
                        <h4 className="font-medium pt-2">Redes Sociais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="socialFacebook" value={settings.socialFacebook || ''} onChange={(e) => setSettings(prev => ({...prev!, socialFacebook: e.target.value}))} placeholder="URL do Facebook" className="pl-9" />
                            </div>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="socialInstagram" value={settings.socialInstagram || ''} onChange={(e) => setSettings(prev => ({...prev!, socialInstagram: e.target.value}))} placeholder="URL do Instagram" className="pl-9" />
                            </div>
                            <div className="relative">
                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="socialTwitter" value={settings.socialTwitter || ''} onChange={(e) => setSettings(prev => ({...prev!, socialTwitter: e.target.value}))} placeholder="URL do Twitter" className="pl-9" />
                            </div>
                            <div className="relative">
                                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="socialYoutube" value={settings.socialYoutube || ''} onChange={(e) => setSettings(prev => ({...prev!, socialYoutube: e.target.value}))} placeholder="URL do YouTube" className="pl-9" />
                            </div>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="seo" className="pt-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">SEO da Página Inicial</h3>
                            <p className="text-sm text-muted-foreground">Otimize como sua página aparece no Google.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={onGenerateSeo} disabled={isGeneratingSeo}>
                            {isGeneratingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2"/>}
                            Gerar com IA
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoTitle">Meta Title</Label>
                        <Input id="seoTitle" name="seoTitle" value={settings.seoTitle || ''} onChange={(e) => setSettings(prev => prev ? { ...prev, seoTitle: e.target.value } : null)} placeholder="Título para o Google" disabled={isSaving} maxLength={60} />
                        <p className="text-xs text-muted-foreground">Recomendado: 50-60 caracteres.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoDescription">Meta Description</Label>
                        <Textarea id="seoDescription" name="seoDescription" value={settings.seoDescription || ''} onChange={(e) => setSettings(prev => prev ? { ...prev, seoDescription: e.target.value } : null)} placeholder="Descrição para o Google" className="min-h-[100px]" disabled={isSaving} maxLength={160} />
                        <p className="text-xs text-muted-foreground">Recomendado: 150-160 caracteres.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoKeywords">Palavras-chave</Label>
                        <Input id="seoKeywords" name="seoKeywords" value={settings.seoKeywords || ''} onChange={(e) => setSettings(prev => prev ? { ...prev, seoKeywords: e.target.value } : null)} placeholder="imóveis, comprar apartamento, etc" disabled={isSaving} />
                        <p className="text-xs text-muted-foreground">Separadas por vírgula.</p>
                    </div>
                </TabsContent>

            </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSaving || isUploading !== null}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
