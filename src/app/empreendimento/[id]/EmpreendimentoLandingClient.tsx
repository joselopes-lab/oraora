'use client';

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  Maximize2, 
  FileDown, 
  Download, 
  X,
  ChevronRight
} from 'lucide-react';
import { createLead } from '@/app/sites/actions';

interface EmpreendimentoLandingClientProps {
  project: any;
  constructorData: any;
  properties: any[];
  priceTables: any[];
  resolvedBranding?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  brandingOverride?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  previewMode?: boolean;
}

export default function EmpreendimentoLandingClient({
  project,
  constructorData,
  properties,
  priceTables,
  resolvedBranding,
  brandingOverride,
  previewMode = false
}: EmpreendimentoLandingClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInterest, setModalInterest] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const logoUrl = constructorData?.branding?.logoUrl || constructorData?.logoUrl;
  const builderName = constructorData?.name || 'Incorporadora';

  const mediaList = project.midia || [];
  const heroImage = mediaList[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80';

  const defaultBranding = {
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    backgroundColor: '#030712',
    textColor: '#f8fafc',
    buttonColor: '#f59e0b',
    buttonTextColor: '#030712',
  };

  const currentBranding = {
    ...defaultBranding,
    ...(resolvedBranding || {}),
    ...(brandingOverride || {}),
  };

  const handleOpenModal = (interest = 'Geral') => {
    setModalInterest(interest);
    setIsModalOpen(true);
    setSuccessMessage('');
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Por favor, preencha nome, e-mail e WhatsApp.');
      return;
    }

    if (previewMode) {
      setSubmitting(false);
      setSuccessMessage('[Modo Pré-visualização] Solicitação simulada com sucesso!');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setIsModalOpen(false), 2000);
      return;
    }

    setSubmitting(true);
    const res = await createLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      propertyInterest: `${project.name} - ${modalInterest}`,
      message: formData.message,
      brokerId: constructorData?.ownerId || constructorData?.id || 'constructor',
      source: 'Landing Page Empreendimento',
      origin: 'form',
      propertyName: project.name,
      pageType: 'empreendimento',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    });

    setSubmitting(false);
    if (res.success) {
      setSuccessMessage('Solicitação enviada com sucesso! Entraremos em contato em breve.');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);
    } else {
      alert(res.message || 'Erro ao enviar lead.');
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNum = constructorData?.whatsapp || constructorData?.phone || '5511999999999';
    const text = encodeURIComponent(`Olá! Tenho interesse no empreendimento ${project.name}. Gostaria de mais informações.`);
    window.open(`https://wa.me/${phoneNum}?text=${text}`, '_blank');
  };

  return (
    <div 
      className="min-h-screen font-sans selection:bg-[var(--project-primary)] selection:text-[var(--project-button-text)]"
      style={{
        '--project-primary': currentBranding.primaryColor,
        '--project-secondary': currentBranding.secondaryColor,
        '--project-background': currentBranding.backgroundColor,
        '--project-text': currentBranding.textColor,
        '--project-button': currentBranding.buttonColor,
        '--project-button-text': currentBranding.buttonTextColor,
        backgroundColor: 'var(--project-background)',
        color: 'var(--project-text)',
      } as React.CSSProperties}
    >
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={builderName} className="h-10 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="font-bold text-lg tracking-wider text-white">{builderName}</span>
            )}
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <span className="text-sm font-medium text-slate-300 hidden sm:block tracking-wide">{project.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleWhatsAppClick}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-sm font-medium transition"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={() => handleOpenModal('Contato Geral')}
              style={{
                backgroundColor: 'var(--project-button)',
                color: 'var(--project-button-text)',
              }}
              className="px-5 py-2.5 rounded-full font-semibold hover:opacity-90 text-sm transition shadow-lg"
            >
              Fale com um Consultor
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt={project.name} className="w-full h-full object-cover object-center scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--project-background)] via-[var(--project-background)]/60 to-[var(--project-background)]/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center sm:text-left w-full">
          <div className="max-w-3xl">
            {project.status && (
              <div 
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--project-primary) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--project-primary) 30%, transparent)',
                  color: 'var(--project-primary)',
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {project.status.replace('_', ' ')}
              </div>
            )}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight mb-6 leading-tight">
              {project.tituloComercial || project.name}
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 font-light mb-8 max-w-2xl leading-relaxed">
              {project.subtituloComercial || project.descricaoCurta || 'Um projeto exclusivo planejado para elevar seu padrão de vida.'}
            </p>

            {project.localizacao && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-300 text-sm mb-8">
                <MapPin className="w-4 h-4" style={{ color: 'var(--project-primary)' }} />
                <span>{project.localizacao.bairro}, {project.localizacao.cidade} - {project.localizacao.estado}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start">
              <button
                onClick={() => handleOpenModal('Quero Conhecer')}
                style={{
                  backgroundColor: 'var(--project-button)',
                  color: 'var(--project-button-text)',
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-xl text-base"
              >
                Quero Conhecer
              </button>
              <button
                onClick={() => handleOpenModal('Ver Plantas')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 text-white font-medium border border-slate-700 hover:bg-slate-800 transition text-base backdrop-blur-sm"
              >
                Ver Plantas e Tipologias
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Specs Bar */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 border-r border-slate-800/60 last:border-none">
            <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Tipologias</span>
            <span className="text-xl font-semibold text-white">{project.tipologias?.join(', ') || 'Residencial'}</span>
          </div>
          <div className="p-4 border-r border-slate-800/60 last:border-none">
            <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Áreas</span>
            <span className="text-xl font-semibold text-white">
              {project.areaMinima && project.areaMaxima ? `${project.areaMinima}m² a ${project.areaMaxima}m²` : 'Consulte'}
            </span>
          </div>
          <div className="p-4 border-r border-slate-800/60 last:border-none">
            <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Quartos / Suítes</span>
            <span className="text-xl font-semibold text-white">{project.numQuartos || project.suites || 'Sob consulta'}</span>
          </div>
          <div className="p-4">
            <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Preço Inicial</span>
            <span className="text-xl font-semibold" style={{ color: 'var(--project-primary)' }}>
              {project.precoInicial ? `R$ ${project.precoInicial.toLocaleString('pt-BR')}` : 'Sob Consulta'}
            </span>
          </div>
        </div>
      </section>

      {/* Conceito / Descrição */}
      {(project.descricaoCompleta || project.argumentosVenda) && (
        <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="uppercase tracking-widest text-xs font-bold block mb-3" style={{ color: 'var(--project-primary)' }}>O Projeto</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-8">Arquitetura e Sofisticação</h2>
          <div className="prose prose-invert max-w-none text-slate-300 text-lg leading-relaxed font-light space-y-6">
            <p>{project.descricaoCompleta || project.descricaoCurta}</p>
            {project.argumentosVenda && (
              <div 
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--project-primary) 5%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--project-primary) 20%, transparent)',
                }}
                className="p-6 rounded-2xl border text-slate-200 text-base mt-6"
              >
                <strong>Destaque Comercial:</strong> {project.argumentosVenda}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Arquitetura & Galeria */}
      {mediaList.length > 0 && (
        <section className="py-24 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="uppercase tracking-widest text-xs font-bold block mb-3" style={{ color: 'var(--project-primary)' }}>Galeria</span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-4">Perspectivas e Ambientes</h2>
              <p className="text-slate-400">Clique em qualquer imagem para ampliar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaList.map((url: string, index: number) => (
                <div 
                  key={index} 
                  onClick={() => setSelectedImage(url)}
                  className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer shadow-xl bg-slate-900 border border-slate-800"
                >
                  <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-6">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Maximize2 className="w-4 h-4" style={{ color: 'var(--project-primary)' }} /> Ampliar Imagem
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lazer */}
      {project.lazerItens && project.lazerItens.length > 0 && (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="uppercase tracking-widest text-xs font-bold block mb-3" style={{ color: 'var(--project-primary)' }}>Exclusividade</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-4">Área de Lazer Completa</h2>
            <p className="text-slate-400">Espaços planejados para o seu bem-estar e entretenimento.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.lazerItens.map((item: string, idx: number) => (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4 transition hover:border-[var(--project-primary)]"
              >
                <div 
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--project-primary) 10%, transparent)',
                    color: 'var(--project-primary)',
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-200 text-sm sm:text-base">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tipologias & Unidades */}
      {(project.tipologias || properties.length > 0) && (
        <section className="py-24 bg-slate-900/30 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="uppercase tracking-widest text-xs font-bold block mb-3" style={{ color: 'var(--project-primary)' }}>Plantas</span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-4">Tipologias e Unidades Disponíveis</h2>
              <p className="text-slate-400">Escolha a planta ideal para o seu momento de vida.</p>
            </div>

            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((prop: any) => (
                  <div key={prop.id} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
                    <div className="h-56 relative bg-slate-950">
                      {prop.midia?.[0] ? (
                        <img src={prop.midia[0]} alt={prop.informacoesbasicas?.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}
                      <span 
                        style={{ color: 'var(--project-primary)' }}
                        className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-semibold backdrop-blur-md"
                      >
                        {prop.informacoesbasicas?.status || 'Disponível'}
                      </span>
                    </div>
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{prop.informacoesbasicas?.nome || 'Unidade'}</h3>
                        <p className="text-sm text-slate-400 mb-4">{prop.localizacao?.bairro || project.localizacao?.bairro}</p>
                        <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-800 text-center text-xs text-slate-300">
                          <div>
                            <span className="block font-bold text-white text-sm">{prop.caracteristicasimovel?.tamanho || '-'}m²</span>
                            <span>Área</span>
                          </div>
                          <div>
                            <span className="block font-bold text-white text-sm">{prop.caracteristicasimovel?.quartos || '-'}</span>
                            <span>Quartos</span>
                          </div>
                          <div>
                            <span className="block font-bold text-white text-sm">{prop.caracteristicasimovel?.vagas || '-'}</span>
                            <span>Vagas</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">Valor</span>
                          <span className="text-lg font-bold" style={{ color: 'var(--project-primary)' }}>
                            {prop.informacoesbasicas?.valor ? `R$ ${prop.informacoesbasicas.valor.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenModal(`Unidade ${prop.informacoesbasicas?.nome}`)}
                          style={{
                            backgroundColor: 'var(--project-button)',
                            color: 'var(--project-button-text)',
                          }}
                          className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 text-xs transition"
                        >
                          Tenho Interesse
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Nenhuma unidade cadastrada publicamente no momento. Entre em contato para mais detalhes.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Materiais & Downloads */}
      {project.materiais && project.materiais.length > 0 && (
        <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="uppercase tracking-widest text-xs font-bold block mb-3" style={{ color: 'var(--project-primary)' }}>Downloads</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-4">Materiais do Empreendimento</h2>
            <p className="text-slate-400">Baixe o folder oficial, apresentação ou plantas em PDF.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.materiais.map((mat: any) => (
              <a
                key={mat.id}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-[var(--project-primary)] transition group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--project-primary) 10%, transparent)',
                      color: 'var(--project-primary)',
                    }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                  >
                    <FileDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-[var(--project-primary)] transition">{mat.name}</h4>
                    <span className="text-xs text-slate-400 uppercase">{mat.category || 'Documento'}</span>
                  </div>
                </div>
                <Download className="w-5 h-5 text-slate-500 group-hover:text-[var(--project-primary)] transition" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Localização */}
      {project.localizacao && (
        <section className="py-24 bg-slate-900/30 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="uppercase tracking-widest text-xs font-bold block mb-3" style={{ color: 'var(--project-primary)' }}>Localização Privilegiada</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-6">Endereço</h2>
            <p className="text-xl text-slate-300 font-light mb-8">
              {project.localizacao.address ? `${project.localizacao.address}, ` : ''}{project.localizacao.bairro} — {project.localizacao.cidade} / {project.localizacao.estado}
            </p>
            <button
              onClick={() => handleOpenModal('Visita ao Local')}
              style={{
                backgroundColor: 'var(--project-button)',
                color: 'var(--project-button-text)',
              }}
              className="px-8 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg"
            >
              Agendar Visita ao Local
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-16 bg-slate-950 border-t border-slate-900 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {logoUrl && <img src={logoUrl} alt={builderName} className="h-8 mx-auto object-contain opacity-70" referrerPolicy="no-referrer" />}
          <p>© {new Date().getFullYear()} {builderName}. Todos os direitos reservados.</p>
          <p className="text-xs text-slate-600">As imagens e perspectivas são ilustrativas. Consulte condições comerciais.</p>
        </div>
      </footer>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} alt="Ampliada" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" referrerPolicy="no-referrer" />
        </div>
      )}

      {/* Contact / Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 relative shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="uppercase tracking-widest text-xs font-bold block mb-2" style={{ color: 'var(--project-primary)' }}>{project.name}</span>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Fale com um Especialista</h3>
            <p className="text-slate-400 text-sm mb-6">Interesse: <strong className="text-white">{modalInterest}</strong></p>

            {successMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center font-medium">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--project-primary)]"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--project-primary)]"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--project-primary)]"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mensagem ou Dúvida (Opcional)</label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--project-primary)] resize-none"
                    placeholder="Gostaria de saber mais sobre..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: 'var(--project-button)',
                    color: 'var(--project-button-text)',
                  }}
                  className="w-full py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg text-base flex items-center justify-center gap-2"
                >
                  {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
