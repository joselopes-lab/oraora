'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMarketingSettings, saveMarketingSettings } from './actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function MarketingSettingsForm({ brokerId }: { brokerId: string }) {
    const [settings, setSettings] = useState({ googleAnalyticsId: '', gtmId: '', metaPixelId: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        getMarketingSettings(brokerId).then(data => {
            if (data) setSettings(data);
            setLoading(false);
        });
    }, [brokerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveMarketingSettings(brokerId, settings);
            toast({
                title: 'Sucesso!',
                description: 'Configurações salvas com sucesso!',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error.message || 'Erro ao salvar configurações.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                Carregando configurações...
            </div>
        );
    }

    const isConfigured = (val: string) => val && val.trim().length > 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="ga4" className="font-medium text-slate-700">Google Analytics 4</Label>
                    {isConfigured(settings.googleAnalyticsId) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Configurado
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <AlertCircle className="w-3 h-3" /> Não configurado
                        </span>
                    )}
                </div>
                <Input 
                    id="ga4" 
                    value={settings.googleAnalyticsId} 
                    onChange={e => setSettings({...settings, googleAnalyticsId: e.target.value})} 
                    placeholder="G-XXXXXXXXXX" 
                    className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="gtm" className="font-medium text-slate-700">Google Tag Manager</Label>
                    {isConfigured(settings.gtmId) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Configurado
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <AlertCircle className="w-3 h-3" /> Não configurado
                        </span>
                    )}
                </div>
                <Input 
                    id="gtm" 
                    value={settings.gtmId} 
                    onChange={e => setSettings({...settings, gtmId: e.target.value})} 
                    placeholder="GTM-XXXXXXX" 
                    className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="pixel" className="font-medium text-slate-700">Meta Pixel</Label>
                    {isConfigured(settings.metaPixelId) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Configurado
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <AlertCircle className="w-3 h-3" /> Não configurado
                        </span>
                    )}
                </div>
                <Input 
                    id="pixel" 
                    value={settings.metaPixelId} 
                    onChange={e => setSettings({...settings, metaPixelId: e.target.value})} 
                    placeholder="ID numérico" 
                    className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-1">
                Insira os IDs de rastreamento para monitorar visitas, cliques e conversões das suas campanhas no site público.
            </p>

            <div className="pt-2">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar configurações'}
                </Button>
            </div>
        </form>
    );
}

