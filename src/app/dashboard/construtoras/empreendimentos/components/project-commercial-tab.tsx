'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProjectCommercialServer } from '../actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle, AlertCircle, Plus, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectCommercialTabProps {
  project: {
    id: string;
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
  };
}

const DEFAULT_TIPOLOGIAS = ['Studio', '1 Dormitório', '2 Dormitórios', '3 Dormitórios', '4 Dormitórios', 'Cobertura', 'Duplex', 'Loft', 'Garden'];

export default function ProjectCommercialTab({ project }: ProjectCommercialTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form states
  const [tituloComercial, setTituloComercial] = useState(project.tituloComercial || '');
  const [subtituloComercial, setSubtituloComercial] = useState(project.subtituloComercial || '');
  const [precoInicial, setPrecoInicial] = useState(project.precoInicial ? String(project.precoInicial) : '');
  const [precoMaximo, setPrecoMaximo] = useState(project.precoMaximo ? String(project.precoMaximo) : '');
  const [valorMetroQuadrado, setValorMetroQuadrado] = useState(project.valorMetroQuadrado ? String(project.valorMetroQuadrado) : '');
  
  const [tipologias, setTipologias] = useState<string[]>(project.tipologias || ['2 Dormitórios']);
  const [customTipologia, setCustomTipologia] = useState('');

  const [condicoesComerciais, setCondicoesComerciais] = useState(project.condicoesComerciais || '');
  const [diferenciaisCorretor, setDiferenciaisCorretor] = useState(project.diferenciaisCorretor || '');
  const [argumentosVenda, setArgumentosVenda] = useState(project.argumentosVenda || '');
  const [observacoesComerciais, setObservacoesComerciais] = useState(project.observacoesComerciais || '');

  const handleFieldChange = (setter: any, value: any) => {
    setter(value);
    setIsDirty(true);
  };

  const handleAddTipologia = (tip: string) => {
    if (!tipologias.includes(tip)) {
      setTipologias([...tipologias, tip]);
      setIsDirty(true);
    }
  };

  const handleRemoveTipologia = (tip: string) => {
    setTipologias(tipologias.filter(t => t !== tip));
    setIsDirty(true);
  };

  const handleAddCustomTipologia = () => {
    if (customTipologia.trim() && !tipologias.includes(customTipologia.trim())) {
      setTipologias([...tipologias, customTipologia.trim()]);
      setCustomTipologia('');
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
      await updateProjectCommercialServer(project.id, {
        tituloComercial,
        subtituloComercial,
        precoInicial: precoInicial ? Number(precoInicial) : undefined,
        precoMaximo: precoMaximo ? Number(precoMaximo) : undefined,
        valorMetroQuadrado: valorMetroQuadrado ? Number(valorMetroQuadrado) : undefined,
        tipologias,
        condicoesComerciais,
        diferenciaisCorretor,
        argumentosVenda,
        observacoesComerciais,
        idToken,
      });

      setIsDirty(false);
      toast({ title: 'Salvo com sucesso!', description: 'As informações comerciais foram atualizadas.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save bar floating or top */}
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

      {/* 1. POSICIONAMENTO COMERCIAL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">1. Posicionamento Comercial</CardTitle>
          <CardDescription>Defina os títulos de destaque e chamadas de venda para os materiais de lançamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tituloComercial">Título Comercial</Label>
            <Input 
              id="tituloComercial" 
              value={tituloComercial} 
              onChange={(e) => handleFieldChange(setTituloComercial, e.target.value)} 
              placeholder="Ex: Lançamento Exclusivo Beira Mar em Balneário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtituloComercial">Subtítulo / Chamada Comercial</Label>
            <Input 
              id="subtituloComercial" 
              value={subtituloComercial} 
              onChange={(e) => handleFieldChange(setSubtituloComercial, e.target.value)} 
              placeholder="Ex: Unidades de 2 e 3 dormitórios com alto padrão de acabamento"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. VALORES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">2. Valores</CardTitle>
          <CardDescription>Faixa de preços orientativa para investidores e corretores.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="precoInicial">Preço Inicial (A partir de R$)</Label>
            <Input 
              id="precoInicial" 
              type="number" 
              value={precoInicial} 
              onChange={(e) => handleFieldChange(setPrecoInicial, e.target.value)} 
              placeholder="Ex: 350000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="precoMaximo">Preço Máximo (Até R$)</Label>
            <Input 
              id="precoMaximo" 
              type="number" 
              value={precoMaximo} 
              onChange={(e) => handleFieldChange(setPrecoMaximo, e.target.value)} 
              placeholder="Ex: 1200000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMetroQuadrado">Valor Estimado do m² (R$)</Label>
            <Input 
              id="valorMetroQuadrado" 
              type="number" 
              value={valorMetroQuadrado} 
              onChange={(e) => handleFieldChange(setValorMetroQuadrado, e.target.value)} 
              placeholder="Ex: 8500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. TIPOLOGIAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">3. Tipologias</CardTitle>
          <CardDescription>Selecione ou adicione as tipologias de plantas oferecidas neste empreendimento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tipologias.map((tip) => (
              <Badge key={tip} variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2 bg-slate-100 text-slate-800">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                {tip}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTipologia(tip)}
                  className="text-slate-400 hover:text-red-600 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
            {tipologias.length === 0 && (
              <p className="text-sm text-slate-500 italic">Nenhuma tipologia selecionada.</p>
            )}
          </div>

          <div className="pt-2 border-t">
            <Label className="text-xs text-slate-500 mb-2 block">Sugestões rápidas:</Label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {DEFAULT_TIPOLOGIAS.filter(t => !tipologias.includes(t)).map((t) => (
                <Button 
                  key={t} 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={() => handleAddTipologia(t)}
                >
                  <Plus className="w-3 h-3 mr-1" /> {t}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <Input 
                value={customTipologia} 
                onChange={(e) => setCustomTipologia(e.target.value)} 
                placeholder="Outra tipologia personalizada..."
              />
              <Button type="button" variant="secondary" onClick={handleAddCustomTipologia}>
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. CONDIÇÕES COMERCIAIS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">4. Condições Comerciais</CardTitle>
          <CardDescription>Orientações sobre fluxo de pagamento, parcelamento direto e financiamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condicoesComerciais">Resumo das Condições</Label>
            <Textarea 
              id="condicoesComerciais" 
              rows={4}
              value={condicoesComerciais} 
              onChange={(e) => handleFieldChange(setCondicoesComerciais, e.target.value)} 
              placeholder="Ex: Entrada facilitada em até 36x direto com a construtora, saldo via financiamento bancário após a entrega..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. INFORMAÇÕES PARA O CORRETOR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">5. Informações Exclusivas para Corretores</CardTitle>
          <CardDescription>Argumentos de venda e diferenciais estratégicos para equipar a força de vendas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="argumentosVenda">Argumentos Principais de Venda</Label>
            <Textarea 
              id="argumentosVenda" 
              rows={3}
              value={argumentosVenda} 
              onChange={(e) => handleFieldChange(setArgumentosVenda, e.target.value)} 
              placeholder="Ex: Alta valorização na região, acabamento em porcelanato retificado, rooftop com piscina aquecida..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diferenciaisCorretor">Diferenciais Competitivos</Label>
            <Input 
              id="diferenciaisCorretor" 
              value={diferenciaisCorretor} 
              onChange={(e) => handleFieldChange(setDiferenciaisCorretor, e.target.value)} 
              placeholder="Ex: Portaria blindada 24h, vagas com infraestrutura para carros elétricos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoesComerciais">Observações Operacionais / Comissão</Label>
            <Textarea 
              id="observacoesComerciais" 
              rows={2}
              value={observacoesComerciais} 
              onChange={(e) => handleFieldChange(setObservacoesComerciais, e.target.value)} 
              placeholder="Ex: Tabelas sujeitas a alteração sem aviso prévio. Comissão padrão de mercado..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
