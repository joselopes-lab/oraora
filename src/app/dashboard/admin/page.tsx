'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, FileText, Globe, Users, Building2, Video, HelpCircle, ArrowRight } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export default function AdminDashboardPage() {
    const {
        brokers,
        isBrokersLoading,
        brokersError,
        realEstates,
        isRealEstatesLoading,
        realEstatesError,
        constructors,
        isConstructorsLoading,
        constructorsError,
        todayBrokers,
        isTodayBrokersLoading,
        todayBrokersError,
        todayRealEstates,
        isTodayRealEstatesLoading,
        todayRealEstatesError,
        todayConstructors,
        isTodayConstructorsLoading,
        todayConstructorsError,
        todayTickets,
        isTodayTicketsLoading,
        todayTicketsError,
        todayAnsweredTickets,
        isTodayAnsweredTicketsLoading,
        todayAnsweredTicketsError,
    } = useAdminDashboard();

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Administrativo</h1>
                <p className="text-sm text-slate-500 mt-1">Visão geral da plataforma, métricas e alertas operacionais.</p>
            </div>

            {/* LINHA 1: Resumo Executivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Saúde da Plataforma</div>
                    <div className="text-xl font-black text-emerald-600">99.9%</div>
                    <p className="text-[11px] text-slate-400">Serviços operacionais</p>
                </div>
                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Usuários Ativos Hoje</div>
                    <div className="text-xl font-black text-slate-900">1,280</div>
                    <p className="text-[11px] text-slate-400">+12% vs ontem</p>
                </div>
                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pendências Críticas</div>
                    <div className="text-xl font-black text-amber-600">7</div>
                    <p className="text-[11px] text-slate-400">Requer atenção imediata</p>
                </div>
                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Adoção da Plataforma</div>
                    <div className="text-xl font-black text-blue-600">78.4%</div>
                    <p className="text-[11px] text-slate-400">Média geral de uso</p>
                </div>
            </div>

            {/* LINHA 2: KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Corretores Cadastrados</div>
                    {isBrokersLoading ? (
                        <Skeleton className="h-8 w-16 my-1" />
                    ) : brokersError ? (
                        <div className="text-2xl font-black text-slate-400">--</div>
                    ) : (
                        <div className="text-2xl font-black text-slate-900">{brokers?.length || 0}</div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">Profissionais ativos na rede</p>
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Imobiliárias</div>
                    {isRealEstatesLoading ? (
                        <Skeleton className="h-8 w-16 my-1" />
                    ) : realEstatesError ? (
                        <div className="text-2xl font-black text-slate-400">--</div>
                    ) : (
                        <div className="text-2xl font-black text-slate-900">{realEstates?.length || 0}</div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">Imobiliárias parceiras</p>
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Construtoras</div>
                    {isConstructorsLoading ? (
                        <Skeleton className="h-8 w-16 my-1" />
                    ) : constructorsError ? (
                        <div className="text-2xl font-black text-slate-400">--</div>
                    ) : (
                        <div className="text-2xl font-black text-slate-900">{constructors?.length || 0}</div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">Incorporadoras cadastradas</p>
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tickets Abertos</div>
                    <div className="text-2xl font-black text-slate-900">0</div>
                    <p className="text-[11px] text-slate-400 mt-1">Solicitações em andamento</p>
                </div>
            </div>

            {/* LINHA 3: Esquerda (2/3) Central de Ações | Direita (1/3) Plataforma Hoje */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div>
                        <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span>🚨</span>
                            <span>Central de Ações</span>
                        </div>
                        <div className="text-xs text-slate-500">Itens operacionais prioritários que necessitam de intervenção administrativa.</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { 
                                title: "Tickets aguardando resposta", 
                                desc: "Chamados abertos há mais de 24h sem retorno.", 
                                priority: "Alta", 
                                priorityColor: "bg-rose-50 text-rose-700 border-rose-200", 
                                icon: FileText 
                            },
                            { 
                                title: "Domínios aguardando DNS", 
                                desc: "Configurações de apontamento pendentes de validação.", 
                                priority: "Média", 
                                priorityColor: "bg-amber-50 text-amber-700 border-amber-200", 
                                icon: Globe 
                            },
                            { 
                                title: "Usuários sem acesso recente", 
                                desc: "Contas inativas há mais de 30 dias na plataforma.", 
                                priority: "Baixa", 
                                priorityColor: "bg-slate-50 text-slate-700 border-slate-200", 
                                icon: Users 
                            },
                            { 
                                title: "Solicitações pendentes", 
                                desc: "Novos cadastros de imobiliárias aguardando aprovação.", 
                                priority: "Alta", 
                                priorityColor: "bg-rose-50 text-rose-700 border-rose-200", 
                                icon: HelpCircle 
                            },
                            { 
                                title: "Construtoras sem empreendimentos", 
                                desc: "Incorporadoras cadastradas sem catálogo ativo.", 
                                priority: "Média", 
                                priorityColor: "bg-amber-50 text-amber-700 border-amber-200", 
                                icon: Building2 
                            },
                            { 
                                title: "Vídeos de ajuda sem categoria", 
                                desc: "Tutoriais recém-enviados sem tagueamento.", 
                                priority: "Baixa", 
                                priorityColor: "bg-slate-50 text-slate-700 border-slate-200", 
                                icon: Video 
                            },
                        ].map((action, idx) => {
                            const IconComponent = action.icon;
                            return (
                                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-700">
                                                <IconComponent className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.priorityColor}`}>
                                                {action.priority}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{action.title}</div>
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{action.desc}</div>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-slate-400">ID #{1000 + idx}</span>
                                        <button className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                                            <span>Ver</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between">
                    <div>
                        <div className="text-lg font-bold text-slate-900">📈 Plataforma Hoje</div>
                        <div className="text-xs text-slate-500">Métricas consolidadas das atividades recentes.</div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Novos Corretores</span>
                            {isTodayBrokersLoading ? (
                                <Skeleton className="h-6 w-12" />
                            ) : todayBrokersError ? (
                                <span className="text-lg font-black text-slate-400">--</span>
                            ) : (
                                <span className="text-lg font-black text-slate-900">{todayBrokers?.length || 0}</span>
                            )}
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Novas Imobiliárias</span>
                            {isTodayRealEstatesLoading ? (
                                <Skeleton className="h-6 w-12" />
                            ) : todayRealEstatesError ? (
                                <span className="text-lg font-black text-slate-400">--</span>
                            ) : (
                                <span className="text-lg font-black text-slate-900">{todayRealEstates?.length || 0}</span>
                            )}
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Novas Construtoras</span>
                            {isTodayConstructorsLoading ? (
                                <Skeleton className="h-6 w-12" />
                            ) : todayConstructorsError ? (
                                <span className="text-lg font-black text-slate-400">--</span>
                            ) : (
                                <span className="text-lg font-black text-slate-900">{todayConstructors?.length || 0}</span>
                            )}
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Novos Tickets</span>
                            {isTodayTicketsLoading ? (
                                <Skeleton className="h-6 w-12" />
                            ) : todayTicketsError ? (
                                <span className="text-lg font-black text-slate-400">--</span>
                            ) : (
                                <span className="text-lg font-black text-slate-900">{todayTickets?.length || 0}</span>
                            )}
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Tickets Respondidos</span>
                            {isTodayAnsweredTicketsLoading ? (
                                <Skeleton className="h-6 w-12" />
                            ) : todayAnsweredTicketsError ? (
                                <span className="text-lg font-black text-slate-400">--</span>
                            ) : (
                                <span className="text-lg font-black text-slate-900">{todayAnsweredTickets?.length || 0}</span>
                            )}
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Domínios Registrados</span>
                            <span className="text-lg font-black text-slate-900">--</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* LINHA 4: Esquerda Uso da Plataforma | Direita Área reservada Crescimento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div>
                        <div className="text-lg font-bold text-slate-900">📊 Uso da Plataforma</div>
                        <div className="text-xs text-slate-500">Percentual de adoção e utilização das funcionalidades pelos usuários ativos.</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { name: "CRM", value: 85 },
                            { name: "Jornada", value: 72 },
                            { name: "Carteira", value: 64 },
                            { name: "Radar", value: 50 },
                            { name: "Meu Site", value: 45 },
                            { name: "Vídeos de Ajuda", value: 38 },
                            { name: "Financeiro", value: 30 },
                            { name: "Cartório", value: 22 },
                        ].map((item) => (
                            <div key={item.name} className="space-y-1.5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-slate-700">{item.name}</span>
                                    <span className="text-xs font-bold text-slate-500">{item.value}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-blue-600 h-2.5 rounded-full" 
                                        style={{ width: `${item.value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                    <div className="space-y-2">
                        <div className="text-lg font-bold text-slate-900">🚀 Crescimento</div>
                        <div className="text-xs text-slate-500">Área reservada para projeções e expansão da rede.</div>
                    </div>
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                            +
                        </div>
                        <div className="text-sm font-semibold text-slate-700">Módulo em preparação</div>
                        <p className="text-xs text-slate-400 max-w-[220px]">Novas métricas de expansão e projeção de cadastros serão exibidas aqui.</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                        Atualizado em tempo real
                    </div>
                </div>
            </div>
        </div>
    );
}

