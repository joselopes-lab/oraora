
'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/dashboard-sidebar';
import DashboardHeader from '@/app/dashboard/header';
import { useAuth, AuthProvider } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


const allPermissions = [
  'Acessar Painel',
  'Acessar Leads',
  'Acessar Usuários',
  'Acessar Funções',
  'Acessar Log de Atividades',
  'Acessar Configurações',
  'Acessar Aparência',
  'Acessar Construtoras',
  'Acessar Suporte',
  'Acessar Destaques',
  'Acessar Banners',
  'Acessar Personas',
  'Acessar Clientes',
  'Criar Usuários',
  'Editar Usuários',
  'Deletar Usuários',
  'Criar Funções',
  'Editar Funções',
  'Deletar Funções',
  'Criar Construtoras',
  'Editar Construtoras',
  'Deletar Construtoras',
  'Acessar Imóveis',
  'Criar Imóveis',
  'Editar Imóveis',
  'Deletar Imóveis',
  'Acessar Corretores',
  'Editar Perfil',
  'Criar Personas',
  'Editar Personas',
  'Deletar Personas',
  'Acessar Leads de Construtoras',
  'Acessar Leads de Corretores',
  'Acessar Ajuda',
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, panelUserType } = useAuth();
  
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    // This allows the property edit page to be used by constructors
    const isEditingProperty = window.location.pathname.startsWith('/dashboard/properties/edit');
    if (panelUserType === 'builder' && !isEditingProperty) {
      router.push('/dashboard-construtora/dashboard');
      return;
    }
    
    if (panelUserType === 'broker') {
        router.push('/corretor/dashboard');
        return;
    }
    
    if (panelUserType === 'none') {
        router.push('/');
        return;
    }
    
    const fetchPermissions = async () => {
      if (user.email === 'vinicius@teste.com') {
        setUserPermissions(allPermissions);
      } else {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().roleId) {
          const roleDocRef = doc(db, 'roles', userDocSnap.data().roleId);
          const roleDocSnap = await getDoc(roleDocRef);
          if (roleDocSnap.exists()) {
            setUserPermissions(roleDocSnap.data().permissions || []);
          }
        }
      }
      setIsLoadingPermissions(false);
    }
    
    fetchPermissions();

  }, [user, authLoading, panelUserType, router]);
  
  if (isLoadingPermissions || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verificando permissões...</p>
      </div>
    );
  }

  return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <DashboardSidebar permissions={userPermissions} />
          <div className="flex flex-col">
            <DashboardHeader permissions={userPermissions} />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
                {children}
            </main>
          </div>
      </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
