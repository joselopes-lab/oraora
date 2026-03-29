'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
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

export default function CorretorPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData } = useDoc<{ logoUrlWhite?: string; logoUrl?: string }>(siteContentRef);

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
            
            await addDocumentNonBlocking(collection(firestore, 'inviteRequests'), {
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

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap');
                
                :root {
                    --tertiary: #00dce0;
                    --secondary-fixed: #00e900;
                    --secondary-fixed-dim: #00c000;
                    --background: #131313;
                    --on-surface: #e5e2e1;
                    --on-surface-variant: #cac3da;
                    --primary-container: #6218ff;
                }

                .font-headline { font-family: 'Manrope', sans-serif; }
                .font-body { font-family: 'Inter', sans-serif; }
                .font-accent { font-family: serif; }

                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .hero-glow {
                    background: radial-gradient(circle at 20% 50%, rgba(98, 24, 255, 0.15) 0%, transparent 40%),
                                radial-gradient(circle at 80% 80%, rgba(0, 233, 0, 0.1) 0%, transparent 40%);
                }
                .glass-nav {
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
            `}</style>

            <div className="bg-[#131313] text-[#e5e2e1] font-body selection:bg-[#00e900] selection:text-[#131313] min-h-screen">
                {/* TopNavBar */}
                <header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl shadow-[0_48px_48px_rgba(0,0,0,0.06)] border-b border-white/5">
                    <nav className="flex justify-between items-center w-full px-8 py-6 max-w-screen-2xl mx-auto">
                        <Link href="/" className="text-2xl font-extrabold tracking-tighter text-[#E5E2E1] font-headline">
                            {siteData?.logoUrlWhite ? (
                                <Image src={siteData.logoUrlWhite} alt="OraOra" width={120} height={30} className="h-8 w-auto" />
                            ) : "OraOra"}
                        </Link>
                        <Button onClick={() => setIsModalOpen(true)} className="bg-[#00e900] text-[#131313] px-6 py-2.5 font-bold rounded-full text-sm tracking-tight hover:bg-[#00c000] transition-all duration-300 scale-95 active:scale-90 h-auto border-none">
                            Solicitar convite
                        </Button>
                    </nav>
                </header>

                <main className="pt-32">
                    {/* Hero Section */}
                    <section className="relative px-8 pt-32 pb-48 max-w-screen-2xl mx-auto overflow-hidden hero-glow">
                        <div className="flex flex-col items-center text-center z-10 relative">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#006668]/30 border border-[#00dce0]/20 rounded-full mb-12">
                                <span className="material-symbols-outlined text-[#00dce0] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#00dce0]">Acesso apenas por convite.</span>
                            </div>
                            <h1 className="text-5xl md:text-8xl font-headline font-extrabold tracking-tighter leading-[0.95] text-[#e5e2e1] mb-12 max-w-5xl">
                                O sistema que está mudando a forma como <span className="italic font-accent text-[#00e900]">corretores</span> vendem <span className="text-[#00dce0]">imóveis.</span>
                            </h1>
                            <p className="text-lg md:text-2xl text-[#cac3da] max-w-3xl mb-16 leading-relaxed">
                                Tenha seu próprio site, organize seus leads e acesse empreendimentos de construtoras — tudo em uma única plataforma.
                            </p>
                            <div className="flex flex-col items-center gap-6">
                                <button onClick={() => setIsModalOpen(true)} className="bg-[#00e900] text-[#131313] px-12 py-6 font-extrabold text-xl tracking-tight flex items-center gap-3 hover:bg-[#00c000] transition-all rounded-full shadow-[0_0_40px_rgba(0,233,0,0.2)]">
                                    👉 Solicitar convite
                                </button>
                                <p className="text-sm text-[#e5e2e1]/40 font-medium">
                                    Estamos liberando novas vagas de forma controlada...
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#6218ff]/10 blur-[120px] rounded-full -z-10"></div>
                        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#006668]/10 blur-[100px] rounded-full -z-10"></div>
                    </section>

                    {/* Bento Grid */}
                    <section className="bg-[#0e0e0e] py-32 px-8" id="features">
                        <div className="max-w-screen-2xl mx-auto">
                            <div className="mb-20">
                                <span className="text-[#00e900] font-bold text-xs tracking-[0.3em] uppercase block mb-4">Independência Total</span>
                                <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight max-w-3xl text-[#e5e2e1]">
                                    Pare de depender de portais. Comece a construir sua própria estrutura.
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-[#201f1f] p-10 rounded-2xl flex flex-col justify-between min-h-[400px] border border-white/5">
                                    <div>
                                        <span className="material-symbols-outlined text-[#00e900] text-4xl mb-6">web</span>
                                        <h3 className="text-2xl font-headline font-bold mb-4 text-[#e5e2e1]">Site profissional</h3>
                                        <p className="text-[#cac3da] leading-relaxed">Sua vitrine digital personalizada com alta conversão, otimizada para buscadores e focada na experiência do seu cliente.</p>
                                    </div>
                                    <div className="mt-8 flex gap-2">
                                        <span className="px-3 py-1 bg-[#2a2a2a] rounded text-[10px] font-bold tracking-widest uppercase">SEO Ready</span>
                                        <span className="px-3 py-1 bg-[#2a2a2a] rounded text-[10px] font-bold tracking-widest uppercase">Fast Loading</span>
                                    </div>
                                </div>
                                <div className="bg-[#2a2a2a] p-10 rounded-2xl min-h-[400px] border border-white/5">
                                    <span className="material-symbols-outlined text-[#00dce0] text-4xl mb-6">hub</span>
                                    <h3 className="text-2xl font-headline font-bold mb-4 text-[#e5e2e1]">Leads direto</h3>
                                    <p className="text-[#cac3da] leading-relaxed">Receba contatos interessados diretamente no seu painel, sem intermediários ou leilão de leads em portais.</p>
                                </div>
                                <div className="bg-[#2a2a2a] p-10 rounded-2xl min-h-[400px] border border-white/5">
                                    <span className="material-symbols-outlined text-[#ccbeff] text-4xl mb-6">inventory_2</span>
                                    <h3 className="text-2xl font-headline font-bold mb-4 text-[#e5e2e1]">Carteira organizada</h3>
                                    <p className="text-[#cac3da] leading-relaxed">Gestão inteligente do seu portfólio de imóveis com filtros avançados e atualização em tempo real.</p>
                                </div>
                                <div className="md:col-span-2 bg-[#6218ff]/10 p-10 rounded-2xl flex flex-col md:flex-row gap-10 items-center overflow-hidden border border-[#6218ff]/20">
                                    <div className="flex-1 text-left">
                                        <span className="material-symbols-outlined text-[#00e900] text-4xl mb-6">corporate_fare</span>
                                        <h3 className="text-2xl font-headline font-bold mb-4 text-[#e5e2e1]">Acesso a construtoras</h3>
                                        <p className="text-[#cac3da] leading-relaxed">Conecte-se com as maiores incorporadoras do país e tenha acesso a materiais de venda exclusivos antes do mercado.</p>
                                    </div>
                                    <div className="flex-1 relative w-full h-48 md:h-64">
                                        <Image alt="Building" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmKtm3GiPDfeMx1Y2cAHqEW__vbAk5G0K-d3MaSQOYC-G35ZdB2lZu0fmBcQ-Yq3xnLmLCYh4Y_X-fiEgqn1TdUcWLce73HOXE_xkHIqoady-VDRP7B437aqcx7HxoV3f4kPbbNHMtylxjQQkL_j3m_-MV9FBRmycq2wHEMvF66u48qWXobq8nIMuWeN2nRYjro1CudrVyysvLWXVOqJvrsXD4uayk2oOiE1smXsSKNscfW8mQ_Asl55_ABQSr6d1gy-GUB3ZrDps" fill className="object-cover rounded shadow-2xl scale-110 rotate-3" />
                                    </div>
                                </div>
                                <div className="bg-[#201f1f] p-10 rounded-2xl min-h-[400px] border border-white/5">
                                    <span className="material-symbols-outlined text-[#00e900] text-4xl mb-6">dashboard_customize</span>
                                    <h3 className="text-2xl font-headline font-bold mb-4 text-[#e5e2e1]">CRM completo</h3>
                                    <p className="text-[#cac3da] leading-relaxed">Acompanhe cada etapa da jornada do seu cliente, desde o primeira clique até a assinatura do contrato.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Differentiation */}
                    <section className="py-32 px-8">
                        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-20 items-center">
                            <div className="flex-1 text-left">
                                <h2 className="text-5xl font-headline font-extrabold tracking-tighter mb-8 leading-none">
                                    Você não precisa de mais leads. <br/>
                                    <span className="text-[#00dce0]">Precisa de mais controle.</span>
                                </h2>
                                <p className="text-xl text-[#cac3da] leading-relaxed mb-12">
                                    O mercado tradicional te obriga a alugar audiência. A OraOra te entrega a infraestrutura para você ser o dono da sua própria audiência.
                                </p>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-[#1c1b1b] border-l-4 border-[#ffb4ab]/50 rounded-r-xl">
                                        <span className="font-bold text-[#cac3da]/60">Modelo Tradicional</span>
                                        <span className="material-symbols-outlined text-[#ffb4ab]">close</span>
                                    </div>
                                    <div className="flex items-center justify-between p-6 bg-[#201f1f] border-l-4 border-[#00e900] rounded-r-xl">
                                        <span className="font-bold text-[#e5e2e1]">Ecossistema OraOra</span>
                                        <span className="material-symbols-outlined text-[#00e900]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Positioning Section */}
                    <section className="bg-[#6218ff] py-32 px-8 overflow-hidden relative">
                        <div className="max-w-screen-2xl mx-auto relative z-10 text-center">
                            <h2 className="text-5xl md:text-8xl font-headline font-extrabold tracking-tighter text-[#d8cdff] mb-12">
                                O OraOra não é um portal.
                            </h2>
                            <p className="text-2xl md:text-3xl font-medium text-[#e7deff] max-w-4xl mx-auto leading-relaxed">
                                Somos a infraestrutura digital que conecta <span className="text-[#00e900]">Corretores</span>, <span className="text-[#00e900]">Fazendas</span> e <span className="text-[#00e900]">Clientes</span> em um único ambiente de alta performance.
                            </p>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00e900]/10 blur-[120px] rounded-full"></div>
                    </section>

                    {/* Plans Section */}
                    <section className="py-32 px-8">
                        <div className="max-w-screen-2xl mx-auto">
                            <div className="mb-16 text-left">
                                <h2 className="text-4xl font-headline font-bold tracking-tight mb-4 text-[#e5e2e1]">Planos pensados para escalar seu negócio</h2>
                                <p className="text-[#00dce0] font-medium">Os planos são liberados após aprovação do convite.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                                <div className="bg-[#131313] p-12 hover:bg-[#1c1b1b] transition-colors duration-500 text-left">
                                    <h5 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-[#cac3da]">Essencial</h5>
                                    <div className="mb-10"><span className="text-4xl font-headline font-extrabold tracking-tighter">Sob consulta</span></div>
                                    <ul className="space-y-4 mb-12">
                                        <li className="flex items-center gap-3 text-sm text-[#cac3da]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Site Profissional Customizado</li>
                                        <li className="flex items-center gap-3 text-sm text-[#cac3da]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Gestão de 50 Imóveis</li>
                                        <li className="flex items-center gap-3 text-sm text-[#cac3da] opacity-50"><span className="material-symbols-outlined text-lg">lock</span> CRM Avançado</li>
                                    </ul>
                                </div>
                                <div className="bg-[#201f1f] p-12 border-x border-white/5 relative text-left">
                                    <div className="absolute top-0 right-12 bg-[#00e900] text-[#131313] px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-b-lg">Popular</div>
                                    <h5 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-[#00e900]">Profissional</h5>
                                    <div className="mb-10"><span className="text-4xl font-headline font-extrabold tracking-tighter">Sob consulta</span></div>
                                    <ul className="space-y-4 mb-12">
                                        <li className="flex items-center gap-3 text-sm text-[#e5e2e1]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Tudo do Essencial</li>
                                        <li className="flex items-center gap-3 text-sm text-[#e5e2e1]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> CRM Completo & Automações</li>
                                        <li className="flex items-center gap-3 text-sm text-[#e5e2e1]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Acesso Direto a Construtoras</li>
                                    </ul>
                                </div>
                                <div className="bg-[#131313] p-12 hover:bg-[#1c1b1b] transition-colors duration-500 text-left">
                                    <h5 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-[#cac3da]">Avançado</h5>
                                    <div className="mb-10"><span className="text-4xl font-headline font-extrabold tracking-tighter">Sob consulta</span></div>
                                    <ul className="space-y-4 mb-12">
                                        <li className="flex items-center gap-3 text-sm text-[#cac3da]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Tudo do Profissional</li>
                                        <li className="flex items-center gap-3 text-sm text-[#cac3da]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Consultoria de Tráfego</li>
                                        <li className="flex items-center gap-3 text-sm text-[#cac3da]"><span className="material-symbols-outlined text-[#00e900] text-lg">check</span> Suporte Prioritário 24/7</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Closing Section */}
                    <section className="py-40 px-8 text-center bg-[#0e0e0e]">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tighter mb-8 leading-none text-[#e5e2e1]">
                                Se você quer continuar dependendo de portais, ignore isso.
                            </h2>
                            <p className="text-xl text-[#cac3da] mb-12 font-medium">
                                Mas se você está pronto para ser o dono da sua própria jornada digital, o convite está esperando.
                            </p>
                            <button onClick={() => setIsModalOpen(true)} className="bg-[#00e900] text-[#131313] px-12 py-5 rounded-full font-bold text-xl tracking-tight hover:bg-[#00c000] transition-all inline-flex items-center gap-3 shadow-glow">
                                👉 Solicite seu convite
                            </button>
                        </div>
                    </section>
                </main>

                {/* Footer Adjusted to Image */}
                <footer className="bg-white text-[#131313] w-full border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-8 py-20 max-w-screen-2xl mx-auto text-left items-start">
                        {/* Coluna 1: OraOra */}
                        <div>
                            <div className="text-2xl font-bold text-[#131313] font-headline mb-6">OraOra</div>
                            <p className="text-gray-500 font-body text-sm leading-relaxed max-w-xs">
                                Transformando a corretagem imobiliária através de tecnologia exclusiva e independência digital.
                            </p>
                        </div>
                        {/* Coluna 2: PLATAFORMA */}
                        <div className="flex flex-col gap-4">
                            <h6 className="text-[#131313] font-bold text-xs uppercase tracking-[0.2em] mb-4 font-headline">PLATAFORMA</h6>
                            <Link className="text-gray-500 hover:text-[#00e900] transition-colors text-sm font-medium" href="/contato">Contato</Link>
                            <Link className="text-gray-500 hover:text-[#00e900] transition-colors text-sm font-medium" href="/politica-de-privacidade">Política de Privacidade</Link>
                            <Link className="text-gray-500 hover:text-[#00e900] transition-colors text-sm font-medium" href="/termos-de-uso">Termos de Uso</Link>
                        </div>
                        {/* Coluna 3: CONECTE-SE */}
                        <div className="flex flex-col gap-4 relative h-full min-h-[120px]">
                            <h6 className="text-[#131313] font-bold text-xs uppercase tracking-[0.2em] mb-4 font-headline">CONECTE-SE</h6>
                            <div className="flex flex-col gap-4">
                                <a className="text-gray-500 hover:text-[#00e900] transition-colors text-sm font-medium" href="#">LinkedIn</a>
                                <a className="text-gray-500 hover:text-[#00e900] transition-colors text-sm font-medium" href="#">Instagram</a>
                            </div>
                            <div className="mt-12 text-gray-400 text-[11px] font-medium leading-relaxed">
                                © 2024 OraOra Real Estate Network. All<br/>rights reserved.
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Invite Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-xl">
                    <VisuallyHidden>
                        <DialogHeader>
                            <DialogTitle>Solicitar Convite</DialogTitle>
                            <DialogDescription>Preencha os dados para entrar na lista de acesso.</DialogDescription>
                        </DialogHeader>
                    </VisuallyHidden>
                    <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-12 shadow-2xl border border-white/5">
                        <form 
                            onSubmit={handleInviteSubmit} 
                            className="space-y-8 text-left"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">Nome Completo</label>
                                <input 
                                    required
                                    name="name"
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    className="w-full bg-transparent border-0 border-b-2 border-[#00dce0] focus:ring-0 text-[#e5e2e1] transition-colors py-3 outline-none placeholder:text-[#e5e2e1]/30" 
                                    placeholder="Como devemos te chamar?" 
                                    type="text"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">E-mail Profissional</label>
                                <input 
                                    required
                                    name="email"
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    className="w-full bg-transparent border-0 border-b-2 border-[#00dce0] focus:ring-0 text-[#e5e2e1] transition-colors py-3 outline-none placeholder:text-[#e5e2e1]/30" 
                                    placeholder="exemplo@email.com" 
                                    type="email"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">WhatsApp</label>
                                    <input 
                                        required
                                        name="whatsapp"
                                        value={formData.whatsapp} 
                                        onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                                        className="w-full bg-[#1c1b1b] border-0 border-b-2 border-white/10 focus:ring-0 focus:border-[#00dce0] text-[#e5e2e1] transition-colors py-3 px-4 outline-none placeholder:text-[#e5e2e1]/30" 
                                        placeholder="(00) 00000-0000" 
                                        type="tel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">Cidade</label>
                                    <input 
                                        required
                                        name="city"
                                        value={formData.city} 
                                        onChange={e => setFormData({...formData, city: e.target.value})} 
                                        className="w-full bg-[#1c1b1b] border-0 border-b-2 border-white/10 focus:ring-0 focus:border-[#00dce0] text-[#e5e2e1] transition-colors py-3 px-4 outline-none placeholder:text-[#e5e2e1]/30" 
                                        placeholder="Onde você atua?" 
                                        type="text"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">Tempo de atuação</label>
                                    <div className="relative">
                                        <select 
                                            name="experience"
                                            value={formData.experience} 
                                            onChange={e => setFormData({...formData, experience: e.target.value})} 
                                            className="w-full bg-[#1c1b1b] border-0 border-b-2 border-white/10 focus:ring-0 focus:border-[#00dce0] text-[#e5e2e1] transition-colors py-3 px-4 outline-none appearance-none cursor-pointer"
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
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">Especialidade</label>
                                    <div className="relative">
                                        <select 
                                            name="specialty"
                                            value={formData.specialty} 
                                            onChange={e => setFormData({...formData, specialty: e.target.value})} 
                                            className="w-full bg-[#1c1b1b] border-0 border-b-2 border-white/10 focus:ring-0 focus:border-[#00dce0] text-[#e5e2e1] transition-colors py-3 px-4 outline-none appearance-none cursor-pointer"
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
                                className="w-full bg-[#00e900] text-[#131313] py-5 rounded-full font-bold text-lg tracking-tight hover:bg-[#00c000] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 border-none cursor-pointer" 
                                type="submit"
                            >
                                {isSubmitting ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <span>👉 Entrar na lista de acesso</span>
                                )}
                            </button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
