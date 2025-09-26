'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';
import { Icons } from '@/components/icons';
import { Building, Users, Briefcase, Home, Inbox } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const CorretorSidebarNav = () => {
    const pathname = usePathname();

    const navLinks = [
        { href: "/corretor/dashboard", label: "Dashboard", icon: Home, exact: true },
        { href: "/corretor/clientes", label: "Clientes", icon: Users },
        { href: "/corretor/construtoras", label: "Construtoras", icon: Building },
        { href: "/corretor/carteira", label: "Minha Carteira", icon: Briefcase },
        { href: "/corretor/leads", label: "Meus Leads", icon: Inbox },
    ];

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map(link => {
                const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                 return (
                 <Link key={link.href} href={link.href} className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold text-foreground transition-all hover:text-primary",
                    isActive && "text-primary bg-muted"
                    )}
                >
                   <link.icon className="h-4 w-4" />
                   {link.label}
                </Link>
                 )
            })}
        </nav>
    )
}


export default function CorretorSidebar({ isMobile = false }: { isMobile?: boolean }) {
    const [logoUrl, setLogoUrl] = useState<string>('');

    useEffect(() => {
        async function fetchLogo() {
          const settings = await getAppearanceSettings();
          if (settings.logoUrl) {
            setLogoUrl(settings.logoUrl);
          }
        }
        fetchLogo();
    }, []);

    const content = (
         <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/corretor/dashboard" className="flex items-center gap-2 font-semibold">
                    {logoUrl ? (
                        <Image src={logoUrl} alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
                    ) : (
                        <>
                            <Icons.logo className="h-6 w-6 text-primary" />
                            <span className="">oraora</span>
                        </>
                    )}
                </Link>
            </div>
            <div className="flex-1">
               <CorretorSidebarNav />
            </div>
        </div>
    );
    
    if (isMobile) {
        return content;
    }

    return (
        <div className="hidden border-r bg-muted/40 md:block">
           {content}
        </div>
    );
}
