'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartorioServiceItem, CartorioProcess, CartorioService, normalizeProcess } from '@/services/cartorioService';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Layers, 
  Clock, 
  Coins,
  Loader2
} from 'lucide-react';

interface PublicRequestProps {
  service: CartorioServiceItem;
  client: { id: string; name: string; email: string; phone?: string };
  brokerId: string;
  onClose: () => void;
  onSuccess: (newProcess: CartorioProcess) => void;
}

const cartorioService = CartorioService.getInstance();

export default function PublicRequest({
  service,
  client,
  brokerId,
  onClose,
  onSuccess
}: PublicRequestProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Normalize fields for robust rendering
  const servicePrice = typeof service.price === 'number' ? service.price : 0;
  const serviceDescription = service.description || service.summary || "";
  const serviceName = service.name || service.title || "Serviço sem nome";
  const serviceCategory = service.category || "Geral";
  
  // Normalize completion time
  const rawDays = service.estimatedDays || (parseInt(String(service.duration || service.estimatedTime)) || 0);
  const displayDuration = service.duration || service.estimatedTime || `${rawDays} dias`;

  // Normalize documents list
  const normalizedDocs = Array.isArray(service.documentsConfig) 
    ? service.documentsConfig.map((d: any) => typeof d === 'string' ? d : (d.name || d.nome || "Documento"))
    : Array.isArray(service.documents)
      ? service.documents
      : [];

  const handleConfirmRequest = async () => {
    if (!brokerId) {
      toast({
        variant: 'destructive',
        title: 'Usuário não autenticado',
        description: 'É necessário estar autenticado para iniciar um processo no Cartório.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const docsConfig = service.documentsConfig || service.documents || [];
      const newProcess: CartorioProcess = normalizeProcess({
        id: `RASCUNHO-${Date.now()}`,
        serviceId: service.id,
        serviceName: service.name,
        brokerId,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        status: 'rascunho',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        history: [],
        events: [],
        documents: docsConfig.map((doc: any, idx: number) => ({
          id: typeof doc === 'string' ? `doc-${idx}` : (doc.id || `doc-${idx}`),
          name: typeof doc === 'string' ? doc : (doc.name || doc.nome || 'Documento'),
          required: true,
          status: 'pending'
        })),
        timeline: [
          {
            id: 'step-1',
            title: 'Rascunho Criado',
            description: 'Aguardando envio de documentos e confirmação.',
            status: 'current',
            date: new Date().toLocaleDateString('pt-BR')
          },
          {
            id: 'step-2',
            title: 'Enviado ao Cartório',
            description: 'Aguardando recepção pelo escrevente.',
            status: 'pending'
          }
        ]
      });

      toast({
        title: 'Rascunho Criado!',
        description: `Rascunho do processo de "${service.name}" registrado localmente.`,
      });

      onSuccess(newProcess);
    } catch (error: any) {
      console.error('Error creating draft in PublicRequest:', error);
      toast({
        variant: 'destructive',
        title: 'Falha na abertura',
        description: 'Ocorreu um erro ao criar o rascunho.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="public-request-portal" className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* Informative Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-primary/20 rounded-full blur-[40px] pointer-events-none translate-x-6 -translate-y-6"></div>
        <div className="relative space-y-1">
          <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase tracking-wider font-bold mb-2">
            Portal de Solicitação do Cartório
          </Badge>
          <h3 className="text-xl font-black tracking-tight">{serviceName}</h3>
          <p className="text-slate-400 text-xs">
            Esta solicitação será transmitida diretamente ao Oficial de Registro parceiro.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Service details */}
        <div className="space-y-4">
          <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="size-4 text-primary" /> Detalhes do Ato Cartorial
            </h4>
            
            <p className="text-slate-600 text-xs leading-relaxed">{serviceDescription}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo Estimado</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="size-4 text-slate-400" /> {displayDuration}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emolumentos (Valor)</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Coins className="size-4 text-slate-400" /> R$ {servicePrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Categoria</span>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none capitalize text-xs">
                {serviceCategory}
              </Badge>
            </div>
          </div>

          {normalizedDocs.length > 0 && (
            <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Documentação Necessária para Análise
              </h4>
              <p className="text-slate-500 text-[11px]">
                Os seguintes documentos serão solicitados após o início do processo para qualificação territorial:
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc mt-2">
                {normalizedDocs.map((docName, idx) => (
                  <li key={`${service.id}-req-${idx}`} className="leading-tight">
                    <span className="font-semibold text-slate-800">{docName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Client & Integration metadata */}
        <div className="space-y-4">
          <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="size-4 text-primary" /> Cliente Vinculado (CRM)
            </h4>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 text-sm">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800 leading-tight">{client.name}</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {client.id}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-slate-400" /> {client.email}
                </p>
                {client.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 text-slate-400" /> {client.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-500" /> Metadados de Integração
            </h4>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Origem</span>
                <p className="font-semibold text-slate-700 mt-0.5">BROKER</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nome do Broker</span>
                <p className="font-semibold text-slate-700 mt-0.5">OraOra Corretor</p>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identificador do Broker</span>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5 truncate">{brokerId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={submitting}
          className="border-slate-200 h-11 px-6 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer text-sm font-semibold"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirmRequest}
          disabled={submitting}
          className="bg-[#00e900] text-black hover:brightness-105 font-bold h-11 px-6 rounded-xl transition-all border-none flex items-center gap-2 text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Transmitindo...
            </>
          ) : (
            <>
              Confirmar Solicitação
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>

    </div>
  );
}
