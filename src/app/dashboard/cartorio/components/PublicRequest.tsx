'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartorioServiceItem, CartorioProcess, CartorioService } from '@/services/cartorioService';
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

  const handleConfirmRequest = async () => {
    setSubmitting(true);
    try {
      // Pass the origin and client details dynamically as customData
      const customData = {
        origin: 'BROKER',
        originName: 'OraOra Corretor',
        brokerId,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email
      };

      // Calls the centralized CartorioService to create the request
      const newProcess = await cartorioService.openRequest(service.id, brokerId, customData);

      toast({
        title: 'Solicitação Iniciada!',
        description: `O processo de "${service.name}" foi registrado com sucesso no sistema central do Cartório.`,
      });

      onSuccess(newProcess);
    } catch (error: any) {
      console.error('Error opening request in PublicRequest:', error);
      toast({
        variant: 'destructive',
        title: 'Falha na abertura',
        description: 'Ocorreu um erro ao registrar a solicitação junto ao Cartório.',
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
          <h3 className="text-xl font-black tracking-tight">{service.name}</h3>
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
            
            <p className="text-slate-600 text-xs leading-relaxed">{service.description}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo Estimado</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="size-4 text-slate-400" /> {service.estimatedDays} dias
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emolumentos (Valor)</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Coins className="size-4 text-slate-400" /> R$ {service.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Categoria</span>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none capitalize text-xs">
                {service.category}
              </Badge>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Documentação Necessária para Análise
            </h4>
            <p className="text-slate-500 text-[11px]">
              Os seguintes documentos serão solicitados após o início do processo para qualificação territorial:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc mt-2">
              {service.documentsConfig.map((doc) => (
                <li key={doc.id} className="leading-tight">
                  <span className="font-semibold text-slate-800">{doc.name}</span>
                </li>
              ))}
            </ul>
          </div>
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
