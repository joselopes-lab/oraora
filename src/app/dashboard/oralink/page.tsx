'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { QRCodeSVG } from 'qrcode.react';
import { 
  Layers, 
  Download, 
  QrCode, 
  User, 
  Palette, 
  Link as LinkIcon, 
  Building2, 
  Trash2, 
  GripVertical, 
  PlusCircle, 
  X, 
  Save, 
  Eye, 
  Loader2,
  Copy,
  ExternalLink,
  Smartphone,
  Share2
} from 'lucide-react';

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

function hslToHex(hslStr: string | undefined): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = Math.min(100, Math.max(0, parseFloat(parts[1]))) / 100;
    const l = Math.min(100, Math.max(0, parseFloat(parts[2]))) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        const channel = Math.round(255 * color);
        const hex = channel.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

const ColorPicker = ({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) => {
    const hexValue = hslToHex(value);
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
  const [oralinkUrl, setOralinkUrl] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  const { data: brokerData, isLoading: isBrokerLoading } = useDoc<any>(brokerDocRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && brokerData?.slug) {
      setOralinkUrl(`${window.location.origin}/sites/${brokerData.slug}/link`);
    }
  }, [brokerData?.slug]);

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

  const videoEmbedUrl = getYoutubeEmbedUrl(oralink.videoUrl);

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    const size = 3000;
    canvas.width = size;
    canvas.height = size;
    
    img.onload = () => {
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `oralink-qrcode-hd-${brokerData?.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadSVG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `oralink-qrcode-vetor-${brokerData?.slug}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(oralinkUrl);
    toast({ title: "Link Copiado!", description: "O link do seu Oralink agora está na sua área de transferência." });
  };

  const handleShareWhatsapp = () => {
    const message = encodeURIComponent(`Olá! Confira meu cartão de visitas digital e meu catálogo de imóveis atualizado: ${oralinkUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (isBrokerLoading) return <div className="p-10 text-center">Carregando editor...</div>;

  // Preview Colors (Processed)
  const previewBg = hslToHex(oralink.backgroundColor);
  const previewText = hslToHex(oralink.textColor);
  const previewBtnBg = hslToHex(oralink.buttonBgColor);
  const previewBtnText = hslToHex(oralink.buttonTextColor);
  const previewCardText = hslToHex(oralink.cardTextColor);
  const previewFooterText = hslToHex(oralink.footerTextColor);
  const previewTagBg = hslToHex(oralink.statusTagBgColor);
  const previewTagText = hslToHex(oralink.statusTagTextColor);

  const dynamicStyles = {
    '--primary': oralink.buttonBgColor ? `hsl(${oralink.buttonBgColor})` : 'hsl(111 89% 50%)',
    '--ring': oralink.buttonBgColor ? `hsl(${oralink.buttonBgColor})` : 'hsl(111 89% 50%)',
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="relative flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8 max-w-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-main">Gestão do Oralink</h1>
            <p className="text-text-secondary">Sua vitrine digital e links de contato simplificados.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-white border-slate-200">
              <Link href={`/sites/${brokerData?.slug}/link`} target="_blank">
                <Eye className="size-4 mr-2" />
                Ver Oralink
              </Link>
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-text-main font-bold shadow-sm">
              <Save className="size-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Copy & Share Section */}
        <section className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg border border-slate-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -z-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-bold">Link de Divulgação</h3>
                    <p className="text-slate-400 text-sm">Use este link na bio do seu Instagram ou envie diretamente para seus contatos.</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 text-primary font-mono text-xs">
                        {oralinkUrl || 'Gerando link...'}
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 shrink-0">
                    <Button onClick={handleCopyLink} variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-11 px-6 font-bold">
                        <Copy className="size-4 mr-2" />
                        Copiar para Bio
                    </Button>
                    <Button onClick={handleShareWhatsapp} className="bg-primary hover:bg-primary-hover text-slate-950 h-11 px-6 font-black shadow-glow border-none">
                        <Share2 className="size-4 mr-2" />
                        Divulgar no WhatsApp
                    </Button>
                </div>
            </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <User className="size-5 text-primary" />
            <h2 className="text-xl font-bold text-text-main">1. Informações de Perfil</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group flex-shrink-0">
              <div className="size-32 rounded-full overflow-hidden border-4 border-slate-100 bg-gray-100 relative shrink-0 flex-shrink-0">
                {oralink.profileImageUrl ? (
                  <Image src={oralink.profileImageUrl} alt="Profile" fill className="object-cover rounded-full" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-300">
                    <User className="size-12" />
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
            <div className="flex-1 grid gap-4 w-full text-left">
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
            <Palette className="size-5 text-primary" />
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
              <QrCode className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-text-main">3. QR Code para Impressão</h2>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div ref={qrRef} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              {oralinkUrl ? (
                <QRCodeSVG 
                  value={oralinkUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <div className="size-44 bg-slate-50 flex items-center justify-center rounded-xl border border-dashed text-black">
                  <span className="text-xs text-slate-400">Aguardando slug...</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h3 className="font-bold text-lg text-slate-900 uppercase tracking-tight">QR Code Estático</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Este código aponta diretamente para o seu Oralink. Você pode imprimi-lo em cartões, placas ou outdoors. 
                <strong> O destino é fixo, mas você altera o conteúdo quando quiser no painel sem precisar reimprimir.</strong>
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Button onClick={downloadQRCode} className="bg-slate-900 hover:bg-black text-white px-6 font-bold flex-1 sm:flex-none">
                        <Download className="size-4 mr-2" />
                        Baixar PNG HD (3000px)
                    </Button>
                    <Button onClick={downloadSVG} variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold flex-1 sm:flex-none">
                        <Layers className="size-4 mr-2" />
                        Baixar Vetor (SVG)
                    </Button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase text-left">* Use o formato Vetor (SVG) para impressões gigantes como outdoors.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LinkIcon className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-text-main">4. Meus Links Personalizados</h2>
            </div>
            <button onClick={handleAddLink} className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none">
              <PlusCircle className="size-4" />
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
                  <GripVertical className="size-5" />
                </div>
                <div className="flex-1 grid gap-4 text-left">
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
                      className="bg-transparent border-none p-0 font-bold focus:ring-0 w-full text-black"
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
                  <button onClick={() => handleRemoveLink(link.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none outline-none">
                    <Trash2 className="size-5" />
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
              <Building2 className="size-5 text-primary" />
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
            <p className="text-sm text-text-secondary text-left">Selecione até 4 imóveis para aparecerem no final da sua página Oralink.</p>
            <Dialog open={isPropertyPickerOpen} onOpenChange={setIsPropertyPickerOpen}>
              <DialogTrigger asChild>
                <button type="button" className="bg-slate-100 text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary transition-colors cursor-pointer text-black border-none outline-none">
                    Gerenciar Seleção
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 bg-white">
                <VisuallyHidden>
                  <DialogHeader>
                    <DialogTitle>Selecionar Imóveis para Vitrine</DialogTitle>
                    <DialogDescription>Escolha até 4 imóveis do seu catálogo.</DialogDescription>
                  </DialogHeader>
                </VisuallyHidden>
                
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-text-main mb-4 text-left">Selecionar Imóveis</h3>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder="Buscar por nome ou bairro..." 
                      className="pl-10 h-12 w-full rounded-xl bg-gray-50 border-gray-100 px-4 py-2 focus:ring-primary focus:border-primary outline-none text-black"
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
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-bold text-sm truncate">{prop.informacoesbasicas.nome}</h4>
                          <p className="text-xs text-text-secondary">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                        </div>
                        <div className="px-2 pointer-events-none">
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
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-sm truncate">{prop.informacoesbasicas.nome}</h4>
                  <p className="text-xs text-text-secondary">{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <button 
                  onClick={() => handlePropertyToggle(prop.id)}
                  className="absolute top-2 right-2 size-6 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-none outline-none"
                >
                  <X className="size-3" />
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
              <div className="mt-8 w-24 h-24 flex-shrink-0 rounded-full border-4 p-1 mb-4 overflow-hidden shadow-lg relative bg-gray-100" style={{ borderColor: previewBtnBg }}>
                {oralink.profileImageUrl ? (
                  <Image src={oralink.profileImageUrl} alt="Avatar" fill className="object-cover rounded-full" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-300">
                    <User className="size-10" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-1" style={{ color: previewText }}>{oralink.displayName || 'Seu Nome'}</h3>
              <p className="text-[11px] text-center mb-8 leading-relaxed px-2" style={{ color: previewText + 'CC' }}>
                {oralink.bio || 'Sua biografia profissional aparecerá aqui.'}
              </p>

              {oralink.showVideo && videoEmbedUrl && (
                <div className="w-full mb-6 rounded-2xl overflow-hidden shadow-lg aspect-video bg-black relative">
                  <iframe src={videoEmbedUrl} className="absolute inset-0 w-full h-full" allowFullScreen />
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
                <div className="w-full text-left">
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
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fb51a21ec-d89e-4b7e-be51-d741841e8903-logo-oraora-b.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2" alt="Oraora" width={80} height={20} className="h-4 w-auto grayscale" />
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
