
'use client';

import Link from 'next/link';
import { Home, Building, Users, Table, Image as ImageIcon, Package } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConstrutoraSidebarProps {
    isMobile?: boolean;
}

const ConstrutoraSidebarNav = ({ isMobile = false }: ConstrutoraSidebarProps) => {
    const pathname = usePathname();

    const navLinks = [
        { href: "/dashboard-construtora/dashboard", label: "Dashboard", icon: Home, exact: true },
        { href: "/dashboard-construtora/imoveis", label: "Meus Imóveis", icon: Building },
        { href: "/dashboard-construtora/corretores", label: "Corretores", icon: Users },
        { href: "/dashboard-construtora/tabelas", label: "Tabelas", icon: Table },
        { href: "/dashboard-construtora/midia", label: "Mídia", icon: ImageIcon },
        { href: "/dashboard-construtora/meu-plano", label: "Meu Plano", icon: Package },
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

export default function ConstrutoraSidebar({ isMobile = false }: ConstrutoraSidebarProps) {

    const content = (
         <div className="flex h-full max-h-screen flex-col items-center gap-2">
            <div className="flex-1 w-full">
               <ConstrutoraSidebarNav isMobile={isMobile} />
            </div>
        </div>
    );
    
    if (isMobile) {
        return (
            <div className="flex h-full max-h-screen flex-col gap-2">
                 <div className="flex-1 overflow-y-auto">
                    <ConstrutoraSidebarNav isMobile={isMobile} />
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
