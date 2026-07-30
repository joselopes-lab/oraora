'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Play, 
  ShieldCheck, 
  Zap, 
  FileCheck, 
  Layers, 
  Building2, 
  Search, 
  UploadCloud, 
  Activity, 
  Award 
} from 'lucide-react';

export default function AboutTab() {
  return (
    <div className="space-y-12 mb-12 animate-in fade-in duration-500">
      {/* 1. HERO */}
      <div className="grid lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] pointer-events-none translate-x-20 -translate-y-20"></div>
        
        <div className="lg:col-span-7 space-y-6 relative z-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="size-3.5" /> Parceria Oficial Travassos Soluções
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Serviços Cartorários
          </h2>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            Solicite serviços cartorários diretamente no OraOra através da parceria com a Travassos Soluções.
          </p>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Envie documentos, acompanhe seus processos e tenha mais agilidade durante toda a jornada da negociação imobiliária.
          </p>
        </div>

        {/* Video Institutional Card */}
        <div className="lg:col-span-5 relative z-10">
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl overflow-hidden group">
            <div className="relative aspect-video rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,233,0,0.15)_0,transparent_70%)]"></div>
              
              {/* Play Button */}
              <button 
                type="button"
                onClick={() => {}}
                className="size-16 rounded-full bg-primary text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer border-none z-10"
                title="Assistir vídeo institucional"
              >
                <Play className="size-7 fill-current ml-1" />
              </button>

              <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white/80 uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-sm">
                Vídeo Institucional
              </span>
            </div>
            <div className="mt-4 text-left px-1">
              <h4 className="font-black text-white text-base">Conheça a Travassos Soluções</h4>
              <p className="text-slate-400 text-xs mt-0.5">Assista à apresentação dos nossos serviços extrajudiciais.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BENEFÍCIOS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow">
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Atendimento Especializado</h3>
          <p className="text-slate-500 text-xs leading-relaxed">Equipe especializada em serviços cartorários.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow">
          <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Zap className="size-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Processo Digital</h3>
          <p className="text-slate-500 text-xs leading-relaxed">Solicite serviços e acompanhe tudo pelo OraOra.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow">
          <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <FileCheck className="size-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Transparência</h3>
          <p className="text-slate-500 text-xs leading-relaxed">Consulte documentos necessários, prazos e andamento.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow">
          <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Layers className="size-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Integração</h3>
          <p className="text-slate-500 text-xs leading-relaxed">Tudo centralizado em um único ambiente.</p>
        </div>
      </div>

      {/* 3. QUEM É A TRAVASSOS */}
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm text-left flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
            <Building2 className="size-4" /> Sobre a Parceria
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Quem é a Travassos Soluções?
          </h3>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            A Travassos Soluções é parceira do OraOra na oferta de serviços cartorários para o mercado imobiliário.
          </p>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Sua equipe acompanha todas as etapas dos processos oferecendo suporte especializado, segurança e agilidade para corretores e imobiliárias.
          </p>
        </div>
        <div className="shrink-0">
          <Button 
            onClick={() => {}}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-xl shadow-md cursor-pointer border-none"
          >
            Conhecer a Travassos
          </Button>
        </div>
      </div>

      {/* 4. COMO FUNCIONA */}
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm text-left">
        <div className="text-center md:text-left mb-8">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Passo a Passo</span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Como Funciona a Consultoria Cartorial</h3>
          <p className="text-slate-500 text-xs mt-1">Entenda o fluxo simplificado para protocolar e concluir seus atos extrajudiciais.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 relative">
            <div className="size-10 rounded-xl bg-primary/20 text-slate-900 font-black flex items-center justify-center text-sm mb-1">
              01
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Search className="size-4" /> Escolha o serviço
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Selecione entre escrituras, certidões, regularizações ou registros no catálogo.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 relative">
            <div className="size-10 rounded-xl bg-primary/20 text-slate-900 font-black flex items-center justify-center text-sm mb-1">
              02
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <UploadCloud className="size-4" /> Envie os documentos
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Faça upload dos arquivos exigidos com suporte a múltiplos formatos e alta resolução.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 relative">
            <div className="size-10 rounded-xl bg-primary/20 text-slate-900 font-black flex items-center justify-center text-sm mb-1">
              03
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Activity className="size-4" /> Acompanhe o processo
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Monitore o status em tempo real, tire dúvidas pelo chat e receba diagnósticos de IA.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 relative">
            <div className="size-10 rounded-xl bg-primary/20 text-slate-900 font-black flex items-center justify-center text-sm mb-1">
              04
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Award className="size-4" /> Receba a conclusão
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Atos registrados e documentação oficial entregues com total segurança jurídica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
