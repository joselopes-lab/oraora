'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getProjectDetailServer, updateProjectBrandingServer } from '../../../../actions.server';
import EmpreendimentoLandingClient from '@/app/empreendimento/[id]/EmpreendimentoLandingClient';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Palette, Eye, Settings, RotateCcw, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_BRANDING = {
  primaryColor: '#f59e0b',
  secondaryColor: '#10b981',
  backgroundColor: '#030712',
  textColor: '#f8fafc',
  buttonColor: '#f59e0b',
  buttonTextColor: '#030712',
};

export default function HotsiteAparenciaPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [constructorData, setConstructorData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [priceTables, setPriceTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'preview'>('config');

  const [draftBranding, setDraftBranding] = useState({
    primaryColor: '',
    secondaryColor: '',
    backgroundColor: '',
    textColor: '',
    buttonColor: '',
    buttonTextColor: '',
  });

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const idToken = await user?.getIdToken();
        const res = await getProjectDetailServer(id, idToken);
        if (res.success && res.project) {
          setProject(res.project);
          setConstructorData(res.constructorData);
          setProperties(res.properties || []);
          setPriceTables(res.priceTables || []);

          const b = res.project.branding || {};
          setDraftBranding({
            primaryColor: b.primaryColor || '',
            secondaryColor: b.secondaryColor || '',
            backgroundColor: b.backgroundColor || '',
            textColor: b.textColor || '',
            buttonColor: b.buttonColor || '',
            buttonTextColor: b.buttonTextColor || '',
          });
        } else {
          alert(res.error || 'Erro ao carregar empreendimento.');
        }
      } catch (e: any) {
        console.error(e);
        alert('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, isUserLoading, id, router]);

  const handleColorChange = (key: string, value: string) => {
    setDraftBranding(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = async () => {
    if (!confirm('Deseja restaurar o padrão herdado da construtora / sistema?')) return;
    try {
      setSaving(true);
      const idToken = await user?.getIdToken();
      const res = await updateProjectBrandingServer(id, null, idToken);
      if (res.success) {
        setDraftBranding({
          primaryColor: '',
          secondaryColor: '',
          backgroundColor: '',
          textColor: '',
          buttonColor: '',
          buttonTextColor: '',
        });
        alert('Branding restaurado com sucesso!');
        const updated = await getProjectDetailServer(id, idToken);
        if (updated.success && updated.project) {
          setProject(updated.project);
        }
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao restaurar padrão.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const idToken = await user?.getIdToken();
      const res = await updateProjectBrandingServer(id, draftBranding, idToken);
      if (res.success) {
        alert('Aparência do hotsite salva com sucesso!');
        const updated = await getProjectDetailServer(id, idToken);
        if (updated.success && updated.project) {
          setProject(updated.project);
        }
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const btnBg = draftBranding.buttonColor || constructorData?.branding?.buttonColor || DEFAULT_BRANDING.buttonColor;
  const btnText = draftBranding.buttonTextColor || constructorData?.branding?.buttonTextColor || DEFAULT_BRANDING.buttonTextColor;
  const hasLowContrast = btnBg && btnText && btnBg.toLowerCase() === btnText.toLowerCase();

  const previewResolvedBranding = {
    primaryColor: draftBranding.primaryColor || constructorData?.branding?.primaryColor || constructorData?.primaryColor || DEFAULT_BRANDING.primaryColor,
    secondaryColor: draftBranding.secondaryColor || constructorData?.branding?.secondaryColor || constructorData?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
    backgroundColor: draftBranding.backgroundColor || constructorData?.branding?.backgroundColor || DEFAULT_BRANDING.backgroundColor,
    textColor: draftBranding.textColor || constructorData?.branding?.textColor || DEFAULT_BRANDING.textColor,
    buttonColor: draftBranding.buttonColor || constructorData?.branding?.buttonColor || constructorData?.buttonColor || DEFAULT_BRANDING.buttonColor,
    buttonTextColor: draftBranding.buttonTextColor || constructorData?.branding?.buttonTextColor || constructorData?.buttonTextColor || DEFAULT_BRANDING.buttonTextColor,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
            <Link href={`/dashboard/construtoras/empreendimentos/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Empreendimento
            </Link>
          </Button>
          <div className="h-5 w-px bg-slate-800" />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500" /> Aparência do Hotsite
            </h1>
            <p className="text-xs text-slate-400">{project?.name || 'Empreendimento'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSubTab === 'config' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Configurações
          </button>
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSubTab === 'preview' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Pré-visualização
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {activeSubTab === 'config' ? (
          <div className="max-w-4xl mx-auto p-6 md:p-10 w-full space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Tokens de Identidade Visual</h2>
                <p className="text-sm text-slate-400">
                  Personalize as cores do hotsite público deste empreendimento. Os campos em branco herdam automaticamente da construtora ou do padrão do sistema.
                </p>
              </div>

              {hasLowContrast && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Baixo contraste entre o botão e o texto. Certifique-se de que a leitura seja confortável.</span>
                </div>
              )}

              {/* Identidade */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Identidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Cor principal</label>
                    <p className="text-xs text-slate-400">Usada em destaques, links e elementos da identidade.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftBranding.primaryColor || DEFAULT_BRANDING.primaryColor}
                        onChange={e => handleColorChange('primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        placeholder="#A22709"
                        value={draftBranding.primaryColor}
                        onChange={e => handleColorChange('primaryColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Cor secundária</label>
                    <p className="text-xs text-slate-400">Usada em detalhes e elementos secundários.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftBranding.secondaryColor || DEFAULT_BRANDING.secondaryColor}
                        onChange={e => handleColorChange('secondaryColor', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        placeholder="#D4AF37"
                        value={draftBranding.secondaryColor}
                        onChange={e => handleColorChange('secondaryColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Superfície */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Superfície</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Cor de fundo</label>
                    <p className="text-xs text-slate-400">Cor de fundo principal do hotsite.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftBranding.backgroundColor || DEFAULT_BRANDING.backgroundColor}
                        onChange={e => handleColorChange('backgroundColor', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        placeholder="#0B0F19"
                        value={draftBranding.backgroundColor}
                        onChange={e => handleColorChange('backgroundColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Cor dos textos</label>
                    <p className="text-xs text-slate-400">Cor principal para textos e parágrafos.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftBranding.textColor || DEFAULT_BRANDING.textColor}
                        onChange={e => handleColorChange('textColor', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        placeholder="#F8FAFC"
                        value={draftBranding.textColor}
                        onChange={e => handleColorChange('textColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Botões</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Cor dos botões</label>
                    <p className="text-xs text-slate-400">Cor de fundo dos CTAs e botões principais.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftBranding.buttonColor || DEFAULT_BRANDING.buttonColor}
                        onChange={e => handleColorChange('buttonColor', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        placeholder="#D4AF37"
                        value={draftBranding.buttonColor}
                        onChange={e => handleColorChange('buttonColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Cor do texto dos botões</label>
                    <p className="text-xs text-slate-400">Cor do texto dentro dos botões e CTAs.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftBranding.buttonTextColor || DEFAULT_BRANDING.buttonTextColor}
                        onChange={e => handleColorChange('buttonTextColor', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        placeholder="#0B0F19"
                        value={draftBranding.buttonTextColor}
                        onChange={e => handleColorChange('buttonTextColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Restaurar padrão
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 px-6"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar alterações
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative border-t border-slate-800">
            <div className="absolute top-4 right-4 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full shadow-lg text-xs flex items-center gap-2">
              <Eye className="w-4 h-4" /> Modo Pré-visualização em Tempo Real
            </div>
            <EmpreendimentoLandingClient
              project={project}
              constructorData={constructorData}
              properties={properties}
              priceTables={priceTables}
              resolvedBranding={previewResolvedBranding}
              previewMode={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
