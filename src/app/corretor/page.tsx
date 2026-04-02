
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { Globe, Users, LayoutGrid, Asterisk, CheckCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CorretorPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData } = useDoc<{ 
        logoUrlWhite?: string; 
        logoUrl?: string;
        corretorPageHeaderImageUrl?: string;
        corretorPageHeaderImage02Url?: string;
        corretorPageCentralBgImageUrl?: string;
        corretorPageAsteriskImageUrl?: string;
        corretorPageFooterBgImageUrl?: string;
        corretorPageSystemScreenImageUrl?: string;
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

    const headerImage = siteData?.corretorPageHeaderImageUrl || 'https://picsum.photos/seed/luxury-real-estate/1920/1080';
    const headerImage02 = siteData?.corretorPageHeaderImage02Url;
    const centralBgImage = siteData?.corretorPageCentralBgImageUrl;
    const footerBgImage = siteData?.corretorPageFooterBgImageUrl;
    const customAsterisk = siteData?.corretorPageAsteriskImageUrl;
    const systemScreenImage = siteData?.corretorPageSystemScreenImageUrl;
    
    // Prioritize white logo for dark background, then standard logo, then fallback
    const oraoraLogo = "https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o%2Fsite-assets%2Flogos%2Fa08e5cdf-9fd3-4be2-85a1-05ff0eaddc58-logo-oraora-p.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2";
    const displayLogo = siteData?.logoUrlWhite || siteData?.logoUrl || oraoraLogo || defaultLogo || "";

    return (
        <main className="bg-black text-white font-sans selection:bg-[#00e900] selection:text-black min-h-screen">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');
                html, body, * {
                    font-family: 'Inter', sans-serif !important;
                }
            `}</style>

            {/* HERO */}
            <section className="relative min-h-[90vh] flex flex-col items-center overflow-hidden">
                {/* Background principal */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={headerImage}
                        alt="Background"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Navbar de topo no Hero */}
                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-12 mb-12 flex justify-between items-center">
                    <Link href="/">
                        <div className="relative h-10 w-40">
                            <Image 
                                src={displayLogo} 
                                alt="Oraora Logo" 
                                fill
                                className="object-contain object-left" 
                            />
                        </div>
                    </Link>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-100 hover:scale-105 transition-all shadow-xl active:scale-95 cursor-pointer border-none"
                    >
                        Solicite seu convite
                    </button>
                </div>

                {/* Conteúdo Central em Grid */}
                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex-1 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="max-w-[450px] animate-in fade-in slide-in-from-left duration-700">
                        <h1 className="text-[3rem] font-extrabold leading-[1.0] text-white tracking-tighter mb-8 drop-shadow-lg">
                            O sistema que está mudando a forma<br />
                            como corretores vendem imóveis.
                        </h1>
                        <div className="space-y-4 text-white text-lg lg:text-xl font-medium drop-shadow-md leading-none">
                            <p className="leading-none">
                                A primeira infraestrutura digital que <br />
                                rastreia lançamentos e constrói seu <br />
                                site automaticamente.
                            </p>
                            <p className="leading-none mt-4">
                                Chega de ser refém de portais. <br />
                                Recupere sua soberania.
                            </p>
                        </div>
                    </div>

                    {/* Imagem de Destaque 02 (Flutuante) */}
                    <div className="hidden lg:flex items-center justify-center relative h-[500px] animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        {headerImage02 && (
                            <div 
                                style={{
                                    position: 'absolute',
                                    height: '108%',
                                    left: '-10%',
                                    width: '52%',
                                    top: '0px',
                                }}
                                className="transform hover:translate-y-[-10px] transition-transform duration-500"
                            >
                                <Image
                                    src={headerImage02}
                                    alt="Destaque Oraora"
                                    fill
                                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION DARK - FEATURES */}
            <section className="relative py-24 bg-[#0a0a0a] overflow-hidden">
                {centralBgImage && (
                    <div className="absolute inset-0 z-0">
                        <Image src={centralBgImage} alt="Central Background" fill className="object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
                    </div>
                )}
                <div className="max-w-6xl mx-auto px-6 text-left relative z-10">
                    <p className="font-bold uppercase tracking-[0.3em] text-white text-sm mb-1">
                        Independência Total
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-0">
                        Pare de depender de portais.
                    </h2>
                    <p className="text-white mt-0 text-[3rem] font-light leading-[1.0] tracking-tighter mb-16">
                        Comece a construir sua própria estrutura digital
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Row 1 */}
                        <div className="bg-[#111]/80 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <Globe className="text-[#00e900] size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-xl mb-3">Site próprio</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Sua vitrine digital personalizada com alta conversão e SEO otimizado.</p>
                        </div>
                        <div className="bg-[#111]/80 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <Users className="text-[#00e900] size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-xl mb-3">Leads direto</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Receba contatos interessados sem intermediários ou leilões de leads.</p>
                        </div>
                        <div className="bg-[#111]/80 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <LayoutGrid className="text-[#00e900] size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-xl mb-3">Carteira organizada</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Gestão inteligente do seu portfólio com filtros avançados e CRM.</p>
                        </div>

                        {/* Row 2 */}
                        <div className="bg-[#00e900] p-10 rounded-3xl transition-all hover:-translate-y-2 group text-black md:col-span-2">
                            {customAsterisk ? (
                                <div className="relative size-10 mb-6 group-hover:scale-110 transition-transform text-black">
                                    <Image src={customAsterisk} alt="Asterisk" fill className="object-contain" />
                                </div>
                            ) : (
                                <Asterisk className="text-black size-10 mb-6 group-hover:scale-110 transition-transform font-black" />
                            )}
                            <h3 className="font-black text-2xl mb-3 uppercase tracking-tighter">Acesso a construtoras</h3>
                            <p className="text-black/80 text-base font-medium leading-relaxed max-w-lg">
                                Conecte-se com as maiores incorporadoras do país e tenha acesso a materiais de venda exclusivos antes do mercado.
                            </p>
                        </div>
                        <div className="bg-[#111]/80 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <LayoutGrid className="text-white size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-xl mb-3">CRM completo</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Acompanhe cada etapa da jornada do seu cliente, desde o primeiro clique até a assinatura do contrato.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATEMENT */}
            <section className="bg-gray-100 text-black py-32 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 items-center gap-16 relative z-10">
                    <div className="space-y-8 text-left">
                        <h2 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tighter">
                            Você não precisa de mais leads.<br />
                            <span className="bg-[#00e900] px-3 rounded-lg inline-block mt-2">Precisa de mais controle.</span>
                        </h2>

                        <p className="text-gray-600 text-xl max-w-md font-medium">
                            O mercado tradicional te obriga a alugar audiência. Na OraOra você constrói a sua.
                        </p>
                        
                        <div className="pt-4">
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="bg-black text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-all cursor-pointer border-none"
                            >
                                Solicitar acesso agora
                            </button>
                        </div>
                    </div>

                    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                        <Image
                            src={systemScreenImage || "https://picsum.photos/seed/broker-life/600/600"}
                            alt="Demonstração do Sistema"
                            fill
                            className="object-cover"
                            data-ai-hint="dashboard screen"
                        />
                    </div>
                </div>
            </section>

            {/* BENEFITS */}
            <section className="py-24 bg-black">
                <div className="max-w-4xl mx-auto px-6 text-left">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-12 tracking-tight">
                        Para corretores que jogam no <span className="text-[#00e900]">nível alto</span>
                    </h2>

                    <ul className="space-y-0">
                        {[
                            "Clareza para tomar decisões baseadas em dados",
                            "Velocidade na execução de novos lançamentos",
                            "Processo de atendimento que converte curiosos em clientes",
                            "Presença digital que trabalha por você 24/7",
                            "Controle total do jogo e da sua margem de lucro",
                            "Fechamentos previsíveis e recorrentes"
                        ].map((item, i) => (
                            <li key={i} className="group flex items-center justify-between border-b border-white/10 py-6 hover:bg-white/5 px-4 transition-colors">
                                <span className="text-lg md:text-xl font-medium text-gray-300 group-hover:text-white transition-colors">{item}</span>
                                <CheckCircle className="text-[#00e900] size-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0" />
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* PRICING */}
            <section className="bg-white text-black py-32">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <div className="max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Planos pensados para escalar</h2>
                        <p className="text-gray-500 mt-4 text-lg">Os planos são liberados após aprovação do seu convite exclusivo.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "Essencial", price: "Sob consulta", features: ["Site Profissional", "Gestão de 50 Imóveis"] },
                            { name: "Profissional", price: "Sob consulta", features: ["Tudo do Essencial", "CRM Completo", "Automações"], popular: true },
                            { name: "Avançado", price: "Sob consulta", features: ["Tudo do Profissional", "Consultoria de Tráfego"] }
                        ].map((plan, i) => (
                            <div key={i} className={cn(
                                "bg-black text-white p-10 rounded-[2rem] flex flex-col items-center text-center relative transition-all",
                                plan.popular ? "scale-105 border-4 border-[#00e900] shadow-2xl z-10" : "border border-white/10"
                            )}>
                                {plan.popular && (
                                    <span className="absolute -top-4 bg-[#00e900] text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Mais Popular</span>
                                )}
                                <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-6">{plan.name}</h3>
                                <p className="text-4xl font-black mb-8">{plan.price}</p>
                                <ul className="space-y-3 mb-10 text-sm text-gray-400 flex-1">
                                    {plan.features.map((f, idx) => <li key={idx}>{f}</li>)}
                                </ul>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full bg-[#00e900] text-black py-4 rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer border-none"
                                >
                                    Solicitar Convite
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FORM */}
            <section className="py-32 bg-[#0a0a0a] relative overflow-hidden">
                {footerBgImage && (
                    <div className="absolute inset-0 z-0">
                        <Image src={footerBgImage} alt="Footer Background" fill className="object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
                    </div>
                )}
                <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">
                    <div className="space-y-6 text-left">
                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight">
                            Se você quer continuar dependendo de portais, <span className="text-gray-600">ignore isso.</span>
                        </h2>
                        <p className="text-gray-400 text-xl font-medium">Mas se você está pronto para ser dono da sua jornada, entre na lista de acesso.</p>
                    </div>

                    <div className="bg-[#111]/90 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <form onSubmit={handleInviteSubmit} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Nome Completo</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-4 bg-black rounded-xl border border-white/10 focus:border-[#00e900] focus:ring-0 outline-none transition-all font-bold text-white" 
                                    placeholder="Ex: Marcus Thorne" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">E-mail Profissional</label>
                                <input 
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full p-4 bg-black rounded-xl border border-white/10 focus:border-[#00e900] focus:ring-0 outline-none transition-all font-bold text-white" 
                                    placeholder="seu@email.com" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">WhatsApp</label>
                                <input 
                                    required
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                    className="w-full p-4 bg-black rounded-xl border border-white/10 focus:border-[#00e900] focus:ring-0 outline-none transition-all font-bold text-white" 
                                    placeholder="(00) 00000-0000" 
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#00e900] text-black py-5 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer border-none"
                            >
                                {isSubmitting ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <>
                                        <span>Entrar na lista de acesso</span>
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                {!footerBgImage && <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#00e900]/5 rounded-full blur-[120px] -mb-48 -mr-48"></div>}
            </section>

            {/* FOOTER */}
            <footer className="py-12 border-t border-white/5 bg-black">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-black tracking-tighter">Oraora Pro</span>
                    </div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                        © 2025 Oraora Tecnologia. Todos os direitos reservados.
                    </p>
                    <div className="flex gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Link href="/termos-de-uso" className="hover:text-white transition-colors">Termos</Link>
                        <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
                    </div>
                </div>
            </footer>

            {/* Invite Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-xl">
                    <VisuallyHidden>
                        <DialogHeader>
                            <DialogTitle>Solicitar Convite</DialogTitle>
                            <DialogDescription>Preencha os dados para entrar na lista de acesso.</DialogDescription>
                        </DialogHeader>
                    </VisuallyHidden>
                    <div className="bg-[#1a1a1a] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/10">
                        <form 
                            onSubmit={handleInviteSubmit} 
                            className="space-y-8 text-left"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nome Completo</label>
                                <input 
                                    required
                                    name="name"
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    className="w-full bg-transparent border-0 border-b-2 border-[#00e900] focus:ring-0 text-white transition-colors py-3 outline-none placeholder:text-white/20 font-bold text-lg" 
                                    placeholder="Como devemos te chamar?" 
                                    type="text"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">E-mail Profissional</label>
                                <input 
                                    required
                                    name="email"
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    className="w-full bg-transparent border-0 border-b-2 border-[#00e900] focus:ring-0 text-white transition-colors py-3 outline-none placeholder:text-white/20 font-bold text-lg" 
                                    placeholder="exemplo@email.com" 
                                    type="email"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">WhatsApp</label>
                                    <input 
                                        required
                                        name="whatsapp"
                                        value={formData.whatsapp} 
                                        onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                                        className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-[#00e900] text-white transition-all py-4 px-4 outline-none placeholder:text-white/20 font-bold" 
                                        placeholder="(00) 00000-0000" 
                                        type="tel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cidade</label>
                                    <input 
                                        required
                                        name="city"
                                        value={formData.city} 
                                        onChange={e => setFormData({...formData, city: e.target.value})} 
                                        className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-[#00e900] text-white transition-all py-4 px-4 outline-none placeholder:text-white/20 font-bold" 
                                        placeholder="Onde você atua?" 
                                        type="text"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tempo de atuação</label>
                                    <div className="relative">
                                        <select 
                                            name="experience"
                                            value={formData.experience} 
                                            onChange={e => setFormData({...formData, experience: e.target.value})} 
                                            className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-[#00e900] text-white transition-all py-4 px-4 outline-none appearance-none cursor-pointer font-bold"
                                        >
                                            <option>Menos de 1 ano</option>
                                            <option>1 a 3 anos</option>
                                            <option>3 a 5 anos</option>
                                            <option>Mais de 5 anos</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Especialidade</label>
                                    <div className="relative">
                                        <select 
                                            name="specialty"
                                            value={formData.specialty} 
                                            onChange={e => setFormData({...formData, specialty: e.target.value})} 
                                            className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-primary text-white transition-all py-4 px-4 outline-none appearance-none cursor-pointer font-bold"
                                        >
                                            <option>Lançamentos</option>
                                            <option>Alto Padrão</option>
                                            <option>Revenda</option>
                                            <option>Minha Casa Minha Vida</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                disabled={isSubmitting}
                                className="w-full bg-[#00e900] text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 border-none cursor-pointer" 
                                type="submit"
                            >
                                {isSubmitting ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <>
                                        <span>Solicitar Acesso</span>
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
