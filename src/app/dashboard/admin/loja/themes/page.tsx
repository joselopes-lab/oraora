'use client';

import React, { useState, useMemo } from 'react';
import * as catalogService from '@/lib/themeCatalog/catalogService';
import { ThemeFullDefinition } from '@/lib/themeCatalog/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { 
  Search, 
  Settings, 
  Zap, 
  CheckCircle2, 
  Eye, 
  Archive, 
  ShieldCheck, 
  Image as ImageIcon,
  DollarSign,
  ChevronRight,
  MonitorSmartphone,
  Check,
  X,
  Calendar,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ThemeCenterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemeFullDefinition | null>(null);
  const { toast } = useToast();
  
  const themes = useMemo(() => catalogService.getAllThemes(), []);
  
  const filteredThemes = useMemo(() => {
    return themes.filter(t => 
      t.commercial.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [themes, searchTerm]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 text-left pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Theme Center</h1>
          <p className="text-slate-500 font-medium mt-1">Gestão técnica e comercial de layouts do ecossistema Oraora.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-12 pr-4 bg-white border-slate-200 rounded-xl w-64 shadow-sm"
              placeholder="Buscar temas..."
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredThemes.map((theme) => (
          <motion.div 
            key={theme.id}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Card className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-soft hover:shadow-xl transition-all duration-500 bg-white h-full flex flex-col">
              <div className="relative h-56 w-full overflow-hidden bg-slate-100 shrink-0">
                {theme.commercial.thumbnail ? (
                  <img src={theme.commercial.thumbnail} alt={theme.commercial.displayName} className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110" />
                ) : (
                  <div className="size-full flex items-center justify-center text-slate-200">
                    <ImageIcon className="size-16" strokeWidth={1} />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button asChild className="bg-primary text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-6">
                        <Link href={`/dashboard/loja/preview/${theme.id}`}>
                            <PlayCircle className="size-4 mr-2" />
                            Visualizar
                        </Link>
                    </Button>
                    <Button onClick={() => setSelectedTheme(theme)} variant="secondary" className="bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-6">
                        <Settings className="size-4 mr-2" />
                        Ajustes
                    </Button>
                </div>

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className={cn(
                    "border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-lg",
                    theme.commercial.status === 'active' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {theme.commercial.status}
                  </Badge>
                  {theme.commercial.premium && (
                    <Badge className="bg-slate-900 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-lg">
                      PREMIUM
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-8 flex flex-col flex-1 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{theme.commercial.displayName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{theme.commercial.category}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-1 rounded">v{theme.technical.manifest.version}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50 mb-6 mt-2">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Tipo de Motor</p>
                    <p className="text-xs font-bold text-slate-700">{theme.technical.isLegacy ? 'Legacy Bridge' : 'SDK 1.0 (Core)'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Preço Base</p>
                    <p className="text-xs font-bold text-slate-700">
                        {theme.commercial.price > 0 ? theme.commercial.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Gratuito'}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Ativo no Registry
                    </span>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedTheme(theme)} className="h-8 px-0 text-primary-hover font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-transparent cursor-pointer">
                    Administrar <ChevronRight className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Sheet open={!!selectedTheme} onOpenChange={(open) => !open && setSelectedTheme(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col bg-white border-none shadow-2xl overflow-hidden">
          {selectedTheme && (
            <>
              <header className="shrink-0 bg-slate-950 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-inner">
                      <Settings className="size-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedTheme.commercial.displayName}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tema ID: {selectedTheme.id}</span>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black px-2 py-0.5">ESTÁVEL</Badge>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTheme(null)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer outline-none">
                    <X className="size-5 text-white" />
                  </button>
                </div>
              </header>

              <Tabs defaultValue="geral" className="flex-1 flex flex-col min-h-0">
                <TabsList className="shrink-0 bg-white border-b border-slate-100 h-16 p-0 px-8 flex gap-8 justify-start rounded-none">
                  {['geral', 'comercial', 'publicacao', 'compatibilidade', 'midia'].map(tab => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab} 
                      className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-black uppercase text-[10px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 cursor-pointer"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  <TabsContent value="geral" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Comercial</Label>
                        <Input defaultValue={selectedTheme.commercial.displayName} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug Interno</Label>
                        <Input defaultValue={selectedTheme.id} disabled className="h-12 rounded-xl bg-slate-100 border-none font-mono text-slate-500" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Catálogo</Label>
                        <Textarea defaultValue={selectedTheme.commercial.description} rows={4} className="rounded-2xl bg-slate-50 border-none p-4 shadow-inner resize-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lançamento</Label>
                        <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                          <Input defaultValue={selectedTheme.commercial.releaseDate} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Estilo</Label>
                        <Input defaultValue={selectedTheme.commercial.category} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comercial" className="m-0 space-y-10 animate-in fade-in slide-in-from-right-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Público (R$)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                          <Input type="number" defaultValue={selectedTheme.commercial.price} className="h-14 pl-12 rounded-xl bg-slate-50 border-none font-black text-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plano Mínimo</Label>
                        <Select defaultValue={selectedTheme.commercial.includedInPlans[0]}>
                          <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Qualquer Plano</SelectItem>
                            <SelectItem value="basic">Plano Básico</SelectItem>
                            <SelectItem value="premium">Plano Premium</SelectItem>
                            <SelectItem value="enterprise">Plano Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="publicacao" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 text-left">
                    <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: 'active', label: 'Publicado (Live)', desc: 'Visível e instalável por todos os corretores elegíveis.', icon: <CheckCircle2 className="size-5 text-green-500" /> },
                          { id: 'hidden', label: 'Oculto na Loja', desc: 'Funcional, mas não aparece na listagem pública de temas.', icon: <Eye className="size-5 text-slate-400" /> },
                          { id: 'beta', label: 'Versão Beta', desc: 'Disponível apenas para testadores e administradores.', icon: <Zap className="size-5 text-amber-500" /> },
                          { id: 'archived', label: 'Arquivado', desc: 'Desabilitado para novas instalações. Mantido apenas para quem já usa.', icon: <Archive className="size-5 text-red-400" /> },
                        ].map((item) => (
                          <div key={item.id} className={cn(
                            "flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer",
                            selectedTheme.commercial.status === item.id ? "bg-primary/5 border-primary" : "bg-white border-slate-50 hover:border-slate-200"
                          )}>
                             <div className="flex gap-4">
                                <div className="size-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">{item.icon}</div>
                                <div className="text-left">
                                  <p className="text-base font-black text-slate-900 leading-tight uppercase tracking-tight">{item.label}</p>
                                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                </div>
                             </div>
                             {selectedTheme.commercial.status === item.id && <div className="size-6 rounded-full bg-primary text-slate-900 flex items-center justify-center shadow-lg"><Check className="size-4 stroke-[3]" /></div>}
                          </div>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="compatibilidade" className="m-0 space-y-10 animate-in fade-in slide-in-from-right-4 text-left">
                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl opacity-20"></div>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner"><ShieldCheck className="size-6" /></div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Status do SDK</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Versão Oraora Core</p>
                          <p className="text-lg font-black text-white">v{selectedTheme.technical.manifest.version} ({selectedTheme.technical.isLegacy ? 'Legacy' : 'SDK 1.0'})</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Compatibilidade</p>
                          <Badge className="bg-green-500 text-white border-none font-black text-[8px] px-2 py-0.5">COMPATÍVEL</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Componentes Suportados</h3>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {['Hero', 'Search', 'FeaturedProperties', 'About', 'Services', 'Contact', 'Map', 'CTA', 'Footer'].map(comp => (
                            <div key={comp} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <div className={cn(
                                 "size-4 rounded-full flex items-center justify-center transition-all",
                                 selectedTheme.technical.manifest.supports.some(s => s.toLowerCase() === comp.toLowerCase()) ? "bg-primary text-slate-950" : "bg-slate-200"
                               )}>
                                 {selectedTheme.technical.manifest.supports.some(s => s.toLowerCase() === comp.toLowerCase()) && <Check className="size-2.5 stroke-[4]" />}
                               </div>
                               <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{comp}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="midia" className="m-0 space-y-10 animate-in fade-in slide-in-from-right-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4 text-left">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thumbnail da Loja</Label>
                        <div className="aspect-square bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
                           {selectedTheme.commercial.thumbnail && <img src={selectedTheme.commercial.thumbnail} alt="thumb" className="absolute inset-0 object-cover size-full opacity-60 group-hover:opacity-80 transition-opacity" />}
                           <div className="relative z-10 flex flex-col items-center gap-2">
                             <ImageIcon className="size-8 text-slate-400" />
                             <span className="text-[10px] font-black text-slate-900 uppercase">Alterar Imagem</span>
                           </div>
                        </div>
                      </div>
                      <div className="space-y-4 text-left">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner de Preview</Label>
                        <div className="aspect-[4/3] bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
                           {selectedTheme.commercial.banner && <img src={selectedTheme.commercial.banner} alt="preview" className="absolute inset-0 object-cover size-full opacity-60 group-hover:opacity-80 transition-opacity" />}
                           <div className="relative z-10 flex flex-col items-center gap-2">
                             <MonitorSmartphone className="size-8 text-slate-400" />
                             <span className="text-[10px] font-black text-slate-900 uppercase">Alterar Preview</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>

                <footer className="shrink-0 p-8 border-t border-slate-100 bg-gray-50/50 flex justify-between gap-4">
                  <div className="flex gap-2">
                    <Button variant="outline" asChild className="rounded-xl font-bold h-11 px-6 border-slate-200">
                        <Link href={`/dashboard/loja/preview/${selectedTheme.id}`}>
                            <PlayCircle className="size-4 mr-2" />
                            Visualizar em Tempo Real
                        </Link>
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <SheetClose asChild>
                      <Button variant="ghost" className="rounded-xl h-11 px-6 text-slate-400 font-bold hover:text-slate-900">Descartar</Button>
                    </SheetClose>
                    <Button onClick={() => { toast({ title: "Modo Protegido", description: "A persistência via Firestore será implementada na próxima etapa." }); setSelectedTheme(null); }} className="bg-primary text-slate-900 font-black px-10 h-11 rounded-xl shadow-lg border-none hover:scale-[1.02] transition-transform cursor-pointer">
                      Salvar Alterações
                    </Button>
                  </div>
                </footer>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
