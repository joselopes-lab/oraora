
'use client';

import Link from "next/link";
import { UserMenu } from "./user-info";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { UserProfile } from "@/firebase/auth-provider";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const AIChatWidget = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: 'Olá, Alex! Bom dia. Como posso ajudar no seu desempenho hoje? Notei que você tem 3 visitas importantes agendadas.',
            time: '09:12'
        },
    ]);
    const [inputValue, setInputValue] = useState('');

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const currentTime = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        setMessages(prev => [...prev, { sender: 'user', text: inputValue, time: currentTime }]);
        setInputValue('');

        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Entendido. Processando sua solicitação...', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Window */}
            <div
                id="chatWindow"
                className={cn(
                    "w-[420px] h-[600px] bg-white rounded-2xl flex flex-col shadow-2xl border border-gray-100 overflow-hidden",
                    "transition-all duration-300 ease-out",
                    isChatOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                )}
            >
              <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Assistente NextEstate AI</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Online agora</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={toggleChat}>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeWidth="2"></path>
                  </svg>
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.map((message, index) => (
                    message.sender === 'bot' ? (
                        <div key={index} className="flex flex-col items-start max-w-[85%]">
                          <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <p className="text-sm text-gray-800 leading-relaxed">{message.text}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 ml-1">{message.time}</span>
                        </div>
                    ) : (
                        <div key={index} className="flex flex-col items-end ml-auto max-w-[85%]">
                          <div className="bg-primary p-3 rounded-2xl rounded-tr-none shadow-sm">
                            <p className="text-sm text-secondary font-medium leading-relaxed">{message.text}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 mr-1">{message.time}</span>
                        </div>
                    )
                ))}
              </div>
              <div className="px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-600 rounded-full hover:border-primary hover:text-secondary transition-all">
                  Ver próximos compromissos
                </button>
                <button className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-600 rounded-full hover:border-primary hover:text-secondary transition-all">
                  Dicas de leads
                </button>
                <button className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-600 rounded-full hover:border-primary hover:text-secondary transition-all">
                  Status de vendas
                </button>
              </div>
              <footer className="p-4 bg-white">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none focus:ring-2 focus:ring-primary rounded-xl text-sm placeholder:text-gray-400" 
                    placeholder="Pergunte qualquer coisa..." 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button type="submit" className="absolute right-2 p-2 bg-secondary text-primary rounded-lg hover:bg-black transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeWidth="2"></path>
                    </svg>
                  </button>
                </form>
                <p className="text-center text-[9px] text-gray-400 mt-3 uppercase tracking-tighter">Powered by NextEstate AI Engine</p>
              </footer>
            </div>

            <button
                className={cn(
                    "w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform group",
                    isChatOpen && 'hidden'
                )}
                onClick={toggleChat}
            >
                <svg className="h-7 w-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeWidth="2"></path>
                </svg>
            </button>
        </div>
    );
};

// Este componente agora espera receber o userProfile e não faz mais buscas.
export default function DashboardCore({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: UserProfile; // Não é mais nulo, garantido pelo AuthGuard
}) {
  const pathname = usePathname();
  const firestore = useFirestore();

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);


  const navLinkClasses = (path: string, exact: boolean = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors h-full flex items-center relative gap-2",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
      isActive ? "text-text-main font-semibold after:w-full" : "after:w-0 hover:after:w-full"
    );
  }
  
  const dropdownTriggerClasses = (paths: string[]) => {
    const isActive = paths.some(p => pathname.startsWith(p));
    return cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors flex items-center gap-2 h-full relative group-hover:after:w-full",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
      isActive ? "text-text-main font-semibold after:w-full" : "after:w-0"
    );
  }

  const dropdownItemClasses = (path: string) => {
    const isActive = pathname === path;
    return cn(
      "block px-4 py-2 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary transition-colors",
      isActive && "font-bold text-text-main bg-primary/10 border-l-4 border-primary"
    )
  }
  
  const dropdownItemClassesSub = (path: string) => {
    const isActive = pathname.startsWith(path);
    return cn(
      "block px-4 py-2 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary transition-colors",
      isActive && "font-bold text-text-main bg-primary/10 border-l-4 border-primary"
    )
  }

  return (
    <>
      <div className="w-full bg-white border-b border-[#f2f5f0] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10 h-full">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={128} height={32} className="h-6 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-8 h-full">
                {userProfile.userType === 'broker' && (
                  <>
                    <Link
                        className={navLinkClasses("/dashboard", true)}
                        href="/dashboard"
                    >
                        <span className="material-symbols-outlined text-sm">grid_view</span>
                        Dashboard
                    </Link>
                    <div className="relative group h-full flex items-center">
                      <button className={dropdownTriggerClasses(["/dashboard/leads", "/dashboard/clientes", "/dashboard/construtoras", "/dashboard/personas"])}>
                        <span className="material-symbols-outlined text-sm">group</span>
                        Clientes
                      </button>
                      <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                        <Link className={dropdownItemClassesSub("/dashboard/leads")} href="/dashboard/leads">Leads / Pipeline</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/clientes")} href="/dashboard/clientes">Clientes Ativos</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/construtoras")} href="/dashboard/construtoras">Construtoras</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/personas")} href="/dashboard/personas">Personas</Link>
                      </div>
                    </div>

                    <div className="relative group h-full flex items-center">
                      <button className={dropdownTriggerClasses(["/dashboard/imoveis", "/dashboard/minha-carteira", "/dashboard/avulso"])}>
                         <span className="material-symbols-outlined text-sm">folder</span>
                        Portfólio
                      </button>
                      <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                        <Link className={dropdownItemClassesSub("/dashboard/imoveis")} href="/dashboard/imoveis">Imóveis de Construtoras</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/minha-carteira")} href="/dashboard/minha-carteira">Minha Carteira</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/avulso")} href="/dashboard/avulso">Imóveis Próprios</Link>
                      </div>
                    </div>
                    
                    <div className="relative group h-full flex items-center">
                        <button className={dropdownTriggerClasses(["/dashboard/agenda", "/dashboard/propostas", "/dashboard/financeiro"])}>
                            <span className="material-symbols-outlined text-sm">business_center</span>
                            Negócios
                        </button>
                        <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                            <Link className={dropdownItemClassesSub("/dashboard/agenda")} href="/dashboard/agenda">Agenda</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/propostas")} href="/dashboard/propostas">Propostas</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/financeiro")} href="/dashboard/financeiro">Financeiro</Link>
                        </div>
                    </div>
                    
                    <div className="relative group h-full flex items-center">
                        <button className={dropdownTriggerClasses(["/dashboard/meu-site", "/dashboard/marketing", "/dashboard/loja", "/dashboard/sob-medida"])}>
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            Crescimento
                        </button>
                        <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                            <Link className={dropdownItemClassesSub("/dashboard/meu-site")} href="/dashboard/meu-site">Meu Site</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/marketing")} href="/dashboard/marketing">Marketing</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/loja")} href="/dashboard/loja">Loja</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/sob-medida")} href="/dashboard/sob-medida">Sob Medida</Link>
                        </div>
                    </div>

                    <div className="relative group h-full flex items-center">
                        <button className={dropdownTriggerClasses(["/dashboard/benchmark", "/dashboard/score", "/dashboard/insights"])}>
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            Inteligência
                        </button>
                        <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                            <Link className={dropdownItemClassesSub("/dashboard/benchmark")} href="/dashboard/benchmark">Benchmark</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/score")} href="/dashboard/score">Score</Link>
                            <Link className={dropdownItemClassesSub("/dashboard/insights")} href="/dashboard/insights">Insights</Link>
                        </div>
                    </div>
                    <Link className={navLinkClasses("/dashboard/suporte")} href="/dashboard/suporte">
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Suporte
                    </Link>
                  </>
                )}
                
                {userProfile.userType === 'admin' && (
                  <>
                    {/* Inteligência */}
                    <div className="relative group h-full flex items-center">
                      <button className={dropdownTriggerClasses(["/dashboard", "/dashboard/admin/leads", "/dashboard/personas"])}>
                        <span className="material-symbols-outlined text-sm">psychology</span>
                        Inteligência
                      </button>
                      <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                        <Link className={dropdownItemClasses("/dashboard", true)} href="/dashboard">Visão Geral</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/admin/leads")} href="/dashboard/admin/leads">Leads</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/personas")} href="/dashboard/personas">Personas</Link>
                      </div>
                    </div>

                    {/* Rede */}
                    <div className="relative group h-full flex items-center">
                      <button className={dropdownTriggerClasses(["/dashboard/admin/users", "/dashboard/construtoras"])}>
                        <span className="material-symbols-outlined text-sm">hub</span>
                        Rede
                      </button>
                      <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                        <Link className={dropdownItemClassesSub("/dashboard/admin/users")} href="/dashboard/admin/users">Usuários</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/construtoras")} href="/dashboard/construtoras">Construtoras</Link>
                      </div>
                    </div>

                    {/* Ativos */}
                     <Link className={navLinkClasses("/dashboard/imoveis")} href="/dashboard/imoveis">
                        <span className="material-symbols-outlined text-sm">apartment</span>
                        Ativos
                      </Link>

                    {/* Monetização */}
                    <div className="relative group h-full flex items-center">
                      <button className={dropdownTriggerClasses(["/dashboard/admin/planos", "/dashboard/loja"])}>
                        <span className="material-symbols-outlined text-sm">monetization_on</span>
                        Monetização
                      </button>
                      <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                        <Link className={dropdownItemClassesSub("/dashboard/admin/planos")} href="/dashboard/admin/planos">Planos</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/loja")} href="/dashboard/loja">Loja</Link>
                      </div>
                    </div>

                    {/* Suporte */}
                    <Link className={navLinkClasses("/dashboard/admin/tickets")} href="/dashboard/admin/tickets">
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Suporte
                    </Link>

                    {/* Plataforma */}
                    <div className="relative group h-full flex items-center">
                      <button className={dropdownTriggerClasses(["/dashboard/admin/site", "/dashboard/admin/sitemap"])}>
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Plataforma
                      </button>
                      <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-b-lg py-2 z-[60] hidden group-hover:block animate-in fade-in duration-150">
                        <Link className={dropdownItemClassesSub("/dashboard/admin/site/inicio")} href="/dashboard/admin/site/inicio">Editor do Site</Link>
                        <Link className={dropdownItemClassesSub("/dashboard/admin/sitemap")} href="/dashboard/admin/sitemap">Sitemap</Link>
                      </div>
                    </div>
                  </>
                )}
                
                {userProfile.userType === 'constructor' && (
                  <>
                    <Link className={navLinkClasses("/dashboard/imoveis")} href="/dashboard/imoveis">Imóveis</Link>
                    <Link className={navLinkClasses("/dashboard/loja")} href="/dashboard/loja">Loja</Link>
                  </>
                )}
            </nav>
          </div>
          <UserMenu />
        </div>
      </div>
       <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {children}
      </main>
      <footer className="mt-auto border-t border-[#f2f5f0] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-text-secondary text-xs font-normal">© 2024 Oraora Tecnologia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="#">Privacidade</a>
            <a className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="#">Termos de Uso</a>
            <a className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/ajuda">Ajuda</a>
          </div>
        </div>
      </footer>
      {userProfile.userType === 'admin' && <AIChatWidget />}
    </>
  );
}
