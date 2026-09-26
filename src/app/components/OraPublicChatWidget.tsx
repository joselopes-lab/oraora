'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Sparkles, Send, Bot, RefreshCw, Building2, MapPin, Bed, Bath, Car, Maximize2, ExternalLink } from 'lucide-react';

interface PropertyCard {
  id: string;
  title: string;
  type: string;
  purpose: string;
  price: number;
  city: string;
  neighborhood: string;
  state: string;
  bedrooms?: number;
  bedroomOptions?: number[];
  suites?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  usableArea?: number;
  features?: string[];
  images?: string[];
  status?: string;
  publicUrl: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  properties?: PropertyCard[];
  sources?: Array<{ title: string; url: string; domain: string }>;
}

export default function OraPublicChatWidget() {
  const pathname = usePathname();

  // Ocultar em rotas de dashboard, admin, radar, login e sites individuais de corretores (/sites/[slug])
  const shouldHide = 
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/radar') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/sites');

  if (shouldHide) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Oi, eu sou a ORA.\n\nMe conte o que você procura e eu te ajudo a encontrar imóveis reais que façam sentido para você.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previousIntent, setPreviousIntent] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendToOra = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setIsLoading(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    try {
      const conversationPayload = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ora/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          previousIntent,
          conversation: conversationPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na comunicação com a ORA');
      }

      if (data.intent) {
        setPreviousIntent(data.intent);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          properties: data.properties && data.properties.length > 0 ? data.properties : undefined,
          sources: data.sources && data.sources.length > 0 ? data.sources : undefined,
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desculpe, tive um problema ao buscar os imóveis. Por favor, tente novamente em instantes.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendToOra(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendToOra(input);
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Oi, eu sou a ORA.\n\nMe conte o que você procura e eu te ajudo a encontrar imóveis reais que façam sentido para você.`
      }
    ]);
    setPreviousIntent(null);
  };

  const formatCurrency = (val: number) => {
    if (!val) return 'Sob Consulta';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Janela de Chat */}
      {isOpen && (
        <div className="mb-4 w-[90vw] sm:w-[400px] md:w-[460px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  ORA <span className="text-[10px] bg-primary/30 text-primary px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">IA</span>
                </h3>
                <p className="text-xs text-slate-300">Inteligência Imobiliária OraOra</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reiniciar conversa"
                className="size-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                aria-label="Reiniciar conversa"
              >
                <RefreshCw className="size-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                aria-label="Fechar chat da ORA"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col gap-2 max-w-[90%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div className="flex gap-2 items-start">
                  {msg.role === 'assistant' && (
                    <div className="size-8 rounded-full bg-slate-900 text-primary flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Bot className="size-4" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-slate-900 font-medium rounded-tr-none shadow-xs'
                        : 'bg-white text-slate-800 shadow-xs border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    {msg.content}

                    {/* Sources Badge List */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Fontes:</span>
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md transition-colors"
                            title={src.title}
                          >
                            <span>{src.domain}</span>
                            <ExternalLink className="size-3 opacity-60" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Cards Carousel / Grid inside assistant message */}
                {msg.properties && msg.properties.length > 0 && (
                  <div className="w-full pl-9 pr-1 space-y-2.5 my-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                      Imóveis Recomendados ({msg.properties.length})
                    </p>
                    <div className="space-y-3">
                      {msg.properties.slice(0, 4).map((prop) => (
                        <div
                          key={prop.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row group"
                        >
                          {/* Imagem */}
                          <div className="relative w-full sm:w-36 h-32 bg-slate-100 shrink-0">
                            {prop.images && prop.images.length > 0 ? (
                              <img
                                src={prop.images[0]}
                                alt={prop.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-400 bg-slate-100">
                                <Building2 className="size-8 opacity-40" />
                              </div>
                            )}
                            <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                              {prop.type}
                            </span>
                            <span className="absolute bottom-2 left-2 bg-primary text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs">
                              {prop.purpose}
                            </span>
                          </div>

                          {/* Conteúdo */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1 w-full">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                                  {prop.purpose}
                                </span>
                                <span className="text-sm sm:text-base font-extrabold text-primary shrink-0 whitespace-nowrap">
                                  {formatCurrency(prop.price)}
                                </span>
                              </div>

                              <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1 break-words">
                                {prop.title}
                              </h4>

                              <p className="text-xs text-slate-500 flex items-center gap-1 mb-2.5 truncate">
                                <MapPin className="size-3.5 shrink-0 text-slate-400" />
                                <span className="truncate">{prop.neighborhood}{prop.city ? `, ${prop.city}` : ''}</span>
                              </p>
                            </div>

                            {/* Especificações */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                              <div className="flex items-center gap-3 flex-wrap">
                                {(prop.bedrooms !== undefined || (prop.bedroomOptions && prop.bedroomOptions.length > 0)) && (
                                  <span className="flex items-center gap-1" title="Quartos / Tipologias">
                                    <Bed className="size-3.5 text-slate-400" />
                                    <span>
                                      {prop.bedrooms !== undefined
                                        ? `${prop.bedrooms} qto${prop.bedrooms > 1 ? 's' : ''}`
                                        : `${prop.bedroomOptions?.join(', ')} qtos`}
                                    </span>
                                  </span>
                                )}

                                {prop.bathrooms !== undefined && (
                                  <span className="flex items-center gap-1" title="Banheiros">
                                    <Bath className="size-3.5 text-slate-400" />
                                    <span>{prop.bathrooms}</span>
                                  </span>
                                )}

                                {prop.parkingSpaces !== undefined && (
                                  <span className="flex items-center gap-1" title="Vagas">
                                    <Car className="size-3.5 text-slate-400" />
                                    <span>{prop.parkingSpaces}</span>
                                  </span>
                                )}

                                {prop.usableArea !== undefined && (
                                  <span className="flex items-center gap-1" title="Área Útil">
                                    <Maximize2 className="size-3.5 text-slate-400" />
                                    <span>{prop.usableArea}m²</span>
                                  </span>
                                )}
                              </div>

                              <a
                                href={prop.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-primary hover:text-slate-900 text-white font-semibold px-3 py-1.5 rounded-xl transition-all text-xs shrink-0 ml-2"
                              >
                                <span>Ver</span>
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-start mr-auto">
                <div className="size-8 rounded-full bg-slate-900 text-primary flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="size-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white text-slate-500 shadow-xs border border-slate-200/80 rounded-tl-none text-sm flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="size-2 rounded-full bg-primary animate-pulse delay-150"></span>
                  <span className="size-2 rounded-full bg-primary animate-pulse delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {[
              'Apartamento em Tambaú',
              'Até 700 mil',
              'Com 3 quartos',
              'Me fale sobre o bairro'
            ].map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(sug)}
                className="text-xs bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-600 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border border-slate-200/60 font-medium"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o que procura ou pergunte sobre a região..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="size-11 rounded-2xl bg-slate-900 hover:bg-primary hover:text-slate-900 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-slate-955 disabled:hover:text-white shrink-0 shadow-sm"
              aria-label="Enviar mensagem"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="size-14 rounded-full bg-slate-900 hover:bg-primary text-primary hover:text-slate-900 shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 border-2 border-primary/40 group relative"
        aria-label="Abrir assistente ORA"
      >
        <Sparkles className="size-6 transition-transform group-hover:rotate-12" />
        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary animate-ping"></span>
        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[10px] font-bold text-slate-900 flex items-center justify-center shadow-xs">AI</span>
      </button>
    </div>
  );
}
