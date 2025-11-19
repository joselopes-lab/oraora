
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Loader2, Menu } from 'lucide-react';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';
import ConstrutoraSidebar from '@/components/construtora-sidebar';
import { useAuth, AuthProvider } from '@/context/auth-context';

function ConstrutoraLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, panelUserType, userName } = useAuth();
  
  const [logoUrl, setLogoUrl] = useState('');
  const [mainLogo, setMainLogo] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || panelUserType !== 'builder') {
      router.push('/login');
    }
  }, [user, loading, panelUserType, router]);

  useEffect(() => {
    async function fetchLogos() {
        if (!user) return;
        
        const builderDocRef = doc(db, 'builders', user.uid);
        const builderDoc = await getDoc(builderDocRef);
        if (builderDoc.exists()) {
            setLogoUrl(builderDoc.data().logoUrl || '');
        }

        const appearanceSettings = await getAppearanceSettings();
        if (appearanceSettings.logoUrl) {
            setMainLogo(appearanceSettings.logoUrl);
        }
    }
    fetchLogos();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha no Logout', description: error.message });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '..';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  if (loading || !user || panelUserType !== 'builder') {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen w-full bg-gradient-to-b from-[#c8c8c8] to-[#b8bcc8]">
          <ConstrutoraSidebar />
          <div className="flex flex-col flex-1 md:ml-20">
              <header className="flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6">
                  <Sheet>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                              <Menu className="h-5 w-5" />
                              <span className="sr-only">Toggle navigation menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="flex flex-col p-0 w-full max-w-xs">
                          <ConstrutoraSidebar isMobile />
                      </SheetContent>
                  </Sheet>
                  
                  <div className="w-full flex-1">
                          <Link href="/dashboard-construtora/dashboard" className="flex items-center gap-2 font-semibold">
                              {mainLogo ? (
                                  <Image src={mainLogo} alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
                              ) : (
                                  <>
                                      <Icons.logo className="h-6 w-6 text-primary" />
                                      <span className="">Painel da Construtora</span>
                                  </>
                              )}
                      </Link>
                  </div>
                  
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={logoUrl} alt={userName || ''} />
                                  <AvatarFallback>{getInitials(userName || '')}</AvatarFallback>
                              </Avatar>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                              <div className="flex flex-col space-y-1">
                                  <p className="text-sm font-medium leading-none">{userName}</p>
                                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                              </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                              <LogOut className="mr-2 h-4 w-4" />
                              <span>Sair</span>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>

              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                  {children}
              </main>
          </div>
      </div>
  );
}


export default function ConstrutoraDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConstrutoraLayoutContent>{children}</ConstrutoraLayoutContent>
    </AuthProvider>
  );
}
