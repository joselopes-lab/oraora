'use client';

import React, { use, useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { listConstructorLeadsAction } from './actions.server';
import { ConstructorClientsClient } from './client-list';
import { useToast } from '@/hooks/use-toast';

export default function ConstructorLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const constructorId = resolvedParams.id;
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      if (isUserLoading) return;
      if (!user) {
        setError('Usuário não autenticado.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const idToken = await user.getIdToken();
        const data = await listConstructorLeadsAction(constructorId, idToken);
        setLeads(data);
      } catch (err: any) {
        console.error('Erro ao carregar leads:', err);
        setError(err.message || 'Erro ao carregar clientes.');
      } finally {
        setIsLoading(false);
      }
    }

    loadLeads();
  }, [user, isUserLoading, constructorId]);

  if (isUserLoading || isLoading) {
    return (
      <main className="py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
        <div className="p-12 text-center text-text-secondary">Carregando clientes...</div>
      </main>
    );
  }

  if (error) {
    return (
        <main className="py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-600">Erro ao carregar clientes: {error}</p>
            </div>
        </main>
    );
  }

  return <ConstructorClientsClient constructorId={constructorId} initialLeads={leads} />;
}


