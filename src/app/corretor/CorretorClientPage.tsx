'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
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
  ArrowRight,
  Check,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Calendar,
  Globe,
  Users,
  Compass,
  Layers,
  Search,
  Building,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Laptop,
  Flame,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';

export default function CorretorClientPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFicaIndex, setActiveFicaIndex] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    city: '',
    marketTime: '1 a 3 anos',
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha seu nome, e-mail e WhatsApp para solicitar acesso.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (firestore) {
        await addDoc(collection(firestore, 'inviteRequests'), {
          ...formData,
          role: 'broker',
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }

      toast({
        title: 'Solicitação confirmada!',
        description: 'Recebemos seu pedido. Você receberá seu acesso de testes em instantes via WhatsApp/E-mail.'
      });
      
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        whatsapp: '',
        city: '',
        marketTime: '1 a 3 anos',
      });
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        variant: 'destructive',
        title: 'Erro temporário',
        description: 'Não foi possível enviar sua solicitação. Tente novamente em instantes.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const oQueFicaItems = [
    { action: "Cliente atendido", result: "Histórico permanente", desc: "Interesses, preferências, visitas e objeções continuam na sua base, prontos para a próxima oportunidade.", tag: "Memória de Atendimento" },
    { action: "Contato conquistado", result: "Relacionamento ativo", desc: "O contato não se perde no fluxo de conversas. Ele faz parte de uma carteira viva de relacionamentos.", tag: "CRM Imobiliário" },
    { action: "Imóvel trabalhado", result: "Conhecimento acumulado", desc: "Plantas, valores de m², construtoras e tipologias organizadas na sua biblioteca de produtos.", tag: "Portfólio" },
    { action: "Negociação realizada", result: "Informação estruturada", desc: "O motivo do fechamento ou da recusa vira critério para identificar novas demandas compatíveis.", tag: "Inteligência" },
    { action: "Conteúdo publicado", result: "Presença digital", desc: "Seu próprio site indexado, apresentando seus imóveis e sua autoridade no mercado local.", tag: "Site Próprio" },
    { action: "Parceria criada", result: "Rede de negócios", desc: "Conexão direta com construtoras e corretores parceiros através do Radar de Oportunidades.", tag: "Radar & Co-Brokerage" },
    { action: "Venda fechada", result: "Próxima oportunidade", desc: "Indicações, upgrade de patrimônio do cliente e base sólida para a próxima comissão.", tag: "Continuidade" },
  ];

  return (
    <div className="min-h-screen bg-[#0E140E] text-[#F3F6F3] font-sans antialiased selection:bg-[#2BF20D] selection:text-[#0E140E]">
      
      {/* 1. HEADER MINIMALISTA */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0E140E]/90 backdrop-blur-md border-b border-white/10 py-3.5 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          <Link href="/corretor" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight font-display text-white">
              Ora<span className="text-[#2BF20D]">Ora</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-widest text-slate-300">
            <a href="#produto" className="hover:text-white transition-colors">Produto</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#para-quem-e" className="hover:text-white transition-colors">Para quem é</a>
            <Link href="/dashboard/login" className="hover:text-[#2BF20D] transition-colors">Entrar</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-10 px-5 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-semibold text-xs tracking-wide transition-all shadow-lg hover:shadow-[#2BF20D]/20 active:scale-95"
            >
              Quero testar o OraOra
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO | COMISSÃO CAIU. E A PRÓXIMA? */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-32 pb-24 px-6 sm:px-8 overflow-hidden">
        {/* Subtle atmospheric glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#2BF20D]/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          {/* Bank notification simulation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-2xl backdrop-blur-md mb-10"
          >
            <div className="size-2 rounded-full bg-[#2BF20D] animate-pulse" />
            <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-slate-300">
              Notificação bancária: <span className="text-white font-medium">Comissão recebida</span>
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-sm font-mono tracking-[0.25em] text-[#2BF20D] uppercase mb-4"
          >
            COMISSÃO CAIU.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-white mb-8"
          >
            E a próxima?
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-4 text-base sm:text-lg md:text-xl text-slate-300 font-light max-w-2xl leading-relaxed mb-10"
          >
            <p className="text-slate-400">
              Você prospectou. Atendeu. Fez visitas. Negociou. Fechou.
            </p>
            <p className="text-white font-normal">
              A venda terminou. <strong className="font-semibold text-white">Seu trabalho não precisa terminar com ela.</strong>
            </p>
            <p className="text-slate-300 text-sm sm:text-base">
              O OraOra ajuda você a transformar o trabalho que faz hoje em estrutura para continuar construindo seu negócio amanhã.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full sm:w-auto"
          >
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto h-13 px-8 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-bold text-sm tracking-wide transition-all shadow-xl hover:shadow-[#2BF20D]/30"
            >
              Quero testar o OraOra
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xs text-slate-400 font-mono"
          >
            Acesso gratuito durante a fase de testes.
          </motion.p>

          <div className="mt-16 pt-8 border-t border-white/5 w-full max-w-md flex items-center justify-center">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Cada venda constrói a próxima.
            </span>
          </div>

        </div>
      </section>

      {/* 3. SEGUNDA-FEIRA | COMEÇA TUDO DE NOVO? */}
      <section className="py-28 px-6 sm:px-8 bg-[#131B13] text-[#F3F6F3] relative border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-16">
            <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase mb-3">Rotina do Corretor</p>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight text-white leading-tight">
              Segunda-feira. Começa tudo de novo?
            </h2>
          </div>

          {/* Timeline de fragmentos de rotina */}
          <div className="space-y-4 my-12 border-l border-white/10 pl-6 sm:pl-8 ml-2">
            {[
              { time: "08:04", title: "WhatsApp.", desc: "Você abre o aplicativo e procura aquela conversa que esfriou na semana passada." },
              { time: "08:17", title: "Contato antigo.", desc: "Manda mensagem para alguns contatos na esperança de reaquecer o interesse." },
              { time: "08:31", title: "Grupo de corretores.", desc: "Pergunta nos grupos se apareceu algum imóvel na tipologia que seu cliente queria." },
              { time: "09:06", title: "Instagram e Portais.", desc: "Republica anúncios e procura compradores para outro imóvel da pauta." },
              { time: "09:42", title: "Ligação e Parceria.", desc: "Chama um parceiro, liga para quem demonstrou interesse e tenta reativar uma negociação." },
            ].map((step, idx) => (
              <div key={idx} className="relative group py-2">
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 size-3 rounded-full bg-slate-700 group-hover:bg-[#2BF20D] transition-colors" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="font-mono text-xs text-[#2BF20D] shrink-0 font-medium">{step.time}</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-sm text-slate-300 font-light mt-0.5">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6">
            <p className="text-sm sm:text-base text-slate-300 font-light">
              Nada disso está errado. Esse é o ritmo natural de quem atende pessoas reais e fecha negócios.
            </p>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white">
              O problema é precisar começar de novo toda vez.
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
              Você já trabalhou muito antes dessa segunda-feira. Atendeu pessoas. Conheceu imóveis. Construiu relacionamentos. Fez parcerias. Entendeu clientes. Negociou. Vendeu.
            </p>
            <div className="pt-6 border-t border-white/10">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-[#2BF20D]">
                Quanto desse trabalho ficou no seu negócio?
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. VIRADA DA HISTÓRIA */}
      <section className="py-32 px-6 sm:px-8 bg-[#0E140E] relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase mb-3">A Mudança de Postura</p>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight text-white">
              Seu trabalho precisa construir alguma coisa.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                ephemeral: "Uma conversa pode terminar no WhatsApp.",
                permanent: "Ou deixar um relacionamento ativo no seu negócio."
              },
              {
                ephemeral: "Uma visita pode acabar quando o cliente vai embora.",
                permanent: "Ou deixar conhecimento organizado sobre o que ele procura."
              },
              {
                ephemeral: "Uma negociação pode terminar sem venda.",
                permanent: "Ou deixar informação estruturada para a próxima oportunidade."
              },
              {
                ephemeral: "Uma venda pode terminar quando a comissão cai.",
                permanent: "Ou ajudar a construir a próxima comissão."
              }
            ].map((pair, idx) => (
              <div key={idx} className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:border-[#2BF20D]/30 transition-all duration-300">
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase text-slate-400">Efêmero</div>
                  <p className="text-sm sm:text-base text-slate-300 font-light">{pair.ephemeral}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
                  <div className="text-xs font-mono uppercase text-[#2BF20D] flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-3" /> Permanente
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-white">{pair.permanent}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-xl sm:text-2xl font-serif italic text-slate-300">
              “Trabalho bom deixa alguma coisa construída.”
            </p>
          </div>

        </div>
      </section>

      {/* 5. O QUE FICA? (MATRIZ INTERATIVA DE TRANSFORMAÇÃO) */}
      <section id="como-funciona" className="py-28 px-6 sm:px-8 bg-[#131B13] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-16">
            <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase mb-3">Transformação Real</p>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
              O que fica?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-light mt-3 max-w-xl">
              Cada ação diária do corretor deixa de ser um esforço descartável e passa a acumular patrimônio na sua operação.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Lista de Ações */}
            <div className="lg:col-span-6 space-y-3">
              {oQueFicaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFicaIndex(idx)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all flex items-center justify-between group ${activeFicaIndex === idx ? 'bg-white/10 border border-[#2BF20D]/40 text-white' : 'bg-white/[0.02] border border-white/5 text-slate-300 hover:bg-white/[0.05]'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="size-2 rounded-full bg-[#2BF20D] opacity-60 group-hover:opacity-100" />
                    <div>
                      <span className="text-xs font-mono text-slate-400 block">{item.action}</span>
                      <span className="text-sm sm:text-base font-semibold text-white">→ {item.result}</span>
                    </div>
                  </div>
                  <ChevronRight className={`size-4 transition-transform ${activeFicaIndex === idx ? 'translate-x-1 text-[#2BF20D]' : 'text-slate-500'}`} />
                </button>
              ))}
            </div>

            {/* Painel de Detalhe */}
            <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-[#0E140E] border border-white/10 min-h-[360px] flex flex-col justify-between">
              <div className="space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-[#2BF20D]/10 border border-[#2BF20D]/20 text-[#2BF20D] text-xs font-mono">
                  {oQueFicaItems[activeFicaIndex].tag}
                </span>
                
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    {oQueFicaItems[activeFicaIndex].action}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold font-display text-white">
                    Vira {oQueFicaItems[activeFicaIndex].result}
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                  {oQueFicaItems[activeFicaIndex].desc}
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Estrutura OraOra</span>
                <span className="text-[#2BF20D]">Permanência ativa</span>
              </div>
            </div>

          </div>

          <div className="mt-16 text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white">
              É assim que trabalho começa a virar negócio.
            </h3>
          </div>

        </div>
      </section>

      {/* 6. REVELAÇÃO DO ORAORA */}
      <section id="produto" className="py-28 px-6 sm:px-8 bg-[#0E140E] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase mb-3">CONHEÇA O ORAORA</p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight mb-6">
            Foi para isso que construímos o OraOra.
          </h2>
          <div className="space-y-4 text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            <p>
              Não para ensinar você a vender imóveis. <strong className="text-white font-medium">Você já sabe fazer isso.</strong>
            </p>
            <p>
              O OraOra foi criado para ajudar você a construir estrutura em volta do trabalho que já faz.
            </p>
            <p className="text-slate-400 text-sm sm:text-base">
              Clientes, imóveis, atendimentos, negociações, agenda, presença digital, parceiros e informações passam a fazer parte da mesma operação.
            </p>
            <p className="text-xl sm:text-2xl font-bold font-display text-white pt-4">
              Você continua sendo o corretor. <span className="text-[#2BF20D]">Só deixa de precisar carregar tudo sozinho.</span>
            </p>
          </div>
          
          <div className="mt-10">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-8 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-bold text-sm tracking-wide transition-all shadow-lg"
            >
              Quero conhecer o OraOra
            </Button>
          </div>
        </div>

        {/* 7. DEEP DIVES DE PRODUTO */}
        <div className="max-w-5xl mx-auto space-y-24 mt-24">
          
          {/* A. Site Próprio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#131B13] border border-white/5">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Globe className="size-3.5" /> Presença & Autoridade
              </span>
              <h3 className="text-2xl sm:text-4xl font-bold font-display text-white leading-tight">
                Antes do primeiro contato, seu nome já pode estar trabalhando.
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                Tenha seu próprio site para apresentar quem você é, seus imóveis e sua forma de trabalhar. Receba contatos diretamente pelo seu site e leve esses clientes para dentro da sua operação.
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-sm font-semibold text-white">
                  Seu site não é só uma vitrine. É patrimônio digital sendo construído em torno do seu nome.
                </p>
              </div>
            </div>
            <div className="lg:col-span-6 bg-[#0E140E] rounded-2xl p-6 border border-white/10 shadow-2xl font-mono text-xs">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-white/10 text-slate-400">
                <div className="size-2.5 rounded-full bg-red-500/80" />
                <div className="size-2.5 rounded-full bg-yellow-500/80" />
                <div className="size-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 text-[11px] text-slate-300">seunome.oraora.com.br</span>
              </div>
              <div className="space-y-3 text-slate-300">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-20 bg-white/[0.04] rounded-xl border border-white/5 p-2.5 flex flex-col justify-between">
                    <span className="text-[10px] text-[#2BF20D]">Residencial Bessa</span>
                    <span className="text-[9px] text-slate-400">R$ 890.000</span>
                  </div>
                  <div className="h-20 bg-white/[0.04] rounded-xl border border-white/5 p-2.5 flex flex-col justify-between">
                    <span className="text-[10px] text-[#2BF20D]">Cobertura Cabo Branco</span>
                    <span className="text-[9px] text-slate-400">R$ 1.450.000</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Captação Direta de Leads</span>
                  <span className="text-[#2BF20D]">Ativo 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* B. Clientes e Histórico */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#131B13] border border-white/5">
            <div className="lg:col-span-6 lg:order-2 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Users className="size-3.5" /> Memória de Relacionamento
              </span>
              <h3 className="text-2xl sm:text-4xl font-bold font-display text-white leading-tight">
                O cliente não deveria desaparecer dentro do WhatsApp.
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                Quem é essa pessoa? O que ela procura? Que imóveis já viu? O que gostou? O que recusou? Quando você precisa falar novamente com ela? No OraOra, seus clientes têm interesses, histórico e acompanhamento organizados.
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-sm font-semibold text-white">
                  Uma conversa pode acabar. <span className="text-[#2BF20D]">O relacionamento não precisa.</span>
                </p>
              </div>
            </div>
            <div className="lg:col-span-6 lg:order-1 bg-[#0E140E] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-[#2BF20D]/20 text-[#2BF20D] flex items-center justify-center font-bold text-xs">
                    RC
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Rodrigo Carvalho</h4>
                    <p className="text-[10px] text-slate-400">Busca: 3 Quartos • Altiplano</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2BF20D]/10 text-[#2BF20D] font-mono">Quente</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono block">Histórico de Visita • Ontem</span>
                  <p className="text-slate-300 text-xs mt-0.5">Gostou da varanda gourmet. Aguarda proposta de permuta.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono block">Próximo Passo • Quinta 15h</span>
                  <p className="text-slate-300 text-xs mt-0.5">Apresentar simulação de financiamento e tabela atualizada.</p>
                </div>
              </div>
            </div>
          </div>

          {/* C. Personas e Recomendações */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#131B13] border border-white/5">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Compass className="size-3.5" /> Recomendações com Contexto
              </span>
              <h3 className="text-2xl sm:text-4xl font-bold font-display text-white leading-tight">
                Quanto melhor você conhece alguém, melhor consegue vender para essa pessoa.
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                O OraOra ajuda a organizar o perfil e os interesses dos seus clientes para tornar a recomendação de imóveis mais coerente com aquilo que cada pessoa realmente procura. Menos imóvel enviado por enviar. Mais contexto para uma boa recomendação.
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-sm font-semibold text-white">
                  Cada atendimento ensina alguma coisa. <span className="text-[#2BF20D]">Faça esse conhecimento ficar.</span>
                </p>
              </div>
            </div>
            <div className="lg:col-span-6 bg-[#0E140E] rounded-2xl p-6 border border-white/10 shadow-2xl">
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">1. Cliente</span>
                  <span className="text-white font-medium">Médico, 2 filhos</span>
                </div>
                <div className="text-center text-[#2BF20D] text-xs">↓</div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">2. Necessidade</span>
                  <span className="text-white font-medium">Próximo a escolas, 4 suítes</span>
                </div>
                <div className="text-center text-[#2BF20D] text-xs">↓</div>
                <div className="p-3 rounded-xl bg-[#2BF20D]/10 border border-[#2BF20D]/30 flex items-center justify-between">
                  <span className="text-[#2BF20D]">3. Imóvel Recomendado</span>
                  <span className="text-white font-bold">Residencial Jardins</span>
                </div>
              </div>
            </div>
          </div>

          {/* D. Carteira e Jornada de Vendas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-[#131B13] border border-white/5 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Building className="size-3.5" /> Carteira de Imóveis
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                Não basta ter imóveis. É preciso saber para quem eles fazem sentido.
              </h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Construa sua carteira com imóveis de construtoras parceiras e imóveis próprios. Organize aquilo que você trabalha e relacione imóveis às demandas reais dos clientes.
              </p>
              <p className="text-xs font-semibold text-[#2BF20D] uppercase font-mono">
                Sua carteira deixa de ser links soltos e vira negócio.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#131B13] border border-white/5 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Layers className="size-3.5" /> Jornada de Vendas
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                Toda negociação tem uma história.
              </h3>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300 pt-2">
                {['Lead', 'Contato', 'Interesse', 'Visita', 'Proposta', 'Negociação', 'Fechamento'].map((step, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                    {step} {idx < 6 && '→'}
                  </span>
                ))}
              </div>
              <p className="text-xs font-semibold text-[#2BF20D] uppercase font-mono">
                Movimento sem histórico vira recomeço.
              </p>
            </div>
          </div>

          {/* E. Agenda e Radar de Parcerias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-[#131B13] border border-white/5 space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Calendar className="size-3.5" /> Agenda Operacional
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                O próximo passo não deveria depender da sua memória.
              </h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Uma visita, um retorno, um documento, um cliente que pediu para chamar daqui a duas semanas. Organize compromissos e tarefas junto da sua operação.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#131B13] border border-white/5 space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#2BF20D] flex items-center gap-2">
                <Search className="size-3.5" /> Radar & Rede
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                Você pode ter o cliente. Outro corretor pode ter o imóvel.
              </h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                O Radar conecta demandas, oportunidades e profissionais para facilitar parcerias seguras. Porque construir seu negócio não significa fazer tudo sozinho.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* 8. O VELHO JEITO */}
      <section className="py-28 px-6 sm:px-8 bg-[#131B13] border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto space-y-10">
          <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase">Realidade do Mercado</p>
          
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
            Você pode continuar trabalhando como sempre trabalhou.
          </h2>

          <div className="flex flex-wrap justify-center gap-3 text-sm font-mono text-slate-300 max-w-xl mx-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">WhatsApp</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">Planilhas</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">Portais</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">Grupos</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">Anotações</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">Memória</span>
          </div>

          <p className="text-lg text-slate-400 font-light">
            E continuar vendendo.
          </p>

          <div className="py-8 border-y border-white/10 space-y-4">
            <h3 className="text-2xl sm:text-4xl font-bold font-display text-white">
              A questão nunca foi essa.
            </h3>
            <p className="text-base sm:text-xl font-medium text-[#2BF20D] max-w-xl mx-auto">
              A questão é quanto do seu trabalho continua com você depois da venda.
            </p>
          </div>
        </div>
      </section>

      {/* 9. CORRETOR INDEPENDENTE */}
      <section id="para-quem-e" className="py-32 px-6 sm:px-8 bg-[#0E140E] text-center relative">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase mb-4">Independência & Estrutura</p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight mb-8">
            Ter estrutura não significa virar imobiliária.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto mb-16 leading-relaxed">
            O OraOra foi pensado para o corretor que trabalha de forma independente e quer construir um negócio mais estruturado em torno do próprio nome.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-sm font-mono text-slate-300 mb-12">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Seu site.</div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Seus clientes.</div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Sua carteira.</div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Seus contatos.</div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Suas negociações.</div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Seus parceiros.</div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">Sua história.</div>
            <div className="p-4 rounded-2xl bg-[#2BF20D]/10 border border-[#2BF20D]/30 text-[#2BF20D] font-bold">Seu negócio.</div>
          </div>
        </div>
      </section>

      {/* 10. COMO COMEÇAR */}
      <section className="py-24 px-6 sm:px-8 bg-[#131B13] border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-xs font-mono text-[#2BF20D] tracking-widest uppercase">Sem Complicação</p>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
            Comece pelo que você já tem.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Você não precisa mudar sua maneira de trabalhar de um dia para o outro. Entre no OraOra. Crie sua presença. Organize seus clientes. Monte sua carteira. Acompanhe suas oportunidades. Conecte seus relacionamentos.
          </p>
          <div className="pt-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-8 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-bold text-sm tracking-wide shadow-lg"
            >
              Quero começar
            </Button>
          </div>
        </div>
      </section>

      {/* 11. FASE DE TESTES */}
      <section className="py-28 px-6 sm:px-8 bg-[#0E140E] border-t border-white/5">
        <div className="max-w-3xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#131B13] border border-white/10 space-y-8">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#2BF20D]/10 border border-[#2BF20D]/20 text-[#2BF20D] text-xs font-mono">
              Acesso de Testes Liberado
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
              Estamos construindo o OraOra com corretores de verdade.
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            O OraOra está em fase de testes. Corretores já estão usando a plataforma, publicando seus sites, recebendo leads e testando essa nova forma de construir suas operações. Ainda estamos aprendendo, melhorando e queremos fazer isso junto de quem vive o mercado todos os dias.
          </p>

          <div className="space-y-2 py-4 border-y border-white/10 font-mono text-xs sm:text-sm text-slate-400">
            <p>• Sem promessa milagrosa.</p>
            <p>• Sem dizer que uma plataforma vai fazer o seu trabalho por você.</p>
          </div>

          <div className="space-y-4">
            <p className="text-lg sm:text-xl font-bold font-display text-white">
              A proposta é simples: <span className="text-[#2BF20D]">Fazer o seu trabalho valer por mais tempo.</span>
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-bold text-sm tracking-wide shadow-lg"
            >
              Quero participar dos testes
            </Button>
            <p className="text-xs text-slate-400 font-mono block">
              Acesso gratuito durante a fase de testes.
            </p>
          </div>
        </div>
      </section>

      {/* 12. FECHAMENTO DE ALTO IMPACTO */}
      <section className="py-36 px-6 sm:px-8 bg-[#0B100B] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="space-y-2 text-sm sm:text-base text-slate-400 font-light">
            <p>Você já sabe prospectar.</p>
            <p>Você já sabe atender.</p>
            <p>Você já sabe negociar.</p>
            <p>Você já sabe vender.</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#2BF20D]">
              Agora existe outra pergunta
            </p>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight leading-tight">
              O que cada venda está construindo no seu negócio?
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            A comissão pode cair hoje. O trabalho que trouxe você até ela pode continuar construindo amanhã.
          </p>

          <div className="pt-8 space-y-6">
            <div className="text-4xl font-black font-display tracking-tight text-white">
              Ora<span className="text-[#2BF20D]">Ora</span>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Cada venda constrói a próxima.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-14 px-10 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-bold text-base tracking-wide transition-all shadow-2xl hover:shadow-[#2BF20D]/40"
            >
              Quero testar o OraOra
            </Button>
            <p className="text-xs text-slate-400 font-mono">
              Acesso gratuito durante a fase de testes.
            </p>
          </div>

        </div>
      </section>

      {/* 13. FOOTER INSTITUCIONAL */}
      <footer className="py-12 px-6 sm:px-8 bg-[#080C08] border-t border-white/5 text-slate-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-white font-display">Ora<span className="text-[#2BF20D]">Ora</span></span>
            <span className="text-slate-400">|</span>
            <span>Inteligência Imobiliária</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-400">
            <Link href="/termos-de-uso" className="hover:text-white transition-colors">Termos de uso</Link>
            <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de privacidade</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
            <Link href="/dashboard/login" className="hover:text-[#2BF20D] transition-colors">Entrar</Link>
          </div>

          <div className="text-slate-400 text-[10px]">
            © {new Date().getFullYear()} OraOra. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* MODAL DE PARTICIPAÇÃO NOS TESTES */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#131B13] border border-white/10 text-white rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-2xl bg-[#2BF20D]/10 border border-[#2BF20D]/20 text-[#2BF20D] flex items-center justify-center font-bold mb-2">
              <Sparkles className="size-5" />
            </div>
            <DialogTitle className="text-xl font-bold font-display text-white">
              Acesso de Testes | OraOra
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-light">
              Preencha seus dados para receber seu acesso antecipado gratuito e começar a estruturar sua operação.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-slate-300">Seu Nome Completo</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Carlos Eduardo"
                className="bg-[#0E140E] border-white/10 text-white rounded-xl text-xs h-10 focus:border-[#2BF20D]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-slate-300">WhatsApp</Label>
              <Input
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(83) 99999-9999"
                className="bg-[#0E140E] border-white/10 text-white rounded-xl text-xs h-10 focus:border-[#2BF20D]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-slate-300">E-mail Profissional</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="carlos@exemplo.com"
                className="bg-[#0E140E] border-white/10 text-white rounded-xl text-xs h-10 focus:border-[#2BF20D]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-slate-300">Cidade / Estado</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: João Pessoa - PB"
                className="bg-[#0E140E] border-white/10 text-white rounded-xl text-xs h-10 focus:border-[#2BF20D]"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-[#2BF20D] hover:bg-[#25D40B] text-[#0E140E] font-bold text-xs tracking-wider uppercase transition-all shadow-lg"
              >
                {isSubmitting ? 'Enviando...' : 'Liberar Meu Acesso de Testes'}
              </Button>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-mono pt-1">
              🔒 Seus dados não serão compartilhados com terceiros.
            </p>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
