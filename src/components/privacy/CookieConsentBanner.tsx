'use client';

import React, { useState, useEffect } from 'react';
import { ConsentManager } from '@/lib/privacy/consentManager';
import { ConsentPreferences } from '@/lib/privacy/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Settings, X, Check, Lock } from 'lucide-react';

export function CookieConsentBanner({ tenantId = 'oraora-global', domain = 'oraora.com.br' }: { tenantId?: string; domain?: string }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = ConsentManager.getConsent(tenantId);
    if (!consent) {
      setShowBanner(true);
    } else {
      setPreferences(consent.preferences);
    }

    const handleOpenPreferences = () => {
      setShowModal(true);
    };

    window.addEventListener('oraora_open_cookie_preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('oraora_open_cookie_preferences', handleOpenPreferences);
    };
  }, [tenantId]);

  const handleAcceptAll = () => {
    const saved = ConsentManager.acceptAll(tenantId, domain);
    setPreferences(saved.preferences);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleRefuseOptional = () => {
    const saved = ConsentManager.saveConsent({ necessary: true, analytics: false, marketing: false }, tenantId, domain);
    setPreferences(saved.preferences);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSaveCustom = () => {
    const saved = ConsentManager.saveConsent(preferences, tenantId, domain);
    setPreferences(saved.preferences);
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Banner Flutuante */}
      {showBanner && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-2.5 bg-primary/20 text-primary rounded-xl shrink-0 mt-0.5">
                <Shield className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base tracking-tight text-white">Privacidade e Cookies</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  O OraOra utiliza cookies necessários para o funcionamento essencial do site e, com sua autorização, cookies opcionais para análise estatística de uso. Você pode gerenciar suas preferências a qualquer momento.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl"
              >
                <Settings className="size-4 mr-1.5" /> Gerenciar preferências
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefuseOptional}
                className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl"
              >
                Recusar opcionais
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-5"
              >
                Aceitar todos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preferências */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preferências de Privacidade</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Escolha quais categorias de cookies você autoriza.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Necessários */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Estritamente Necessários</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Sempre Ativo</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Essenciais para navegação, segurança, autenticação e funcionamento básico da plataforma. Não podem ser desativados.
                  </p>
                </div>
                <div className="pt-1">
                  <Switch checked={true} disabled aria-label="Necessários sempre ativos" />
                </div>
              </div>

              {/* Analytics */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Analytics (Desempenho e Estatísticas)</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Permitem entender como os visitantes interagem com o site por meio de coleta de dados estatísticos anônimos (ex: Google Analytics).
                  </p>
                </div>
                <div className="pt-1">
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                    aria-label="Alternar Analytics"
                  />
                </div>
              </div>

              {/* Marketing */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Marketing e Publicidade</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Utilizados para rastrear visitas e exibir anúncios relevantes ou campanhas personalizadas (atualmente sem integrações ativas).
                  </p>
                </div>
                <div className="pt-1">
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                    aria-label="Alternar Marketing"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefuseOptional}
                className="text-xs text-slate-600 dark:text-slate-400"
              >
                Recusar todos opcionais
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="rounded-xl text-xs"
                >
                  Aceitar todos
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCustom}
                  className="rounded-xl text-xs font-semibold px-4"
                >
                  Salvar preferências
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
