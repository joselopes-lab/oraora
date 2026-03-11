'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OralinkLink = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  icon?: string;
};

type OralinkData = {
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  links: OralinkLink[];
  showPropertyShowcase: boolean;
  featuredPropertyIds?: string[];
  videoUrl?: string;
  showVideo?: boolean;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    valor?: number;
    status: string;
  };
  midia: string[];
  localizacao: {
    bairro: string;
    cidade: string;
  };
};

const availableIcons = [
  { value: 'link', label: 'Link' },
  { value: 'chat', label: 'WhatsApp' },
  { value: 'mail', label: 'E-mail' },
  { value: 'call', label: 'Telefone' },
  { value: 'language', label: 'Website' },
  { value: 'photo_camera', label: 'Instagram' },
  { value: 'description', label: 'Catálogo' },
  { value: 'apartment', label: 'Imóveis' },
  { value: 'person', label: 'Perfil' },
  { value: 'location_on', label: 'Mapa' },
  { value: 'share', label: 'Compartilhar' },
];

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export default function OralinkManagementPage() {
  const { user, userProfile } = useAuthContext();
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  const { data: brokerData, isLoading: isBrokerLoading } = useDoc<any>(brokerDocRef);

  const brokerPropertiesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: avulsoProperties } = useCollection<Property>(brokerPropertiesQuery);

  const portfolioDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'portfolios', user.uid) : null),
    [user, firestore]
  );
  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<{ propertyIds: string[] }>(portfolioDocRef);

  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!firestore || !portfolio?.propertyIds?.length) return;
      const ids = portfolio.propertyIds.slice(0, 30);
      const q = query(collection(firestore, 'properties'), where('__name__', 'in', ids));
      const snap = await getDocs(q);
      setPortfolioProperties(snap.docs.map(d => ({ id: d.id, ...d.data() } as Property)));
    };
    fetchPortfolio();
  }, [firestore, portfolio]);

  const allAvailableProperties = useMemo(() => {
    const combined = [...(avulsoProperties || []), ...portfolioProperties];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    return Array.from(unique.values());
  }, [avulsoProperties, portfolioProperties]);

  const [oralink, setOralink] = useState<OralinkData>({
    displayName: '',
    bio: '',
    links: [],
    showPropertyShowcase: true,
    featuredPropertyIds: [],
    videoUrl: '',
    showVideo: false,
  });

  useEffect(() => {
    if (brokerData?.oralink) {
      setOralink(prev => ({
        ...prev,
        ...brokerData.oralink,
        links: brokerData.oralink.links || [],
        featuredPropertyIds: brokerData.oralink.featuredPropertyIds || [],
        showVideo: brokerData.oralink.showVideo ?? false,
        videoUrl: brokerData.oralink.videoUrl || '',
      }));
    } else if (userProfile) {
      setOralink(prev => ({ ...prev, displayName: userProfile.username }));
    }
  }, [brokerData, userProfile]);

  const handleSave = () => {
    if (!user || !firestore || !brokerDocRef) return;
    setDocumentNonBlocking(brokerDocRef, { oralink }, { merge: true });
    toast({ title: "Oralink Atualizado!", description: "Suas alterações foram salvas com sucesso." });
  };

  const handleAddLink = () => {
    const newLink: OralinkLink = {
      id: uuidv4(),
      title: 'Novo Link',
      url: 'https://',
      active: true,
      icon: 'link'
    };
    setOralink(prev => ({ ...prev, links: [...prev.links, newLink] }));
  };

  const handleUpdateLink = (id: string, updates: Partial<OralinkLink>) => {
    setOralink(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const handleRemoveLink = (id: string) => {
    setOralink(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLinks = [...oralink.links];
    const draggedItem = newLinks[draggedIndex];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setOralink(prev => ({ ...prev, links: newLinks }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;

    setIsUploading(true);
    try {
      const path = `brokers/${user.uid}/oralink`;
      const url = await uploadFile(storage, path, file, setUploadProgress);
      setOralink(prev => ({ ...prev, profileImageUrl: url }));
      toast({ title: "Foto atualizada!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no upload" });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePropertyToggle = (id: string) => {
    const current = oralink.featuredPropertyIds || [];
    if (current.includes(id)) {
      setOralink(prev => ({ ...prev, featuredPropertyIds: current.filter(pid => pid !== id) }));
    } else {
      if (current.length >= 4) {
        toast({
          variant: "destructive",
          title: "Limite Atingido",
          description: "Selecione no máximo 4 imóveis para a vitrine."
        });
        return;
      }
      setOralink(prev => ({ ...prev, featuredPropertyIds: [...current, id] }));
    }
  };

  const selectedProperties = useMemo(() => {
    return allAvailableProperties.filter(p => oralink.featuredPropertyIds?.includes(p.id));
  }, [allAvailableProperties, oralink.featuredPropertyIds]);

  const filteredSelectionProperties = useMemo(() => {
    if (!searchTerm) return allAvailableProperties;
    return allAvailableProperties.filter(p => 
      p.informacoesbasicas.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.localizacao.bairro.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAvailableProperties, searchTerm]);

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (isBrokerLoading) return <div className="p-10 text-center">Carregando editor...</div>;

  const primaryHex = brokerData?.primaryColor ? hslToHex(brokerData.primaryColor) : '#c3e738';
  const secondaryHex = brokerData?.secondaryColor ? hslToHex(brokerData.secondaryColor) : '#141811';
  const bgHex = brokerData?.backgroundColor ? hslToHex(brokerData.backgroundColor) : '#fcfdfa';
  const textHex = brokerData?.foregroundColor ? hslToHex(brokerData.foregroundColor) : '#141811';

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8 max-w-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-main">Gestão do Oralink</h1>
            <p className="text-text-secondary">Sua vitrine digital e links de contato simplificados.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary-hover text-text-main font-bold shadow-sm">
            <Link href={`/sites/${brokerData?.slug}/link`} target="_blank">
              <span className="material-symbols-outlined text-lg mr-2">visibility</span>
              Ver Meu Oralink
            </Link>
          </Button>
        </div>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">person</span>
            <h2 className="text-xl font-bold text-text-main">1. Informações de Perfil</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <div className="size-32 rounded-full overflow-hidden border-4 border-slate-100 bg-gray-100 relative">
                {oralink.profileImageUrl ? (
                  <Image src={oralink.profileImageUrl} alt="Profile" fill className="object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <span className="material-symbols-outlined text-5xl">person</span>
                  </div>
                )}
              </div>
              <label htmlFor="oralink-img" className="absolute bottom-0 right-0 bg-primary text-text-main p-2 rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-base">photo_camera</span>
                <input id="oralink-img" type="file" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
              </label>
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                  <Progress value={uploadProgress} className="w-20 h-1" />
                </div>
              )}
            </div>
            <div className="flex-1 grid gap-4 w-full">
              <div>
                <label className="text-sm font-bold mb-1.5 block text-text-secondary uppercase tracking-wider">Nome de Exibição</label>
                <Input 
                  value={oralink.displayName} 
                  onChange={e => setOralink(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Seu nome profissional"
                />
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block text-text-secondary uppercase tracking-wider">Bio Curta</label>
                <Textarea 
                  value={oralink.bio} 
                  onChange={e => setOralink(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Ex: Especialista em imóveis de alto padrão..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">play_circle</span>
              <h2 className="text-xl font-bold text-text-main">2. Vídeo em Destaque</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-text-secondary uppercase">Exibir Vídeo</span>
              <Switch 
                checked={oralink.showVideo} 
                onCheckedChange={checked => setOralink(prev => ({ ...prev, showVideo: checked }))} 
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold mb-1.5 block text-text-secondary uppercase tracking-wider">Link do YouTube</label>
              <Input 
                value={oralink.videoUrl} 
                onChange={e => setOralink(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-[10px] text-text-secondary mt-2">O vídeo aparecerá antes dos links de contato no seu Oralink.</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">link</span>
              <h2 className="text-xl font-bold text-text-main">3. Meus Links Personalizados</h2>
            </div>
            <Button variant="ghost" onClick={handleAddLink} className="text-primary hover:text-primary-hover font-bold text-sm">
              <span className="material-symbols-outlined text-lg mr-1">add_circle</span>
              Novo Link
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            {oralink.links.map((link, index) => (
              <div 
                key={link.id} 
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group border border-slate-100 rounded-xl p-4 flex items-center gap-4 bg-gray-50/50 hover:border-primary/50 transition-all cursor-default",
                  draggedIndex === index && "opacity-50"
                )}
              >
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-primary">
                  <span className="material-symbols-outlined">drag_indicator</span>
                </div>
                <div className="flex-1 grid gap-4">
                  <div className="flex items-center gap-3">
                    <Select 
                      value={link.icon || 'link'} 
                      onValueChange={icon => handleUpdateLink(link.id, { icon })}
                    >
                      <SelectTrigger className="w-14 h-10 px-0 flex items-center justify-center bg-white border-slate-200">
                        <span className="material-symbols-outlined text-lg text-slate-500">
                          {link.icon || 'link'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map(icon => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-base">{icon.value}</span>
                              <span className="text-xs">{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      value={link.title} 
                      onChange={e => handleUpdateLink(link.id, { title: e.target.value })}
                      className="bg-transparent border-none p-0 font-bold focus:ring-0"
                      placeholder="Título do botão"
                    />
                  </div>
                  <Input 
                    value={link.url} 
                    onChange={e => handleUpdateLink(link.id, { url: e.target.value })}
                    className="bg-transparent border-none p-0 text-text-secondary text-sm focus:ring-0 ml-16"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={link.active} 
                    onCheckedChange={checked => handleUpdateLink(link.id, { active: checked })}
                  />
                  <button onClick={() => handleRemoveLink(link.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {oralink.links.length === 0 && (
              <p className="text-center py-10 text-text-secondary text-sm italic">Nenhum link adicionado ainda.</p>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">apartment</span>
              <h2 className="text-xl font-bold text-text-main">4. Vitrine de Imóveis</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-text-secondary uppercase">Exibir Vitrine</span>
              <Switch 
                checked={oralink.showPropertyShowcase} 
                onCheckedChange={checked => setOralink(prev => ({ ...prev, showPropertyShowcase: checked }))} 
              />
            </div>
          </div>
          
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-text-secondary">Selecione até 4 imóveis para aparecerem no final da sua página Oralink.</p>
            <Dialog open={isPropertyPickerOpen} onOpenChange={setIsPropertyPickerOpen}>
              <DialogTrigger asChild>
                <button type="button" className="bg-slate-100 text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary transition-colors cursor-pointer">
                    Gerenciar Seleção
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                <VisuallyHidden>
                  <DialogHeader>
                    <DialogTitle>Selecionar Imóveis para Vitrine</DialogTitle>
                    <DialogDescription>Escolha até 4 imóveis do seu catálogo.</DialogDescription>
                  </DialogHeader>
                </VisuallyHidden>
                
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-text-main mb-4">Selecionar Imóveis</h3>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <Input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder="Buscar por nome ou bairro..." 
                      className="pl-10 h-12 bg-gray-50 border-gray-100"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {filteredSelectionProperties.map(prop => {
                    const isSelected = oralink.featuredPropertyIds?.includes(prop.id);
                    return (
                      <div 
                        key={prop.id} 
                        onClick={() => handlePropertyToggle(prop.id)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer",
                          isSelected ? "border-primary bg-primary/5" : "border-gray-50 hover:border-gray-200"
                        )}
                      >
                        <div className="relative size-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image src={prop.midia?.[0] || 'https://placehold.co/100x100'} alt={prop.informacoesbasicas.nome} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{prop.informacoesbasicas.nome}</h4>
                          <p className="text-xs text-text-secondary">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                        </div>
                        <div className="px-2">
                          <Checkbox checked={isSelected} className="size-5 rounded-md" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <span className="text-sm font-bold text-text-secondary">
                    {oralink.featuredPropertyIds?.length || 0} de 4 selecionados
                  </span>
                  <DialogClose asChild>
                    <Button className="bg-primary text-text-main font-bold px-8">Concluir</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedProperties.map(prop => (
              <div key={prop.id} className="flex gap-4 p-3 border border-gray-100 rounded-lg group relative">
                <div className="size-16 rounded-lg overflow-hidden relative shrink-0">
                  <Image src={prop.midia?.[0] || 'https://placehold.co/100x100'} alt={prop.informacoesbasicas.nome} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{prop.informacoesbasicas.nome}</h4>
                  <p className="text-xs text-text-secondary">{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <button 
                  onClick={() => handlePropertyToggle(prop.id)}
                  className="absolute top-2 right-2 size-6 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end pb-10">
          <Button onClick={handleSave} size="lg" className="px-10 h-14 rounded-xl bg-secondary hover:bg-primary text-white hover:text-black font-bold shadow-glow transition-all">
            Salvar Alterações
          </Button>
        </div>
      </div>

      <aside className="w-full lg:w-[400px] flex flex-col items-center">
        <div className="sticky top-24 w-full max-w-[320px]">
          <p className="text-center text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Preview Mobile</p>
          <div className="relative mx-auto border-[10px] border-slate-900 rounded-[3rem] h-[640px] w-full bg-white overflow-hidden shadow-2xl ring-1 ring-slate-200" style={{ backgroundColor: bgHex }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20"></div>
            
            <div className="h-full overflow-y-auto no-scrollbar p-6 flex flex-col items-center">
              <div className="mt-8 size-24 rounded-full border-4 p-1 mb-4 overflow-hidden shadow-lg relative bg-gray-100" style={{ borderColor: primaryHex }}>
                {oralink.profileImageUrl ? (
                  <Image src={oralink.profileImageUrl} alt="Avatar" fill className="object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <span className="material-symbols-outlined text-4xl">person</span>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-1" style={{ color: textHex }}>{oralink.displayName || 'Seu Nome'}</h3>
              <p className="text-[11px] text-center mb-8 leading-relaxed px-2" style={{ color: textHex + 'CC' }}>
                {oralink.bio || 'Sua biografia profissional aparecerá aqui.'}
              </p>

              {oralink.showVideo && oralink.videoUrl && getYoutubeEmbedUrl(oralink.videoUrl) && (
                <div className="w-full mb-6 rounded-2xl overflow-hidden shadow-lg aspect-video bg-black relative">
                  <iframe src={getYoutubeEmbedUrl(oralink.videoUrl)!} className="absolute inset-0 w-full h-full" allowFullScreen />
                </div>
              )}

              <div className="w-full space-y-3 mb-10">
                {oralink.links.filter(l => l.active && l.title && l.url).map(link => (
                  <div 
                    key={link.id} 
                    className="flex items-center justify-center gap-2 w-full text-center py-4 px-4 rounded-xl font-bold text-xs shadow-sm"
                    style={{ backgroundColor: secondaryHex, color: '#fff' }}
                  >
                    {link.icon && <span className="material-symbols-outlined text-lg">{link.icon}</span>}
                    <span>{link.title}</span>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 w-full text-center py-4 px-4 rounded-xl font-black text-xs shadow-sm uppercase tracking-wider" style={{ backgroundColor: primaryHex, color: '#000' }}>
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span>Agendar Consultoria</span>
                </div>
              </div>

              {oralink.showPropertyShowcase && selectedProperties.length > 0 && (
                <div className="w-full">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-3" style={{ color: textHex + '80' }}>
                    <div className="w-4 h-0.5" style={{ backgroundColor: primaryHex }}></div>
                    Imóveis em Destaque
                  </h4>
                  <div className="space-y-4">
                    {selectedProperties.map(prop => (
                      <div key={prop.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <div className="relative h-28 w-full bg-gray-100">
                          <Image src={prop.midia?.[0] || 'https://placehold.co/300/150'} alt="Imóvel" fill className="object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-[11px] truncate text-text-main uppercase">{prop.informacoesbasicas.nome}</p>
                          <p className="text-[9px] text-text-secondary mt-0.5">{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <footer className="mt-12 mb-6 flex flex-col items-center gap-3 opacity-40">
                <div className="flex flex-col items-center gap-2">
                    <Image src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" alt="Oraora" width={80} height={20} className="h-4 w-auto" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: textHex }}>Powered by Oraora</p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
