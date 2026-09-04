'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useUser } from '@/firebase';
import { createConstructorLeadAction, listConstructorPropertiesAction, listConstructorProjectsAction } from './actions.server';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewLeadFormProps {
  constructorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewLeadForm({ constructorId, onSuccess, onCancel }: NewLeadFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [properties, setProperties] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [searchPropertyTerm, setSearchPropertyTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const idToken = user ? await user.getIdToken() : undefined;
        const [props, projs] = await Promise.all([
          listConstructorPropertiesAction(constructorId, idToken),
          listConstructorProjectsAction(constructorId, idToken),
        ]);
        setProperties(props || []);
        setProjects(projs || []);
      } catch (err) {
        console.error('Erro ao carregar imóveis/empreendimentos:', err);
      }
    }
    loadData();
  }, [constructorId, user]);

  const filteredProperties = properties.filter(p => {
    const title = p.informacoesbasicas?.nome || p.informacoesbasicas?.titulo || p.title || p.name || '';
    const code = p.codigo || p.id || '';
    const matchesSearch = title.toLowerCase().includes(searchPropertyTerm.toLowerCase()) || 
                          code.toLowerCase().includes(searchPropertyTerm.toLowerCase());
    const matchesProject = selectedProjectId ? (p.projectId === selectedProjectId) : true;
    return matchesSearch && matchesProject;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    // Find property names for reference
    const selectedProps = properties.filter(p => selectedPropertyIds.includes(p.id));
    const propertyNamesSummary = selectedProps.map(p => p.informacoesbasicas?.nome || p.informacoesbasicas?.titulo || p.title || p.id).join(', ');

    const data = {
      // Dados Pessoais
      name: formData.get('name') as string,
      cpf: formData.get('cpf') as string,
      birthDate: formData.get('birthDate') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string,
      maritalStatus: formData.get('maritalStatus') as string,
      profession: formData.get('profession') as string,

      // Perfil de Compra
      purpose: formData.get('purpose') as string,
      dealValue: formData.get('dealValue') ? Number(formData.get('dealValue')) : 0,
      paymentMethod: formData.get('paymentMethod') as string,
      hasProperty: formData.get('hasProperty') === 'true',
      intendsToFinance: formData.get('intendsToFinance') === 'true',
      purchaseTimeline: formData.get('purchaseTimeline') as string,

      // Interesse Imobiliário
      projectId: selectedProjectId,
      propertyIds: selectedPropertyIds,
      propertyName: propertyNamesSummary || (formData.get('propertyName') as string),
      desiredCharacteristics: formData.get('desiredCharacteristics') as string,
      priceRange: formData.get('priceRange') as string,

      // Atendimento
      brokerId: formData.get('brokerId') as string,
      leadOrigin: formData.get('leadOrigin') as string,
      status: formData.get('status') || 'new',
      dealStatus: 'open',
      nextAction: formData.get('nextAction') as string,
      notes: formData.get('notes') as string,
    };

    try {
      const idToken = user ? await user.getIdToken() : undefined;
      await createConstructorLeadAction(constructorId, data, idToken);
      router.refresh();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-text-main">Adicionar cliente</h2>
            <p className="text-xs text-text-secondary mt-0.5">Preencha o cadastro comercial completo do cliente.</p>
          </div>
          <button onClick={onCancel} className="text-text-secondary hover:text-text-main text-lg font-bold px-2 py-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

          {/* SEÇÃO 1: DADOS PESSOAIS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">1. Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" name="name" required placeholder="Nome completo do cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" name="birthDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Estado Civil</Label>
                <select id="maritalStatus" name="maritalStatus" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="">Selecione...</option>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profession">Profissão</Label>
                <Input id="profession" name="profession" placeholder="Ex: Engenheiro, Médico, Empresário..." />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: PERFIL DE COMPRA */}
          <div className="space-y-4 pt-4 border-t border-card-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">2. Perfil de Compra</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Finalidade da Compra</Label>
                <select id="purpose" name="purpose" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="">Selecione...</option>
                  <option value="moradia">Moradia</option>
                  <option value="investimento">Investimento</option>
                  <option value="lazer">Lazer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealValue">Faixa de Valor / Orçamento (R$)</Label>
                <Input id="dealValue" name="dealValue" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <select id="paymentMethod" name="paymentMethod" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="">Selecione...</option>
                  <option value="financiamento">Financiamento Bancário</option>
                  <option value="a_vista">À Vista</option>
                  <option value="parcelado">Parcelado Direto</option>
                  <option value="consorcio">Consórcio</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hasProperty">Possui Imóvel Atualmente?</Label>
                <select id="hasProperty" name="hasProperty" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intendsToFinance">Pretende Financiar?</Label>
                <select id="intendsToFinance" name="intendsToFinance" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseTimeline">Previsão de Compra</Label>
                <select id="purchaseTimeline" name="purchaseTimeline" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="">Selecione...</option>
                  <option value="imediato">Imediato</option>
                  <option value="3_meses">Até 3 meses</option>
                  <option value="6_meses">Até 6 meses</option>
                  <option value="mais_6_meses">Mais de 6 meses</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: INTERESSE IMOBILIÁRIO */}
          <div className="space-y-4 pt-4 border-t border-card-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">3. Interesse Imobiliário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Empreendimento</Label>
                <select 
                  id="projectId" 
                  name="projectId" 
                  value={selectedProjectId} 
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm"
                >
                  <option value="">Todos os empreendimentos</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name || proj.tituloComercial || proj.id}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceRange">Faixa de Preço</Label>
                <Input id="priceRange" name="priceRange" placeholder="Ex: R$ 300k - R$ 500k" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desiredCharacteristics">Características Desejadas</Label>
                <Input id="desiredCharacteristics" name="desiredCharacteristics" placeholder="Ex: 2 dormitórios, suíte, sol da manhã, andar alto..." />
              </div>
            </div>

            {/* Seletor de Imóveis da Construtora */}
            <div className="space-y-3 pt-2">
              <div>
                <Label className="font-semibold text-text-main">Imóveis de interesse</Label>
                <p className="text-xs text-text-secondary">Selecione os imóveis pelos quais este cliente demonstrou interesse.</p>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <Input 
                  placeholder="Pesquisar imóvel por nome ou código..." 
                  value={searchPropertyTerm}
                  onChange={(e) => setSearchPropertyTerm(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              
              <div className="max-h-48 overflow-y-auto border border-card-border rounded-lg p-3 space-y-2 bg-gray-50/50">
                {filteredProperties.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-4">Nenhum imóvel encontrado para seleção.</p>
                ) : (
                  filteredProperties.map(prop => {
                    const isSelected = selectedPropertyIds.includes(prop.id);
                    const title = prop.informacoesbasicas?.nome || prop.informacoesbasicas?.titulo || prop.title || prop.name || `Imóvel #${prop.id.slice(-6)}`;
                    const price = prop.preco || prop.valor || prop.precoVenda || 0;
                    return (
                      <div 
                        key={prop.id} 
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== prop.id));
                          } else {
                            setSelectedPropertyIds([...selectedPropertyIds, prop.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary text-primary font-medium' : 'bg-white border-card-border hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => {}} 
                            className="rounded border-card-border text-primary focus:ring-primary"
                          />
                          <div>
                            <div className="text-sm text-text-main">{title}</div>
                            <div className="text-xs text-text-secondary">Código: {prop.codigo || prop.id}</div>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-text-main">
                          {price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price) : 'Sob consulta'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedPropertyIds.length > 0 && (
                <div className="text-xs text-primary font-medium">
                  Imóveis selecionados: {selectedPropertyIds.length} imóvel(is) vinculado(s).
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 4: ATENDIMENTO */}
          <div className="space-y-4 pt-4 border-t border-card-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">4. Atendimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brokerId">Corretor Responsável</Label>
                <Input id="brokerId" name="brokerId" placeholder="Nome ou ID do corretor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadOrigin">Origem do Lead</Label>
                <select id="leadOrigin" name="leadOrigin" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="site">Site Institucional</option>
                  <option value="portal">Portal / Parceria</option>
                  <option value="plantao">Plantão de Vendas</option>
                  <option value="indicacao">Indicação</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status do Lead</Label>
                <select id="status" name="status" defaultValue="new" className="w-full h-10 px-3 rounded-md border border-card-border bg-white text-sm">
                  <option value="new">Novo</option>
                  <option value="contacted">Em Contato</option>
                  <option value="qualified">Qualificado</option>
                  <option value="proposal">Proposta</option>
                  <option value="negotiation">Negociação</option>
                  <option value="closed">Fechado / Ganho</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="nextAction">Próxima Ação</Label>
                <Input id="nextAction" name="nextAction" placeholder="Ex: Ligar na terça-feira para agendar visita ao decorado..." />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="notes">Observações</Label>
                <textarea id="notes" name="notes" rows={3} placeholder="Anotações gerais sobre o atendimento..." className="w-full p-3 rounded-md border border-card-border bg-white text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-card-border bg-gray-50 px-6 py-4 -mx-6 -mb-6">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? 'Salvando...' : 'Adicionar cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

