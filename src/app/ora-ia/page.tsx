'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuthContext, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function OraIAPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

  const [activeTab, setActiveTab] = useState('explorar');

  if (!isReady) return null;

  return (
    <div className="bg-[#f7f8f5] text-[#141811] flex h-screen overflow-hidden font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bg-glow-corner {
            background: radial-gradient(circle at bottom right, rgba(0, 233, 0, 0.1), transparent 70%);
        }
      `}</style>

      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-black flex flex-col p-4 space-y-6 z-50">
        <div className="flex items-center px-2 mb-4">
          <Image 
            src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fb51a21ec-d89e-4b7e-be51-d741841e8903-logo-oraora-b.png?alt=media&token=a0d87477-f1e3-4637-8b84-0589b49566ff" 
            alt="Oraora Logo" 
            width={140} 
            height={35} 
            className="h-8 w-auto brightness-0 invert"
          />
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#00e900] text-black rounded-lg font-bold transition-all hover:brightness-110 shadow-[0_0_15px_rgba(0,233,0,0.3)] mb-6 cursor-pointer border-none">
            <span className="material-symbols-outlined">add_comment</span>
            <span className="text-sm font-semibold">Novo Chat</span>
          </button>
          
          <div className="space-y-1">
            <div className="px-4 py-2 flex items-center gap-3 text-gray-400 hover:text-[#00e900] transition-colors cursor-pointer group">
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm font-medium">Histórico</span>
            </div>
            <div className="px-4 py-2 flex items-center gap-3 text-gray-400 hover:text-[#00e900] transition-colors cursor-pointer group">
              <span className="material-symbols-outlined">model_training</span>
              <span className="text-sm font-medium">Modelos</span>
            </div>
            <div className="px-4 py-2 flex items-center gap-3 text-gray-400 hover:text-[#00e900] transition-colors cursor-pointer group">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Configurações</span>
            </div>
          </div>

          <div className="mt-8">
            <span className="px-4 text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-2">Recentes</span>
            <div className="space-y-1">
              <button className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-[#00e900]/10 hover:text-white rounded-lg transition-all truncate bg-transparent border-none">Contrato de Aluguel Jardins...</button>
              <button className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-[#00e900]/10 hover:text-white rounded-lg transition-all truncate bg-transparent border-none">Tendências Imobiliárias 2024</button>
              <button className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-[#00e900]/10 hover:text-white rounded-lg transition-all truncate bg-transparent border-none">Descrição Sobrado Itaim</button>
            </div>
          </div>
        </nav>

        <div className="pt-4 border-t border-gray-800 space-y-2">
          <button className="w-full py-2 px-4 rounded-lg bg-[#00e900]/10 text-[#00e900] text-xs font-bold border border-[#00e900]/30 hover:bg-[#00e900]/20 transition-all cursor-pointer">Upgrade to Pro</button>
          <div className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-[#00e900] transition-colors cursor-pointer">
            <span className="material-symbols-outlined">help</span>
            <span className="text-xs font-medium">Ajuda</span>
          </div>
          <button onClick={() => window.close()} className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-xs font-medium">Voltar ao Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 ml-64 flex flex-col relative bg-[#f7f8f5] overflow-hidden">
        {/* TopNavBar */}
        <header className="sticky top-0 w-full z-40 bg-[#f7f8f5]/80 backdrop-blur-md flex justify-between items-center h-16 px-8">
          <div className="flex items-center gap-4">
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('explorar')}
                className={cn("font-bold text-sm cursor-pointer transition-all border-none bg-transparent", activeTab === 'explorar' ? "text-[#00e900] border-b-2 border-[#00e900] pb-1" : "text-gray-500 hover:text-black")}
              >
                Explorar
              </button>
              <button 
                onClick={() => setActiveTab('comunidade')}
                className={cn("font-bold text-sm cursor-pointer transition-all border-none bg-transparent", activeTab === 'comunidade' ? "text-[#00e900] border-b-2 border-[#00e900] pb-1" : "text-gray-500 hover:text-black")}
              >
                Comunidade
              </button>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-[#00e900] transition-colors">notifications</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700 hidden sm:block">
                  {userProfile?.username || user?.displayName}
                </span>
                <Avatar className="w-8 h-8 border border-white shadow-sm">
                  <AvatarImage src={user?.photoURL || ''} alt={userProfile?.username || "User"} />
                  <AvatarFallback className="text-xs font-bold bg-slate-200 text-slate-500">
                    {(userProfile?.username || user?.displayName || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-glow-corner">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Welcome Section */}
            <div className="space-y-4 pt-10">
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-black">Olá, como posso ajudar hoje?</h2>
              <p className="text-gray-500 text-lg max-w-xl font-medium">Sua inteligência artificial especializada em precisão e vitalidade para o mercado imobiliário de alto padrão.</p>
            </div>

            {/* Bento Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-black">O que eu posso fazer?</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-black rounded uppercase tracking-widest">Funcionalidades</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
                
                {/* Card 1: Análise de Propostas */}
                <div className="group p-6 bg-black rounded-xl shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden border border-[#00e900]/20">
                  <div className="absolute -right-4 -top-4 text-[#00e900]/10 group-hover:text-[#00e900]/20 transition-colors">
                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 bg-[#00e900]/20 rounded-lg flex items-center justify-center text-[#00e900]">
                      <span className="material-symbols-outlined">request_quote</span>
                    </div>
                    <h4 className="font-bold text-lg text-[#00e900]">Análise de Propostas</h4>
                    <p className="text-sm text-gray-400">Avalie ofertas, supere objeções e elabore respostas profissionais.</p>
                  </div>
                </div>

                {/* Card 2: Analisar contratos */}
                <div className="group p-6 bg-white rounded-xl shadow-soft hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden border border-slate-100">
                  <div className="absolute -right-4 -top-4 text-[#00e900]/5 group-hover:text-[#00e900]/10 transition-colors">
                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-black">
                      <span className="material-symbols-outlined">contract</span>
                    </div>
                    <h4 className="font-bold text-lg text-black">Analisar contratos</h4>
                    <p className="text-sm text-gray-500">Identifique cláusulas de risco e garanta conformidade jurídica em segundos.</p>
                  </div>
                </div>

                {/* Card 3: Prever tendências */}
                <div className="group p-6 bg-white rounded-xl shadow-soft hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden border border-slate-100">
                  <div className="absolute -right-4 -top-4 text-[#00e900]/5 group-hover:text-[#00e900]/10 transition-colors">
                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-black">
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <h4 className="font-bold text-lg text-black">Prever tendências</h4>
                    <p className="text-sm text-gray-500">Algoritmos preditivos para análise de valorização de ativos imobiliários.</p>
                  </div>
                </div>

                {/* Card 4: Analisar Propriedades */}
                <div className="group p-6 bg-white rounded-xl shadow-soft hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden border border-slate-100">
                  <div className="absolute -right-4 -top-4 text-[#00e900]/5 group-hover:text-[#00e900]/10 transition-colors">
                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-black">
                      <span className="material-symbols-outlined">home_work</span>
                    </div>
                    <h4 className="font-bold text-lg text-black">Analisar Propriedades</h4>
                    <p className="text-sm text-gray-500">Análise profunda de características e potencial de valorização de imóveis.</p>
                  </div>
                </div>

                {/* Card 5: Dados de Bairros */}
                <div className="group p-6 bg-white rounded-xl shadow-soft hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden border border-slate-100">
                  <div className="absolute -right-4 -top-4 text-[#00e900]/5 group-hover:text-[#00e900]/10 transition-colors">
                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-black">
                      <span className="material-symbols-outlined">location_city</span>
                    </div>
                    <h4 className="font-bold text-lg text-black">Dados de Bairros</h4>
                    <p className="text-sm text-gray-500">Inteligência de mercado, infraestrutura e valorização regional.</p>
                  </div>
                </div>

                {/* Card 6: Comparativo de Preços */}
                <div className="group p-6 bg-white rounded-xl shadow-soft hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden border border-slate-100">
                  <div className="absolute -right-4 -top-4 text-[#00e900]/5 group-hover:text-[#00e900]/10 transition-colors">
                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-black">
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <h4 className="font-bold text-lg text-black">Comparativo de Preços</h4>
                    <p className="text-sm text-gray-500">Benchmarking dinâmico comparando listagens similares na região.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#f7f8f5] via-[#f7f8f5] to-transparent z-10">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center group">
              <input className="w-full bg-white border-none shadow-xl rounded-2xl py-5 px-6 pr-32 focus:ring-2 focus:ring-[#00e900]/50 text-black placeholder:text-gray-400 transition-all outline-none font-medium" placeholder="Digite sua pergunta para ORA AI..." type="text"/>
              <div className="absolute right-3 flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-[#00e900] transition-colors cursor-pointer bg-transparent border-none">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button className="bg-black text-[#00e900] rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(0,233,0,0.2)] cursor-pointer border-none">
                  <span>Enviar</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-3 tracking-widest uppercase font-black">Processado via ORA Intelligence Engine v2.4</p>
          </div>
        </div>
      </main>

      {/* Visual Background Element */}
      <div className="fixed top-0 right-0 w-1/2 h-full -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#00e900] rounded-full blur-[150px] opacity-10"></div>
      </div>
    </div>
  );
}