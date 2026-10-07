'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/firebase/auth-provider';
import { interactWithAgentServer } from '@/app/dashboard/agente/actions.server';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Send,
  User,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
  previewAction?: {
    type: 'create_client' | 'create_event';
    payload: any;
  } | null;
}

interface AgentChatProps {
  currentPath: string;
}

export default function AgentChat({ currentPath }: AgentChatProps) {
  const { user, isReady, authLoading } = useAuthContext();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Olá! Sou o **Agente OraOra**, seu assistente inteligente integrado. Posso tirar dúvidas sobre a plataforma, consultar seus clientes e agenda, ou cadastrar novos contatos e compromissos para você. Como posso ajudar hoje?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [executingActionKey, setExecutingActionKey] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    try {
      console.log('[AGENT-01] submit iniciado');
      const text = textToSend || inputMessage;
      if (!text.trim() || !user || isThinking) return;

      const userMsg = text.trim();
      setInputMessage('');
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setIsThinking(true);

      const token = await user.getIdToken();
      console.log('[AGENT-02] token obtido');
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await interactWithAgentServer({
        message: userMsg,
        history: historyPayload
      }, token);
      console.log('[AGENT-11] resposta recebida no AgentChat');

      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: res.reply,
            previewAction: res.previewAction
          }
        ]);
      } else {
        toast({
          variant: 'destructive',
          title: 'Aviso do Agente OraOra',
          description: res.reply || 'Não foi possível processar a mensagem.'
        });
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: res.reply || 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.'
          }
        ]);
      }
    } catch (err: any) {
      console.error('[AGENT-CLIENT-ERROR-DEBUG]', {
        error: err,
        type: typeof err,
        constructorName: err?.constructor?.name,
        message: err?.message,
        stack: err?.stack
      });
      toast({
        variant: 'destructive',
        title: 'Erro de comunicação',
        description: 'Falha ao conectar com o servidor.'
      });
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmAction = async (msgIndex: number, actionType: 'create_client' | 'create_event', payload: any) => {
    try {
      if (!user || executingActionKey !== null) return;

      setExecutingActionKey(msgIndex);
      setIsThinking(true);

      const token = await user.getIdToken();
      const historyPayload = messages.slice(0, msgIndex).map(m => ({ role: m.role, content: m.content }));

      const res = await interactWithAgentServer({
        message: `Confirmo a execução da ação ${actionType}`,
        history: historyPayload,
        confirmedAction: {
          type: actionType,
          payload
        }
      }, token);

      if (res.success) {
        setMessages(prev => {
          const updated = [...prev];
          updated[msgIndex] = {
            ...updated[msgIndex],
            previewAction: null
          };
          return [...updated, { role: 'model', content: res.reply }];
        });
        toast({
          title: 'Operação concluída!',
          description: 'Ação executada com sucesso no OraOra.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao executar ação',
          description: 'Não foi possível concluir a operação.'
        });
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: 'Desculpe, ocorreu um erro ao executar a operação. Tente novamente.'
          }
        ]);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AgentChat handleConfirmAction technical error:', err);
      }
      toast({
        variant: 'destructive',
        title: 'Erro na execução',
        description: 'Falha ao confirmar operação.'
      });
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'Desculpe, ocorreu um erro ao executar a operação. Tente novamente.'
        }
      ]);
    } finally {
      setIsThinking(false);
      setExecutingActionKey(null);
    }
  };

  const handleCancelAction = (msgIndex: number) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[msgIndex] = {
        ...updated[msgIndex],
        previewAction: null
      };
      return [...updated, { role: 'model', content: 'Operação cancelada a pedido do corretor.' }];
    });
  };

  if (!isReady || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Suggestions */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 overflow-x-auto no-scrollbar flex gap-2">
        <button onClick={() => void handleSendMessage('Como cadastro um cliente?')} className="text-[10px] font-medium bg-white text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap transition-all hover:border-emerald-200 hover:text-emerald-700">Cadastrar cliente?</button>
        <button onClick={() => void handleSendMessage('Meus clientes')} className="text-[10px] font-medium bg-white text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap transition-all hover:border-emerald-200 hover:text-emerald-700">Meus clientes</button>
        <button onClick={() => void handleSendMessage('Minha agenda de hoje')} className="text-[10px] font-medium bg-white text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap transition-all hover:border-emerald-200 hover:text-emerald-700">Agenda de hoje</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.previewAction && (
                <div className="mt-3 bg-white rounded-xl border border-emerald-100 p-3 shadow-sm space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase">
                    <Sparkles className="size-3" /> Confirmação
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    {Object.entries(msg.previewAction.payload).map(([k, v]: any) => <div key={k}><span className="font-semibold capitalize text-slate-400">{k}:</span> {v}</div>)}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Button size="sm" variant="outline" onClick={() => handleCancelAction(index)} className="h-7 text-[10px] rounded-lg">Cancelar</Button>
                    <Button size="sm" onClick={() => void handleConfirmAction(index, msg.previewAction!.type, msg.previewAction!.payload)} className="h-7 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Confirmar</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isThinking && <div className="text-xs text-slate-400 font-medium animate-pulse">Agente pensando...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); void handleSendMessage(); }} className="p-3 border-t border-slate-100 flex gap-2">
        <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Como posso ajudar?" className="h-10 text-xs rounded-xl" />
        <Button size="sm" type="submit" disabled={isThinking || !inputMessage.trim()} className="h-10 rounded-xl bg-emerald-600"><Send className="size-4" /></Button>
      </form>
    </div>
  );
}
