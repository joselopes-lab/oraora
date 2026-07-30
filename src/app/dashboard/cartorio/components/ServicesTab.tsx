'use client';

import React from 'react';
import { CartorioServiceItem } from '@/services/cartorioService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  Coins, 
  Sparkle, 
  ChevronRight 
} from 'lucide-react';

interface ServicesTabProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  sortBy: 'nome' | 'prazo' | 'valor';
  setSortBy: (sort: 'nome' | 'prazo' | 'valor') => void;
  loadingServices: boolean;
  services: CartorioServiceItem[];
  onSolicitar: (service: CartorioServiceItem) => void;
}

export default function ServicesTab({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  loadingServices,
  services,
  onSolicitar,
}: ServicesTabProps) {
  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Busca por Nome */}
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="size-4.5" />
            </span>
            <input 
              type="text"
              placeholder="Pesquisar por nome ou descrição do serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Filtros de Categoria e Ordenação */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Filter className="size-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoria:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer"
              >
                <option value="todos">Todas</option>
                <option value="escritura">Escritura</option>
                <option value="registro">Registro</option>
                <option value="documental">Documental</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <ArrowUpDown className="size-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ordenar por:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer"
              >
                <option value="nome">Nome</option>
                <option value="prazo">Prazo Estimado</option>
                <option value="valor">Valor</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Grid de Serviços */}
      <div className="grid md:grid-cols-2 gap-6">
        {loadingServices ? (
          <div className="col-span-2 text-center py-20 text-slate-400 italic font-semibold">
            Carregando catálogo de serviços imobiliários...
          </div>
        ) : services.length > 0 ? (
          services.map((service) => {
            const servicePrice = typeof service.price === 'number' ? service.price : 0;
            const serviceDescription = service.description || service.summary || "";
            const serviceName = service.name || service.title || "Serviço sem nome";
            const serviceCategory = service.category || "Geral";
            
            const rawDays = service.estimatedDays || (parseInt(String(service.duration || service.estimatedTime)) || 0);
            const averageDays = rawDays > 2 ? rawDays - 2 : rawDays;
            const displayDuration = service.duration || service.estimatedTime || `${rawDays} dias`;

            const normalizedDocs = Array.isArray(service.documentsConfig) 
              ? service.documentsConfig.map((d: any) => typeof d === 'string' ? d : (d.name || d.nome || "Documento"))
              : Array.isArray(service.documents)
                ? service.documents
                : [];

            return (
              <div 
                key={service.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all gap-6 text-left relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/25 border-none font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-full">
                      {serviceCategory}
                    </Badge>
                    <div className="flex flex-wrap items-center text-slate-600 font-bold text-xs gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-slate-400" /> Prazo: {displayDuration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="size-3.5 text-slate-400" /> R$ {servicePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 text-lg tracking-tight leading-tight">{serviceName}</h3>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{serviceDescription}</p>
                  </div>

                  {/* Tempo Médio de Conclusão */}
                  <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-50 p-3 rounded-xl">
                    <Sparkle className="size-4 text-emerald-500 animate-pulse" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Médio de Conclusão</p>
                      <p className="text-xs font-bold text-emerald-700">{averageDays} dias úteis (Média do Cartório)</p>
                    </div>
                  </div>

                  {/* Documentos Obrigatórios */}
                  {normalizedDocs.length > 0 && (
                    <div className="bg-slate-50/50 p-4 rounded-xl space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Documentos Obrigatórios:</h4>
                      <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                        {normalizedDocs.map((docName, idx) => (
                          <li key={`${service.id}-doc-${idx}`} className="leading-tight">{docName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => onSolicitar(service)}
                  className="w-full bg-[#00e900] text-black hover:brightness-105 font-bold h-11 rounded-xl transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Solicitar Serviço
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-20 text-slate-400 italic">
            Nenhum serviço encontrado para os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}
