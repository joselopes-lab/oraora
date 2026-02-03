'use client';

import React from 'react';
import DashboardCore from './DashboardCore';
import { useAuthContext } from '@/firebase/auth-provider';
import Loading from './loading';
import { useRouter } from 'next/navigation';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userProfile, isReady } = useAuthContext();
  const router = useRouter();

  React.useEffect(() => {
    if (isReady && userProfile?.userType === 'client') {
        router.replace('/radar/dashboard');
    }
  }, [isReady, userProfile, router]);


  if (!isReady || userProfile?.userType === 'client') {
    return <Loading />;
  }

  // O perfil pode ser null se o documento do usuário não for encontrado no Firestore
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
