
'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function CorretorPage() {
    const firestore = useFirestore();
    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData } = useDoc<{ logoUrlWhite?: string; logoUrl?: string }>(siteContentRef);
    
  return (
    <>
      <style>{`
        :root {
            --primary: #86ea3c;
            --secondary: #b7e43c;
            --background-light: #ffffff;
            --background-gray: #f5f5f5;
            --background-dark: #000000;
        }
        body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
        .gradient-text {
            background: linear-gradient(90deg, #86ea3c 0%, #b7e43c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .btn-gradient {
            background: linear-gradient(90deg, #86ea3c 0%, #b7e43c 100%);
            transition: all 0.3s ease;
        }
        .btn-gradient:hover {
            box-shadow: 0 10px 25px -5px rgba(134, 234, 60, 0.4);
            transform: translateY(-2px);
        }
        .bg-mesh {
            background-image: radial-gradient(at 0% 0%, hsla(88, 80%, 58%, 0.1) 0, transparent 50%),
                              radial-gradient(at 100% 100%, hsla(88, 80%, 58%, 0.1) 0, transparent 50%);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      <div className="bg-white text-slate-900 selection:bg-[#86ea3c] selection:text-black">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
               {siteData?.logoUrlWhite ? (
                <Image src={siteData.logoUrlWhite} alt="Oraora Logo" width={128} height={32} className="h-8 w-auto" />
              ) : (
                <span className="text-2xl font-extrabold tracking-tighter text-white">OraOra</span>
              )}
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <a className="hover:text-[#86ea3c] transition-colors" href="#">Funcionalidades</a>
              <a className="hover:text-[#86ea3c] transition-colors" href="#">Preços</a>
              <a className="hover:text-[#86ea3c] transition-colors" href="#">Recursos</a>
              <a className="hover:text-[#86ea3c] transition-colors" href="#">Contato</a>
            </div>
            <a className="px-6 py-2.5 rounded-full btn-gradient text-black font-bold text-sm" href="#">
              Começar Agora
            </a>
          </div>
        </nav>
        <section className="relative pt-40 pb-32 overflow-hidden bg-black text-white bg-mesh">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full border border-[#86ea3c]/20 bg-[#86ea3c]/5 text-[#86ea3c] text-xs font-bold tracking-widest uppercase">
              Infraestrutura Digital de Alta Performance
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8"
                dangerouslySetInnerHTML={{ __html: 'O corretor no <span class="gradient-text">centro da operação</span> imobiliária' }}>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Sua infraestrutura digital completa para crescimento sustentável, autonomia e vendas diretas. Chega de depender apenas de terceiros.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="w-full sm:w-auto px-10 py-4 rounded-full btn-gradient text-black font-extrabold text-lg">
                Ativar Plano Pro
              </button>
              <button className="w-full sm:w-auto px-10 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors font-bold">
                Ver demonstração
              </button>
            </div>
          </div>
        </section>
        <section className="py-24 bg-[#f5f5f5]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-[#86ea3c] tracking-[0.2em] uppercase mb-4">O cenário atual</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900">Por que o modelo tradicional está quebrado?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[#86ea3c] text-4xl mb-6">link_off</span>
                <h4 className="text-xl font-bold mb-3">Dependência de Portais</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Você gasta milhares de reais para "alugar" a audiência de portais que não são seus.</p>
              </div>
              <div className="p-8 rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[#86ea3c] text-4xl mb-6">payments</span>
                <h4 className="text-xl font-bold mb-3">Verba Queimada em Ads</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Anúncios caros que geram leads desqualificados e sem intenção real de compra.</p>
              </div>
              <div className="p-8 rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[#86ea3c] text-4xl mb-6">layers_clear</span>
                <h4 className="text-xl font-bold mb-3">Ferramentas Fragmentadas</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Um CRM aqui, um site ali, planilhas acolá. Nada se comunica, dados se perdem.</p>
              </div>
              <div className="p-8 rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[#86ea3c] text-4xl mb-6">database_off</span>
                <h4 className="text-xl font-bold mb-3">Falta de Dados</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Você não é dono do comportamento do seu cliente. O portal sabe mais que você.</p>
              </div>
              <div className="p-8 rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[#86ea3c] text-4xl mb-6">trending_down</span>
                <h4 className="text-xl font-bold mb-3">Baixa Conversão</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Leads demoram a ser atendidos e acabam comprando com a concorrência.</p>
              </div>
              <div className="p-8 rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[#86ea3c] text-4xl mb-6">block</span>
                <h4 className="text-xl font-bold mb-3">Escalabilidade Nula</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Seu negócio para de crescer se você não aumentar o investimento nos portais.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-slate-900">Propriedade Digital vs. <span className="text-red-500">Aluguel de Leads</span></h2>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">Nos portais, você paga para aparecer ao lado de todos os seus concorrentes. Na OraOra, você constrói seu próprio ecossistema onde sua marca é a única autoridade.</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-red-500 text-lg">close</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Modelo Portais</h4>
                      <p className="text-sm text-slate-500">Dados do cliente pertencem à plataforma. Leilão de visibilidade constante.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-[#86ea3c]/10 border border-[#86ea3c]/20">
                    <div className="w-8 h-8 rounded-full bg-[#86ea3c]/20 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#86ea3c] text-lg">check</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Modelo OraOra</h4>
                      <p className="text-sm text-slate-700 font-medium">Você é dono da infraestrutura, dos dados e do relacionamento direto.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#86ea3c]/30 rounded-full blur-3xl opacity-20"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
                  <Image alt="Data flow visualization" className="w-full h-full object-cover" width="600" height="400" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAX0U665VLr6MzztDwFCiwFryTsYr8U1Oiqn1z498fBOXWY1V3GKCz8d8WMFd7kF3C2HxGdIAaeu5p7fVaV2pmYLXZGBUwRYup5_FISbg2eyRUJWoMTUVfKG-VeDNCN_eVN_7sm4Q2rKhiEblc-wT6rHn7zRwzPsMEscAfH7aAdhuFKJjl9NGMrb58y0mxlwVApandFRG5yoCwlrAutYkYwt2MJWZn_DUOS2lnoyb0_Ig2QUTyhe0c-yAV3CZb_cAbKU5ufXTNSju4"/>
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <div className="text-[10px] font-bold tracking-widest text-[#86ea3c] mb-1">ECOSYSTEM V2.0</div>
                    <div className="text-xl font-bold">Domínio completo do funil</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 bg-black text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-8">O que é o <span className="gradient-text">OraOra</span>?</h2>
              <p className="text-lg text-slate-400 mb-12 leading-relaxed">
                Não somos apenas um CRM. Somos a <strong>espinha dorsal tecnológica</strong> da sua imobiliária. Uma interface intuitiva para gerenciar todo o seu negócio em um clique.
              </p>
            </div>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#86ea3c] to-[#b7e43c] rounded-[32px] blur opacity-20"></div>
              <div className="relative bg-slate-900 rounded-[30px] border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-10 border-b border-white/5 bg-slate-800/50 flex items-center px-6 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="p-8 grid grid-cols-12 gap-6 min-h-[500px]">
                  <aside className="col-span-3 space-y-6">
                    <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                    <div className="space-y-3">
                      <div className="h-10 bg-[#86ea3c]/10 border-l-4 border-[#86ea3c] rounded-r"></div>
                      <div className="h-10 bg-white/5 rounded"></div>
                      <div className="h-10 bg-white/5 rounded"></div>
                      <div className="h-10 bg-white/5 rounded"></div>
                    </div>
                  </aside>
                  <main className="col-span-9 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                        <div className="h-3 w-1/2 bg-white/10 rounded mb-4"></div>
                        <div className="h-6 w-3/4 bg-[#86ea3c] rounded opacity-80"></div>
                      </div>
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                        <div className="h-3 w-1/2 bg-white/10 rounded mb-4"></div>
                        <div className="h-6 w-2/3 bg-white/20 rounded"></div>
                      </div>
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                        <div className="h-3 w-1/2 bg-white/10 rounded mb-4"></div>
                        <div className="h-6 w-1/3 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="h-64 bg-white/5 rounded-xl border border-white/5 relative p-6">
                      <div className="flex justify-between items-end h-full gap-2">
                        <div className="w-full bg-[#86ea3c]/40 rounded-t h-[40%]"></div>
                        <div className="w-full bg-[#86ea3c]/60 rounded-t h-[65%]"></div>
                        <div className="w-full bg-[#86ea3c]/40 rounded-t h-[50%]"></div>
                        <div className="w-full bg-[#86ea3c] rounded-t h-[90%]"></div>
                        <div className="w-full bg-[#86ea3c]/70 rounded-t h-[75%]"></div>
                        <div className="w-full bg-[#86ea3c]/50 rounded-t h-[60%]"></div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4 text-slate-900">O que você recebe no <span className="text-[#86ea3c]">Plano Pro</span></h2>
              <p className="text-slate-600 text-lg">Tudo o que você precisa para digitalizar sua operação do zero ao topo.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#86ea3c]/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">language</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">Site Imobiliário Próprio</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Layouts otimizados para conversão e SEO local avançado para atrair vizinhos e compradores.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#86ea3c]/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">inventory_2</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">Portfólio Unificado</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Gerencie todos os seus imóveis em um só lugar com sincronização total entre canais.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#86ea3c]/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">web</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">Landing Page Creator</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Crie páginas de captura específicas para cada empreendimento ou nicho em minutos.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#86ea3c]/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">psychology</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">IA de Qualificação</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Sua secretária virtual atende 24h e filtra os melhores leads por perfil de investimento.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#86ea3c]/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">hub</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">CRM Especializado</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Funil de vendas focado na jornada de compra de imóveis, do lead à escritura.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#86ea3c]/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">monitoring</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">Analytics em Tempo Real</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Saiba exatamente de onde vêm suas vendas e qual canal traz mais retorno real.</p>
              </div>
            </div>
            <div className="mt-16 text-center">
              <button className="px-12 py-5 rounded-full btn-gradient text-black font-extrabold text-xl">
                Quero meu ecossistema completo
              </button>
            </div>
          </div>
        </section>
        <section className="py-24 bg-[#f5f5f5] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#86ea3c]/10 text-slate-900 text-[10px] font-bold tracking-widest uppercase mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#86ea3c] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#86ea3c]"></span>
                  </span>
                  Inteligência Artificial Ativa
                </div>
                <h2 className="text-4xl font-black mb-6 leading-tight text-slate-900">Seu assistente <span className="text-[#86ea3c]">24/7</span> focado em fechamento</h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">Nossa IA não apenas conversa, ela qualifica. Ela entende o perfil do cliente, o momento de compra e agenda a visita direto no seu calendário.</p>
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#86ea3c] text-2xl font-bold">bolt</span>
                    <span className="text-base font-semibold text-slate-800">Resposta em menos de 10 segundos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#86ea3c] text-2xl font-bold">psychology</span>
                    <span className="text-base font-semibold text-slate-800">Extração de perfil (Investimento vs. Moradia)</span>
                  </div>
                </div>
                <button className="px-10 py-4 rounded-full btn-gradient text-black font-extrabold text-lg">
                  Ver IA em ação
                </button>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-[300px] h-[600px] bg-black rounded-[45px] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-20"></div>
                  <div className="h-full flex flex-col bg-white">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 mt-4">
                      <div className="w-8 h-8 rounded-full bg-[#86ea3c] flex items-center justify-center">
                        <span className="material-symbols-outlined text-black text-sm">smart_toy</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">Assistente OraOra</div>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50">
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 max-w-[85%] text-[11px] shadow-sm">
                          Olá! Vi que você se interessou pela cobertura no Jardins. Qual seria o melhor momento para conversarmos?
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-[#86ea3c] text-black font-medium rounded-2xl rounded-br-none p-3 max-w-[85%] text-[11px] shadow-sm">
                          Gostaria de visitar amanhã no final da tarde, é possível?
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 max-w-[85%] text-[11px] shadow-sm">
                          Claro! Tenho horário às 17h ou 18h. Qual prefere para agendarmos com o consultor?
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex gap-2 items-center bg-white">
                      <div className="flex-1 h-8 bg-slate-100 rounded-full px-3 flex items-center text-slate-400 text-[10px]">Escreva sua resposta...</div>
                      <div className="w-8 h-8 bg-[#86ea3c] rounded-full flex items-center justify-center text-black">
                        <span className="material-symbols-outlined text-sm">send</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#f0fdf4] border border-[#86ea3c]/20 p-10 rounded-3xl shadow-sm">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                  <span className="material-symbols-outlined text-[#86ea3c] text-3xl">check_circle</span>
                  Para quem é o OraOra
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <span className="text-[#86ea3c] font-black">✓</span>
                    <div>
                      <h4 className="font-bold text-slate-900">Corretores Independentes</h4>
                      <p className="text-sm text-slate-600">Que buscam construir sua própria marca e independência digital.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-[#86ea3c] font-black">✓</span>
                    <div>
                      <h4 className="font-bold text-slate-900">Pequenas e Médias Imobiliárias</h4>
                      <p className="text-sm text-slate-600">Que precisam de tecnologia de ponta sem custos exorbitantes de TI.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-[#86ea3c] font-black">✓</span>
                    <div>
                      <h4 className="font-bold text-slate-900">Focados em Venda Direta</h4>
                      <p className="text-sm text-slate-600">Profissionais que querem dominar o tráfego pago e converter leads próprios.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-10 rounded-3xl shadow-sm">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-400">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">cancel</span>
                  Para quem NÃO é
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <span className="text-slate-400 font-black">✕</span>
                    <div>
                      <h4 className="font-bold text-slate-400">Dependentes de Portais</h4>
                      <p className="text-sm text-slate-400">Empresas que não querem investir em canais próprios e dependem 100% de terceiros.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-slate-400 font-black">✕</span>
                    <div>
                      <h4 className="font-bold text-slate-400">Sem Visão de Futuro</h4>
                      <p className="text-sm text-slate-400">Quem acredita que o mercado imobiliário continuará igual nos próximos 10 anos.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-slate-400 font-black">✕</span>
                    <div>
                      <h4 className="font-bold text-slate-400">Resistentes à Tecnologia</h4>
                      <p className="text-sm text-slate-400">Profissionais que preferem processos puramente manuais e sem dados.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 px-6 bg-[#f5f5f5]">
          <div className="max-w-7xl mx-auto bg-black rounded-[40px] p-12 md:p-24 text-center relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#86ea3c]/20 via-transparent to-[#b7e43c]/20 opacity-40"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">Tome o controle do seu<br/>futuro digital hoje.</h2>
              <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                Junte-se a milhares de corretores que estão construindo seus próprios impérios digitais com a OraOra.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="w-full sm:w-auto px-12 py-5 rounded-full btn-gradient text-black font-extrabold text-xl">
                  Ativar Plano Pro Agora
                </button>
                <button className="w-full sm:w-auto px-12 py-5 rounded-full border border-white/20 text-white font-extrabold text-xl hover:bg-white/10 transition-all">
                  Falar com Consultor
                </button>
              </div>
              <p className="mt-8 text-slate-500 text-sm font-bold uppercase tracking-widest">Teste grátis por 7 dias. Sem compromisso.</p>
            </div>
          </div>
        </section>
        <footer className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
              <div className="max-w-xs">
                {siteData?.logoUrl ? (
                    <Image src={siteData.logoUrl} alt="Oraora Logo" width={128} height={32} className="h-8 w-auto" />
                ) : (
                    <span className="text-3xl font-black tracking-tighter text-black">OraOra</span>
                )}
                <p className="text-slate-500 text-sm mt-6 leading-relaxed">Sua infraestrutura tecnológica definitiva para o mercado imobiliário moderno. Independência, dados e alta performance.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div className="flex flex-col gap-4">
                  <h5 className="font-bold text-slate-900 text-sm">Produto</h5>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">Plano Pro</a>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">Funcionalidades</a>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">API</a>
                </div>
                <div className="flex flex-col gap-4">
                  <h5 className="font-bold text-slate-900 text-sm">Empresa</h5>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">Sobre nós</a>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">Carreiras</a>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">Contato</a>
                </div>
                <div className="flex flex-col gap-4">
                  <h5 className="font-bold text-slate-900 text-sm">Social</h5>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">Instagram</a>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">LinkedIn</a>
                  <a className="text-slate-500 text-sm hover:text-[#86ea3c] transition-colors" href="#">YouTube</a>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-100 gap-4 text-slate-400 text-xs">
              <p>© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
              <div className="flex gap-8">
                <Link className="hover:text-slate-900 transition-colors" href="/termos-de-uso">Termos de Uso</Link>
                <Link className="hover:text-slate-900 transition-colors" href="/politica-de-privacidade">Privacidade</Link>
                <a className="hover:text-slate-900 transition-colors" href="#">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
