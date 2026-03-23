'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useFirebase, useCollection } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
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
  // Color Customization
  backgroundColor?: string;
  textColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  cardTextColor?: string;
  footerTextColor?: string;
  statusTagBgColor?: string;
  statusTagTextColor?: string;
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

function hexToHsl(hex: string): string {
    if (!hex) return '0 0% 0%';
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return '0 0% 0%';
    }

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
}

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

const ColorPicker = ({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) => {
    const hexValue = value ? hslToHex(value) : '#000000';
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg border border-gray-200 relative overflow-hidden" style={{ backgroundColor: hexValue }}>
                    <input 
                        type="color" 
                        value={hexValue} 
                        onChange={(e) => onChange(hexToHsl(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase">{hexValue}</span>
        </div>
    );
};

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
    backgroundColor: '90 20% 97%',
    textColor: '110 16% 8%',
    buttonBgColor: '80 99% 49%',
    buttonTextColor: '110 16% 8%',
    cardTextColor: '110 16% 8%',
    footerTextColor: '110 16% 8%',
    statusTagBgColor: '80 99% 49%',
    statusTagTextColor: '110 16% 8%',
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

  // Preview Colors
  const previewBg = oralink.backgroundColor ? hslToHex(oralink.backgroundColor) : '#fcfdfa';
  const previewText = oralink.textColor ? hslToHex(oralink.textColor) : '#141811';
  const previewBtnBg = oralink.buttonBgColor ? hslToHex(oralink.buttonBgColor) : '#c3e738';
  const previewBtnText = oralink.buttonTextColor ? hslToHex(oralink.buttonTextColor) : '#141811';
  const previewCardText = oralink.cardTextColor ? hslToHex(oralink.cardTextColor) : '#141811';
  const previewFooterText = oralink.footerTextColor ? hslToHex(oralink.footerTextColor) : '#141811';
  const previewTagBg = oralink.statusTagBgColor ? hslToHex(oralink.statusTagBgColor) : '#c3e738';
  const previewTagText = oralink.statusTagTextColor ? hslToHex(oralink.statusTagTextColor) : '#141811';

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
            <div className="relative group flex-shrink-0">
              <div className="size-32 rounded-full overflow-hidden border-4 border-slate-100 bg-gray-100 relative shrink-0 flex-shrink-0">
                {oralink.profileImageUrl ? (
                  <Image src={oralink.profileImageUrl} alt="Profile" fill className="object-cover rounded-full" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-300">
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
                <input 
                  value={oralink.displayName} 
                  onChange={e => setOralink(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Seu nome profissional"
                  className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block text-text-secondary uppercase tracking-wider">Bio Curta</label>
                <textarea 
                  value={oralink.bio} 
                  onChange={e => setOralink(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Ex: Especialista em imóveis de alto padrão..."
                  rows={2}
                  className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary px-4 py-2"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">palette</span>
            <h2 className="text-xl font-bold text-text-main">2. Personalização de Cores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker 
                label="Cor do Fundo" 
                value={oralink.backgroundColor} 
                onChange={val => setOralink(prev => ({ ...prev, backgroundColor: val }))} 
            />
            <ColorPicker 
                label="Cor do Texto Principal" 
                value={oralink.textColor} 
                onChange={val => setOralink(prev => ({ ...prev, textColor: val }))} 
            />
            <ColorPicker 
                label="Fundo do Botão" 
                value={oralink.buttonBgColor} 
                onChange={val => setOralink(prev => ({ ...prev, buttonBgColor: val }))} 
            />
            <ColorPicker 
                label="Texto/Ícone do Botão" 
                value={oralink.buttonTextColor} 
                onChange={val => setOralink(prev => ({ ...prev, buttonTextColor: val }))} 
            />
            <ColorPicker 
                label="Texto dos Cards" 
                value={oralink.cardTextColor} 
                onChange={val => setOralink(prev => ({ ...prev, cardTextColor: val }))} 
            />
            <ColorPicker 
                label="Texto do Rodapé" 
                value={oralink.footerTextColor} 
                onChange={val => setOralink(prev => ({ ...prev, footerTextColor: val }))} 
            />
            <ColorPicker 
                label="Fundo da Tag de Status" 
                value={oralink.statusTagBgColor} 
                onChange={val => setOralink(prev => ({ ...prev, statusTagBgColor: val }))} 
            />
            <ColorPicker 
                label="Texto da Tag de Status" 
                value={oralink.statusTagTextColor} 
                onChange={val => setOralink(prev => ({ ...prev, statusTagTextColor: val }))} 
            />
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">play_circle</span>
              <h2 className="text-xl font-bold text-text-main">3. Vídeo em Destaque</h2>
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
              <input 
                value={oralink.videoUrl} 
                onChange={e => setOralink(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary px-4 py-2"
              />
              <p className="text-[10px] text-text-secondary mt-2">O vídeo aparecerá antes dos links de contato no seu Oralink.</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">link</span>
              <h2 className="text-xl font-bold text-text-main">4. Meus Links Personalizados</h2>
            </div>
            <button onClick={handleAddLink} className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Novo Link
            </button>
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
                    <input 
                      value={link.title} 
                      onChange={e => handleUpdateLink(link.id, { title: e.target.value })}
                      className="bg-transparent border-none p-0 font-bold focus:ring-0 w-full"
                      placeholder="Título do botão"
                    />
                  </div>
                  <input 
                    value={link.url} 
                    onChange={e => handleUpdateLink(link.id, { url: e.target.value })}
                    className="bg-transparent border-none p-0 text-text-secondary text-sm focus:ring-0 ml-16 w-full"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={link.active} 
                    onCheckedChange={checked => handleUpdateLink(link.id, { active: checked })}
                  />
                  <button onClick={() => handleRemoveLink(link.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer">
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
              <h2 className="text-xl font-bold text-text-main">5. Vitrine de Imóveis</h2>
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
                    <input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder="Buscar por nome ou bairro..." 
                      className="pl-10 h-12 w-full rounded-xl bg-gray-50 border-gray-100 px-4 py-2 focus:ring-primary focus:border-primary"
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
                  className="absolute top-2 right-2 size-6 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
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
          <div className="relative mx-auto border-[10px] border-slate-900 rounded-[3rem] h-[640px] w-full overflow-hidden shadow-2xl ring-1 ring-slate-200" style={{ backgroundColor: previewBg }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20"></div>
            
            <div className="h-full overflow-y-auto no-scrollbar p-6 flex flex-col items-center">
              <div className="mt-8 w-24 h-24 flex-shrink-0 rounded-full border-4 p-1 mb-4 overflow-hidden shadow-lg relative bg-gray-100 flex-shrink-0" style={{ borderColor: previewBtnBg }}>
                {oralink.profileImageUrl ? (
                  <Image src={oralink.profileImageUrl} alt="Avatar" fill className="object-cover rounded-full" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-300">
                    <span className="material-symbols-outlined text-4xl">person</span>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-1" style={{ color: previewText }}>{oralink.displayName || 'Seu Nome'}</h3>
              <p className="text-[11px] text-center mb-8 leading-relaxed px-2" style={{ color: previewText + 'CC' }}>
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
                    style={{ backgroundColor: previewBtnBg, color: previewBtnText }}
                  >
                    {link.icon && <span className="material-symbols-outlined text-lg">{link.icon}</span>}
                    <span>{link.title}</span>
                  </div>
                ))}
              </div>

              {oralink.showPropertyShowcase && allAvailableProperties.length > 0 && (
                <div className="w-full">
                  <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3" style={{ color: previewText + '80' }}>
                    <div className="w-4 h-0.5" style={{ backgroundColor: previewBtnBg }}></div>
                    Imóveis em Destaque
                  </h4>
                  <div className="space-y-4">
                    {selectedProperties.map(prop => (
                      <div key={prop.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-lg transition-all group">
                        <div className="relative h-48 w-full bg-gray-100">
                          <Image src={prop.midia?.[0] || 'https://picsum.photos/seed/prop/400/200'} alt={prop.informacoesbasicas.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute top-4 left-4">
                            <span className="backdrop-blur text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest" style={{ backgroundColor: previewTagBg, color: previewTagText }}>{prop.informacoesbasicas.status}</span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h5 className="font-bold text-base uppercase truncate mb-1" style={{ color: previewCardText }}>{prop.informacoesbasicas.nome}</h5>
                          <div className="flex justify-between items-center">
                            <p className="text-xs opacity-60" style={{ color: previewCardText }}>{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                            <p className="text-sm font-black" style={{ color: previewBtnBg }}>{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <footer className="mt-12 mb-6 flex flex-col items-center gap-4 opacity-60 w-full pt-6 border-t border-gray-100/20" style={{ borderColor: previewText + '20' }}>
                <div className="flex flex-col items-center gap-2">
                    <Image src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" alt="Oraora" width={80} height={20} className="h-4 w-auto grayscale" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: previewFooterText }}>Powered by Oraora</p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
