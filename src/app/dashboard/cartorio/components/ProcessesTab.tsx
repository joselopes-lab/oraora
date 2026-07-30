'use client';

import React from 'react';
import { CartorioProcess, CartorioServiceItem } from '@/services/cartorioService';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Clock, User, Building2, Hash, FileCheck, Timer } from 'lucide-react';

interface ProcessesTabProps {
  loadingProcesses: boolean;
  processes: CartorioProcess[];
  services?: CartorioServiceItem[];
  onSelectProcess: (id: string) => void;
  onGoToServices: () => void;
  getStatusBadge: (status: CartorioProcess['status']) => React.ReactNode;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr || '-';
  }
}

export default function ProcessesTab({
  loadingProcesses,
  processes,
  services = [],
  onSelectProcess,
  onGoToServices,
  getStatusBadge,
}: ProcessesTabProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {loadingProcesses ? (
        <div className="text-center py-20 text-slate-400 italic font-semibold">
          Carregando seus processos ativos...
        </div>
      ) : processes.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {processes.map((p) => {
            const raw = p as any;
            const protocol = raw.protocol || raw.protocolo || raw.protocolNumber || p.id || '-';
            const clientName = raw.clientName || raw.cliente || raw.customerName || raw.customData?.clientName || raw.customData?.nomeCliente || raw.customData?.cliente || '-';
            const cartorioName = raw.cartorioName || raw.cartorio || raw.cartorioNome || raw.cartorioParceiro || '-';
            
            const matchedService = services.find((service) => service.id === p.serviceId);
            const serviceName = matchedService ? matchedService.name : "Serviço não encontrado";

            const docs = p.documents || [];
            const totalDocs = docs.length;
            const sentDocs = docs.filter(d => d.status === 'submitted' || d.status === 'approved' || d.fileUrl || d.downloadURL).length;
            const docsLabel = totalDocs > 0 ? `${sentDocs}/${totalDocs}` : `${sentDocs}/0`;

            const estimatedDays = raw.estimatedDays 
              ? `${raw.estimatedDays} dias` 
              : raw.prazoEstimado 
                ? (typeof raw.prazoEstimado === 'number' ? `${raw.prazoEstimado} dias` : raw.prazoEstimado) 
                : '-';

            const requestDate = formatDate(p.createdAt);
            const updateDate = formatDate(p.updatedAt);

            return (
              <div 
                key={p.id} 
                className="p-6 md:p-8 flex flex-col gap-5 hover:bg-slate-50/50 transition-colors text-left"
              >
                {/* Header: Service Name, Protocol, Status Badge, Action Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        <Hash className="size-3 mr-1 text-slate-400" />
                        Protocolo: {protocol}
                      </span>
                      {getStatusBadge(p.status)}
                    </div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight mt-1">
                      {serviceName}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    <Button 
                      onClick={() => onSelectProcess(p.id)}
                      variant="outline"
                      className="border-slate-200 text-xs font-bold h-11 px-5 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer w-full md:w-auto"
                    >
                      <MessageSquare className="size-4 mr-2" />
                      Acessar Processo
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-100/80 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Cliente:</span>
                    <span className="font-semibold text-slate-800 truncate">{clientName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Cartório:</span>
                    <span className="font-semibold text-slate-800 truncate">{cartorioName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCheck className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Documentos:</span>
                    <span className="font-semibold text-slate-800">{docsLabel} (enviados/solicitados)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Solicitação:</span>
                    <span className="font-semibold text-slate-800">{requestDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Última Atualização:</span>
                    <span className="font-semibold text-slate-800">{updateDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Timer className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Prazo Estimado:</span>
                    <span className="font-semibold text-slate-800">{estimatedDays}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-20 text-slate-400 italic">
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <span className="material-symbols-outlined text-5xl opacity-20 text-slate-900">gavel</span>
            <h3 className="font-bold text-slate-700 text-lg">Nenhum processo em andamento</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Você ainda não iniciou nenhum processo de regularização ou escritura com o Cartório parceiro. Visite a aba de serviços para começar.
            </p>
            <Button 
              onClick={onGoToServices} 
              className="bg-primary hover:bg-primary-hover text-slate-900 font-bold h-10 px-5 rounded-xl border-none cursor-pointer"
            >
              Ver Serviços Cartoriais
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

