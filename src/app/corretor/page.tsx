'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, useAuthContext } from '@/firebase';
import { doc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
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
  Asterisk, 
  Check, 
  Loader2, 
  ArrowRight, 
  ChevronDown, 
  User, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Briefcase,
  Target,
  Instagram,
  Linkedin,
  Twitter,
  UserRound,
  Zap,
  TrendingUp,
  ShieldCheck,
  Workflow,
  BarChart3,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function CorretorPageContent() {
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

    const headerImage = siteData?.corretorPageHeaderImageUrl;
    const headerImage02 = siteData?.corretorPageHeaderImage02Url;
    const centralBgImage = siteData?.corretorPageCentralBgImageUrl;
    const customAsterisk = siteData?.corretorPageAsteriskImageUrl;
    
    const oraoraLogo = "https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o%2Fsite-assets%2Flogos%2Fa08e5cdf-9fd3-4be2-85a1-05ff0eaddc58-logo-oraora-p.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2";
    const displayLogo = siteData?.logoUrlWhite || siteData?.logoUrl || oraoraLogo || defaultLogo || "";

    if (!isReady) return null;

    return (
        <main className="bg-black text-white font-sans selection:bg-[#00e900] selection:text-black min-h-screen">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');
                html, body, * {
                    font-family: 'Inter', sans-serif !important;
                }
            `}</style>

            {/* HERO */}
            <section className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col items-center overflow-hidden">
                <div className="absolute inset-0 z-0 bg-black">
                    {headerImage && (
                        <Image
                            src={headerImage}
                            alt="Background"
                            fill
                            className="object-cover object-[70%_center] md:object-center"
                            priority
                        />
                    )}
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-8 md:pt-12 mb-8 md:mb-12 flex justify-between items-center">
                    <Link href="/">
                        <div className="relative h-8 md:h-10 w-32 md:w-40">
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
                        className="bg-white text-black px-5 md:px-8 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-sm hover:bg-gray-100 hover:scale-105 transition-all shadow-xl active:scale-95 cursor-pointer border-none"
                    >
                        Solicite seu convite
                    </button>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex-1 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="max-w-[450px] animate-in fade-in slide-in-from-left duration-700">
                        <h1 className="text-4xl md:text-[3rem] font-extrabold leading-[1.1] text-white tracking-tighter mb-6 md:mb-8 drop-shadow-lg text-left">
                            O sistema que está mudando a forma como corretores vendem imóveis.
                        </h1>
                        <div className="space-y-4 text-white text-base md:text-lg lg:text-xl font-medium drop-shadow-md text-left">
                            <p className="leading-tight">
                                A primeira infraestrutura digital que rastreia lançamentos e constrói seu site automaticamente.
                            </p>
                            <p className="leading-tight mt-4">
                                Chega de ser refém de portais. Recupere sua soberania.
                            </p>
                        </div>
                    </div>

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

            {/* ASTERISK DIVIDER */}
            {customAsterisk && (
                <div className="relative z-30 -mt-12 md:-mt-16 -mb-12 md:-mt-16 max-w-7xl mx-auto px-6 flex justify-end">
                    <div className="relative size-32 md:size-48 transform hover:rotate-12 transition-transform duration-500">
                        <Image
                            src={customAsterisk}
                            alt="Asterisk Divider"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}

            {/* SECTION DARK - FEATURES */}
            <section className="relative py-16 md:py-24 bg-[#0a0a0a] overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-left relative z-10">
                    <p className="font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white text-xs md:text-sm mb-2">
                        Independência Total
                    </p>
                    <div className="flex flex-col gap-0 mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                            Pare de depender de portais.
                        </h2>
                        <p className="text-white text-3xl md:text-[3rem] font-light leading-[1.1] tracking-tighter mt-2">
                            Comece a construir sua própria estrutura digital
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        <div className="bg-[#111]/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <Globe className="text-[#00e900] size-8 md:size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg md:text-xl mb-3">Site próprio</h3>
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">Sua vitrine digital personalizada com alta conversão e SEO otimizado.</p>
                        </div>
                        <div className="bg-[#111]/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <Users className="text-[#00e900] size-8 md:size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg md:text-xl mb-3">Leads direto</h3>
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">Receba contatos interessados sem intermediários ou leilões de leads.</p>
                        </div>
                        <div className="bg-[#111]/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <LayoutGrid className="text-[#00e900] size-8 md:size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg md:text-xl mb-3">Carteira organizada</h3>
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">Gestão inteligente do seu portfólio com filtros avançados e CRM.</p>
                        </div>

                        <div className="bg-[#00e900] p-8 md:p-10 rounded-3xl transition-all hover:-translate-y-2 group text-black md:col-span-2">
                            {customAsterisk ? (
                                <div className="relative size-8 md:size-10 mb-6 group-hover:scale-110 transition-transform text-black">
                                    <Image src={customAsterisk} alt="Asterisk" fill className="object-contain" />
                                </div>
                            ) : (
                                <Asterisk className="text-black size-8 md:size-10 group-hover:scale-110 transition-transform font-black" />
                            )}
                            <h3 className="font-black text-xl md:text-2xl mb-3 uppercase tracking-tighter">Acesso a construtoras</h3>
                            <p className="text-black/80 text-sm md:text-base font-medium leading-relaxed max-w-lg">
                                Conecte-se com as maiores incorporadoras do país e tenha acesso a materiais de venda exclusivos antes do mercado.
                            </p>
                        </div>
                        <div className="bg-[#111]/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white/5 hover:border-[#00e900]/30 transition-all hover:-translate-y-2 group">
                            <LayoutGrid className="text-white size-8 md:size-10 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg md:text-xl mb-3">CRM completo</h3>
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                                Acompanhe cada etapa da jornada do seu cliente, desde o primeiro clique até a assinatura do contrato.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATEMENT (Section with Aligned Left Text) */}
            <section className="py-16 md:py-24 bg-white text-black relative overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center">
                <div className="absolute inset-0 z-0">
                    {centralBgImage && (
                        <Image src={centralBgImage} alt="Background" fill className="object-cover opacity-100" />
                    )}
                </div>
                <div className="max-w-7xl mx-auto px-6 w-full relative z-10 text-left">
                    <div className="flex flex-col items-start gap-8 md:gap-12">
                        <h2 className="text-3xl md:text-5xl tracking-tighter text-black leading-tight text-left">
                            Você não precisa de mais leads.<br /> 
                            <span className="font-bold text-black">Precisa de mais controle.</span>
                        </h2>

                        <div className="text-black text-lg md:text-xl font-medium leading-relaxed p-0 text-left max-w-2xl">
                            O mercado tradicional te obriga a alugar audiência.<br className="hidden md:block" />
                            A OraOra te entrega a infraestrutura para você ser <br />
                            o dono da sua própria audiência.
                        </div>
                        
                        <div className="text-3xl md:text-5xl font-light leading-[1.1] tracking-tighter text-black text-left">
                            <span className="font-bold">Sua marca,</span><br />
                            sua autoridade,<br />
                            sua vitrine.
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS */}
            <section className="py-16 md:py-24 bg-black overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 items-center gap-12 lg:gap-20">
                    <div className="flex flex-col items-start text-left">
                        <h2 className="text-3xl md:text-5xl font-light leading-[1.1] tracking-tighter mb-10 md:mb-16 text-white text-left">
                            Para Corretores que Jogam no <span className="font-bold text-[#00e900]">Nível Mais Alto</span>
                        </h2>

                        <ul className="space-y-0 w-full max-w-[500px]">
                            {[
                                "Acesso ao que realmente importa",
                                "Clareza para tomar decisões",
                                "Velocidade na execução",
                                "Processo que converte",
                                "Presença que trabalha por você",
                                "Controle total do jogo",
                                "Fechamento"
                            ].map((item, i) => (
                                <li key={i} className="border-b border-white/20 py-3 md:py-4 last:border-b-0">
                                    <span className="text-xl md:text-[30px] font-light text-white leading-tight block">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative h-[300px] md:h-[500px] lg:h-[650px] w-full animate-in fade-in slide-in-from-right duration-1000">
                        {siteData?.corretorPageSystemScreenImageUrl && (
                            <Image
                                src={siteData.corretorPageSystemScreenImageUrl}
                                alt="Dashboard Oraora"
                                fill
                                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[1.5rem] md:rounded-[2.5rem]"
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* PERSUASIVE SECTION */}
            <section className="py-20 md:py-32 bg-[#050505] relative overflow-hidden border-t border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00e900]/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-left max-w-4xl mb-16 md:mb-24 flex flex-col gap-0">
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-tight">
                            Pare de perder vendas todos os dias
                        </h2>
                        <p className="text-white text-2xl md:text-[2.5rem] font-light leading-tight tracking-tighter mt-4 opacity-80 max-w-3xl">
                            Enquanto você organiza contatos manualmente, outros corretores estão fechando mais com processo, dados e velocidade.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
                        {[
                            { title: "Oportunidades que não esperam", desc: "Clientes prontos para comprar não ficam disponíveis por muito tempo.", icon: <Timer className="text-[#00e900]" /> },
                            { title: "Decisões mais rápidas", desc: "Quem responde primeiro e com contexto certo, fecha mais.", icon: <Zap className="text-[#00e900]" /> },
                            { title: "Nenhum lead perdido", desc: "Centralize tudo e nunca mais perca oportunidades.", icon: <ShieldCheck className="text-[#00e900]" /> },
                            { title: "Processo que acelera fechamento", desc: "Organize sua venda do início ao fim com clareza.", icon: <Workflow className="text-[#00e900]" /> },
                            { title: "Seu site trabalhando 24h", desc: "Captação automática de clientes mesmo offline.", icon: <Globe className="text-[#00e900]" /> },
                            { title: "Controle total do pipeline", desc: "Visualize e priorize suas negociações com precisão.", icon: <BarChart3 className="text-[#00e900]" /> },
                            { title: "Previsão de ganhos", desc: "Saiba o que está próximo de fechar e quanto pode ganhar.", icon: <TrendingUp className="text-[#00e900]" /> }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-[#00e900]/20 transition-all group">
                                <div className="size-12 rounded-xl bg-[#00e900]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h4 className="text-white font-bold text-xl mb-3">{item.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}

                        {/* Truth Box */}
                        <div className="bg-[#00e900] p-10 rounded-2xl flex flex-col justify-center text-black md:col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="size-8 font-black" />
                                <h4 className="font-black text-2xl uppercase tracking-tighter">A verdade</h4>
                            </div>
                            <p className="text-black/90 text-lg md:text-2xl font-bold leading-tight max-w-xl">
                                Corretores que operam no improviso estão ficando para trás. Os que usam processo, dados e tecnologia estão dominando o mercado.
                            </p>
                        </div>
                    </div>

                    <div className="text-center flex flex-col items-center gap-6">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-black px-12 py-5 rounded-2xl font-black text-lg md:text-xl hover:scale-105 transition-all shadow-glow hover:bg-[#00e900] active:scale-95 cursor-pointer border-none"
                        >
                            Solicite seu convite
                        </button>
                        <p className="text-gray-500 font-bold text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#00e900]">info</span>
                            Cada dia sem estrutura é dinheiro perdido.
                        </p>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing-section" className="bg-white text-black py-16 md:py-32">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="max-w-3xl mx-auto mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-6xl font-normal tracking-tight text-slate-900 mb-4">
                            Planos pensados para <span className="font-black">escalar seu negócio</span>
                        </h2>
                        <p className="text-slate-500 text-base md:text-xl">
                            Os planos são liberados após{' '}
                            <span className="relative inline-block font-bold">
                                aprovação do convite.
                                <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#00e900] rounded-full"></span>
                            </span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                        {/* Essential Plan */}
                        <div className="bg-[#111] text-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col shadow-xl border border-white/5 group transition-all duration-500 hover:-translate-y-2">
                            <h3 className="text-xl md:text-2xl font-bold text-[#00e900] mb-4 text-left">Essencial</h3>
                            <p className="text-3xl md:text-4xl font-black mb-8 md:mb-10 text-left">R$ 149,90</p>
                            
                            <ul className="space-y-4 mb-10 md:mb-12 flex-1">
                                {[
                                    "50 imóveis na carteira",
                                    "Acesso as construtoras",
                                    "Site"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-left">
                                        <div className="size-5 rounded-full bg-[#00e900]/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="text-[#00e900] size-3" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-[#00e900] text-black py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#00e900]/10 border-none cursor-pointer"
                            >
                                Contratar
                            </button>
                        </div>

                        {/* Professional Plan (Featured) */}
                        <div className="bg-[#111] text-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col shadow-2xl border-4 border-[#00e900] relative transform md:scale-105 z-10 transition-all duration-500 hover:-translate-y-2">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00e900] text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                mais popular
                            </div>
                            
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 text-left">Profissional</h3>
                            <p className="text-3xl md:text-4xl font-black mb-8 md:mb-10 text-left">R$ 189,90</p>
                            
                            <ul className="space-y-4 mb-10 md:mb-12 flex-1">
                                {[
                                    "150 imóveis na carteira",
                                    "Acesso as construtoras",
                                    "Site Premium",
                                    "CRM de Atendimento",
                                    "Suporte VIP"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-left">
                                        <div className="size-5 rounded-full bg-[#00e900]/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="text-[#00e900] size-3" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-100">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-[#00e900] text-black py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#00e900]/20 border-none cursor-pointer"
                            >
                                Contratar
                            </button>
                        </div>

                        {/* Advanced Plan */}
                        <div className="bg-[#111] text-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col shadow-xl border border-white/5 transition-all duration-500 hover:-translate-y-2">
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 text-left">Avançado</h3>
                            <p className="text-3xl md:text-4xl font-black mb-8 md:mb-10 text-left">R$ 249,90</p>
                            
                            <ul className="space-y-4 mb-10 md:mb-12 flex-1">
                                {[
                                    "Imóveis Ilimitados",
                                    "Acesso as construtoras",
                                    "Site Personalizado",
                                    "Domínio Próprio",
                                    "Assessoria de Marketing"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-left">
                                        <div className="size-5 rounded-full bg-[#00e900]/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="text-[#00e900] size-3" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-[#00e900] text-black py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#00e900]/10 border-none cursor-pointer"
                            >
                                Contratar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-20 md:py-32 bg-[#050505] border-t border-white/5">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-12 text-center leading-tight text-white uppercase">
                        Dúvidas que quase ninguém fala <br /> <span className="text-[#00e900] font-light lowercase">(mas todo corretor pensa)</span>
                    </h2>

                    <Accordion type="single" collapsible className="w-full space-y-4">
                        <AccordionItem value="item-1" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                E se isso for só mais uma ferramenta que eu não vou usar?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Se não encaixar no seu dia a dia, você não usa mesmo. <br /><br />
                                Por isso o OraOra não é só uma ferramenta — ele organiza sua operação inteira.
                                Quando você começa a usar, parar significa voltar ao caos.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                Já tentei outras plataformas e não funcionou pra mim…
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Provavelmente porque elas exigiam mais esforço do que retorno. <br /><br />
                                O OraOra foi pensado para gerar valor rápido:
                                você organiza, visualiza e já começa a agir melhor no mesmo dia.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                Não tenho tempo para aprender mais um sistema
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Você já está perdendo tempo hoje — só que sem perceber. <br /><br />
                                Tempo procurando contato, esquecendo follow-up, se desorganizando.
                                O OraOra devolve esse tempo para você fechar mais.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                E se eu não conseguir gerar mais vendas com isso?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Sem estrutura, você já está limitado. <br /><br />
                                O OraOra não faz milagre — ele elimina perda, melhora sua execução e aumenta suas chances reais de fechamento.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                Vou depender da plataforma?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Você já depende de planilhas, WhatsApp e memória. <br /><br />
                                A diferença é que agora você tem controle, organização e visão clara do que está acontecendo.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-6" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                E se meus leads não forem bons?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                O problema raramente é os leads. <br /><br />
                                É falta de processo, acompanhamento e prioridade.
                                Com organização e clareza, o mesmo lead pode ter um resultado completamente diferente.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-7" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                Isso vale o investimento?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Quantas vendas você perdeu por falta de organização ou timing? <br /><br />
                                Se uma única venda melhora, o investimento já se paga.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-8" className="border-white/10 px-4 rounded-2xl bg-[#111]/50 border">
                            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-[#00e900] py-6">
                                Vou ficar para trás se não usar?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed pb-6">
                                Não imediatamente. <br /><br />
                                Mas, aos poucos, quem trabalha com processo, dados e velocidade começa a dominar o jogo. <br /><br />
                                E quando você perceber, já está correndo atrás.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="mt-16 text-center max-w-2xl mx-auto">
                        <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                            Você não precisa de mais uma ferramenta. <br className="hidden md:block" />
                            <span className="text-[#00e900]">Precisa parar de perder venda por falta de estrutura.</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* FORM */}
            <section className="py-20 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl md:text-6xl font-extrabold tracking-tighter leading-tight text-white">
                            Se você quer continuar dependendo de portais, <span className="text-[#00e900]">ignore isso.</span>
                        </h2>
                        <p className="text-gray-400 text-lg md:text-xl font-medium">Mas se você está pronto para ser dono da sua jornada, entre na lista de acesso.</p>
                    </div>

                    <div className="bg-[#111]/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <form onSubmit={handleInviteSubmit} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                    <input 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-4 pl-12 bg-black rounded-xl border border-white/10 focus:border-[#00e900] focus:ring-0 outline-none transition-all font-bold text-white text-sm md:text-base" 
                                        placeholder="Ex: Marcus Thorne" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">E-mail Profissional</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                    <input 
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full p-4 pl-12 bg-black rounded-xl border border-white/10 focus:border-[#00e900] focus:ring-0 outline-none transition-all font-bold text-white text-sm md:text-base" 
                                        placeholder="seu@email.com" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">WhatsApp</label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                    <input 
                                        required
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                        className="w-full p-4 pl-12 bg-black rounded-xl border border-white/10 focus:border-[#00e900] focus:ring-0 outline-none transition-all font-bold text-white text-sm md:text-base" 
                                        placeholder="(00) 00000-0000" 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#00e900] text-black py-4 md:py-5 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm hover:brightness-110 transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer border-none"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Entrar na lista de acesso</span>
                                        <ArrowRight className="size-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#00e900]/5 rounded-full blur-[80px] md:blur-[120px] -mb-24 md:-mb-48 -mr-24 md:-mr-48"></div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 text-black">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Image src={siteData?.logoUrl || displayLogo || ""} alt="Oraora Logo" width={160} height={40} className="h-8 w-auto" style={{ width: 'auto' }} />
                            </div>
                            {isSiteDataLoading ? (
                                <div className="space-y-2 max-w-xs">
                                    <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                                    <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                                    <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
                                </div>
                            ) : (
                                <div
                                    className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: siteData?.footerSlogan || 'Conectando pessoas aos seus sonhos. A plataforma mais moderna para comprar, vender e alugar imóveis no Brasil.' }}
                                />
                            )}
                            <div className="flex gap-4">
                                <a className="text-gray-400 hover:text-black transition-colors" href="#" aria-label="Instagram"><Instagram size={20} /></a>
                                <a className="text-gray-400 hover:text-black transition-colors" href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                                <a className="text-gray-400 hover:text-black transition-colors" href="#" aria-label="Twitter"><Twitter size={20} /></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Imóveis</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a className="hover:text-primary transition-colors" href="/imoveis">Comprar</a></li>
                                <li><a className="hover:text-primary transition-colors" href="/imoveis">Lançamentos</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Empresa</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link className="hover:text-primary transition-colors" href="/sobre">Sobre</Link></li>
                                <li><Link className="hover:text-primary transition-colors" href="/contato">Contato</Link></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link className="hover:text-primary transition-colors" href="/termos-de-uso">Termos de Uso</Link></li>
                                <li><Link className="hover:text-primary transition-colors" href="/politica-de-privacidade">Política de Privacidade</Link></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Política de Cookies</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400 text-center md:text-left">
                        <p>© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" className="text-sm font-medium text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200">
                                <Link href="/login" className="flex items-center gap-2">
                                    <UserRound size={16} />
                                    Área do corretor
                                </Link>
                            </Button>
                            <Link href="/corretor" className="text-xs text-gray-400 hover:text-primary transition-colors">Desenvolvido por <strong>Oraora</strong></Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Invite Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-xl mx-4">
                    <VisuallyHidden>
                        <DialogHeader>
                            <DialogTitle>Solicitar Convite</DialogTitle>
                            <DialogDescription>Preencha os dados para entrar na lista de acesso.</DialogDescription>
                        </DialogHeader>
                    </VisuallyHidden>
                    <div className="bg-[#1a1a1a] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/10">
                        <form 
                            onSubmit={handleInviteSubmit} 
                            className="space-y-6 md:space-y-8 text-left"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-[#00e900] size-5" />
                                    <input 
                                        required
                                        name="name"
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        className="w-full bg-transparent border-0 border-b-2 border-[#00e900] focus:ring-0 text-white transition-colors py-3 pl-8 outline-none placeholder:text-white/20 font-bold text-base md:text-lg" 
                                        placeholder="Como devemos te chamar?" 
                                        type="text"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">E-mail Profissional</label>
                                <div className="relative">
                                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#00e900] size-5" />
                                    <input 
                                        required
                                        name="email"
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})} 
                                        className="w-full bg-transparent border-0 border-b-2 border-[#00e900] focus:ring-0 text-white transition-colors py-3 pl-8 outline-none placeholder:text-white/20 font-bold text-base md:text-lg" 
                                        placeholder="exemplo@email.com" 
                                        type="email"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">WhatsApp</label>
                                    <div className="relative">
                                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                        <input 
                                            required
                                            name="whatsapp"
                                            value={formData.whatsapp} 
                                            onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                                            className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-[#00e900] text-white transition-all py-4 pl-12 pr-4 outline-none appearance-none font-bold text-sm md:text-base" 
                                            placeholder="(00) 00000-0000" 
                                            type="tel"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cidade</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                        <input 
                                            required
                                            name="city"
                                            value={formData.city} 
                                            onChange={e => setFormData({...formData, city: e.target.value})} 
                                            className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-[#00e900] text-white transition-all py-4 pl-12 pr-4 outline-none appearance-none font-bold text-sm md:text-base" 
                                            placeholder="Onde você atua?" 
                                            type="text"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tempo de atuação</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                        <select 
                                            name="experience"
                                            value={formData.experience} 
                                            onChange={e => setFormData({...formData, experience: e.target.value})} 
                                            className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-[#00e900] text-white transition-all py-4 pl-12 pr-4 outline-none appearance-none cursor-pointer font-bold text-sm md:text-base"
                                        >
                                            <option>Menos de 1 ano</option>
                                            <option>1 a 3 anos</option>
                                            <option>3 a 5 anos</option>
                                            <option>Mais de 5 anos</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none size-5" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Especialidade</label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                                        <select 
                                            name="specialty"
                                            value={formData.specialty} 
                                            onChange={e => setFormData({...formData, specialty: e.target.value})} 
                                            className="w-full bg-[#222] border-none rounded-xl focus:ring-2 focus:ring-primary text-white transition-all py-4 pl-12 pr-4 outline-none appearance-none cursor-pointer font-bold text-sm md:text-base"
                                        >
                                            <option>Lançamentos</option>
                                            <option>Alto Padrão</option>
                                            <option>Revenda</option>
                                            <option>Minha Casa Minha Vida</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none size-5" />
                                    </div>
                                </div>
                            </div>
                            <button 
                                disabled={isSubmitting}
                                className="w-full bg-[#00e900] text-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 border-none cursor-pointer" 
                                type="submit"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Solicitar Acesso</span>
                                        <ArrowRight className="size-5" />
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

function CorretorPage() {
  const { isReady } = useAuthContext();
  
  if (!isReady) return null;

  return (
    <div className="w-full min-h-screen">
      <CorretorPageContent />
    </div>
  );
}

export default CorretorPage;
