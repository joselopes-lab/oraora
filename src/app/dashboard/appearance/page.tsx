
'use client';

import { useEffect, useState, useRef } from 'react';
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
import { getAppearanceSettings, revalidateHomepage, handleGenerateSeo, type AppearanceSettings } from './actions';
import { Loader2, Paintbrush, Sparkles, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';

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
});

export default function AppearancePage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    getAppearanceSettings().then(setSettings);
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formRef.current) return;

    setIsSaving(true);
    const formData = new FormData(formRef.current);
    const newSettings = Object.fromEntries(formData.entries());

    const validatedFields = settingsSchema.safeParse(newSettings);

    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0].message;
        toast({ variant: 'destructive', title: 'Erro de Validação', description: firstError });
        setIsSaving(false);
        return;
    }

    try {
      const settingsRef = doc(db, 'settings', 'homepage');
      await setDoc(settingsRef, validatedFields.data, { merge: true });
      await revalidateHomepage();
      
      toast({ title: 'Sucesso!', description: 'Configurações salvas com sucesso!' });
      setSettings(validatedFields.data as AppearanceSettings);
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
          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL do Logo</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={settings.logoUrl}
              placeholder="https://exemplo.com/logo.png"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Usado no cabeçalho e rodapé. Deixe em branco para usar o logo padrão.
            </p>
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="faviconUrl">URL do Favicon</Label>
            <Input
              id="faviconUrl"
              name="faviconUrl"
              defaultValue={settings.faviconUrl}
              placeholder="https://exemplo.com/favicon.ico"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Ícone que aparece na aba do navegador. Use um link para um arquivo .ico ou .png.
            </p>
          </div>

          <Separator />

          <h3 className="text-lg font-medium pt-2">Seção Principal (Homepage)</h3>
          <div className="space-y-4 pl-2 border-l-2 border-primary">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Título Principal</Label>
              <Textarea
                id="heroTitle"
                name="heroTitle"
                defaultValue={settings.heroTitle}
                className="min-h-[100px]"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchFormTitle">Título do Formulário de Busca</Label>
              <Input
                id="searchFormTitle"
                name="searchFormTitle"
                defaultValue={settings.searchFormTitle}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroBackgroundImage">URL da Imagem de Fundo</Label>
              <Input
                id="heroBackgroundImage"
                name="heroBackgroundImage"
                defaultValue={settings.heroBackgroundImage}
                placeholder="https://exemplo.com/imagem.png"
                disabled={isSaving}
              />
            </div>
          </div>
          
          <Separator />

          <h3 className="text-lg font-medium pt-2">Rodapé</h3>
          <div className="space-y-4 pl-2 border-l-2 border-primary">
            <div className="space-y-2">
              <Label htmlFor="footerAboutText">Texto "Sobre"</Label>
              <Textarea
                id="footerAboutText"
                name="footerAboutText"
                defaultValue={settings.footerAboutText}
                className="min-h-[150px]"
                disabled={isSaving}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="newsletterTitle">Título da Newsletter</Label>
              <Input
                id="newsletterTitle"
                name="newsletterTitle"
                defaultValue={settings.newsletterTitle}
                disabled={isSaving}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="newsletterSubtitle">Subtítulo da Newsletter</Label>
              <Textarea
                id="newsletterSubtitle"
                name="newsletterSubtitle"
                defaultValue={settings.newsletterSubtitle}
                className="min-h-[80px]"
                disabled={isSaving}
              />
            </div>
            <h4 className="font-medium pt-2">Redes Sociais</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input name="socialFacebook" defaultValue={settings.socialFacebook} placeholder="URL do Facebook" className="pl-9" />
                </div>
                <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input name="socialInstagram" defaultValue={settings.socialInstagram} placeholder="URL do Instagram" className="pl-9" />
                </div>
                <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input name="socialTwitter" defaultValue={settings.socialTwitter} placeholder="URL do Twitter" className="pl-9" />
                </div>
                <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input name="socialYoutube" defaultValue={settings.socialYoutube} placeholder="URL do YouTube" className="pl-9" />
                </div>
             </div>
          </div>

          <Separator />
          
          <div className="space-y-6 pt-2">
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
                <Input
                    id="seoTitle"
                    name="seoTitle"
                    value={settings.seoTitle || ''}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, seoTitle: e.target.value } : null)}
                    placeholder="Título para o Google"
                    disabled={isSaving}
                    maxLength={60}
                />
                 <p className="text-xs text-muted-foreground">Recomendado: 50-60 caracteres.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="seoDescription">Meta Description</Label>
                <Textarea
                    id="seoDescription"
                    name="seoDescription"
                    value={settings.seoDescription || ''}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, seoDescription: e.target.value } : null)}
                    placeholder="Descrição para o Google"
                    className="min-h-[100px]"
                    disabled={isSaving}
                    maxLength={160}
                />
                 <p className="text-xs text-muted-foreground">Recomendado: 150-160 caracteres.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="seoKeywords">Palavras-chave</Label>
                <Input
                    id="seoKeywords"
                    name="seoKeywords"
                    value={settings.seoKeywords || ''}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, seoKeywords: e.target.value } : null)}
                    placeholder="imóveis, comprar apartamento, etc"
                    disabled={isSaving}
                />
                 <p className="text-xs text-muted-foreground">Separadas por vírgula.</p>
            </div>
          </div>

        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
