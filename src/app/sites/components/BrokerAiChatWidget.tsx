'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, Sparkles, User, Trash2, MapPin, Bed, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendedProperties?: any[];
  quickReplies?: { isMultiSelect: boolean, options: { label: string, value: string }[] };
  requestName?: boolean;
  requestPhone?: boolean;
}

interface BrokerAiChatWidgetProps {
  slug: string;
  brokerName?: string;
  brokerPhone?: string;
  oralinkAiEnabled?: boolean;
}

export default function BrokerAiChatWidget({ slug, brokerName, brokerPhone, oralinkAiEnabled }: BrokerAiChatWidgetProps) {
  const pathname = usePathname();
  const isOralinkPage = pathname?.includes('/link');

  // Se estiver na página do Oralink e o Assistente IA não estiver ativado nas configurações, não renderiza o widget
  if (isOralinkPage && !oralinkAiEnabled) {
    return null;
  }

  const STORAGE_KEY = `oraora:broker-ai-chat:${slug}`;
  const UI_STORAGE_KEY = `oraora:broker-ai-chat-ui:${slug}`;

  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! 👋 Antes de começarmos, como posso te chamar?`
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar estado salvo do localStorage após a hidratação
  useEffect(() => {
    try {
      const savedUi = localStorage.getItem(UI_STORAGE_KEY);
      if (savedUi !== null) {
        setIsOpen(JSON.parse(savedUi));
      }
    } catch {
      // ignore
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [UI_STORAGE_KEY, STORAGE_KEY]);

  // Salvar estado de abertura no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(isOpen));
    } catch {
      // ignore
    }
  }, [isOpen, UI_STORAGE_KEY]);

  // Salvar mensagens no localStorage a cada atualização
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, STORAGE_KEY]);

  // Listener para abrir o chat via CTA do Oralink
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-broker-ai-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-broker-ai-chat', handleOpenChat);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Função para limpar conversa (Nova Conversa)
  const handleClearHistory = () => {
    const initialMessage: Message[] = [
      {
        role: 'assistant',
        content: `Olá! 👋\nPosso ajudar você a encontrar um imóvel de acordo com o que procura.\n\nO que você está procurando?`
      }
    ];
    setMessages(initialMessage);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Função para abrir o WhatsApp com mensagem contextual
  const handleWhatsAppContact = (customText?: string) => {
    if (!brokerPhone) return;
    const defaultText = customText || `Olá! Estive conversando com o assistente no seu site e gostaria de saber mais sobre os imóveis e opções disponíveis.`;
    const encoded = encodeURIComponent(defaultText);
    window.open(`https://wa.me/${brokerPhone}?text=${encoded}`, '_blank');
  };

  const handleSend = async (messageContent: string) => {
    if (!messageContent.trim() || loading) return;

    const userMessage = messageContent.trim();
    if (messageContent === input) setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`/api/sites/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          recommendedProperties: data.recommendedProperties,
          quickReplies: data.quickReplies,
          requestName: data.requestName,
          requestPhone: data.requestPhone
        }]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.reply || 'Desculpe, ocorreu um erro. Como posso ajudar com os imóveis?' }
        ]);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem para assistente:", err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, verifique sua conexão. Como posso ajudar?' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [selectedQuickReplies, setSelectedQuickReplies] = useState<string[]>([]);
  
  // ... (rest of the handleQuickReply function would change, but let's do this in a multi_edit_file)
  const handleQuickReply = (value: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
        setSelectedQuickReplies(prev => 
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    } else {
        handleSend(value);
    }
  };
  
  const handleMultiSend = () => {
    handleSend(selectedQuickReplies.join(', '));
    setSelectedQuickReplies([]);
  };

  const lastMessage = messages[messages.length - 1];
  const isRequestingInfo = lastMessage?.role === 'assistant' && (lastMessage.requestName || lastMessage.requestPhone);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-primary text-slate-900 px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20"
          aria-label="Abrir assistente virtual"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Bot className="size-6 text-slate-900 animate-bounce" />
          <span className="font-bold text-sm tracking-wide hidden sm:inline text-slate-900">Assistente Virtual</span>
        </button>
      ) : (
        <div className="w-[92vw] sm:w-[400px] h-[580px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <Bot className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Assistente IA <Sparkles className="size-3.5 text-amber-400 fill-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-400 leading-none mt-1">
                  Atendimento Exclusivo • {brokerName || 'Corretor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Nova conversa"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                aria-label="Nova conversa"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Fechar chat"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-slate-900 rounded-br-none shadow-sm font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-3">
                      <div className="markdown-body prose dark:prose-invert text-xs sm:text-sm max-w-none [&_button]:text-slate-900 [&_a]:text-slate-900">
                        <ReactMarkdown
                          components={{
                            button: ({node, ...props}) => <button className="text-slate-900 font-medium px-2 py-1 bg-slate-100 rounded border border-slate-200" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.recommendedProperties && msg.recommendedProperties.length > 0 && (
                        <div className="space-y-3.5 pt-2">
                          {msg.recommendedProperties.map((prop: any) => (
                            <div key={prop.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row">
                              {prop.imagem ? (
                                <div className="relative w-full sm:w-[38%] h-40 sm:h-auto shrink-0 bg-slate-100 dark:bg-slate-800">
                                  <img src={prop.imagem} alt={prop.nome} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-full sm:w-[38%] h-32 sm:h-auto bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">Sem foto</div>
                              )}
                              <div className="p-3.5 flex-1 flex flex-col justify-between">
                                <div>
                                  {prop.status && (
                                    <div className="mb-1.5 inline-block">
                                      <span className="text-[10px] bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
                                        {prop.status}
                                      </span>
                                    </div>
                                  )}
                                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-2 leading-snug">{prop.nome}</h4>
                                  {prop.bairro && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                      <MapPin className="size-3.5 shrink-0 text-slate-400" />
                                      <span>{prop.bairro}{prop.cidade ? `, ${prop.cidade}` : ''}</span>
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    {prop.valor && (
                                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                        {typeof prop.valor === 'number' ? `R$ ${prop.valor.toLocaleString('pt-BR')}` : prop.valor}
                                      </span>
                                    )}
                                    {prop.quartos && (
                                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                        <Bed className="size-3.5 text-slate-400" /> {prop.quartos} qtos
                                      </span>
                                    )}
                                    {prop.tamanho && (
                                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                        <Maximize2 className="size-3.5 text-slate-400" /> {prop.tamanho}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                  <a
                                    href={prop.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center bg-[#30f10e] hover:bg-[#2adb0d] text-black font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs gap-2"
                                  >
                                    <span>Conheça</span>
                                    <span>→</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {Array.isArray(msg.quickReplies?.options) && msg.quickReplies.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {msg.quickReplies.options.map((reply, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickReply(reply.value, !!msg.quickReplies?.isMultiSelect)}
                              className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                  msg.quickReplies?.isMultiSelect && selectedQuickReplies.includes(reply.value)
                                  ? 'bg-[#30f10e] text-black border-[#30f10e]'
                                  : 'bg-white dark:bg-slate-700 border-emerald-500/50 text-black dark:text-black hover:bg-emerald-50'
                              }`}
                            >
                              {reply.label}
                            </button>
                          ))}
                          {msg.quickReplies?.isMultiSelect && (
                              <button
                                onClick={handleMultiSend}
                                disabled={selectedQuickReplies.length === 0}
                                className="px-3 py-1.5 bg-[#30f10e] text-black text-xs font-bold rounded-lg hover:bg-[#2adb0d] disabled:opacity-50 transition-all shadow-sm"
                              >
                                Enviar
                              </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="size-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <Bot className="size-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary animate-bounce"></span>
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {brokerPhone && (
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => handleWhatsAppContact()}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-sm transition-all"
              >
                <MessageCircle className="size-4" /> Falar com o corretor
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
            <input
              type={isRequestingInfo ? (lastMessage.requestPhone ? "tel" : "text") : "text"}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isRequestingInfo ? (lastMessage.requestPhone ? "Digite seu WhatsApp..." : "Digite seu nome...") : "Digite o que você procura..."}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-primary text-white p-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 flex items-center justify-center shadow-sm"
              aria-label="Enviar mensagem"
            >
              <Send className="size-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
