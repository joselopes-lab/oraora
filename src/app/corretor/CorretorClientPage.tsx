'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, useAuthContext } from '@/firebase';
import { doc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { 
  Globe, 
  Users, 
  LayoutGrid, 
  Check, 
  Loader2, 
  ArrowRight, 
  User, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Timer
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CorretorClientPage() {
    const firestore = useFirestore();
    const { isReady } = useAuthContext();
    const { toast } = useToast();
    const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ 
        logoUrlWhite?: string; 
        logoUrl?: string;
        footerSlogan?: string;
        corretorPageHeaderImageUrl?: string;
    }>(siteContentRef);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        city: '',
        experience: 'Menos de 1 ano',
        specialty: 'Lançamentos'
    });

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.whatsapp || !formData.email) {
            toast({
                variant: 'destructive',
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha nome, e-mail e WhatsApp para prosseguir.'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (!firestore) throw new Error("Firestore not available");
            
            await addDoc(collection(firestore, 'inviteRequests'), {
                ...formData,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            toast({
                title: 'Solicitação Enviada!',
                description: 'Recebemos seu pedido. Nossa equipe analisará seu perfil e entrará em contato em breve.'
            });
            
            setIsModalOpen(false);
            setFormData({
                name: '',
                email: '',
                whatsapp: '',
                city: '',
                experience: 'Menos de 1 ano',
                specialty: 'Lançamentos'
            });
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error);
            toast({
                variant: 'destructive',
                title: 'Erro no envio',
                description: 'Não foi possível enviar sua solicitação agora. Tente novamente mais tarde.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayLogo = siteData?.logoUrlWhite || siteData?.logoUrl || defaultLogo || "";

    if (!isReady) return null;

    return (
        <main className="bg-black text-white font-sans selection:bg-[#00e900] selection:text-black min-h-screen">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 py-6 md:px-12 bg-black/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <Link href="/">
                    <Image src={displayLogo} alt="Oraora" width={140} height={35} className="h-8 w-auto brightness-0 invert" />
                </Link>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild className="hidden md:flex text-white hover:text-[#00e900]">
                        <Link href="/login">Já sou parceiro</Link>
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-[#00e900] text-black font-bold rounded-lg hover:brightness-110 shadow-[0_0_20px_rgba(0,233,0,0.3)]">
                        Quero participar
                    </Button>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-20 pb-32 px-6 md:px-12 overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00e900]/10 rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <Badge className="bg-[#00e900]/20 text-[#00e900] border-none font-bold uppercase tracking-widest px-4 py-1.5">
                                Oraora para Corretores
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter text-left">
                                A <span className="text-[#00e900]">máquina</span> de vendas definitiva.
                            </h1>
                            <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                                Transforme sua atuação imobiliária com inteligência artificial, site personalizado e um ecossistema completo de parcerias com as maiores construtoras.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={() => setIsModalOpen(true)} className="h-16 px-10 rounded-xl bg-[#00e900] text-black font-black text-lg shadow-[0_0_30px_rgba(0,233,0,0.4)] hover:scale-105 transition-all border-none cursor-pointer">
                                    SOLICITAR CONVITE
                                    <ArrowRight className="ml-2" />
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
                                <Image 
                                    src={siteData?.corretorPageHeaderImageUrl || 'https://picsum.photos/seed/broker-hero/800/600'} 
                                    alt="Dashboard Preview" 
                                    fill 
                                    className="object-cover" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 px-6 md:px-12 bg-white text-black rounded-t-[3rem] text-left">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Por que ser um Corretor <span className="text-[#00e900] bg-black px-4 py-1 rounded-xl">Oraora</span>?</h2>
                        <p className="text-xl text-gray-600">Não somos apenas um CRM. Somos o seu sócio tecnológico focado em fechar negócios.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#00e900] transition-all group">
                            <div className="size-14 rounded-2xl bg-black flex items-center justify-center text-[#00e900] mb-6 group-hover:scale-110 transition-transform">
                                <Globe className="size-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Site Próprio com IA</h3>
                            <p className="text-gray-600 leading-relaxed">Ganhe uma presença digital de luxo em minutos. Nossa IA escreve seus textos, gera SEO e atrai leads qualificados.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#00e900] transition-all group">
                            <div className="size-14 rounded-2xl bg-black flex items-center justify-center text-[#00e900] mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="size-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Inteligência de Mercado</h3>
                            <p className="text-gray-600 leading-relaxed">Tenha acesso a relatórios preditivos de valorização. Saiba exatamente o que sugerir para o seu investidor com base em dados.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#00e900] transition-all group">
                            <div className="size-14 rounded-2xl bg-black flex items-center justify-center text-[#00e900] mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="size-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Dossiê 360 do Cliente</h3>
                            <p className="text-gray-600 leading-relaxed">Gerencie toda a jornada, de documentos a aprovação de crédito, em uma interface pensada para alta performance.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-32 px-6 md:px-12 bg-black text-white relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[#00e900]/5 opacity-30" style={{backgroundImage: 'radial-gradient(#00e900 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
                <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Chegou a hora de elevar o seu patamar profissional.</h2>
                    <Button onClick={() => setIsModalOpen(true)} className="h-16 px-12 rounded-xl bg-[#00e900] text-black font-black text-xl shadow-[0_0_40px_rgba(0,233,0,0.4)] hover:scale-110 transition-all border-none cursor-pointer">
                        SOLICITAR MEU ACESSO
                    </Button>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Vagas limitadas por região para garantir exclusividade.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 text-black">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={160} height={40} className="h-8 w-auto" style={{ width: 'auto' }} />
                            </div>
                            <div
                                className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: siteData?.footerSlogan || 'Conectando pessoas aos seus sonhos. A plataforma mais moderna para comprar, vender e alugar imóveis no Brasil.' }}
                            />
                        </div>
                        <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-6">Plataforma</h4>
                            <ul className="space-y-4 text-sm font-bold">
                                <li><Link href="/login" className="hover:text-[#00e900]">Login</Link></li>
                                <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#00e900] bg-transparent border-none p-0 cursor-pointer font-bold">Solicitar Acesso</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm font-bold">
                                <li><Link href="/termos-de-uso" className="hover:text-[#00e900]">Termos</Link></li>
                                <li><Link href="/politica-de-privacidade" className="hover:text-[#00e900]">Privacidade</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                        <p>© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                    </div>
                </div>
            </footer>

            {/* Invite Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-black text-white border-white/10 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 border-b border-white/5 text-left">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-[#00e900]">Solicitar Convite</DialogTitle>
                        <DialogDescription className="text-gray-400 text-left">Preencha seus dados para análise de perfil.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteSubmit} className="p-8 space-y-5 text-left">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-gray-500 tracking-widest">Nome Completo</Label>
                            <Input 
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#00e900]" 
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-gray-500 tracking-widest">E-mail Profissional</Label>
                            <Input 
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#00e900]" 
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-gray-500 tracking-widest">WhatsApp</Label>
                            <Input 
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#00e900]" 
                                placeholder="(00) 00000-0000"
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-gray-500 tracking-widest">Cidade de Atuação</Label>
                            <Input 
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#00e900]" 
                                placeholder="Cidade - UF"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                            />
                        </div>
                        <Button disabled={isSubmitting} className="w-full h-14 bg-[#00e900] text-black font-black uppercase tracking-widest shadow-lg shadow-[#00e900]/20 border-none mt-4 cursor-pointer">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'ENVIAR SOLICITAÇÃO'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}