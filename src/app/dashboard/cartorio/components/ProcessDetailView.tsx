'use client';

import React from 'react';
import { CartorioProcess, ProcessDocument } from '@/services/cartorioService';
import DocumentsPanel from './DocumentsPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Clock, 
  Activity, 
  Sparkles, 
  RefreshCw, 
  User, 
  Bot, 
  Send 
} from 'lucide-react';

interface ProcessDetailViewProps {
  selectedProcess: CartorioProcess;
  onBack: () => void;
  getStatusBadge: (status: CartorioProcess['status']) => React.ReactNode;
  uploadingDocId: string | null;
  onFileUpload: (docId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDocument: (doc: ProcessDocument) => void;
  onDeleteDocument: (docId: string) => void;
  analyzingProcess: boolean;
  aiAnalysis: string | null;
  onAnalyzeProcess: () => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  sendingMsg: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onSubmitToCartorio?: () => void;
}

export default function ProcessDetailView({
  selectedProcess,
  onBack,
  getStatusBadge,
  uploadingDocId,
  onFileUpload,
  onViewDocument,
  onDeleteDocument,
  analyzingProcess,
  aiAnalysis,
  onAnalyzeProcess,
  chatInput,
  setChatInput,
  sendingMsg,
  onSendMessage,
  chatBottomRef,
  onSubmitToCartorio,
}: ProcessDetailViewProps) {
  return (
    <div className="space-y-8">
      <button 
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-transparent border-none cursor-pointer p-1"
      >
        <ArrowLeft className="size-4" /> Voltar para a lista de processos
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Coluna Central: Dados Gerais, Documentos e Linha do Tempo */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card de Informação do Processo */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Processo ID: {selectedProcess.id}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {selectedProcess.serviceName}
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Aberto em {new Date(selectedProcess.createdAt).toLocaleDateString('pt-BR')} • Atualizado em tempo real
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(selectedProcess.status)}
                <span className="text-xs text-slate-400 italic font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Atualizado há poucos segundos
                </span>
              </div>
            </div>

            {/* Linha do Tempo */}
            <div className="mt-8">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Estágios de Qualificação do Cartório
              </h3>
              <div className="grid md:grid-cols-3 gap-6 relative">
                {selectedProcess.timeline.map((milestone, idx) => (
                  <div key={milestone.id} className="relative flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                        milestone.status === 'done' ? "bg-emerald-100 text-emerald-800" :
                        milestone.status === 'current' ? "bg-amber-100 text-amber-800 animate-pulse" :
                        "bg-slate-100 text-slate-400"
                      )}>
                        {milestone.status === 'done' ? '✓' : idx + 1}
                      </span>
                      {milestone.date && <span className="text-[10px] font-bold text-slate-400">{milestone.date}</span>}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{milestone.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">{milestone.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checklist de Documentos solicitados */}
          <DocumentsPanel 
            documents={selectedProcess.documents}
            uploadingDocId={uploadingDocId}
            onFileUpload={onFileUpload}
            onViewDocument={onViewDocument}
            onDeleteDocument={onDeleteDocument}
            onSubmitToCartorio={onSubmitToCartorio}
          />
        </div>

        {/* Coluna Lateral: Chat em Tempo Real com Escreventes e Análise de IA */}
        <div className="space-y-8">
          
          {/* Card Analista de IA */}
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-white/5 p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/15 rounded-full blur-[60px] -z-0 pointer-events-none translate-x-12 -translate-y-12"></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                  <Sparkles className="size-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base tracking-tight">Parecer do Consultor de IA</h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Gemini Flash Integration</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed text-left">
                Dúvidas com exigências, prazos ou termos jurídicos do Cartório? Solicite um diagnóstico do nosso analista de conformidade jurídica alimentado por IA.
              </p>

              <Button 
                onClick={onAnalyzeProcess}
                disabled={analyzingProcess}
                className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold h-11 rounded-xl transition-all border-none shadow-[0_4px_20px_rgba(0,233,0,0.15)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {analyzingProcess ? (
                  <>
                    <RefreshCw className="size-4 mr-1 animate-spin" />
                    Qualificando Processo...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-1" />
                    Analisar com IA
                  </>
                )}
              </Button>

              {/* Resultado do Parecer da IA */}
              {aiAnalysis && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 md:p-5 mt-4 text-left max-h-[380px] overflow-y-auto space-y-3 font-sans scrollbar-thin">
                  <h4 className="text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-widest border-b border-white/5 pb-2">
                    <Sparkles className="size-3.5" /> Diagnóstico Legal & Recomendações
                  </h4>
                  <div className="text-xs text-slate-200 space-y-3 leading-relaxed">
                    {aiAnalysis.split('\n').map((line, idx) => {
                      if (line.trim().startsWith('###')) {
                        return <h5 key={idx} className="font-bold text-white text-sm mt-4 mb-2">{line.replace('###', '').trim()}</h5>;
                      }
                      if (line.trim().startsWith('**')) {
                        return <p key={idx} className="font-bold text-slate-200 mt-2">{line.replace(/\*\*/g, '').trim()}</p>;
                      }
                      if (line.trim().startsWith('-')) {
                        return <li key={idx} className="ml-3 list-disc text-slate-300 pl-1">{line.replace('-', '').trim()}</li>;
                      }
                      return <p key={idx} className="text-slate-300">{line}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canal de Atendimento do Cartório (Chat) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[520px] overflow-hidden">
            <header className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 font-bold text-slate-600">
                    CT
                  </div>
                  <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Serventia Extrajudicial</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Escrevente Conectado</p>
                </div>
              </div>
            </header>

            {/* Mensagens do Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
              {selectedProcess.messages.map((message) => {
                const isSystem = message.sender === 'system';
                const isBroker = message.sender === 'broker';

                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center my-2">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-center max-w-[90%] leading-relaxed">
                        {message.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div 
                    key={message.id} 
                    className={cn(
                      "flex flex-col max-w-[85%] text-left",
                      isBroker ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl shadow-sm text-sm leading-relaxed",
                      isBroker 
                        ? "bg-[#00e900]/10 text-slate-900 rounded-tr-none border border-[#00e900]/20" 
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    )}>
                      {message.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 ml-1 flex items-center gap-1">
                      {isBroker ? <User className="size-2.5" /> : <Bot className="size-2.5 text-primary" />}
                      {isBroker ? 'Você' : 'Oficial de Registro'} • {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input do Chat */}
            <footer className="p-4 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={onSendMessage} className="relative flex items-center gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tire dúvidas sobre exigências..." 
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary rounded-xl text-sm placeholder:text-slate-400 text-slate-800 outline-none" 
                />
                <button 
                  type="submit" 
                  disabled={sendingMsg || !chatInput.trim()}
                  className="absolute right-2 p-2 bg-[#00e900] text-black rounded-lg hover:brightness-105 transition-all cursor-pointer border-none disabled:opacity-40"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </footer>
          </div>

        </div>
      </div>
    </div>
  );
}
