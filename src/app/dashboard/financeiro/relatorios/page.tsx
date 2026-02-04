'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DetailedReportPage() {
    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                        <Link className="hover:text-primary transition-colors" href="/dashboard/financeiro">Financeiro</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-text-main">Relatório Detalhado</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Relatório Detalhado</h1>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-text-main hover:text-text-main font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-300">
                        <span className="material-symbols-outlined text-[20px]">share</span>
                        <span className="hidden sm:inline">Compartilhar</span>
                    </button>
                    <button className="flex items-center gap-2 bg-secondary text-white hover:bg-primary-hover hover:text-text-main font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-green-200/50 transition-all duration-300">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Exportar Relatório
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Período</label>
                            <div className="relative">
                                <select className="w-full text-sm border-gray-200 rounded-lg py-2.5 pl-3 pr-8 focus:ring-primary focus:border-primary">
                                    <option>Últimos 30 dias</option>
                                    <option>Este Mês</option>
                                    <option>Mês Passado</option>
                                    <option>Este Ano</option>
                                    <option>Personalizado</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 pointer-events-none text-[20px]">calendar_today</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Tipo de Transação</label>
                            <select className="w-full text-sm border-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary">
                                <option>Todas</option>
                                <option>Receitas</option>
                                <option>Despesas</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Categoria</label>
                            <select className="w-full text-sm border-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary">
                                <option>Todas as Categorias</option>
                                <option>Comissões</option>
                                <option>Marketing</option>
                                <option>Software</option>
                                <option>Transporte</option>
                                <option>Consultoria</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Cliente / Fornecedor</label>
                            <div className="relative">
                                <input className="w-full text-sm border-gray-200 rounded-lg py-2.5 pl-9 focus:ring-primary focus:border-primary" placeholder="Buscar..." type="text"/>
                                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-gray-400 pointer-events-none text-[20px]">search</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex gap-2 items-end">
                        <div className="space-y-1.5 w-32">
                            <label className="text-xs font-bold text-text-secondary uppercase">Início</label>
                            <input className="w-full text-sm border-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary" type="date"/>
                        </div>
                        <div className="space-y-1.5 w-32">
                            <label className="text-xs font-bold text-text-secondary uppercase">Fim</label>
                            <input className="w-full text-sm border-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary" type="date"/>
                        </div>
                    </div>
                    <button className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold transition-colors w-full lg:w-auto h-[42px] flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                        Filtrar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Receitas</span>
                        <h3 className="text-2xl font-bold text-text-main mt-1">R$ 124.500,00</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-status-success-text bg-status-success/30 w-fit px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +15% vs período anterior
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Despesas</span>
                        <h3 className="text-2xl font-bold text-text-main mt-1">R$ 32.150,00</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-status-error-text bg-status-error/30 w-fit px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +5% vs período anterior
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-secondary"></div>
                    <div>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Resultado Líquido</span>
                        <h3 className="text-2xl font-bold text-text-main mt-1">R$ 92.350,00</h3>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-secondary h-1.5 rounded-full" style={{width: '74%'}}></div>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 text-right">74% de margem</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-text-main text-lg">Fluxo de Caixa</h3>
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-primary"></span>
                                <span>Receitas</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-gray-800"></span>
                                <span>Despesas</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                        {/* Placeholder for chart */}
                        <div className="w-full flex justify-center gap-1 h-full items-end group cursor-pointer relative"><div className="w-3 bg-primary rounded-t-sm h-[40%] group-hover:opacity-80 transition-opacity relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-white border shadow p-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">R$ 40k</span></div><div className="w-3 bg-gray-800 rounded-t-sm h-[20%] group-hover:opacity-80 transition-opacity relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-white border shadow p-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">R$ 20k</span></div><span className="absolute -bottom-6 text-[10px] text-text-secondary">Jan</span></div>
                        <div className="w-full flex justify-center gap-1 h-full items-end group cursor-pointer relative"><div className="w-3 bg-primary rounded-t-sm h-[55%] group-hover:opacity-80 transition-opacity"></div><div className="w-3 bg-gray-800 rounded-t-sm h-[25%] group-hover:opacity-80 transition-opacity"></div><span className="absolute -bottom-6 text-[10px] text-text-secondary">Fev</span></div>
                        <div className="w-full flex justify-center gap-1 h-full items-end group cursor-pointer relative"><div className="w-3 bg-primary rounded-t-sm h-[45%] group-hover:opacity-80 transition-opacity"></div><div className="w-3 bg-gray-800 rounded-t-sm h-[30%] group-hover:opacity-80 transition-opacity"></div><span className="absolute -bottom-6 text-[10px] text-text-secondary">Mar</span></div>
                        <div className="w-full flex justify-center gap-1 h-full items-end group cursor-pointer relative"><div className="w-3 bg-primary rounded-t-sm h-[70%] group-hover:opacity-80 transition-opacity"></div><div className="w-3 bg-gray-800 rounded-t-sm h-[35%] group-hover:opacity-80 transition-opacity"></div><span className="absolute -bottom-6 text-[10px] text-text-secondary">Abr</span></div>
                        <div className="w-full flex justify-center gap-1 h-full items-end group cursor-pointer relative"><div className="w-3 bg-primary rounded-t-sm h-[60%] group-hover:opacity-80 transition-opacity"></div><div className="w-3 bg-gray-800 rounded-t-sm h-[25%] group-hover:opacity-80 transition-opacity"></div><span className="absolute -bottom-6 text-[10px] text-text-secondary">Mai</span></div>
                        <div className="w-full flex justify-center gap-1 h-full items-end group cursor-pointer relative"><div className="w-3 bg-primary rounded-t-sm h-[85%] group-hover:opacity-80 transition-opacity"></div><div className="w-3 bg-gray-800 rounded-t-sm h-[30%] group-hover:opacity-80 transition-opacity"></div><span className="absolute -bottom-6 text-[10px] text-text-secondary">Jun</span></div>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white rounded-xl shadow-soft border border-gray-100 p-6 flex flex-col">
                    <h3 className="font-bold text-text-main text-lg mb-6">Despesas por Categoria</h3>
                    <div className="flex-grow flex items-center justify-center relative">
                        <div className="relative size-40 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-primary via-secondary to-gray-200" style={{background: 'conic-gradient(#c3e738 0% 45%, #84e637 45% 70%, #1f2937 70% 90%, #e5e7eb 90% 100%)'}}>
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                <div className="text-center">
                                    <span className="block text-xs text-text-secondary font-medium">Total</span>
                                    <span className="block text-lg font-bold">R$ 32k</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 space-y-3">
                        <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#c3e738]"></span><span className="text-text-secondary">Marketing</span></div><span className="font-bold">45%</span></div>
                        <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#84e637]"></span><span className="text-text-secondary">Transporte</span></div><span className="font-bold">25%</span></div>
                        <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-gray-800"></span><span className="text-text-secondary">Software</span></div><span className="font-bold">20%</span></div>
                        <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-gray-200"></span><span className="text-text-secondary">Outros</span></div><span className="font-bold">10%</span></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-text-main text-lg">Transações Detalhadas</h3>
                    <div className="flex items-center gap-3">
                        <button className="text-xs font-bold text-text-secondary flex items-center gap-1 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[16px]">tune</span> Personalizar Colunas</button>
                        <div className="relative">
                            <input className="text-xs border-gray-200 rounded-md py-1.5 pl-7 pr-2 focus:ring-primary focus:border-primary w-48" placeholder="Buscar na tabela..." type="text"/>
                            <span className="material-symbols-outlined absolute left-1.5 top-1.5 text-gray-400 pointer-events-none text-[16px]">search</span>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-text-main">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs">Data</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs">Descrição</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs">Categoria</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs">Cliente / Fornecedor</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs text-center">Tipo</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs">Status</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs text-right">Valor</th>
                                <th className="px-6 py-3 font-semibold text-text-secondary uppercase text-xs text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {/* Example Row - In a real app, this would be a map loop */}
                           <tr className="hover:bg-background-light transition-colors group"><td className="px-6 py-4 whitespace-nowrap text-text-secondary text-xs">28 Out, 2024</td><td className="px-6 py-4 font-medium">Comissão Venda - Ref 3940</td><td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">Comissões</span></td><td className="px-6 py-4 text-text-secondary">Cliente João Barros</td><td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-status-success-text text-[18px]">arrow_circle_up</span></td><td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success text-status-success-text"><span className="w-1.5 h-1.5 rounded-full bg-status-success-text"></span>Recebido</span></td><td className="px-6 py-4 text-right font-bold text-status-success-text">+ R$ 15.000,00</td><td className="px-6 py-4 text-center"><button className="text-gray-400 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button></td></tr>
                           <tr className="hover:bg-background-light transition-colors group"><td className="px-6 py-4 whitespace-nowrap text-text-secondary text-xs">26 Out, 2024</td><td className="px-6 py-4 font-medium">Combustível Visitas</td><td className="px-6 py-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">Transporte</span></td><td className="px-6 py-4 text-text-secondary">Posto Shell Centro</td><td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-status-error-text text-[18px]">arrow_circle_down</span></td><td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success text-status-success-text"><span className="w-1.5 h-1.5 rounded-full bg-status-success-text"></span>Pago</span></td><td className="px-6 py-4 text-right font-bold text-status-error-text">- R$ 350,00</td><td className="px-6 py-4 text-center"><button className="text-gray-400 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button></td></tr>
                           <tr className="hover:bg-background-light transition-colors group"><td className="px-6 py-4 whitespace-nowrap text-text-secondary text-xs">25 Out, 2024</td><td className="px-6 py-4 font-medium">Google Ads Campanha Out</td><td className="px-6 py-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-medium border border-purple-100">Marketing</span></td><td className="px-6 py-4 text-text-secondary">Google Ireland Ltd</td><td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-status-error-text text-[18px]">arrow_circle_down</span></td><td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-error text-status-error-text"><span className="w-1.5 h-1.5 rounded-full bg-status-error-text"></span>Atrasado</span></td><td className="px-6 py-4 text-right font-bold text-status-error-text">- R$ 1.200,00</td><td className="px-6 py-4 text-center"><button className="text-gray-400 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button></td></tr>
                           <tr className="hover:bg-background-light transition-colors group"><td className="px-6 py-4 whitespace-nowrap text-text-secondary text-xs">20 Out, 2024</td><td className="px-6 py-4 font-medium">Consultoria Jurídica</td><td className="px-6 py-4"><span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium border border-orange-100">Serviços</span></td><td className="px-6 py-4 text-text-secondary">Advocacia Mendes</td><td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-status-success-text text-[18px]">arrow_circle_up</span></td><td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success text-status-success-text"><span className="w-1.5 h-1.5 rounded-full bg-status-success-text"></span>Recebido</span></td><td className="px-6 py-4 text-right font-bold text-status-success-text">+ R$ 800,00</td><td className="px-6 py-4 text-center"><button className="text-gray-400 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button></td></tr>
                           <tr className="hover:bg-background-light transition-colors group"><td className="px-6 py-4 whitespace-nowrap text-text-secondary text-xs">15 Out, 2024</td><td className="px-6 py-4 font-medium">Assinatura CRM</td><td className="px-6 py-4"><span className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-xs font-medium border border-teal-100">Software</span></td><td className="px-6 py-4 text-text-secondary">Salesforce Inc</td><td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-status-error-text text-[18px]">arrow_circle_down</span></td><td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success text-status-success-text"><span className="w-1.5 h-1.5 rounded-full bg-status-success-text"></span>Pago</span></td><td className="px-6 py-4 text-right font-bold text-status-error-text">- R$ 299,00</td><td className="px-6 py-4 text-center"><button className="text-gray-400 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button></td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Mostrando <span className="font-bold text-text-main">1-5</span> de <span className="font-bold text-text-main">124</span> resultados</span>
                    <div className="flex items-center gap-2">
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-text-main transition-colors disabled:opacity-50"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                        <button className="size-8 flex items-center justify-center rounded bg-primary text-text-main font-bold text-xs">1</button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 text-text-secondary hover:bg-gray-50 text-xs font-medium transition-colors">2</button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 text-text-secondary hover:bg-gray-50 text-xs font-medium transition-colors">3</button>
                        <span className="text-text-secondary text-xs">...</span>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 text-text-secondary hover:bg-gray-50 text-xs font-medium transition-colors">12</button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 text-text-secondary hover:border-gray-300 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                    </div>
                </div>
            </div>
        </>
    );
}
