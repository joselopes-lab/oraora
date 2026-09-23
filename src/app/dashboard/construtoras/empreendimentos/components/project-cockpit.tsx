'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  Globe, 
  Layers, 
  Users, 
  FileText, 
  DollarSign, 
  Sparkles, 
  Image as ImageIcon, 
  Building, 
  FolderDown,
  ChevronRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ProjectInfoTab from './project-info-tab';
import ProjectCommercialTab from './project-commercial-tab';
import ProjectCharacteristicsTab from './project-characteristics-tab';
import ProjectPersonaTab from './project-persona-tab';
import ProjectMediaTab from './project-media-tab';
import ProjectUnitsTab from './project-units-tab';
import ProjectMaterialsTab from './project-materials-tab';
import ProjectPublicationTab from './project-publication-tab';

interface ProjectCockpitProps {
  project: {
    id: string;
    name: string;
    builderId: string;
    status?: string;
    standard?: string;
    vgvEstimado?: number;
    percentualObra?: number;
    dataEntregaEstimada?: string;
    descricaoCurta?: string;
    descricaoCompleta?: string;
    tituloComercial?: string;
    subtituloComercial?: string;
    precoInicial?: number;
    precoMaximo?: number;
    valorMetroQuadrado?: number;
    tipologias?: string[];
    condicoesComerciais?: string;
    diferenciaisCorretor?: string;
    argumentosVenda?: string;
    observacoesComerciais?: string;
    numTorres?: number;
    numUnidades?: number;
    numPavimentos?: number;
    numElevadores?: number;
    areaTerreno?: number;
    tipologiasResidenciais?: string[];
    areaMinima?: number;
    areaMaxima?: number;
    numQuartos?: string;
    suites?: string;
    vagasGaragem?: string;
    temVaranda?: boolean;
    caracteristicasGerais?: string[];
    lazerItens?: string[];
    diferenciaisEspecificos?: string;
    sustentabilidadeTecnologia?: string[];
    personaIds?: string[];
    midia?: string[];
    materiais?: Array<{
      id: string;
      name: string;
      category: string;
      url: string;
      size?: number;
      type?: string;
      updatedAt: string;
    }>;
    localizacao?: {
      estado: string;
      cidade: string;
      bairro: string;
      address?: string;
      cep?: string;
    };
    createdAt?: any;
    updatedAt?: any;
  };
  units?: any[];
}

export default function ProjectCockpit({ project, units = [] }: ProjectCockpitProps) {
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Real checklist computation based on filled fields
  const hasBasicInfo = !!project.name && !!project.status && !!project.standard;
  const hasLocation = !!project.localizacao?.estado && !!project.localizacao?.cidade && !!project.localizacao?.bairro;
  const hasFinancials = !!project.vgvEstimado || project.percentualObra !== undefined || !!project.dataEntregaEstimada;
  const hasPresentation = !!project.descricaoCurta || !!project.descricaoCompleta;
  const hasCommercial = !!project.tituloComercial && !!project.precoInicial && (project.tipologias?.length || 0) > 0;
  const hasCharacteristics = !!project.numTorres && !!project.numUnidades && (project.lazerItens?.length || 0) > 0;
  const hasPersona = (project.personaIds?.length || 0) > 0;
  const hasMedia = (project.midia?.length || 0) > 0;
  const hasUnits = (units?.length || 0) > 0;
  const hasMaterials = (project.materiais?.length || 0) > 0;

  const steps = [
    { id: 'info', label: 'Identificação & Informações', done: hasBasicInfo, tab: 'informacoes' },
    { id: 'localizacao', label: 'Localização Completa', done: hasLocation, tab: 'informacoes' },
    { id: 'ficha', label: 'Ficha Técnica & VGV', done: hasFinancials, tab: 'informacoes' },
    { id: 'apresentacao', label: 'Apresentação & Textos', done: hasPresentation, tab: 'informacoes' },
    { id: 'comercial', label: 'Posicionamento e Valores', done: hasCommercial, tab: 'comercial' },
    { id: 'caracteristicas', label: 'Estrutura e Lazer', done: hasCharacteristics, tab: 'caracteristicas' },
    { id: 'persona', label: 'Persona Alvo', done: hasPersona, tab: 'persona' },
    { id: 'midia', label: 'Mídia & Galeria', done: hasMedia, tab: 'midia' },
    { id: 'unidades', label: 'Torres e Unidades', done: hasUnits, tab: 'unidades' },
    { id: 'materiais', label: 'Materiais & Downloads', done: hasMaterials, tab: 'materiais' },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header Navigation & Actions */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link href="/dashboard/construtoras/empreendimentos" className="hover:text-slate-900 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Empreendimentos
                </Link>
                <span>/</span>
                <span className="font-medium text-slate-800">{project.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h1>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="w-3 h-3 mr-1 inline" /> Rascunho
                </Badge>
              </div>
              {project.localizacao && (
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {project.localizacao.address ? `${project.localizacao.address}, ` : ''}
                  {project.localizacao.bairro ? `${project.localizacao.bairro} - ` : ''}
                  {project.localizacao.cidade}/{project.localizacao.estado}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {project.isPublished ? (
                <Button asChild variant="default" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm gap-2">
                  <Link href={`/empreendimento/${project.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-amber-400" /> Visualizar hotsite ↗
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col items-end">
                  <Button variant="outline" disabled className="text-slate-400 gap-2 cursor-not-allowed" title="Publique o empreendimento para visualizar o hotsite.">
                    <ExternalLink className="w-4 h-4 text-slate-300" /> Visualizar hotsite
                  </Button>
                  <span className="text-[11px] text-amber-600 mt-1">Publique o empreendimento para visualizar o hotsite.</span>
                </div>
              )}
              <Button asChild variant="outline" className="text-slate-700 hover:bg-slate-50">
                <Link href={`/dashboard/construtoras/empreendimentos/${project.id}/hotsite/aparencia`}>
                  <Palette className="w-4 h-4 mr-2 text-amber-500" /> Aparência do Hotsite
                </Link>
              </Button>
              <Button asChild variant="outline" className="text-slate-700 hover:bg-slate-50">
                <Link href={`/dashboard/construtoras/empreendimentos/${project.id}/apresentacao`} target="_blank">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Apresentação Comercial
                </Link>
              </Button>
            </div>
          </div>

          {/* Progress Bar Header section */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">Progresso do lançamento</span>
                <span className="font-bold text-slate-900">{progressPercent}% concluído ({completedCount}/{steps.length} etapas)</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              Preencha as informações essenciais para habilitar a publicação automática do empreendimento no portal.
            </p>
          </div>
        </div>
      </div>

      {/* Main Cockpit Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Tabs defaultValue="visao-geral" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 border rounded-xl shadow-xs flex flex-wrap h-auto gap-1">
            <TabsTrigger value="visao-geral" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Visão geral
            </TabsTrigger>
            <TabsTrigger value="informacoes" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Informações
            </TabsTrigger>
            <TabsTrigger value="comercial" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Comercial
            </TabsTrigger>
            <TabsTrigger value="caracteristicas" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Características
            </TabsTrigger>
            <TabsTrigger value="persona" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Persona
            </TabsTrigger>
            <TabsTrigger value="midia" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Mídia
            </TabsTrigger>
            <TabsTrigger value="unidades" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Unidades
            </TabsTrigger>
            <TabsTrigger value="materiais" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Materiais
            </TabsTrigger>
            <TabsTrigger value="publicacao" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium">
              Publicação
            </TabsTrigger>
          </TabsList>

          {/* TAB: VISÃO GERAL */}
          <div className={activeTab === 'visao-geral' ? 'space-y-6' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Checklist & Status */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Checklist de Lançamento</CardTitle>
                    <CardDescription>Acompanhe o preenchimento das seções para habilitar o lançamento.</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {steps.map((step) => (
                      <div key={step.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          {step.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                          )}
                          <span className={`text-sm font-medium ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-slate-600 hover:text-slate-900"
                          onClick={() => setActiveTab(step.tab)}
                        >
                          {step.done ? 'Editar' : 'Preencher'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">O que falta preencher</CardTitle>
                    <CardDescription>Pendências críticas para tornar o empreendimento visível.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Seu empreendimento ainda está como rascunho.</p>
                        <p className="mt-1 text-amber-700">
                          Complete as informações comerciais, adicione ao menos uma tabela de preços ou unidade e defina a persona alvo para realizar a publicação.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Summary Widget */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Resumo do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-500">ID do Projeto</span>
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{project.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-500">Construtora ID</span>
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{project.builderId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-500">Cidade / UF</span>
                      <span className="font-medium text-slate-900">{project.localizacao?.cidade || 'Não informada'} / {project.localizacao?.estado || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Criado em</span>
                      <span className="text-slate-700">Recentemente</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Central de Ajuda OraOra</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-300 space-y-3">
                    <p>Precisa de suporte na configuração do seu lançamento imobiliário?</p>
                    <Button variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20">
                      Falar com Especialista
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* TAB: INFORMAÇÕES */}
          <div className={activeTab === 'informacoes' ? 'space-y-6' : 'hidden'}>
            <ProjectInfoTab project={project} />
          </div>

          {/* TAB: COMERCIAL */}
          <div className={activeTab === 'comercial' ? 'space-y-6' : 'hidden'}>
            <ProjectCommercialTab project={project} />
          </div>

          {/* TAB: CARACTERÍSTICAS */}
          <div className={activeTab === 'caracteristicas' ? 'space-y-6' : 'hidden'}>
            <ProjectCharacteristicsTab project={project} />
          </div>

          {/* TAB: PERSONA */}
          <div className={activeTab === 'persona' ? 'space-y-6' : 'hidden'}>
            <ProjectPersonaTab project={project} />
          </div>

          {/* TAB: MIDIA */}
          <div className={activeTab === 'midia' ? 'space-y-6' : 'hidden'}>
            <ProjectMediaTab project={project} />
          </div>

          {/* TAB: UNIDADES */}
          <div className={activeTab === 'unidades' ? 'space-y-6' : 'hidden'}>
            <ProjectUnitsTab project={project} units={units} />
          </div>

          {/* TAB: MATERIAIS */}
          <div className={activeTab === 'materiais' ? 'space-y-6' : 'hidden'}>
            <ProjectMaterialsTab project={project} />
          </div>

          {/* TAB: PUBLICACAO */}
          <div className={activeTab === 'publicacao' ? 'space-y-6' : 'hidden'}>
            <ProjectPublicationTab project={project} units={units} onTabChange={setActiveTab} />
          </div>
        </Tabs>
      </div>
    </div>
  );
}
