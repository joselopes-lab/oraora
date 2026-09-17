'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProjectPublicationServer } from '../actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Rocket, Globe, ArrowRight, ShieldCheck, Lock, Layers, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectPublicationTabProps {
  project: {
    id: string;
    builderId: string;
    name?: string;
    isPublished?: boolean;
    tituloComercial?: string;
    precoInicial?: number;
    tipologias?: string[];
    numTorres?: number;
    numUnidades?: number;
    lazerItens?: string[];
    personaIds?: string[];
    midia?: string[];
    materiais?: any[];
    localizacao?: {
      cidade?: string;
      estado?: string;
      bairro?: string;
      address?: string;
      cep?: string;
    };
    status?: string;
    standard?: string;
  };
  units: any[];
  onTabChange?: (tab: string) => void;
}

export default function ProjectPublicationTab({ project, units, onTabChange }: ProjectPublicationTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirement checks
  const hasBasic = !!project.name && !!project.localizacao?.cidade && !!project.localizacao?.estado;
  const hasCommercial = !!project.tituloComercial && (project.precoInicial || 0) > 0 && (project.tipologias?.length || 0) > 0;
  const hasCharacteristics = (project.numTorres || 0) > 0 && (project.numUnidades || 0) > 0 && (project.lazerItens?.length || 0) > 0;
  const hasPersona = (project.personaIds?.length || 0) > 0;
  const hasMedia = (project.midia?.length || 0) > 0;
  const hasUnits = units.length > 0;
  const hasMaterials = (project.materiais?.length || 0) > 0;

  const checklistItems = [
    { id: 'info', label: 'Informações Básicas (Nome, Cidade, Estado)', done: hasBasic, tab: 'informacoes' },
    { id: 'commercial', label: 'Informações Comerciais (Título, Preço, Tipologia)', done: hasCommercial, tab: 'informacoes' },
    { id: 'characteristics', label: 'Estrutura e Lazer (Torres, Unidades, Lazer)', done: hasCharacteristics, tab: 'caracteristicas' },
    { id: 'persona', label: 'Persona Alvo Vinculada', done: hasPersona, tab: 'persona' },
    { id: 'media', label: 'Mídia & Galeria Cadastradas', done: hasMedia, tab: 'midia' },
    { id: 'units', label: 'Unidades de Estoque Cadastradas', done: hasUnits, tab: 'unidades' },
    { id: 'materials', label: 'Materiais Comerciais Disponibilizados', done: hasMaterials, tab: 'materiais' },
  ];

  const completedCount = checklistItems.filter(i => i.done).length;
  const totalCount = checklistItems.length;
  const percentual = Math.round((completedCount / totalCount) * 100);
  const isReadyToPublish = completedCount === totalCount;
  const isPublished = !!project.isPublished;

  const handleTogglePublish = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const newStatus = !isPublished;

      const res = await updateProjectPublicationServer(project.id, {
        isPublished: newStatus,
        idToken,
      });

      if (res.success) {
        toast({
          title: newStatus ? 'Empreendimento Publicado!' : 'Empreendimento despublicado',
          description: newStatus 
            ? 'Agora este lançamento está disponível para os corretores na rede.' 
            : 'O empreendimento voltou para o modo rascunho.',
        });
        window.location.reload();
      } else {
        throw new Error(res.message || 'Erro ao atualizar publicação.');
      }
    } catch (e: any) {
      toast({ title: 'Erro na publicação', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <Card className={`border-2 ${isPublished ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/50 border-slate-200'}`}>
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant={isPublished ? 'default' : 'secondary'} className={`text-xs font-semibold px-3 py-1 ${isPublished ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {isPublished ? '● Publicado na Rede' : '○ Modo Rascunho'}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">Progresso: {percentual}%</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {isPublished ? 'Empreendimento disponível para corretores' : 'Finalize o checklist para lançar o empreendimento'}
            </h3>
            <p className="text-sm text-slate-600 max-w-xl">
              {isPublished 
                ? 'Seu lançamento está ativo no catálogo de "Imóveis de Construtoras" da rede. Corretores podem visualizar e comercializar as unidades.'
                : 'Quando todos os requisitos obrigatórios forem preenchidos, o botão de publicação será habilitado para você disponibilizar o lançamento aos corretores.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {isPublished ? (
              <Button 
                onClick={handleTogglePublish} 
                disabled={isSubmitting}
                variant="outline"
                className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 gap-2 h-12 px-6"
              >
                <Lock className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Despublicar Empreendimento'}
              </Button>
            ) : (
              <Button 
                onClick={handleTogglePublish} 
                disabled={!isReadyToPublish || isSubmitting}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-12 px-8 shadow-md"
              >
                <Rocket className="w-4 h-4" /> {isSubmitting ? 'Publicando...' : 'Publicar Empreendimento'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress & Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Checklist Obrigatório de Lançamento</CardTitle>
            <span className="text-sm font-semibold font-mono text-indigo-600">{completedCount} de {totalCount} concluídos</span>
          </div>
          <CardDescription>
            Requisitos essenciais exigidos para garantir a qualidade das informações ofertadas aos corretores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={percentual} className="h-2" />

          <div className="divide-y border rounded-xl overflow-hidden bg-white mt-4">
            {checklistItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.done ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${item.done ? 'text-slate-900' : 'text-slate-700'}`}>{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {item.done ? 'Concluído com sucesso' : 'Pendente de preenchimento'}
                    </p>
                  </div>
                </div>

                {!item.done ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 gap-1"
                    onClick={() => onTabChange?.(item.tab)}
                  >
                    Preencher <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-slate-500 hover:text-slate-900 gap-1"
                    onClick={() => onTabChange?.(item.tab)}
                  >
                    Revisar <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {!isReadyToPublish && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Publicação bloqueada</p>
                <p className="text-xs mt-0.5">
                  Preencha todos os itens pendentes do checklist nas abas anteriores do Cockpit para habilitar o botão de publicação.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
