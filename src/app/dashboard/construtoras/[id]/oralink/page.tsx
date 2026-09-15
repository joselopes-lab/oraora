'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext, useFirebase } from '@/firebase';
import { getConstructorDetailsServer, getConstructorProjectsServer, saveConstructorOralinkServer, updateProjectVisibilityServer } from '../../actions.server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { uploadFile } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';
import { 
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
  Share2,
  Palette,
  Link as LinkIcon,
  Upload
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
  featuredProjectIds?: string[];
  videoUrl?: string;
  showVideo?: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  cardTextColor?: string;
  footerTextColor?: string;
  statusTagBgColor?: string;
  statusTagTextColor?: string;
  propertyPriceColor?: string;
};

const availableIcons = [
  { value: 'link', label: 'Link' },
  { value: 'chat', label: 'WhatsApp' },
  { value: 'mail', label: 'E-mail' },
  { value: 'call', label: 'Telefone' },
  { value: 'language', label: 'Website' },
  { value: 'photo_camera', label: 'Instagram' },
  { value: 'description', label: 'Catálogo' },
  { value: 'apartment', label: 'Empreendimentos' },
  { value: 'share', label: 'Compartilhar' },
];

function hexToHsl(hex: string): string {
    if (!hex) return '0 0% 0%';
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
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
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hslStr: string | undefined): string {
    if (!hslStr || typeof hslStr !== 'string') return '#fcfdfa';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#fcfdfa';
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
                <div className="size-8 rounded-lg border border-gray-200 relative overflow-hidden shadow-sm" style={{ backgroundColor: hexValue }}>
                    <input 
                        type="color" 
                        value={hexValue} 
                        onChange={(e) => onChange(hexToHsl(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase">{hexValue}</span>
        </div>
    );
};

export default function ConstructorOralinkManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { storage } = useFirebase();
  const { toast } = useToast();
  const { user } = useAuthContext();

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;

    setIsUploadingImage(true);
    try {
      const path = `constructors/${id}/oralink/profile_${Date.now()}`;
      const url = await uploadFile(storage, path, file, setUploadProgress);
      setFormData(prev => ({ ...prev, profileImageUrl: url }));
      toast({ title: "Logo / Foto enviada com sucesso!" });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro no upload da imagem", variant: "destructive" } as any);
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const [constructorData, setConstructorData] = useState<any>(null);
  const [isConstructorLoading, setIsConstructorLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  const [oralinkUrl, setOralinkUrl] = useState('');
  const [formData, setFormData] = useState<OralinkData>({
    displayName: '',
    bio: '',
    profileImageUrl: '',
    links: [],
    showPropertyShowcase: true,
    featuredProjectIds: [],
    videoUrl: '',
    showVideo: false,
    backgroundColor: '60 30% 98%',
    textColor: '120 10% 8%',
    buttonBgColor: '76 78% 57%',
    buttonTextColor: '120 10% 8%',
    cardTextColor: '120 10% 8%',
    footerTextColor: '120 10% 8%',
    statusTagBgColor: '76 78% 57%',
    statusTagTextColor: '120 10% 8%',
    propertyPriceColor: '120 70% 35%',
  });

  const [isSaving, setIsSaving] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      setIsConstructorLoading(true);
      setIsProjectsLoading(true);
      (async () => {
        try {
          const idToken = user ? await user.getIdToken() : undefined;
          const [constructorRes, projectsRes] = await Promise.all([
            getConstructorDetailsServer(id, idToken),
            getConstructorProjectsServer(id, idToken)
          ]);

          if (constructorRes.success && constructorRes.constructor) {
            const cData = constructorRes.constructor;
            setConstructorData(cData);
            const defaultSlug = cData.slug || cData.id;
            if (typeof window !== 'undefined') {
              setOralinkUrl(`${window.location.origin}/oralink/${defaultSlug}`);
            }

            if (cData.oralink) {
              setFormData({
                displayName: cData.oralink.displayName || cData.name || '',
                bio: cData.oralink.bio || 'Central comercial digital oficial.',
                profileImageUrl: cData.oralink.profileImageUrl || cData.logoUrl || '',
                links: cData.oralink.links || [],
                showPropertyShowcase: cData.oralink.showPropertyShowcase ?? true,
                featuredProjectIds: cData.oralink.featuredProjectIds || [],
                videoUrl: cData.oralink.videoUrl || '',
                showVideo: cData.oralink.showVideo ?? false,
                backgroundColor: cData.oralink.backgroundColor || '60 30% 98%',
                textColor: cData.oralink.textColor || '120 10% 8%',
                buttonBgColor: cData.oralink.buttonBgColor || '76 78% 57%',
                buttonTextColor: cData.oralink.buttonTextColor || '120 10% 8%',
                cardTextColor: cData.oralink.cardTextColor || '120 10% 8%',
                footerTextColor: cData.oralink.footerTextColor || '120 10% 8%',
                statusTagBgColor: cData.oralink.statusTagBgColor || '76 78% 57%',
                statusTagTextColor: cData.oralink.statusTagTextColor || '120 10% 8%',
                propertyPriceColor: cData.oralink.propertyPriceColor || '120 70% 35%',
              });
            } else {
              setFormData(prev => ({
                ...prev,
                displayName: cData.name || '',
                profileImageUrl: cData.logoUrl || '',
                bio: 'Central comercial digital oficial.',
              }));
            }
          } else {
            toast({ title: "Erro", description: constructorRes.error || "Erro ao carregar dados da construtora.", variant: "destructive" });
          }

          if (projectsRes.success && projectsRes.projects) {
            setProjects(projectsRes.projects);
          }
        } catch (err) {
          console.error('Erro ao carregar dados:', err);
          toast({ variant: 'destructive', title: 'Erro ao carregar dados do Oralink.' });
        } finally {
          setIsConstructorLoading(false);
          setIsProjectsLoading(false);
        }
      })();
    }
  }, [id, user]);

  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { id: uuidv4(), title: 'Novo Link', url: 'https://', active: true, icon: 'link' }]
    }));
  };

  const handleUpdateLink = (linkId: string, updates: Partial<OralinkLink>) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === linkId ? { ...l, ...updates } : l)
    }));
  };

  const handleDeleteLink = (linkId: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(l => l.id !== linkId)
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const res = await saveConstructorOralinkServer(id, formData, idToken);
      if (res.success) {
        toast({ title: 'Oralink atualizado com sucesso!' });
      } else {
        toast({ title: 'Erro ao salvar Oralink', description: res.error || 'Erro desconhecido', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao salvar Oralink', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(oralinkUrl);
    toast({ title: 'Link copiado para a área de transferência!' });
  };

  if (isConstructorLoading) {
    return <div className="p-10 text-center">Carregando configuração do Oralink...</div>;
  }

  if (!constructorData) {
    return <div className="p-10 text-center">Construtora não encontrada.</div>;
  }

  return (
    <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
      <nav className="flex mb-6 text-sm font-medium text-text-secondary">
        <Link className="hover:text-text-main" href="/dashboard">Home</Link>
        <span className="mx-2">/</span>
        <Link className="hover:text-text-main" href="/dashboard/construtoras">Construtoras</Link>
        <span className="mx-2">/</span>
        <Link className="hover:text-text-main" href={`/dashboard/construtoras/${id}`}>{constructorData.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-text-main">Oralink</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main mb-1">Oralink da Construtora</h1>
          <p className="text-text-secondary">Configure a central digital comercial de {constructorData.name} compartilhada com clientes e corretores.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href={oralinkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Ver Página Pública
            </a>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-hover text-text-main font-bold gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Share Box */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Seu Link Público
            </h3>
            <div className="flex gap-2">
              <Input value={oralinkUrl} readOnly className="font-mono text-xs bg-gray-50" />
              <Button onClick={copyToClipboard} variant="outline" className="gap-1 shrink-0">
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
            </div>
          </div>

          {/* Identity */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Identidade do Oralink
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Nome de Exibição</label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} 
                  placeholder="Nome da Construtora" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Biografia / Slogan</label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                  placeholder="Breve descrição ou slogan institucional" 
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Foto de Perfil / Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center">
                    {formData.profileImageUrl ? (
                      <Image src={formData.profileImageUrl} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="logo-upload-input" 
                      className="hidden" 
                      onChange={handleLogoUpload} 
                    />
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        disabled={isUploadingImage}
                        onClick={() => document.getElementById('logo-upload-input')?.click()}
                        className="gap-1.5 text-xs"
                      >
                        {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {isUploadingImage ? `Enviando... ${Math.round(uploadProgress)}%` : 'Fazer Upload de Imagem'}
                      </Button>
                      {formData.profileImageUrl && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, profileImageUrl: '' }))}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    {isUploadingImage && (
                      <Progress value={uploadProgress} className="h-1 w-full" />
                    )}
                    <Input 
                      value={formData.profileImageUrl} 
                      onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })} 
                      placeholder="Ou cole a URL da imagem..." 
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Links */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Links Personalizados ({formData.links.length})
              </h3>
              <Button onClick={handleAddLink} size="sm" variant="outline" className="gap-1">
                <PlusCircle className="w-4 h-4 text-primary" />
                Adicionar Link
              </Button>
            </div>
            <div className="space-y-3">
              {formData.links.map((link) => (
                <div key={link.id} className="p-4 bg-gray-50 rounded-xl border border-card-border space-y-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <Input 
                      value={link.title} 
                      onChange={(e) => handleUpdateLink(link.id, { title: e.target.value })} 
                      placeholder="Título do Link (ex: Fale no WhatsApp)" 
                      className="flex-1 bg-white"
                    />
                    <select 
                      value={link.icon || 'link'} 
                      onChange={(e) => handleUpdateLink(link.id, { icon: e.target.value })}
                      className="h-10 px-3 rounded-md border border-input bg-white text-xs font-medium"
                    >
                      {availableIcons.map(icon => <option key={icon.value} value={icon.value}>{icon.label}</option>)}
                    </select>
                    <Button onClick={() => handleDeleteLink(link.id)} size="icon" variant="ghost" className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 pl-7">
                    <Input 
                      value={link.url} 
                      onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })} 
                      placeholder="https://..." 
                      className="flex-1 bg-white text-xs font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Ativo</span>
                      <Switch 
                        checked={link.active} 
                        onCheckedChange={(checked) => handleUpdateLink(link.id, { active: checked })} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.links.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">Nenhum link personalizado cadastrado ainda.</p>
              )}
            </div>
          </div>

          {/* Empreendimentos Showcase */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Vitrine de Empreendimentos</h3>
                <p className="text-xs text-text-secondary">Gerencie quais empreendimentos aparecem no seu Oralink público.</p>
              </div>
              <Switch 
                checked={formData.showPropertyShowcase} 
                onCheckedChange={(checked) => setFormData({ ...formData, showPropertyShowcase: checked })} 
              />
            </div>
            {formData.showPropertyShowcase && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-medium text-text-secondary">
                  Total de empreendimentos: <span className="font-bold text-text-main">{projects?.length || 0}</span>
                </p>
                {isProjectsLoading ? (
                  <div className="flex items-center justify-center py-6 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-xs">Carregando empreendimentos...</span>
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {projects.map((proj: any) => {
                      const isPublished = proj.isPublished === true;
                      return (
                        <div key={proj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 relative overflow-hidden shrink-0">
                              {proj.midia?.[0] ? (
                                <Image src={proj.midia[0]} alt={proj.name} fill className="object-cover" />
                              ) : (
                                <Building2 className="w-5 h-5 m-auto text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate text-gray-900">{proj.name || proj.tituloComercial || 'Empreendimento'}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 truncate">{proj.localizacao?.bairro ? `${proj.localizacao.bairro}, ` : ''}{proj.localizacao?.cidade || ''}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {isPublished ? 'Visível' : 'Oculto'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500 font-medium">{isPublished ? 'Exibir' : 'Ocultar'}</span>
                            <Switch 
                              checked={isPublished}
                              onCheckedChange={async (checked) => {
                                // Optimistic update
                                const updated = projects.map(p => p.id === proj.id ? { ...p, isPublished: checked } : p);
                                setProjects(updated);
                                const idToken = user ? await user.getIdToken() : undefined;
                                const res = await updateProjectVisibilityServer(proj.id, checked, id, idToken);
                                if (res.success) {
                                  toast({
                                    title: 'Visibilidade atualizada',
                                    description: `O empreendimento agora está ${checked ? 'visível' : 'oculto'} no Oralink.`,
                                  });
                                } else {
                                  // Revert on error
                                  setProjects(projects);
                                  toast({
                                    title: 'Erro ao atualizar',
                                    description: res.error || 'Não foi possível alterar a visibilidade.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400">
                    Nenhum empreendimento cadastrado para esta construtora.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colors Customization */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Personalização de Cores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorPicker label="Fundo da Página" value={formData.backgroundColor} onChange={(val) => setFormData({ ...formData, backgroundColor: val })} />
              <ColorPicker label="Texto Principal" value={formData.textColor} onChange={(val) => setFormData({ ...formData, textColor: val })} />
              <ColorPicker label="Fundo dos Botões" value={formData.buttonBgColor} onChange={(val) => setFormData({ ...formData, buttonBgColor: val })} />
              <ColorPicker label="Texto dos Botões" value={formData.buttonTextColor} onChange={(val) => setFormData({ ...formData, buttonTextColor: val })} />
              <div className="sm:col-span-2">
                <ColorPicker label="Cor do Valor do Empreendimento" value={formData.propertyPriceColor} onChange={(val) => setFormData({ ...formData, propertyPriceColor: val })} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-8 w-full max-w-[380px] bg-gray-900 p-4 rounded-[3rem] shadow-2xl border-4 border-gray-800">
            <div className="w-full bg-white rounded-[2.5rem] overflow-hidden min-h-[680px] flex flex-col relative shadow-inner" style={{ backgroundColor: hslToHex(formData.backgroundColor), color: hslToHex(formData.textColor) }}>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-gray-900 rounded-full z-20"></div>
              
              <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full border-4 p-1 mb-4 shadow-lg overflow-hidden bg-gray-100 shrink-0" style={{ borderColor: hslToHex(formData.buttonBgColor) }}>
                  {formData.profileImageUrl ? (
                    <Image src={formData.profileImageUrl} alt="Avatar" fill className="object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Building2 className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold tracking-tight mb-1">{formData.displayName || 'Nome da Construtora'}</h2>
                <p className="text-xs opacity-70 leading-relaxed max-w-xs mb-8">{formData.bio}</p>

                <div className="w-full space-y-3 mb-8">
                  {formData.links.filter(l => l.active && l.title && l.url).map(link => (
                    <div 
                      key={link.id} 
                      className="w-full py-4 px-5 rounded-2xl font-bold text-xs shadow-md text-center flex items-center justify-center gap-2"
                      style={{ backgroundColor: hslToHex(formData.buttonBgColor), color: hslToHex(formData.buttonTextColor) }}
                    >
                      <span>{link.title}</span>
                    </div>
                  ))}
                  {formData.links.filter(l => l.active && l.title && l.url).length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-gray-300 text-xs text-gray-400">
                      Nenhum link ativo.
                    </div>
                  )}
                </div>

                {formData.showPropertyShowcase && projects && projects.length > 0 && (
                  <div className="w-full text-left mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Empreendimentos ({projects.length})</p>
                    <div className="space-y-3">
                      {projects.slice(0, 2).map((proj: any) => (
                        <div key={proj.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 relative overflow-hidden shrink-0">
                            {proj.midia?.[0] ? (
                              <Image src={proj.midia[0]} alt={proj.name} fill className="object-cover" />
                            ) : (
                              <Building2 className="w-6 h-6 m-auto text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-gray-900">{proj.name || proj.tituloComercial || 'Empreendimento'}</p>
                            <p className="text-[10px] text-gray-500 truncate">{proj.localizacao?.bairro}, {proj.localizacao?.cidade}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="py-4 text-center border-t border-gray-100/20 text-[9px] opacity-50 font-medium">
                Oraora Tecnologia para Construtoras
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
