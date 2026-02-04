
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
      "text-sm font-medium transition-colors",
      pathname === path
        ? "text-neutral-dark font-semibold border-b-2 border-primary pb-1"
        : "text-gray-500 hover:text-neutral-dark"
    );
    
    return (
        <div className="antialiased min-h-screen font-body bg-neutral-light/50 text-neutral-dark">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-3">
                            <Link href="/radar/dashboard">
                                <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={128} height={32} className="h-8 w-auto" />
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <Link className={navLinkClasses('/radar/dashboard')} href="/radar/dashboard">Painel</Link>
                            <Link className={navLinkClasses('/radar/dashboard/comparar')} href="/radar/dashboard/comparar">Comparar Imóveis</Link>
                            <Link className={navLinkClasses('/radar/dashboard/imoveis-salvos')} href="/radar/dashboard/imoveis-salvos">Imóveis Salvos</Link>
                            <Link className={navLinkClasses('/radar/dashboard/personas')} href="/radar/dashboard/personas">Minha Persona</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" className="bg-white rounded-full font-bold text-sm h-10 px-6 hover:bg-gray-100 transition-colors flex items-center gap-2">
                            <Link href="/">
                                <span className="material-symbols-outlined text-base">public</span>
                                <span>Ver Site</span>
                            </Link>
                        </Button>
                        <button className="p-2 text-gray-400 hover:text-neutral-dark transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <button type="button" className="flex items-center gap-3 group">
                                    <span className="text-right hidden sm:block">
                                        <span className="block text-sm font-bold leading-none">{user?.displayName}</span>
                                        <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Investidor Urbano</span>
                                    </span>
                                    <Avatar className="size-10 border-2 border-primary/50 group-hover:border-primary transition-colors">
                                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </button>
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
                    <Link href="/radar/dashboard" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={128} height={32} className="h-8 w-auto" />
                    </Link>
                    <p className="text-xs text-gray-400">© 2024 Oraora. Todos os direitos reservados.</p>
                    <div className="flex gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <a className="hover:text-primary transition-colors" href="#">Termos</a>
                        <a className="hover:text-primary transition-colors" href="#">Privacidade</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
