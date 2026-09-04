'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProjectCharacteristicsServer } from '../actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, CheckCircle, AlertCircle, Plus, X, Layers, Trees, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectCharacteristicsTabProps {
  project: {
    id: string;
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
  };
}

const DEFAULT_TIPOLOGIAS_RESIDENCIAIS = ['Apartamento', 'Studio', 'Flat', 'Cobertura', 'Duplex', 'Garden', 'Loft'];
const DEFAULT_LAZER_ITENS = [
  'Piscina', 'Academia', 'Salão de festas', 'Espaço gourmet', 'Playground', 
  'Brinquedoteca', 'Coworking', 'Rooftop', 'Espaço pet', 'Quadra poliesportiva', 'Sauna'
];
const DEFAULT_SUSTENTABILIDADE = [
  'Energia solar', 'Reuso de água da chuva', 'Automação residencial', 
  'Fechadura digital', 'Infraestrutura para carros elétricos', 'Iluminação LED nas áreas comuns'
];

export default function ProjectCharacteristicsTab({ project }: ProjectCharacteristicsTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form states
  const [numTorres, setNumTorres] = useState(project.numTorres !== undefined ? String(project.numTorres) : '');
  const [numUnidades, setNumUnidades] = useState(project.numUnidades !== undefined ? String(project.numUnidades) : '');
  const [numPavimentos, setNumPavimentos] = useState(project.numPavimentos !== undefined ? String(project.numPavimentos) : '');
  const [numElevadores, setNumElevadores] = useState(project.numElevadores !== undefined ? String(project.numElevadores) : '');
  const [areaTerreno, setAreaTerreno] = useState(project.areaTerreno !== undefined ? String(project.areaTerreno) : '');

  const [tipologiasResidenciais, setTipologiasResidenciais] = useState<string[]>(project.tipologiasResidenciais || ['Apartamento']);
  const [customTipologia, setCustomTipologia] = useState('');

  const [areaMinima, setAreaMinima] = useState(project.areaMinima !== undefined ? String(project.areaMinima) : '');
  const [areaMaxima, setAreaMaxima] = useState(project.areaMaxima !== undefined ? String(project.areaMaxima) : '');
  const [numQuartos, setNumQuartos] = useState(project.numQuartos || '');
  const [suites, setSuites] = useState(project.suites || '');
  const [vagasGaragem, setVagasGaragem] = useState(project.vagasGaragem || '');
  const [temVaranda, setTemVaranda] = useState(project.temVaranda || false);

  const [lazerItens, setLazerItens] = useState<string[]>(project.lazerItens || ['Piscina', 'Academia', 'Salão de festas']);
  const [customLazer, setCustomLazer] = useState('');

  const [diferenciaisEspecificos, setDiferenciaisEspecificos] = useState(project.diferenciaisEspecificos || '');
  
  const [sustentabilidadeTecnologia, setSustentabilidadeTecnologia] = useState<string[]>(project.sustentabilidadeTecnologia || ['Fechadura digital']);

  const handleFieldChange = (setter: any, value: any) => {
    setter(value);
    setIsDirty(true);
  };

  const toggleArrayItem = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
    setIsDirty(true);
  };

  const handleAddCustom = (list: string[], setList: any, customVal: string, setCustomVal: any) => {
    if (customVal.trim() && !list.includes(customVal.trim())) {
      setList([...list, customVal.trim()]);
      setCustomVal('');
      setIsDirty(true);
    }
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await updateProjectCharacteristicsServer(project.id, {
        numTorres: numTorres ? Number(numTorres) : undefined,
        numUnidades: numUnidades ? Number(numUnidades) : undefined,
        numPavimentos: numPavimentos ? Number(numPavimentos) : undefined,
        numElevadores: numElevadores ? Number(numElevadores) : undefined,
        areaTerreno: areaTerreno ? Number(areaTerreno) : undefined,
        tipologiasResidenciais,
        areaMinima: areaMinima ? Number(areaMinima) : undefined,
        areaMaxima: areaMaxima ? Number(areaMaxima) : undefined,
        numQuartos,
        suites,
        vagasGaragem,
        temVaranda,
        lazerItens,
        diferenciaisEspecificos,
        sustentabilidadeTecnologia,
        idToken,
      });

      setIsDirty(false);
      toast({ title: 'Salvo com sucesso!', description: 'As características foram atualizadas.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-xs sticky top-4 z-10">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4" /> Alterações não salvas
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Todas as alterações salvas
            </div>
          )}
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isSubmitting}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* 1. ESTRUTURA DO EMPREENDIMENTO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-700" /> 1. Estrutura do Empreendimento
          </CardTitle>
          <CardDescription>Dimensionamento físico e volumetria do projeto.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numTorres">Nº de Torres</Label>
            <Input 
              id="numTorres" 
              type="number" 
              value={numTorres} 
              onChange={(e) => handleFieldChange(setNumTorres, e.target.value)} 
              placeholder="Ex: 2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numUnidades">Total Unidades</Label>
            <Input 
              id="numUnidades" 
              type="number" 
              value={numUnidades} 
              onChange={(e) => handleFieldChange(setNumUnidades, e.target.value)} 
              placeholder="Ex: 120"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numPavimentos">Pavimentos</Label>
            <Input 
              id="numPavimentos" 
              type="number" 
              value={numPavimentos} 
              onChange={(e) => handleFieldChange(setNumPavimentos, e.target.value)} 
              placeholder="Ex: 15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numElevadores">Elevadores</Label>
            <Input 
              id="numElevadores" 
              type="number" 
              value={numElevadores} 
              onChange={(e) => handleFieldChange(setNumElevadores, e.target.value)} 
              placeholder="Ex: 4"
            />
          </div>
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label htmlFor="areaTerreno">Área Terreno (m²)</Label>
            <Input 
              id="areaTerreno" 
              type="number" 
              value={areaTerreno} 
              onChange={(e) => handleFieldChange(setAreaTerreno, e.target.value)} 
              placeholder="Ex: 3500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. TIPOLOGIAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">2. Tipologias Residenciais</CardTitle>
          <CardDescription>Formatos habitacionais oferecidos no empreendimento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TIPOLOGIAS_RESIDENCIAIS.map((tip) => {
              const selected = tipologiasResidenciais.includes(tip);
              return (
                <Button
                  key={tip}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className={selected ? 'bg-slate-900 text-white' : 'text-slate-700'}
                  onClick={() => toggleArrayItem(tipologiasResidenciais, setTipologiasResidenciais, tip)}
                >
                  {tip}
                </Button>
              );
            })}
          </div>

          <div className="pt-2 border-t flex gap-2 max-w-md">
            <Input 
              value={customTipologia} 
              onChange={(e) => setCustomTipologia(e.target.value)} 
              placeholder="Outra tipologia personalizada..."
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleAddCustom(tipologiasResidenciais, setTipologiasResidenciais, customTipologia, setCustomTipologia)}
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {tipologiasResidenciais.filter(t => !DEFAULT_TIPOLOGIAS_RESIDENCIAIS.includes(t)).map(custom => (
              <Badge key={custom} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                {custom}
                <button type="button" onClick={() => toggleArrayItem(tipologiasResidenciais, setTipologiasResidenciais, custom)}>
                  <X className="w-3 h-3 text-slate-500 hover:text-red-600" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. ÁREAS E DIMENSÕES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">3. Áreas e Dimensões das Unidades</CardTitle>
          <CardDescription>Metragens e configurações internas padrão.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="areaMinima">Área Mínima (m²)</Label>
            <Input 
              id="areaMinima" 
              type="number" 
              value={areaMinima} 
              onChange={(e) => handleFieldChange(setAreaMinima, e.target.value)} 
              placeholder="Ex: 45"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="areaMaxima">Área Máxima (m²)</Label>
            <Input 
              id="areaMaxima" 
              type="number" 
              value={areaMaxima} 
              onChange={(e) => handleFieldChange(setAreaMaxima, e.target.value)} 
              placeholder="Ex: 140"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numQuartos">Nº de Quartos</Label>
            <Input 
              id="numQuartos" 
              value={numQuartos} 
              onChange={(e) => handleFieldChange(setNumQuartos, e.target.value)} 
              placeholder="Ex: 1 a 3 quartos"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suites">Suítes</Label>
            <Input 
              id="suites" 
              value={suites} 
              onChange={(e) => handleFieldChange(setSuites, e.target.value)} 
              placeholder="Ex: 1 a 2 suítes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vagasGaragem">Vagas de Garagem</Label>
            <Input 
              id="vagasGaragem" 
              value={vagasGaragem} 
              onChange={(e) => handleFieldChange(setVagasGaragem, e.target.value)} 
              placeholder="Ex: 1 ou 2 vagas"
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox 
              id="temVaranda" 
              checked={temVaranda} 
              onCheckedChange={(checked) => handleFieldChange(setTemVaranda, !!checked)} 
            />
            <Label htmlFor="temVaranda" className="text-sm font-medium leading-none cursor-pointer">
              Possui Varanda / Terraço Gourmet
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 4. LAZER E ÁREAS COMUNS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trees className="w-5 h-5 text-emerald-600" /> 4. Lazer e Áreas Comuns
          </CardTitle>
          <CardDescription>Infraestrutura de lazer entregue equipada e decorada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEFAULT_LAZER_ITENS.map((item) => {
              const active = lazerItens.includes(item);
              return (
                <div 
                  key={item}
                  onClick={() => toggleArrayItem(lazerItens, setLazerItens, item)}
                  className={`border rounded-lg p-3 text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-700 hover:border-slate-400'}`}
                >
                  <span>{item}</span>
                  {active && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t flex gap-2 max-w-md">
            <Input 
              value={customLazer} 
              onChange={(e) => setCustomLazer(e.target.value)} 
              placeholder="Outro item de lazer..."
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleAddCustom(lazerItens, setLazerItens, customLazer, setCustomLazer)}
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {lazerItens.filter(i => !DEFAULT_LAZER_ITENS.includes(i)).map(custom => (
              <Badge key={custom} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                {custom}
                <button type="button" onClick={() => toggleArrayItem(lazerItens, setLazerItens, custom)}>
                  <X className="w-3 h-3 text-slate-500 hover:text-red-600" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. DIFERENCIAIS ESPECÍFICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> 5. Diferenciais Arquitetônicos
          </CardTitle>
          <CardDescription>Atributos construtivos e de acabamento de destaque.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            rows={3}
            value={diferenciaisEspecificos} 
            onChange={(e) => handleFieldChange(setDiferenciaisEspecificos, e.target.value)} 
            placeholder="Ex: Fachada ventilada com revestimento aerado, pé-direito livre de 2.80m, isolamento acústico nas lajes entre andares..."
          />
        </CardContent>
      </Card>

      {/* 6. SUSTENTABILIDADE E TECNOLOGIA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> 6. Sustentabilidade e Tecnologia
          </CardTitle>
          <CardDescription>Inovações ecológicas e facilidades tecnológicas integradas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEFAULT_SUSTENTABILIDADE.map((item) => {
              const active = sustentabilidadeTecnologia.includes(item);
              return (
                <div 
                  key={item}
                  onClick={() => toggleArrayItem(sustentabilidadeTecnologia, setSustentabilidadeTecnologia, item)}
                  className={`border rounded-lg p-3 text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 hover:border-slate-400'}`}
                >
                  <span>{item}</span>
                  {active && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
