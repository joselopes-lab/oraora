'use client';

import React from 'react';
import DashboardCore from './DashboardCore';
import { useAuthContext } from '@/firebase/auth-provider';
import Loading from './loading';
import { useRouter } from 'next/navigation';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isReady } = useAuthContext();
  const router = useRouter();

  React.useEffect(() => {
    if (isReady) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile?.userType === 'client') {
        router.replace('/radar/dashboard');
      }
    }
  }, [isReady, user, userProfile, router]);

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
  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main antialiased min-h-screen flex flex-col">
      <AuthGuard>
        {children}
      </AuthGuard>
    </div>
  );
}
