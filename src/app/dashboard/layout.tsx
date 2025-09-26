
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import DashboardHeader from '@/app/dashboard/header';
import { Loader2 } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard-sidebar';

// Lista completa de todas as permissões disponíveis no sistema.
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
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setIsAuthenticated(true);
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // Super admin check (email or role name)
            if (user.email === 'vinicius@teste.com' || userData.role === 'Admin') {
              setUserPermissions(allPermissions);
            } else if (userData.roleId && typeof userData.roleId === 'string') {
              // Standard role-based permissions
              const roleDocRef = doc(db, 'roles', userData.roleId);
              const roleDocSnap = await getDoc(roleDocRef);

              if(roleDocSnap.exists()) {
                const roleData = roleDocSnap.data();
                setUserPermissions(roleData.permissions || []);
              } else {
                 setUserPermissions([]);
              }
            } else {
              setUserPermissions([]);
            }
          } else {
             setUserPermissions([]);
          }
        } catch (error) {
          console.error("Erro ao buscar permissões do usuário:", error);
          setUserPermissions([]); 
        } finally {
           setIsLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verificando autenticação e permissões...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Render nothing or a redirect message while router pushes
    return null;
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
