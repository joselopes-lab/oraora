'use client';

import Link from 'next/link';
import { Building, Users, Briefcase, Home, Inbox, FilePlus, Paintbrush, Calendar, Wallet, FileText, Handshake, Package, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CorretorSidebarProps {
    isMobile?: boolean;
}

const CorretorSidebarNav = ({ isMobile = false }: CorretorSidebarProps) => {
    const pathname = usePathname();

    const navLinks = [
        { href: "/corretor/dashboard", label: "Dashboard", icon: Home, exact: true },
        { href: "/corretor/agenda", label: "Agenda", icon: Calendar },
        { href: "/corretor/clientes", label: "Clientes", icon: Users },
        { href: "/corretor/explorar", label: "Explorar Imóveis", icon: Search },
        { href: "/corretor/construtoras", label: "Construtoras", icon: Building },
        { href: "/corretor/carteira", label: "Carteira", icon: Briefcase },
        { href: "/corretor/avulso", label: "Avulsos", icon: FilePlus },
        { href: "/corretor/leads", label: "Leads", icon: Inbox },
        { href: "/corretor/financeiro", label: "Finanças", icon: Wallet },
        { href: "/corretor/documentos", label: "Documentos", icon: FileText },
        { href: "/corretor/parcerias", label: "Parcerias", icon: Handshake },
        { href: "/corretor/meu-plano", label: "Meu Plano", icon: Package },
        { href: "/corretor/appearance", label: "Aparência", icon: Paintbrush },
    ];

    if (isMobile) {
        return (
            <nav className="flex flex-col gap-2 p-4 text-lg font-medium">
                {navLinks.map(link => {
                     const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                     return (
                         <Link
                             key={link.href}
                             href={link.href}
                             className={cn(
                                 "flex items-center gap-4 rounded-lg px-3 py-2 text-foreground transition-colors hover:text-primary hover:bg-muted",
                                 isActive && "bg-muted text-primary"
                             )}
                         >
                             <link.icon className="h-5 w-5" />
                             {link.label}
                         </Link>
                     )
                })}
            </nav>
        );
    }

    return (
        <TooltipProvider delayDuration={0}>
            <nav className="flex flex-col items-center gap-2 px-2 pt-5">
                {navLinks.map(link => {
                    const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                    return (
                        <Tooltip key={link.href}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary hover:bg-white",
                                        isActive && "bg-white text-primary shadow-lg"
                                    )}
                                >
                                    <link.icon className="h-5 w-5" />
                                    <span className="sr-only">{link.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{link.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </nav>
        </TooltipProvider>
    )
}

export default function CorretorSidebar({ isMobile = false }: CorretorSidebarProps) {

    const content = (
         <div className="flex h-full max-h-screen flex-col items-center gap-2">
            <div className="flex-1 w-full">
               <CorretorSidebarNav isMobile={isMobile} />
            </div>
        </div>
    );
    
    if (isMobile) {
        return (
            <div className="flex h-full max-h-screen flex-col gap-2">
                 <div className="flex-1 overflow-y-auto">
                    <CorretorSidebarNav isMobile={isMobile} />
                </div>
            </div>
        )
    }

    return (
        <div className="hidden md:block fixed top-0 left-0 h-full z-50 w-20">
           {content}
        </div>
    );
}
