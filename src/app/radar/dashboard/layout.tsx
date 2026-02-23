
'use client';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/firebase/auth-provider';
import Loading from '@/app/dashboard/loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';


function RadarAuthGuard({ children }: { children: ReactNode }) {
    const { userProfile, isReady } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (isReady && !userProfile) {
            router.replace('/radar');
        } else if (isReady && userProfile && userProfile.userType !== 'client') {
            router.replace('/dashboard');
        }
    }, [isReady, userProfile, router]);
    

    if (!isReady || !userProfile || userProfile.userType !== 'client') {
        return <Loading />;
    }

    return <>{children}</>;
}


export default function RadarDashboardLayout({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const firestore = useFirestore();

    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);


    const handleLogout = () => {
        if (auth) {
            signOut(auth).then(() => {
                router.push('/radar');
            });
        }
    };

    const navLinkClasses = (path: string) =>
    cn(
      "text-sm transition-colors",
      pathname === path
        ? "text-neutral-dark font-semibold border-b-2 border-primary pb-1"
        : "text-gray-500 font-medium hover:text-neutral-dark"
    );
    
    return (
        <div className="antialiased min-h-screen font-body bg-white text-neutral-dark">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/radar/dashboard" className="flex items-center gap-2 group cursor-pointer">
                            <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={160} height={40} className="h-6 w-auto" />
                        </Link>
                    </div>
                    
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="hidden md:flex items-center gap-8">
                            <Link className={navLinkClasses('/radar/dashboard')} href="/radar/dashboard">Radar</Link>
                            <Link className={navLinkClasses('/radar/dashboard/comparar')} href="/radar/dashboard/comparar">Comparar Imóveis</Link>
                            <Link className={navLinkClasses('/radar/dashboard/imoveis-salvos')} href="/radar/dashboard/imoveis-salvos">Imóveis Salvos</Link>
                            <Link className={navLinkClasses('/radar/dashboard/personas')} href="/radar/dashboard/personas">Minha Persona</Link>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" className="hidden md:flex">
                           <Link href="/" target="_blank">
                                <span className="material-symbols-outlined text-base mr-2">home</span>
                                Visualizar Site
                            </Link>
                        </Button>
                        <div className="h-8 w-[1px] bg-gray-100"></div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-3 cursor-pointer group">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-bold leading-none">{user?.displayName}</div>
                                    </div>
                                    <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-colors">
                                        <Avatar className="h-full w-full">
                                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Avatar'}/>
                                            <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/radar/dashboard/perfil">
                                        <span className="material-symbols-outlined mr-2 text-base">person</span>
                                        Meu Perfil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600">
                                     <span className="material-symbols-outlined mr-2 text-base">logout</span>
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>
            <RadarAuthGuard>
                <main className="max-w-7xl mx-auto px-6 py-8">
                    {children}
                </main>
            </RadarAuthGuard>
            <footer className="mt-20 border-t border-gray-100 py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                   <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                        <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={120} height={30} className="h-8 w-auto opacity-50" />
                    </Link>
                    <p className="text-xs text-gray-400">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                    <div className="flex gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <a className="hover:text-primary transition-colors" href="/termos-de-uso">Termos</a>
                        <a className="hover:text-primary transition-colors" href="/politica-de-privacidade">Privacidade</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
