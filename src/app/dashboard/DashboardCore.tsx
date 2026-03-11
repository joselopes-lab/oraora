
'use client';

import Link from "next/link";
import { UserMenu } from "./user-info";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from "@/firebase/auth-provider";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            <div
                id="chatWindow"
                className={cn(
                    "w-[420px] h-[600px] bg-white rounded-2xl flex flex-col shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto",
                    "transition-all duration-300 ease-out",
                    isChatOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none hidden'
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
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" onClick={toggleChat}>
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
              <footer className="p-4 bg-white">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none focus:ring-2 focus:ring-primary rounded-xl text-sm placeholder:text-gray-400" 
                    placeholder="Pergunte qualquer coisa..." 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button type="submit" className="absolute right-2 p-2 bg-secondary text-primary rounded-lg hover:bg-black transition-colors cursor-pointer">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </button>
                </form>
              </footer>
            </div>

            <button
                className={cn(
                    "w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform group cursor-pointer pointer-events-auto",
                    isChatOpen && 'hidden'
                )}
                onClick={toggleChat}
            >
                <svg className="h-7 w-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
            </button>
        </div>
    );
};

export default function DashboardCore({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: UserProfile;
}) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  const navLinkClasses = (path: string, exact: boolean = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors h-full flex items-center relative gap-2 cursor-pointer whitespace-nowrap",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
      isActive ? "text-text-main font-semibold after:w-full" : "after:w-0 hover:after:w-full"
    );
  }
  
  const dropdownTriggerClasses = (paths: string[]) => {
    const isActive = paths.some(p => pathname.startsWith(p));
    return cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors flex items-center gap-2 h-full relative cursor-pointer whitespace-nowrap outline-none",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
      isActive ? "text-text-main font-semibold after:w-full" : "after:w-0 hover:after:w-full"
    );
  }

  return (
    <>
      <div className="w-full bg-white border-b border-[#f2f5f0] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10 h-full">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={128} height={32} className="h-6 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-6 h-full">
                {userProfile.userType === 'broker' && (
                  <>
                    <Link className={navLinkClasses("/dashboard", true)} href="/dashboard">
                      <span className="material-symbols-outlined text-[20px]">grid_view</span>
                      Dashboard
                    </Link>
                    
                    <div onMouseEnter={() => handleMouseEnter('clientes')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'clientes'} onOpenChange={(open) => setOpenMenu(open ? 'clientes' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/leads", "/dashboard/clientes", "/dashboard/personas"])}>
                          <span className="material-symbols-outlined text-[20px]">group</span>
                          Clientes
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('clientes')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/leads">Leads / Pipeline</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/clientes">Clientes Ativos</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/personas">Personas</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('portfolio')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'portfolio'} onOpenChange={(open) => setOpenMenu(open ? 'portfolio' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/imoveis", "/dashboard/minha-carteira", "/dashboard/avulso"])}>
                          <span className="material-symbols-outlined text-[20px]">apartment</span>
                          Portfólio
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('portfolio')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/imoveis">Imóveis de Construtoras</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/minha-carteira">Minha Carteira</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/avulso">Imóveis Próprios</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div onMouseEnter={() => handleMouseEnter('negocios')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'negocios'} onOpenChange={(open) => setOpenMenu(open ? 'negocios' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/agenda", "/dashboard/propostas", "/dashboard/financeiro"])}>
                          <span className="material-symbols-outlined text-[20px]">business_center</span>
                          Negócios
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('negocios')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/agenda">Agenda</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/propostas">Propostas</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/financeiro">Financeiro</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div onMouseEnter={() => handleMouseEnter('crescimento')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'crescimento'} onOpenChange={(open) => setOpenMenu(open ? 'crescimento' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/meu-site", "/dashboard/marketing", "/dashboard/loja", "/dashboard/oralink"])}>
                          <span className="material-symbols-outlined text-[20px]">trending_up</span>
                          Crescimento
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('crescimento')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/meu-site">Meu Site</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/oralink">Oralink</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/marketing">Marketing</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/loja">Loja</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link className={navLinkClasses("/dashboard/suporte")} href="/dashboard/suporte">
                      <span className="material-symbols-outlined text-[20px]">help</span>
                      Suporte
                    </Link>
                  </>
                )}
                
                {userProfile.userType === 'admin' && (
                  <>
                    <div onMouseEnter={() => handleMouseEnter('inteligencia')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'inteligencia'} onOpenChange={(open) => setOpenMenu(open ? 'inteligencia' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard", "/dashboard/admin/leads", "/dashboard/personas"])}>
                          <span className="material-symbols-outlined text-[20px]">psychology</span>
                          Inteligência
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('inteligencia')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard">Visão Geral</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/leads">Leads</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/personas">Personas</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('rede')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'rede'} onOpenChange={(open) => setOpenMenu(open ? 'rede' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/users", "/dashboard/construtoras"])}>
                          <span className="material-symbols-outlined text-[20px]">lan</span>
                          Rede
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('rede')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/users">Usuários</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/construtoras">Construtoras</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link className={navLinkClasses("/dashboard/imoveis")} href="/dashboard/imoveis">
                      <span className="material-symbols-outlined text-[20px]">inventory</span>
                      Ativos
                    </Link>

                    <div onMouseEnter={() => handleMouseEnter('monetizacao')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'monetizacao'} onOpenChange={(open) => setOpenMenu(open ? 'monetizacao' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/planos", "/dashboard/loja"])}>
                          <span className="material-symbols-outlined text-[20px]">payments</span>
                          Monetização
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('monetizacao')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/planos">Planos</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/loja">Loja</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('atendimento')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'atendimento'} onOpenChange={(open) => setOpenMenu(open ? 'atendimento' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/tickets", "/dashboard/admin/comunicados"])}>
                          <span className="material-symbols-outlined text-[20px]">support_agent</span>
                          Atendimento
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('atendimento')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/tickets">Suporte</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/comunicados">Comunicados</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('plataforma')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'plataforma'} onOpenChange={(open) => setOpenMenu(open ? 'plataforma' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/site", "/dashboard/admin/sitemap"])}>
                          <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                          Plataforma
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('plataforma')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/inicio">Editor do Site</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/sitemap">Sitemap</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            <Link className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/politica-de-privacidade">Privacidade</Link>
            <Link className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/termos-de-uso">Termos de Uso</Link>
            <Link className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/ajuda">Help</Link>
          </div>
        </div>
      </footer>
      {userProfile.userType === 'admin' && <AIChatWidget />}
    </>
  );
}
