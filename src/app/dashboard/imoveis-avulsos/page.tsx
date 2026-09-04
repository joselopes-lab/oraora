'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { useUser } from '@/firebase';
import { getNetworkPropertiesServer, getMySelectedNetworkPropertiesServer, addPropertyToOperationServer, removePropertyFromOperationServer } from './actions.server';
import { useToast } from "@/hooks/use-toast";

type NetworkProperty = {
  id: string;
  existsInOriginal?: boolean;
  informacoesbasicas?: {
    nome?: string;
    status?: string;
    valor?: number;
    aluguel?: number;
  };
  localizacao?: {
    cidade?: string;
    estado?: string;
  };
  midia?: string[];
  title?: string;
  nome?: string;
  basicInfo?: {
    title?: string;
  };
  createdAt?: any;
};

export default function ImoveisAvulsosPage() {
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'catalog' | 'operation'>('catalog');
  const [properties, setProperties] = useState<NetworkProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [operationProperties, setOperationProperties] = useState<NetworkProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const { toast } = useToast();

  const availableCities = useMemo(() => {
    const cityMap = new Map<string, { city: string; state: string; label: string; value: string }>();
    properties.forEach(prop => {
      const city = prop.localizacao?.cidade || (prop as any).localizacao?.city || '';
      const state = prop.localizacao?.estado || (prop as any).localizacao?.state || '';
      if (city.trim()) {
        const cityTrimmed = city.trim();
        const stateTrimmed = state.trim().toUpperCase();
        const value = stateTrimmed ? `${cityTrimmed}_${stateTrimmed}` : cityTrimmed;
        const label = stateTrimmed ? `${cityTrimmed} (${stateTrimmed})` : cityTrimmed;
        if (!cityMap.has(value.toLowerCase())) {
          cityMap.set(value.toLowerCase(), { city: cityTrimmed, state: stateTrimmed, label, value });
        }
      }
    });
    return Array.from(cityMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [properties]);

  const loadData = async () => {
    if (!user || isUserLoading) return;
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await getNetworkPropertiesServer({ idToken });
      setProperties(res.properties || []);
      setSelectedIds(res.selectedPropertyIds || []);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar imóveis",
        description: err.message || "Não foi possível carregar os imóveis avulsos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOperationData = async () => {
    if (!user || isUserLoading) return;
    setIsOperationLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await getMySelectedNetworkPropertiesServer({ idToken });
      setOperationProperties(res.properties || []);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar sua operação",
        description: err.message || "Não foi possível carregar os imóveis selecionados.",
        variant: "destructive",
      });
    } finally {
      setIsOperationLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      loadData();
    }
  }, [user, isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && user && activeTab === 'operation') {
      loadOperationData();
    }
  }, [activeTab, user, isUserLoading]);

  const getPropertyName = (property: NetworkProperty) => {
    return property.informacoesbasicas?.nome || property.title || property.nome || property.basicInfo?.title || "Imóvel sem título";
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      const name = getPropertyName(prop).toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const city = prop.localizacao?.cidade || (prop as any).localizacao?.city || '';
      const state = prop.localizacao?.estado || (prop as any).localizacao?.state || '';
      const stateTrimmed = state.trim().toUpperCase();
      const cityTrimmed = city.trim();
      const propValue = stateTrimmed ? `${cityTrimmed}_${stateTrimmed}` : cityTrimmed;
      const matchesCity = selectedCity ? propValue.toLowerCase() === selectedCity.toLowerCase() : true;
      return matchesSearch && matchesCity;
    });
  }, [properties, searchTerm, selectedCity]);

  const handleToggleSelect = async (propertyId: string, isCurrentlySelected: boolean) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      if (isCurrentlySelected) {
        await removePropertyFromOperationServer(propertyId, idToken);
        setSelectedIds(prev => prev.filter(id => id !== propertyId));
        setOperationProperties(prev => prev.filter(p => p.id !== propertyId));
        toast({
          title: "Imóvel Removido",
          description: "O imóvel foi removido da sua operação.",
        });
      } else {
        await addPropertyToOperationServer(propertyId, idToken);
        setSelectedIds(prev => [...prev, propertyId]);
        toast({
          title: "Imóvel Adicionado",
          description: "O imóvel foi adicionado com sucesso à sua operação.",
        });
        // Recarregar operação se necessário
        loadOperationData();
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao atualizar operação.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromOperation = async (propertyId: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await removePropertyFromOperationServer(propertyId, idToken);
      setSelectedIds(prev => prev.filter(id => id !== propertyId));
      setOperationProperties(prev => prev.filter(p => p.id !== propertyId));
      toast({
        title: "Imóvel Removido",
        description: "O imóvel foi removido com sucesso da sua operação.",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao remover imóvel.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Carregando imóveis avulsos disponíveis...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Imóveis Avulsos</h1>
          <p className="text-text-secondary mt-1">Gerencie os imóveis disponíveis na rede e sua operação comercial.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'catalog' ? 'bg-white text-text-main shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
          >
            Catálogo Disponível ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('operation')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'operation' ? 'bg-white text-text-main shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
          >
            Minha Operação ({selectedIds.length})
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
            <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
              Filtros de Busca
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome do Imóvel</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                  <input 
                    className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" 
                    placeholder="Buscar por nome..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Cidade</label>
                <div className="relative">
                  <select 
                    className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {availableCities.map(item => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela / Listagem do Catálogo */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                    <TableHead className="px-6 py-4 font-semibold">Imóvel</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-right">Ação na Operação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 text-sm">
                  {filteredProperties && filteredProperties.length > 0 ? (
                    filteredProperties.map(property => {
                      const isSelected = selectedIds.includes(property.id);
                      const name = getPropertyName(property);
                      const city = property.localizacao?.cidade || 'Local não informado';
                      const state = property.localizacao?.estado || '';
                      const status = property.informacoesbasicas?.status || 'Disponível';
                      const price = property.informacoesbasicas?.aluguel || property.informacoesbasicas?.valor;

                      return (
                        <TableRow key={property.id} className="group hover:bg-background-light transition-colors">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-100 relative">
                                <Image 
                                  alt={name} 
                                  className="h-full w-full object-cover" 
                                  src={property.midia?.[0] || 'https://picsum.photos/seed/property/100/100'} 
                                  width={96} 
                                  height={64} 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-text-main text-base">{name}</p>
                                <p className="text-text-secondary text-xs">{city}{state ? `, ${state}` : ''}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">{status}</span>
                                  <span>•</span>
                                  <span>{price ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Valor sob consulta'}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {isSelected ? (
                              <div className="flex items-center justify-end gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                  Adicionado
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  onClick={() => handleToggleSelect(property.id, true)}
                                >
                                  Remover
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                className="bg-primary hover:bg-primary/90 text-white font-medium"
                                onClick={() => handleToggleSelect(property.id, false)}
                              >
                                <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
                                Adicionar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center p-12 text-text-secondary">
                        <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">apartment</span>
                        <h4 className="font-bold text-lg text-text-main">Nenhum imóvel avulso disponível no momento.</h4>
                        <p className="text-sm mt-1">Novos imóveis estarão disponíveis em breve.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'operation' && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-main">Imóveis na Minha Operação</h3>
              <p className="text-xs text-text-secondary mt-0.5">Estes são os imóveis da rede que você selecionou para comercializar.</p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{operationProperties.length} imóveis</span>
          </div>

          {isOperationLoading ? (
            <div className="p-12 text-center text-text-secondary">Carregando sua operação...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                    <TableHead className="px-6 py-4 font-semibold">Imóvel</TableHead>
                    <TableHead className="px-6 py-4 font-semibold">Status do Vínculo</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 text-sm">
                  {operationProperties && operationProperties.length > 0 ? (
                    operationProperties.map(property => {
                      const name = getPropertyName(property);
                      const city = property.localizacao?.cidade || 'Local não informado';
                      const state = property.localizacao?.estado || '';
                      const price = property.informacoesbasicas?.aluguel || property.informacoesbasicas?.valor;
                      const exists = property.existsInOriginal !== false;

                      return (
                        <TableRow key={property.id} className="group hover:bg-background-light transition-colors">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-100 relative">
                                <Image 
                                  alt={name} 
                                  className="h-full w-full object-cover" 
                                  src={property.midia?.[0] || 'https://picsum.photos/seed/property/100/100'} 
                                  width={96} 
                                  height={64} 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-text-main text-base">{name}</p>
                                <p className="text-text-secondary text-xs">{city}{state ? `, ${state}` : ''}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                                  <span>{price ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Valor sob consulta'}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {exists ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Disponível na Rede
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                Indisponível no Catálogo Original
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleRemoveFromOperation(property.id)}
                            >
                              Remover da Operação
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center p-12 text-text-secondary">
                        <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">work_outline</span>
                        <h4 className="font-bold text-lg text-text-main">Sua operação de imóveis avulsos está vazia.</h4>
                        <p className="text-sm mt-1">Navegue pelo catálogo disponível e adicione imóveis à sua operação.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
