
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MinhasDemandasPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o Radar principal, pois a arquitetura de 'demands' foi migrada para 'leads'
    router.replace('/dashboard/radar-oportunidades');
  }, [router]);

  return (
    <div className="flex items-center justify-center p-20 text-slate-400 italic">
      Redirecionando para o Radar...
    </div>
  );
}
