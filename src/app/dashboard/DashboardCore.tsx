
'use client';

import Link from "next/link";
import { UserMenu } from "./user-info";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from 'react';
import { UserProfile } from "@/firebase/auth-provider";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


// Este componente agora espera receber o userProfile e não faz mais buscas.
export default function DashboardCore({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: UserProfile; // Não é mais nulo, garantido pelo AuthGuard
}) {
  const pathname = usePathname();
  const firestore = useFirestore();

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);


  const navLinkClasses = (path: string, exact: boolean = false) => 
    cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors",
      exact ? (pathname === path && "text-text-main font-bold") : (pathname.startsWith(path) && "text-text-main font-bold")
    );
  
  const dropdownTriggerClasses = (paths: string[]) => 
    cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors flex items-center gap-1",
      paths.some(p => pathname.startsWith(p)) && "text-text-main font-bold"
    );

  return (
    <>
      <div className="w-full bg-white border-b border-[#f2f5f0] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={128} height={32} className="h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
                <Link
                  className={navLinkClasses("/dashboard", true)}
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                
                {/* O userProfile agora é garantido que existe */}
                <>
                  {userProfile.userType === 'broker' && (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/leads", "/dashboard/clientes", "/dashboard/construtoras", "/dashboard/personas"])}>
                          Relacionamentos <span className="material-symbols-outlined text-base">expand_more</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild><Link href="/dashboard/leads">Leads</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/clientes">Clientes</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/construtoras">Construtoras</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/personas">Personas</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/imoveis", "/dashboard/minha-carteira", "/dashboard/avulso"])}>
                          Imóveis <span className="material-symbols-outlined text-base">expand_more</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild><Link href="/dashboard/imoveis">Imóveis</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/minha-carteira">Minha Carteira</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/avulso">Avulso</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Link className={navLinkClasses("/dashboard/agenda")} href="/dashboard/agenda">Agenda</Link>
                      <Link className={navLinkClasses("/dashboard/financeiro")} href="/dashboard/financeiro">Financeiro</Link>
                      <Link className={cn(navLinkClasses("/dashboard/loja"), "px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 hover:text-primary-foreground shadow-glow")} href="/dashboard/loja">Loja</Link>
                      <Link className={navLinkClasses("/dashboard/meu-site")} href="/dashboard/meu-site">Meu Site</Link>
                    </>
                  )}
                  
                  {userProfile.userType === 'admin' && (
                    <>
                      <Link className={navLinkClasses("/dashboard/admin/leads")} href="/dashboard/admin/leads">Leads</Link>
                      <Link className={navLinkClasses("/dashboard/imoveis")} href="/dashboard/imoveis">Imóveis</Link>
                      <Link className={navLinkClasses("/dashboard/personas")} href="/dashboard/personas">Personas</Link>
                      <Link className={navLinkClasses("/dashboard/admin/users")} href="/dashboard/admin/users">Usuários</Link>
                      <Link className={navLinkClasses("/dashboard/admin/planos")} href="/dashboard/admin/planos">Planos</Link>
                      <Link className={navLinkClasses("/dashboard/admin/tickets")} href="/dashboard/admin/tickets">Tickets</Link>
                      <Link className={navLinkClasses("/dashboard/construtoras")} href="/dashboard/construtoras">Construtoras</Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/site"])}>
                          Site <span className="material-symbols-outlined text-base">expand_more</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/inicio">Página Inicial</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/imagens">Imagens</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/contato">Página de Contato</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/sobre">Página Sobre</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/configuracoes">Configurações</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Link className={navLinkClasses("/dashboard/admin/sitemap")} href="/dashboard/admin/sitemap">Sitemap</Link>
                      <Link className={navLinkClasses("/dashboard/loja")} href="/dashboard/loja">Loja</Link>
                    </>
                  )}
                  
                  {userProfile.userType === 'constructor' && (
                    <>
                      <Link className={navLinkClasses("/dashboard/imoveis")} href="/dashboard/imoveis">Imóveis</Link>
                      <Link className={navLinkClasses("/dashboard/loja")} href="/dashboard/loja">Loja</Link>
                    </>
                  )}
                </>
            </nav>
          </div>
          <UserMenu />
        </div>
      </div>
       <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {children}
      </main>
      <footer className="mt-auto border-t border-[#f2f5f0] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-text-secondary text-xs font-normal">© 2024 Oraora Tecnologia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="#">Privacidade</a>
            <a className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="#">Termos de Uso</a>
            <a className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/ajuda">Ajuda</a>
          </div>
        </div>
      </footer>
    </>
  );
}
