'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Users, 
  LayoutGrid, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Timer, 
  CheckCircle2,
  Sparkles,
  Briefcase,
  Layers,
  Calendar,
  Building2,
  TrendingUp,
  FileText,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CorretorClientPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        city: '',
        experience: '1 a 3 anos',
        specialty: 'Residencial'
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
                experience: '1 a 3 anos',
                specialty: 'Residencial'
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
        <div className="bg-[#fafafa] text-neutral-900 font-sans selection:bg-[#00e900] selection:text-black min-h-screen overflow-x-hidden">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/60">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-8 w-32">
                            <Image 
                                src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fa08e5cdf-9fd3-4be2-85a1-05ff0eaddc58-logo-oraora-p.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2"
                                alt="OraOra Logo"
                                fill
                                className="object-contain object-left"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Para Corretores
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors hidden sm:block">
                            Entrar
                        </Link>
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-black hover:bg-neutral-800 text-white font-medium px-5 h-11 rounded-full shadow-sm transition-all hover:scale-[1.02]"
                        >
                            Conhecer o OraOra
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-36 pb-24 md:pt-48 md:pb-32 px-6">
                <div className="max-w-6xl mx-auto text-center space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-200/60 border border-neutral-300/60 text-xs font-medium text-neutral-800"
                    >
                        <Sparkles className="size-3.5 text-black" />
                        <span>A nova era da operação imobiliária pessoal</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-neutral-900 leading-[1.05] max-w-5xl mx-auto"
                    >
                        Você não precisa trabalhar mais. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900">
                            Precisa trabalhar melhor.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed"
                    >
                        O OraOra reúne sua operação imobiliária em um único lugar para você gastar menos tempo organizando o trabalho e mais tempo atendendo clientes, construindo relacionamentos e fechando negócios.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto h-14 px-8 rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base shadow-lg shadow-black/10 transition-all hover:scale-105"
                        >
                            Conhecer o OraOra
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                        <a 
                            href="#como-funciona"
                            className="w-full sm:w-auto h-14 px-8 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 font-medium text-base border border-neutral-300 transition-all flex items-center justify-center"
                        >
                            Ver como funciona
                        </a>
                    </motion.div>
                </div>

                {/* Hero Product Visual Preview */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="max-w-6xl mx-auto mt-20"
                >
                    <div className="relative rounded-3xl border border-neutral-200/80 bg-white p-3 shadow-2xl shadow-neutral-200/50">
                        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-100/50 to-transparent rounded-3xl pointer-events-none"></div>
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <Image 
                                src="https://picsum.photos/seed/oraora-dashboard-hero/1400/800" 
                                alt="OraOra Plataforma Unificada" 
                                fill 
                                className="object-cover opacity-90"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                                <div className="text-white space-y-2">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#00e900] text-black">
                                        Ecossistema Integrado
                                    </span>
                                    <h3 className="text-2xl font-bold">Seu negócio imobiliário em um único lugar.</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Section 5: Pain Identification */}
            <section className="py-24 px-6 bg-white border-y border-neutral-200/60">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900">
                        Em que momento organizar o trabalho virou parte maior do trabalho?
                    </h2>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
                        {[
                            { label: "WhatsApp", desc: "Conversas perdidas" },
                            { label: "Planilhas", desc: "Dados desatualizados" },
                            { label: "Agenda", desc: "Visitas e lembretes dispersos" },
                            { label: "Apresentações", desc: "Arquivos espalhados" }
                        ].map((item, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
                                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ferramenta #{idx + 1}</div>
                                <div className="text-lg font-bold text-neutral-900">{item.label}</div>
                                <div className="text-sm text-neutral-600">{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-6 max-w-2xl mx-auto">
                        <p className="text-lg text-neutral-600">
                            E quando percebe, passou boa parte do dia organizando a operação.
                        </p>
                        <p className="text-2xl font-bold text-neutral-900">
                            O problema não é falta de esforço. É trabalhar com tudo espalhado.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 6 & 7: Transformation & Big Promise */}
            <section id="como-funciona" className="py-32 px-6 bg-[#fafafa]">
                <div className="max-w-6xl mx-auto space-y-24">
                    <div className="text-center max-w-3xl mx-auto space-y-6">
                        <span className="text-xs font-bold tracking-widest uppercase text-neutral-500">Conexão Total</span>
                        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900">
                            Seu trabalho deveria estar conectado.
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Cliente. Imóvel. Atendimento. Site. Agenda. Histórico. Negociação. Tudo precisa conversar. É isso que o OraOra organiza.
                        </p>
                    </div>

                    <div className="rounded-3xl bg-black text-white p-10 md:p-16 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00e900]/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="relative z-10 max-w-3xl space-y-8">
                            <span className="text-xs font-bold tracking-widest uppercase text-[#00e900]">A Grande Promessa</span>
                            <h3 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                                Tenha estrutura de empresa. <br />
                                <span className="text-[#00e900]">Sem precisar ser uma empresa.</span>
                            </h3>
                            <p className="text-lg text-neutral-400 leading-relaxed">
                                O OraOra reúne a estrutura necessária para você construir, operar e fazer crescer seu negócio imobiliário em um único ambiente.
                            </p>
                            <div className="pt-4">
                                <Button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="h-14 px-8 rounded-full bg-[#00e900] text-black font-bold hover:brightness-110 transition-all"
                                >
                                    Conhecer a plataforma
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modules Grid (Features anchored to user request) */}
            <section className="py-24 px-6 bg-white border-t border-neutral-200/60">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900">
                            Tudo o que sua operação precisa, conectado.
                        </h2>
                        <p className="text-lg text-neutral-600">
                            Conheça os pilares que transformam sua rotina dispersa em um negócio estruturado.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* 1. Site Profissional */}
                        <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/60 hover:border-black transition-all group flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="size-12 rounded-2xl bg-black text-[#00e900] flex items-center justify-center">
                                    <Globe className="size-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900">Sua presença digital pronta</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Tenha um site profissional para apresentar sua marca, seus imóveis e seu trabalho sem precisar começar tudo do zero.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-neutral-200 mt-6 text-xs font-semibold text-neutral-500">
                                Você cuida do negócio. O OraOra cuida da estrutura.
                            </div>
                        </div>

                        {/* 2. Imóveis e Carteira */}
                        <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/60 hover:border-black transition-all group flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="size-12 rounded-2xl bg-black text-[#00e900] flex items-center justify-center">
                                    <Building2 className="size-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900">Mais imóveis, menos trabalho</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Conecte-se a imóveis disponibilizados por construtoras parceiras e organize sua carteira própria em um só lugar.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-neutral-200 mt-6 text-xs font-semibold text-neutral-500">
                                Sua carteira começa organizada.
                            </div>
                        </div>

                        {/* 3. CRM + Clientes */}
                        <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/60 hover:border-black transition-all group flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="size-12 rounded-2xl bg-black text-[#00e900] flex items-center justify-center">
                                    <Users className="size-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900">Controle total de clientes</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Você não precisa lembrar de tudo. Gerencie funis, oportunidades, histórico de atendimento e relacionamento com clareza.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-neutral-200 mt-6 text-xs font-semibold text-neutral-500">
                                Menos informação espalhada. Mais controle.
                            </div>
                        </div>

                        {/* 4. Personas */}
                        <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/60 hover:border-black transition-all group flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="size-12 rounded-2xl bg-black text-[#00e900] flex items-center justify-center">
                                    <Briefcase className="size-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900">Personas inteligentes</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Conhecer o cliente muda a conversa. Entenda os objetivos e perfis para conectar o comprador ao imóvel ideal com precisão.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-neutral-200 mt-6 text-xs font-semibold text-neutral-500">
                                Mais contexto para a negociação certa.
                            </div>
                        </div>

                        {/* 5. Agenda e Negócios */}
                        <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/60 hover:border-black transition-all group flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="size-12 rounded-2xl bg-black text-[#00e900] flex items-center justify-center">
                                    <Calendar className="size-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900">Agenda e Acompanhamento</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Venda também é acompanhamento. Organize tarefas, visitas, propostas e próximos passos sem depender da memória.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-neutral-200 mt-6 text-xs font-semibold text-neutral-500">
                                Sua operação no piloto inteligente.
                            </div>
                        </div>

                        {/* 6. IA Aplicada */}
                        <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/60 hover:border-black transition-all group flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="size-12 rounded-2xl bg-black text-[#00e900] flex items-center justify-center">
                                    <Zap className="size-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900">Inteligência Artificial real</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    A IA trabalha a favor do seu tempo. Reduza tarefas repetitivas, elabore descrições e apoie sua operação sem perder o toque humano.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-neutral-200 mt-6 text-xs font-semibold text-neutral-500">
                                A IA aumenta sua capacidade. Não substitui você.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 14: Unified Vision */}
            <section className="py-32 px-6 bg-neutral-900 text-white">
                <div className="max-w-5xl mx-auto text-center space-y-12">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#00e900]">Visão Unificada</span>
                    <h2 className="text-4xl sm:text-6xl font-black tracking-tight">
                        Não são várias ferramentas. <br />
                        <span className="text-[#00e900]">É uma operação conectada.</span>
                    </h2>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        O diferencial não está em ter uma ferramenta para cada problema. Está em fazer as ferramentas trabalharem juntas.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                        {['SITE', 'CLIENTES', 'IMÓVEIS', 'CRM', 'PERSONAS', 'AGENDA', 'NEGÓCIOS', 'FINANCEIRO', 'IA'].map((mod, i) => (
                            <span key={i} className="px-5 py-2.5 rounded-full bg-neutral-800 border border-neutral-700 text-sm font-semibold tracking-wide text-neutral-200">
                                {mod}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 17: Para quem é */}
            <section className="py-24 px-6 bg-[#fafafa]">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900">
                            Para o corretor que quer deixar de trabalhar como autônomo e começar a operar como negócio.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            "Trabalho sozinho e preciso de escala.",
                            "Tenho clientes espalhados em vários lugares.",
                            "Uso ferramentas desconectadas que atrapalham.",
                            "Quero profissionalizar minha presença digital.",
                            "Quero organizar minha operação de ponta a ponta.",
                            "Quero crescer sem aumentar a complexidade."
                        ].map((text, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex items-start gap-4">
                                <CheckCircle2 className="size-6 text-[#00e900] shrink-0 mt-0.5" />
                                <p className="text-neutral-800 font-medium text-lg leading-snug">{text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center pt-8">
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="h-14 px-10 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-base shadow-lg"
                        >
                            Esse é o meu momento
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Section 19: Como Começar */}
            <section className="py-24 px-6 bg-white border-t border-neutral-200/60">
                <div className="max-w-5xl mx-auto space-y-16">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                        <span className="text-xs font-bold tracking-widest uppercase text-neutral-500">Simples e Direto</span>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">Como começar a operar</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-6">
                        {[
                            { step: "01", title: "Crie seu perfil", desc: "Sua identidade profissional pronta." },
                            { step: "02", title: "Presença digital", desc: "Seu site no ar em minutos." },
                            { step: "03", title: "Monte sua carteira", desc: "Imóveis próprios e de parceiros." },
                            { step: "04", title: "Cadastre clientes", desc: "Organize sua base de contatos." },
                            { step: "05", title: "Comece a operar", desc: "Sua rotina conectada." },
                        ].map((st, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                                <span className="text-xs font-bold text-[#00e900] bg-black px-2.5 py-1 rounded-md">
                                    {st.step}
                                </span>
                                <h3 className="text-lg font-bold text-neutral-900">{st.title}</h3>
                                <p className="text-sm text-neutral-600">{st.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 bg-black text-white text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    <h2 className="text-4xl sm:text-7xl font-black tracking-tight leading-tight">
                        Quanto do seu dia você poderia recuperar?
                    </h2>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        O OraOra coloca sua operação em um único lugar para você poder fazer o que realmente importa: construir relacionamentos, fechar negócios e fazer seu negócio crescer.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto h-16 px-10 rounded-full bg-[#00e900] text-black font-black text-lg hover:brightness-110 shadow-[0_0_30px_rgba(0,233,0,0.3)]"
                        >
                            Conhecer o OraOra
                        </Button>
                    </div>

                    <div className="pt-20 border-t border-neutral-800 space-y-4">
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-300">
                            Mais que um sistema. <br />
                            <span className="text-[#00e900]">Uma estrutura para crescer.</span>
                        </h3>
                        <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">oraora</p>
                    </div>
                </div>
            </section>

            {/* Invite Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-neutral-200 rounded-3xl p-8">
                    <DialogHeader className="space-y-3 text-left">
                        <DialogTitle className="text-2xl font-black tracking-tight text-neutral-900">Solicitar Acesso ao OraOra</DialogTitle>
                        <p className="text-sm text-neutral-600">
                            Preencha seus dados abaixo para iniciar sua jornada com estrutura profissional.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="name">Nome completo</Label>
                            <Input 
                                id="name" 
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="email">E-mail profissional</Label>
                            <Input 
                                id="email" 
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input 
                                id="whatsapp" 
                                placeholder="(00) 00000-0000"
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="city">Cidade de atuação</Label>
                            <Input 
                                id="city" 
                                placeholder="Ex: João Pessoa - PB"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full h-14 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-base mt-4"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
