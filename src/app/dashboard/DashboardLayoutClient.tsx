'use client';

import React from 'react';
import DashboardCore from './DashboardCore';
import { useAuthContext } from '@/firebase';
import Loading from './loading';
import { useRouter, usePathname } from 'next/navigation';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isReady } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (isReady) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile?.userType === 'client') {
        router.replace('/radar/dashboard');
      } else if (userProfile?.userType === 'broker' && userProfile.moduleAccess) {
        const modulePathMap: Record<string, string[]> = {
          crm: ['/dashboard/leads', '/dashboard/clientes', '/dashboard/personas'],
          agenda: ['/dashboard/agenda', '/dashboard/jornada'],
          properties: ['/dashboard/minha-carteira', '/dashboard/avulso', '/dashboard/imoveis-avulsos', '/dashboard/imoveis', '/dashboard/tabelas'],
          canalPro: ['/dashboard/imoveis/canal-pro'],
          radar: ['/dashboard/radar-oportunidades', '/dashboard/solicitacoes-rede'],
          oralink: ['/dashboard/oralink'],
          marketing: ['/dashboard/meu-site', '/dashboard/marketing', '/dashboard/loja', '/dashboard/ativacao'],
          intelligence: ['/dashboard/mercado'],
          ai: ['/dashboard/ora-ia'],
        };

        for (const [modKey, paths] of Object.entries(modulePathMap)) {
          if (userProfile.moduleAccess[modKey as keyof typeof userProfile.moduleAccess] === false) {
            const isMatched = paths.some(p => pathname === p || (p !== '/dashboard' && pathname.startsWith(p + '/')));
            if (isMatched) {
              router.replace('/dashboard');
              break;
            }
          }
        }
      }
    }
  }, [isReady, user, userProfile, router, pathname]);

  if (!isReady || !user || userProfile?.userType === 'client') {
    return <Loading />;
  }
  
  if (!userProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4 bg-background-light">
        <h1 className="text-xl font-bold text-red-500 tracking-tight">
          Erro de Perfil
        </h1>
        <p className="text-muted-foreground">Não foi possível carregar seu perfil de usuário. Contate o suporte.</p>
      </div>
    );
  }

  return (
    <DashboardCore userProfile={userProfile}>
      {children}
    </DashboardCore>
  );
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const isPresentation = pathname?.includes('/apresentacao');

  if (isPresentation) {
    return (
      <div className="bg-slate-950 text-slate-100 antialiased min-h-screen w-screen overflow-hidden flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main antialiased min-h-screen flex flex-col">
      <AuthGuard>
        {children}
      </AuthGuard>
    </div>
  );
}
