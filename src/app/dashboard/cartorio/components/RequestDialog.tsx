'use client';

import React from 'react';
import { CartorioServiceItem, CartorioProcess } from '@/services/cartorioService';
import PublicRequest from './PublicRequest';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { UserCheck, Search } from 'lucide-react';

interface CRMClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface RequestDialogProps {
  solicitarService: CartorioServiceItem | null;
  clientSelectionOpen: boolean;
  setClientSelectionOpen: (open: boolean) => void;
  clientSearchTerm: string;
  setClientSearchTerm: (term: string) => void;
  loadingClients: boolean;
  filteredClients: CRMClient[];
  onSelectClient: (client: CRMClient) => void;
  publicRequestOpen: boolean;
  setPublicRequestOpen: (open: boolean) => void;
  selectedCrmClient: CRMClient | null;
  brokerId: string;
  onRequestSuccess: (process: CartorioProcess) => void;
}

export default function RequestDialog({
  solicitarService,
  clientSelectionOpen,
  setClientSelectionOpen,
  clientSearchTerm,
  setClientSearchTerm,
  loadingClients,
  filteredClients,
  onSelectClient,
  publicRequestOpen,
  setPublicRequestOpen,
  selectedCrmClient,
  brokerId,
  onRequestSuccess,
}: RequestDialogProps) {
  return (
    <>
      {/* STEP 1: SELECT CRM CLIENT */}
      <Dialog open={clientSelectionOpen} onOpenChange={setClientSelectionOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border-slate-100 text-left">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="size-5 text-primary" /> Selecionar Cliente do CRM
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Vincule um cliente já cadastrado no seu CRM à solicitação do serviço cartorial.
            </DialogDescription>
          </DialogHeader>

          {/* Search clients input */}
          <div className="mt-4 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="size-4" />
            </span>
            <input 
              type="text"
              placeholder="Pesquisar por nome, email ou telefone..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Clients list */}
          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {loadingClients ? (
              <div className="text-center py-10 text-slate-400 italic text-xs">Buscando seus clientes...</div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div 
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{client.name}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{client.email}</p>
                  </div>
                  <Button 
                    size="sm"
                    variant="ghost" 
                    className="text-primary hover:text-primary-hover font-bold text-xs"
                  >
                    Selecionar
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-3">
                <p className="text-xs italic">Nenhum cliente encontrado no CRM.</p>
                <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                  Você precisa ter clientes cadastrados para poder iniciar um processo no Cartório.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setClientSelectionOpen(false)}
              className="border-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STEP 2: PUBLIC REQUEST (PORTAL DE SOLICITAÇÃO) */}
      <Dialog open={publicRequestOpen} onOpenChange={setPublicRequestOpen}>
        <DialogContent className="max-w-4xl bg-white rounded-3xl p-6 md:p-8 border-none text-left scrollbar-thin overflow-y-auto max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Solicitação de Serviço Cartorial</DialogTitle>
          </DialogHeader>
          {solicitarService && selectedCrmClient && (
            <PublicRequest 
              service={solicitarService}
              client={selectedCrmClient}
              brokerId={brokerId}
              onClose={() => setPublicRequestOpen(false)}
              onSuccess={onRequestSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
