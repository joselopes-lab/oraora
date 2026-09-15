'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getLeadOrigin } from '@/lib/lead-origin';
import { Users, TrendingUp, Globe, Target, Layers, Award, DollarSign, BarChart3, ArrowUpRight, Settings, CheckCircle2, AlertCircle, X, SlidersHorizontal } from 'lucide-react';
import MarketingSettingsForm from './MarketingSettingsForm';
import { getMarketingSettings } from './actions';
import { Button } from '@/components/ui/button';
import { normalizeDate } from '@/lib/utils';

interface Lead {
  id: string;
  campaignData?: Record<string, string>;
  createdAt: Timestamp;
  dealStatus?: 'open' | 'won' | 'lost';
  dealValue?: number;
}

export default function MarketingPage() {
    const { user } = useAuthContext();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [period, setPeriod] = useState<'all' | '7days' | '30days' | 'thismonth'>('all');
    const [loading, setLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [marketingSettings, setMarketingSettings] = useState({ googleAnalyticsId: '', gtmId: '', metaPixelId: '' });
    const firestore = useFirestore();

    const fetchSettings = async (brokerId: string) => {
        try {
            const data = await getMarketingSettings(brokerId);
            if (data) setMarketingSettings(data);
        } catch (err) {
            console.error('Error fetching marketing settings:', err);
        }
    };

    useEffect(() => {
        if (!user) return;
        const fetchLeads = async () => {
            try {
                const q = query(collection(firestore, 'leads'), where('brokerId', '==', user.uid));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
                setLeads(data);
            } catch (err) {
                console.error('Error fetching leads for analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
        fetchSettings(user.uid);
    }, [user, firestore]);

    if (!user) return null;

    // Tracking status check
    const isConfigured = (val: string) => val && val.trim().length > 0;
    const ga4 = isConfigured(marketingSettings.googleAnalyticsId);
    const gtm = isConfigured(marketingSettings.gtmId);
    const pixel = isConfigured(marketingSettings.metaPixelId);
    const configuredCount = [ga4, gtm, pixel].filter(Boolean).length;

    let trackingStatusText = 'Rastreamento não configurado';
    let trackingStatusClass = 'bg-slate-100 text-slate-600 border-slate-200';
    let trackingIcon = <AlertCircle className="w-3.5 h-3.5 text-slate-500" />;

    if (configuredCount === 3) {
        trackingStatusText = 'Rastreamento ativo';
        trackingStatusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        trackingIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    } else if (configuredCount > 0) {
        trackingStatusText = 'Rastreamento parcialmente configurado';
        trackingStatusClass = 'bg-amber-50 text-amber-700 border-amber-200';
        trackingIcon = <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
    }

    const filteredLeads = leads.filter(lead => {
        const date = normalizeDate(lead.createdAt);
        if (!date) return period === 'all';
        const now = new Date();

        if (period === '7days') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return date >= sevenDaysAgo;
        }
        if (period === '30days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return date >= thirtyDaysAgo;
        }
        if (period === 'thismonth') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const totalFiltered = filteredLeads.length;
    const wonLeads = filteredLeads.filter(l => l.dealStatus === 'won');
    const lostLeads = filteredLeads.filter(l => l.dealStatus === 'lost');
    const openLeads = filteredLeads.filter(l => l.dealStatus === 'open' || !l.dealStatus);

    const conversionRate = totalFiltered > 0 ? (wonLeads.length / totalFiltered) * 100 : 0;
    const totalSoldValue = wonLeads.reduce((acc, l) => acc + (typeof l.dealValue === 'number' ? l.dealValue : 0), 0);
    const averageTicket = wonLeads.length > 0 ? totalSoldValue / wonLeads.length : 0;

    // Origin breakdown
    const origins = ['Google Ads', 'Meta Ads', 'Orgânico', 'Outros'];
    const originStats = origins.reduce((acc, origin) => {
        const originLeads = filteredLeads.filter(l => getLeadOrigin(l.campaignData) === origin);
        const originWon = originLeads.filter(l => l.dealStatus === 'won');
        const originLost = originLeads.filter(l => l.dealStatus === 'lost');
        const originSold = originWon.reduce((sum, l) => sum + (typeof l.dealValue === 'number' ? l.dealValue : 0), 0);
        const conv = originLeads.length > 0 ? (originWon.length / originLeads.length) * 100 : 0;

        acc[origin] = {
            leads: originLeads.length,
            won: originWon.length,
            lost: originLost.length,
            conversion: conv,
            soldValue: originSold,
        };
        return acc;
    }, {} as Record<string, { leads: number; won: number; lost: number; conversion: number; soldValue: number }>);

    // Campaign breakdown
    const campaignMap = filteredLeads.reduce((acc, lead) => {
        if (lead.campaignData?.utm_campaign) {
            const campaign = lead.campaignData.utm_campaign;
            const origin = getLeadOrigin(lead.campaignData);
            const key = `${campaign}__${origin}`;
            if (!acc[key]) {
                acc[key] = { campaign, origin, leads: 0, won: 0, soldValue: 0 };
            }
            acc[key].leads += 1;
            if (lead.dealStatus === 'won') {
                acc[key].won += 1;
                acc[key].soldValue += (typeof lead.dealValue === 'number' ? lead.dealValue : 0);
            }
        }
        return acc;
    }, {} as Record<string, { campaign: string; origin: string; leads: number; won: number; soldValue: number }>);

    const campaignList = Object.values(campaignMap).sort((a, b) => b.soldValue - a.soldValue || b.leads - a.leads);

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(1).replace('.', ',')}%`;
    };

    return (
        <main className="flex-grow px-4 sm:px-8 py-8 sm:py-10 bg-slate-50/50 min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* Header with Tracking Status and Configure Button */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Analytics de Campanhas</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                BETA
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">Visão unificada de captação, conversão e vendas</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${trackingStatusClass} shadow-2xs`}>
                            {trackingIcon}
                            <span>{trackingStatusText}</span>
                        </div>
                        <Button 
                            onClick={() => setSettingsOpen(true)}
                            variant="outline"
                            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium text-xs sm:text-sm h-10 px-4 rounded-xl shadow-2xs flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4 text-slate-500" />
                            Configurar rastreamento
                        </Button>
                    </div>
                </div>

                {/* Period Selector Bar */}
                <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-6 py-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <span>Filtro de Período</span>
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as any)}
                        className="border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                    >
                        <option value="all">Todo o período</option>
                        <option value="7days">Últimos 7 dias</option>
                        <option value="30days">Últimos 30 dias</option>
                        <option value="thismonth">Este mês</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24 text-sm text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
                        Carregando métricas de marketing...
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Primary Commercial Metric Cards with Visual Emphasis */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                            {/* Total Leads */}
                            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between text-slate-500 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de Leads</span>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{totalFiltered}</div>
                                    <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                                        Volume de captação
                                    </div>
                                </div>
                            </div>

                            {/* Won Leads */}
                            <div className="bg-white border border-emerald-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50/40 via-white to-white">
                                <div className="flex items-center justify-between text-emerald-800 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Leads Ganhos</span>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                                        <Award className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">{wonLeads.length}</div>
                                    <div className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1.5 font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Negócios fechados
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Rate */}
                            <div className="bg-white border border-blue-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/40 via-white to-white">
                                <div className="flex items-center justify-between text-blue-800 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Taxa Conversão</span>
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">{formatPercent(conversionRate)}</div>
                                    <div className="text-xs text-blue-700 mt-1.5 flex items-center gap-1.5 font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                        Ganhos / Total de leads
                                    </div>
                                </div>
                            </div>

                            {/* Total Sold Value */}
                            <div className="bg-white border border-indigo-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow bg-gradient-to-br from-indigo-50/40 via-white to-white">
                                <div className="flex items-center justify-between text-indigo-800 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Valor Vendido</span>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight truncate" title={formatCurrency(totalSoldValue)}>
                                        {formatCurrency(totalSoldValue)}
                                    </div>
                                    <div className="text-xs text-indigo-700 mt-1.5 flex items-center gap-1.5 font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                                        Receita total fechada
                                    </div>
                                </div>
                            </div>

                            {/* Average Ticket */}
                            <div className="bg-white border border-violet-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow bg-gradient-to-br from-violet-50/40 via-white to-white col-span-1 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center justify-between text-violet-800 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-violet-800">Ticket Médio</span>
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-violet-950 tracking-tight truncate" title={formatCurrency(averageTicket)}>
                                        {formatCurrency(averageTicket)}
                                    </div>
                                    <div className="text-xs text-violet-700 mt-1.5 flex items-center gap-1.5 font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-violet-500"></span>
                                        Média por negócio ganho
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Status Breakdown bar */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                            <div className="flex items-center gap-6">
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status do Funil:</div>
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                                    <span className="text-slate-600">Em aberto: <strong className="text-slate-900 font-bold">{openLeads.length}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    <span className="text-slate-600">Ganhos: <strong className="text-slate-900 font-bold">{wonLeads.length}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                                    <span className="text-slate-600">Perdidos: <strong className="text-slate-900 font-bold">{lostLeads.length}</strong></span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                                Total analisado: {totalFiltered} leads
                            </div>
                        </div>

                        {/* Origin that generated most business ("Origem que mais gerou negócios") */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Origem que mais gerou negócios</h3>
                                <p className="text-xs text-slate-500">Comparativo de performance comercial por canal de origem</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {origins.map(origin => {
                                    const stats = originStats[origin];
                                    const isTopOrigin = stats.won > 0 && stats.soldValue === Math.max(...origins.map(o => originStats[o].soldValue));
                                    return (
                                        <div 
                                            key={origin} 
                                            className={`bg-white border rounded-2xl p-6 space-y-5 transition-all shadow-2xs hover:shadow-md ${
                                                isTopOrigin ? 'border-indigo-300 ring-2 ring-indigo-500/10 bg-gradient-to-b from-indigo-50/20 to-white' : 'border-slate-200/80'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-3.5 h-3.5 rounded-full ${
                                                        origin === 'Google Ads' ? 'bg-blue-600' :
                                                        origin === 'Meta Ads' ? 'bg-indigo-600' :
                                                        origin === 'Orgânico' ? 'bg-emerald-600' : 'bg-amber-500'
                                                    }`}></span>
                                                    <span className="font-bold text-sm text-slate-900">{origin}</span>
                                                </div>
                                                {isTopOrigin && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                                        Top Vendas
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                                <div>
                                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Leads</div>
                                                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.leads}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Ganhos</div>
                                                    <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{stats.won}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Conversão</div>
                                                    <div className="text-base font-bold text-slate-800 mt-0.5">{formatPercent(stats.conversion)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Valor Vendido</div>
                                                    <div className="text-base font-extrabold text-indigo-900 mt-0.5 truncate" title={formatCurrency(stats.soldValue)}>
                                                        {formatCurrency(stats.soldValue)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Campaign Performance Section ("Performance das campanhas") */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs space-y-1">
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-900">Performance das campanhas</h3>
                                    <p className="text-xs text-slate-500">Métricas detalhadas por identificador UTM (`utm_campaign`)</p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                                    {campaignList.length} campanhas ativas
                                </span>
                            </div>

                            {campaignList.length === 0 ? (
                                <div className="py-20 px-4 text-center">
                                    <p className="text-sm text-slate-500 font-medium">Não há campanhas identificadas no período.</p>
                                    <p className="text-xs text-slate-400 mt-1">As campanhas com parâmetros UTM capturadas nos leads aparecerão aqui.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="py-4 px-6">Nome da Campanha</th>
                                                <th className="py-4 px-4">Origem</th>
                                                <th className="py-4 px-4 text-right">Leads</th>
                                                <th className="py-4 px-4 text-right">Ganhos</th>
                                                <th className="py-4 px-4 text-right">Conversão</th>
                                                <th className="py-4 px-6 text-right">Valor Vendido</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                            {campaignList.map((item, index) => {
                                                const conv = item.leads > 0 ? (item.won / item.leads) * 100 : 0;
                                                const hasSales = item.won > 0;
                                                return (
                                                    <tr 
                                                        key={index} 
                                                        className={`transition-colors ${hasSales ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/50'}`}
                                                    >
                                                        <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2.5">
                                                            <span>{item.campaign}</span>
                                                            {hasSales && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    <ArrowUpRight className="w-3 h-3" /> Com Vendas
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                                                                item.origin === 'Google Ads' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                                item.origin === 'Meta Ads' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                                            }`}>
                                                                {item.origin}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-right font-extrabold text-slate-900">{item.leads}</td>
                                                        <td className="py-4 px-4 text-right font-extrabold text-emerald-700">{item.won}</td>
                                                        <td className="py-4 px-4 text-right font-semibold text-slate-700">{formatPercent(conv)}</td>
                                                        <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                                                            {formatCurrency(item.soldValue)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {settingsOpen && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">Configurar rastreamento</h3>
                                    <p className="text-xs text-slate-500">Gerencie os pixels e tags para atribuição de campanhas</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSettingsOpen(false);
                                        if (user?.uid) fetchSettings(user.uid);
                                    }}
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6">
                                <MarketingSettingsForm brokerId={user?.uid || ''} />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            </div>
        </main>
    );
}
