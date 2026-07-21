'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle,
  MapPin,
  Search,
  Zap,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    slug?: string;
    transactionTypes?: string[];
  };
  midia: string[];
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
  };
  personaIds?: string[];
};

type Lead = {
  id: string;
  name: string;
  propertyInterest?: string;
  personaIds?: string[];
  phone: string;
};

type Persona = {
  id: string;
  name: string;
  icon: string;
  iconBackgroundColor: string;
};

export default function RadarOportunidadesPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('all');
  const [searchProperty, setSearchProperty] = useState('');
  const [filterPersonaId, setFilterPersonaId] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Fetch de Dados do Usuário (Demand Side) - Usando Leads e Personas existentes
  const leadsQuery = useMemoFirebase(
    () => (firestore && user?.uid && isReady ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null),
    [firestore, user?.uid, isReady]
  );
  const { data: myLeads } = useCollection<Lead>(leadsQuery);

  const personasQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'personas')) : null),
    [firestore]
  );
  const { data: allPersonas } = useCollection<Persona>(personasQuery);

  // 2. Fetch de Inventário da Rede (Supply Side)
  const globalPropertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true)) : null),
    [firestore]
  );
  const { data: globalProperties, isLoading: areGlobalLoading } = useCollection<Property>(globalPropertiesQuery);

  const partnerPropertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'brokerProperties'), where('isVisibleOnSite', '==', true)) : null),
    [firestore]
  );
  const { data: partnerProperties, isLoading: arePartnerLoading } = useCollection<Property>(partnerPropertiesQuery);

  // Consolidação do Inventário (Exclui os próprios imóveis do corretor para focar em parcerias)
  const allAvailableProperties = useMemo(() => {
    const combined = [...(globalProperties || []), ...(partnerProperties || [])];
    const unique = new Map();
    combined.forEach(p => {
        if (p.brokerId !== user?.uid) {
            unique.set(p.id, p);
        }
    });
    return Array.from(unique.values());
  }, [globalProperties, partnerProperties, user?.uid]);

  // 3. Lógica de Match (Cruzamento de Personas do Lead vs Ativos da Rede)
  const opportunities = useMemo(() => {
    let list = allAvailableProperties;

    if (selectedLeadId !== 'all') {
        const lead = myLeads?.find(l => l.id === selectedLeadId);
        if (lead?.personaIds && lead.personaIds.length > 0) {
            // Match por Persona do Lead
            list = list.filter(p => p.personaIds?.some(pid => lead.personaIds?.includes(pid)));
        } else {
            // Se o lead não tem persona, não há match automático
            return [];
        }
    } 
    else if (filterPersonaId !== 'all') {
        list = list.filter(p => p.personaIds?.includes(filterPersonaId));
    }

    if (searchProperty) {
        const term = searchProperty.toLowerCase();
        list = list.filter(p => 
            p.informacoesbasicas.nome.toLowerCase().includes(term) ||
            p.localizacao.bairro.toLowerCase().includes(term)
        );
    }

    return list;
  }, [allAvailableProperties, selectedLeadId, filterPersonaId, myLeads, searchProperty]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLeadId, filterPersonaId, searchProperty]);

  const totalPages = Math.ceil(opportunities.length / itemsPerPage);
  const paginatedOpportunities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return opportunities.slice(start, start + itemsPerPage);
  }, [opportunities, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShareWithLead = (prop: Property) => {
    const lead = myLeads?.find(l => l.id === selectedLeadId);
    if (!lead) {
        toast({ title: "Atenção", description: "Selecione um cliente no topo para compartilhar com o match correto." });
        return;
    }
    
    const propertyUrl = `https://oraora.com.br/imoveis/${prop.informacoesbasicas.slug || prop.id}`;
    const message = encodeURIComponent(`Olá ${lead.name}! Encontrei este imóvel no Radar que combina muito com o seu perfil: *${prop.informacoesbasicas.nome}* em ${prop.localizacao.bairro}.\n\nConfira os detalhes aqui: ${propertyUrl}`);
    
    const cleanPhone = lead.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const isLoading = areGlobalLoading || arePartnerLoading || !isReady;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 text-left pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">Radar de Oportunidades</h1>
          <p className="text-slate-500 text-lg font-body">Cruzamento inteligente entre seus leads e o inventário de toda a rede.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="h-12 px-6 bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20 flex items-center gap-2 border-none cursor-pointer">
            <Link href="/dashboard/clientes/nova">
              <PlusCircle className="size-4" />
              Novo Lead
            </Link>
          </Button>
        </div>
      </header>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">1. Qual cliente você quer atender?</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none">
                        <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Ver Tudo (Geral)</SelectItem>
                        {myLeads?.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">2. Filtrar por Perfil (Persona)</Label>
                <Select 
                    value={filterPersonaId} 
                    onValueChange={setFilterPersonaId} 
                    disabled={selectedLeadId !== 'all'}
                >
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none">
                        <SelectValue placeholder="Selecione uma persona..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Personas</SelectItem>
                        {allPersonas?.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">3. Busca Rápida no Inventário</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                    <Input 
                        value={searchProperty}
                        onChange={e => setSearchProperty(e.target.value)}
                        placeholder="Nome ou bairro..." 
                        className="pl-10 h-12 bg-slate-50 border-none rounded-xl"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
             <Zap className="size-5 text-primary fill-current" />
             {opportunities.length} Oportunidades Encontradas
           </h2>
           <Badge variant="outline" className="bg-slate-50 border-slate-200 font-bold px-3 py-1">
             Rede Oraora Ativa
           </Badge>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)
          ) : paginatedOpportunities.map((prop) => {
              const isPartner = !!prop.brokerId;
              const isProject = !prop.brokerId;
              
              return (
                  <div key={prop.id} className="bg-white rounded-2xl overflow-hidden shadow-soft border border-slate-100 hover:border-primary/40 transition-all flex flex-col group h-full">
                      <div className="relative h-48 w-full overflow-hidden shrink-0">
                          <Image 
                            src={prop.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'} 
                            alt={prop.informacoesbasicas.nome} 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                              <Badge className="bg-primary text-slate-900 border-none font-black text-[9px] uppercase tracking-widest py-1 px-3 shadow-lg">
                                  98% Match
                              </Badge>
                              {isPartner && (
                                  <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase tracking-widest py-1 px-3 shadow-lg">
                                      Parceria
                                  </Badge>
                              )}
                              {isProject && (
                                  <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest py-1 px-3 shadow-lg">
                                      Construtora
                                  </Badge>
                              )}
                          </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col text-left">
                          <div className="mb-4">
                            <h3 className="text-lg font-black text-slate-900 truncate uppercase tracking-tight leading-tight">{prop.informacoesbasicas.nome}</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1 mt-1">
                                <MapPin className="size-3" /> {prop.localizacao.bairro}, {prop.localizacao.cidade}
                            </p>
                          </div>

                          <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor do Ativo</span>
                                <span className="text-xl font-black text-slate-900">
                                    {prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" asChild className="size-10 rounded-xl text-slate-400 hover:text-primary transition-colors cursor-pointer">
                                      <Link href={`/imoveis/${prop.informacoesbasicas.slug || prop.id}`} target="_blank">
                                          <ExternalLink className="size-5" />
                                      </Link>
                                  </Button>
                                  <Button 
                                      onClick={() => handleShareWithLead(prop)}
                                      disabled={selectedLeadId === 'all'}
                                      className={cn(
                                        "size-10 rounded-xl transition-all shadow-glow border-none cursor-pointer",
                                        selectedLeadId === 'all' ? "bg-slate-100 text-slate-300" : "bg-primary text-slate-900 hover:scale-110"
                                      )}
                                      title={selectedLeadId === 'all' ? "Selecione um lead acima para compartilhar" : "Enviar para o cliente"}
                                  >
                                      <MessageCircle className="size-5" />
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          })}

          {!isLoading && opportunities.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
              <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                <Search className="size-10" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold text-slate-900 uppercase">Nenhum Match Encontrado</h3>
                <p className="text-slate-500 mt-2">
                  Não encontramos imóveis na rede que combinem com os critérios deste cliente no momento. Tente ajustar o perfil da persona dele.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4 border-slate-200 font-bold rounded-xl">
                <Link href="/dashboard/clientes">Gerenciar Personas de Leads</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 mt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-tight">
                    Mostrando <span className="font-bold text-slate-900">{paginatedOpportunities.length}</span> de <span className="font-bold text-slate-900">{opportunities.length}</span> oportunidades
                </p>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="size-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-all"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={cn(
                                "size-10 rounded-xl border font-bold transition-all cursor-pointer",
                                currentPage === page 
                                    ? "bg-primary text-slate-950 border-primary shadow-sm" 
                                    : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {page}
                        </button>
                    ))}
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="size-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-all"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Action Helper */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="max-w-xl">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Maximize seus Fechamentos</h3>
            <p className="text-slate-400 text-base leading-relaxed">
              O Radar utiliza algoritmos de compatibilidade para poupar seu tempo. Foque apenas no que faz sentido para o seu investidor e utilize as parcerias da rede para ganhar escala.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild className="h-14 px-8 bg-primary hover:bg-primary-hover text-slate-950 font-black rounded-2xl shadow-glow transition-all border-none uppercase text-xs tracking-widest">
              <Link href="/dashboard/meu-site">Personalizar meu portfólio</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
