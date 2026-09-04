'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { listConstructorLeadsAction } from './actions.server';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewLeadForm } from './new-lead-form';

interface ClientListProps {
  constructorId: string;
  initialLeads: any[];
}

export function ConstructorClientsClient({ constructorId, initialLeads }: ClientListProps) {
  const { user } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [leads, setLeads] = useState(initialLeads);

  async function refreshLeads() {
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const updated = await listConstructorLeadsAction(constructorId, idToken);
      setLeads(updated);
    } catch {
      // ignore
    }
  }

  return (
    <main className="py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Clientes</h1>
                <p className="text-sm text-text-secondary mt-1">Gerencie os clientes e oportunidades comerciais da sua construtora.</p>
            </div>
            {!showForm && (
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    + Novo Cliente
                </Button>
            )}
        </div>

        {showForm && (
            <NewLeadForm 
                constructorId={constructorId} 
                onSuccess={() => {
                    setShowForm(false);
                    refreshLeads();
                }} 
                onCancel={() => setShowForm(false)} 
            />
        )}

        {leads.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-card-border shadow-sm space-y-4">
                <p className="text-text-secondary">Você ainda não possui clientes cadastrados.</p>
                <div>
                    <Button onClick={() => setShowForm(true)} variant="outline">
                        + Novo Cliente
                    </Button>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Nome</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Empreendimento</TableHead>
                            <TableHead>Corretor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map(lead => (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium text-text-main">
                                    <div>{lead.name || 'Sem nome'}</div>
                                    <div className="text-xs text-text-secondary">{lead.cpf ? `CPF: ${lead.cpf}` : (lead.profession || '')}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-text-main">{lead.email || '-'}</div>
                                    <div className="text-xs text-text-secondary">{lead.whatsapp || lead.phone || '-'}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{lead.status || 'Novo'}</Badge>
                                    <div className="text-xs text-text-secondary mt-1">{lead.dealStatus || '-'}</div>
                                </TableCell>
                                <TableCell>{lead.dealValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.dealValue) : '-'}</TableCell>
                                <TableCell>
                                    <div className="text-sm text-text-main">{lead.propertyName || '-'}</div>
                                    <div className="text-xs text-text-secondary">{lead.nextAction ? `Próxima: ${lead.nextAction}` : ''}</div>
                                </TableCell>
                                <TableCell>{lead.brokerId || 'Direto'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
    </main>
  );
}
