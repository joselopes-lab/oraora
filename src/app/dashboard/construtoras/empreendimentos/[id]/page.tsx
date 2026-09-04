'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getProjectDetailServer } from '../actions.server';
import ProjectCockpit from '../components/project-cockpit';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectDetailPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const idToken = await user.getIdToken();
        const res = await getProjectDetailServer(id, idToken);
        setProject(res.project);
        setUnits(res.units || []);
      } catch (err: any) {
        console.error('Erro ao carregar empreendimento:', err);
        setError(err.message || 'Erro ao carregar empreendimento.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [user, isUserLoading, id, router]);

  if (isUserLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 font-medium">Carregando cockpit do empreendimento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Acesso Restrito ou Erro</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
        <Button onClick={() => router.push('/dashboard/construtoras/empreendimentos')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          Voltar para Empreendimentos
        </Button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return <ProjectCockpit project={project} units={units} />;
}
