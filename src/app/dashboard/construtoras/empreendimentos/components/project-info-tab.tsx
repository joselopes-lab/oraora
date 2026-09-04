'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProjectFullServer } from '../actions.server';
import locationData from '@/lib/location-data.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

interface ProjectInfoTabProps {
  project: {
    id: string;
    name: string;
    status?: string;
    standard?: string;
    vgvEstimado?: number;
    percentualObra?: number;
    dataEntregaEstimada?: string;
    descricaoCurta?: string;
    descricaoCompleta?: string;
    localizacao?: {
      estado: string;
      cidade: string;
      bairro: string;
      address?: string;
      cep?: string;
    };
  };
  onUpdateSuccess?: () => void;
}

export default function ProjectInfoTab({ project }: ProjectInfoTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form states
  const [name, setName] = useState(project.name || '');
  const [status, setStatus] = useState(project.status || 'lancamento');
  const [standard, setStandard] = useState(project.standard || 'medio_padrao');

  const [estado, setEstado] = useState(project.localizacao?.estado || '');
  const [cidade, setCidade] = useState(project.localizacao?.cidade || '');
  const [bairro, setBairro] = useState(project.localizacao?.bairro || '');
  const [address, setAddress] = useState(project.localizacao?.address || '');
  const [cep, setCep] = useState(project.localizacao?.cep || '');

  const [vgvEstimado, setVgvEstimado] = useState(project.vgvEstimado ? String(project.vgvEstimado) : '');
  const [percentualObra, setPercentualObra] = useState(project.percentualObra !== undefined ? String(project.percentualObra) : '0');
  const [dataEntregaEstimada, setDataEntregaEstimada] = useState(project.dataEntregaEstimada || '');

  const [descricaoCurta, setDescricaoCurta] = useState(project.descricaoCurta || '');
  const [descricaoCompleta, setDescricaoCompleta] = useState(project.descricaoCompleta || '');

  const states = locationData.states;
  const selectedStateObj = states.find(s => s.uf === estado || s.name === estado);
  const availableCities = selectedStateObj?.cities || [];
  const selectedCityObj = availableCities.find(c => c.name === cidade);
  const availableNeighborhoods = selectedCityObj?.neighborhoods || [];

  const handleFieldChange = (setter: any, value: any) => {
    setter(value);
    setIsDirty(true);
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await updateProjectFullServer(project.id, {
        name,
        status,
        standard,
        vgvEstimado: vgvEstimado ? Number(vgvEstimado) : undefined,
        percentualObra: percentualObra !== '' ? Number(percentualObra) : undefined,
        dataEntregaEstimada,
        descricaoCurta,
        descricaoCompleta,
        localizacao: {
          estado,
          cidade,
          bairro,
          address,
          cep,
        },
        idToken,
      });

      setIsDirty(false);
      toast({ title: 'Salvo com sucesso!', description: 'As informações do empreendimento foram atualizadas.' });
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

      {/* 1. IDENTIFICAÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">1. Identificação</CardTitle>
          <CardDescription>Nome oficial, estágio atual de vendas e padrão do empreendimento.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="name">Nome do Empreendimento</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => handleFieldChange(setName, e.target.value)} 
              placeholder="Ex: Residencial Horizon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status do Empreendimento</Label>
            <Select value={status} onValueChange={(val) => handleFieldChange(setStatus, val)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breve_lancamento">Breve Lançamento</SelectItem>
                <SelectItem value="lancamento">Lançamento</SelectItem>
                <SelectItem value="em_obras">Em Obras</SelectItem>
                <SelectItem value="pronto">Pronto para Morar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="standard">Padrão Construtivo</Label>
            <Select value={standard} onValueChange={(val) => handleFieldChange(setStandard, val)}>
              <SelectTrigger id="standard">
                <SelectValue placeholder="Selecione o padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economico">Econômico / Minha Casa Minha Vida</SelectItem>
                <SelectItem value="medio_padrao">Médio Padrão</SelectItem>
                <SelectItem value="alto_padrao">Alto Padrão / Luxo</SelectItem>
                <SelectItem value="altissimo_padrao">Altíssimo Padrão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 2. LOCALIZAÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">2. Localização</CardTitle>
          <CardDescription>Endereço completo estruturado para SEO e mapas.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estado">Estado (UF)</Label>
            <select 
              id="estado"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              value={estado} 
              onChange={(e) => {
                handleFieldChange(setEstado, e.target.value);
                setCidade('');
                setBairro('');
              }}
            >
              <option value="">Selecione o estado...</option>
              {states.map(s => <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <select 
              id="cidade"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              value={cidade} 
              disabled={!estado}
              onChange={(e) => {
                handleFieldChange(setCidade, e.target.value);
                setBairro('');
              }}
            >
              <option value="">Selecione a cidade...</option>
              {availableCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <select 
              id="bairro"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              value={bairro} 
              disabled={!cidade}
              onChange={(e) => handleFieldChange(setBairro, e.target.value)}
            >
              <option value="">Selecione o bairro...</option>
              {availableNeighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Endereço (Rua, Número)</Label>
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => handleFieldChange(setAddress, e.target.value)} 
              placeholder="Ex: Av. Beira Mar, 1500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input 
              id="cep" 
              value={cep} 
              onChange={(e) => handleFieldChange(setCep, e.target.value)} 
              placeholder="00000-000"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. FICHA DO EMPREENDIMENTO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">3. Ficha do Empreendimento</CardTitle>
          <CardDescription>Métricas financeiras e cronograma da obra.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vgv">VGV Estimado (R$)</Label>
            <Input 
              id="vgv" 
              type="number" 
              value={vgvEstimado} 
              onChange={(e) => handleFieldChange(setVgvEstimado, e.target.value)} 
              placeholder="Ex: 45000000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentualObra">Avanço da Obra (%)</Label>
            <Input 
              id="percentualObra" 
              type="number" 
              min="0" 
              max="100" 
              value={percentualObra} 
              onChange={(e) => handleFieldChange(setPercentualObra, e.target.value)} 
              placeholder="Ex: 25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataEntrega">Previsão de Entrega</Label>
            <Input 
              id="dataEntrega" 
              value={dataEntregaEstimada} 
              onChange={(e) => handleFieldChange(setDataEntregaEstimada, e.target.value)} 
              placeholder="Ex: Dezembro / 2027"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. APRESENTAÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">4. Apresenação</CardTitle>
          <CardDescription>Textos promocionais para portais e materiais de divulgação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricaoCurta">Descrição Curta (Resumo)</Label>
            <Input 
              id="descricaoCurta" 
              value={descricaoCurta} 
              onChange={(e) => handleFieldChange(setDescricaoCurta, e.target.value)} 
              placeholder="Uma frase marcante sobre o projeto (ex: Vista eterna para o mar com lazer completo)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoCompleta">Descrição Completa</Label>
            <Textarea 
              id="descricaoCompleta" 
              rows={5}
              value={descricaoCompleta} 
              onChange={(e) => handleFieldChange(setDescricaoCompleta, e.target.value)} 
              placeholder="Detalhe o conceito do empreendimento, diferenciais de arquitetura, acabamento e localização..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
