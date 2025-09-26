'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
    Home, 
    Building2, 
    Building, 
    UserCheck, 
    Inbox, 
    Star, 
    Megaphone, 
    ImageIcon, 
    LifeBuoy, 
    Settings,
    Paintbrush,
    Users,
    Shield,
    UserSquare,
    Handshake,
    Download,
    Map,
} from 'lucide-react';
import React from 'react';


interface NavLink {
  href: string;
  label: string;
  permission: string;
  icon: React.ElementType;
}

const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Painel', permission: 'Acessar Painel', icon: Home },
  { href: '/dashboard/properties', label: 'Imóveis', permission: 'Acessar Imóveis', icon: Building2 },
  { href: '/dashboard/builders', label: 'Construtoras', permission: 'Acessar Construtoras', icon: Building },
  { href: '/dashboard/brokers', label: 'Corretores', permission: 'Acessar Corretores', icon: UserCheck },
  { href: '/dashboard/leads', label: 'Leads', permission: 'Acessar Leads', icon: Inbox },
  { href: '/dashboard/personas', label: 'Personas', permission: 'Acessar Personas', icon: UserSquare },
  { href: '/dashboard/clients', label: 'Clientes', permission: 'Acessar Clientes', icon: Users },
  { href: '/dashboard/leads-construtoras', label: 'Leads de Construtoras', permission: 'Acessar Leads de Construtoras', icon: Building },
  { href: '/dashboard/leads-corretores', label: 'Leads de Corretores', permission: 'Acessar Leads de Corretores', icon: UserCheck },
  { href: '/dashboard/featured', label: 'Destaques', permission: 'Acessar Destaques', icon: Star },
  { href: '/dashboard/banners', label: 'Banners', permission: 'Acessar Banners', icon: ImageIcon },
  { href: '/dashboard/support', label: 'Suporte', permission: 'Acessar Suporte', icon: LifeBuoy },
  { href: '/dashboard/appearance', label: 'Aparência', permission: 'Acessar Aparência', icon: Paintbrush },
  { href: '/dashboard/users', label: 'Usuários', permission: 'Acessar Usuários', icon: Users },
  { href: '/dashboard/roles', label: 'Funções', permission: 'Acessar Funções', icon: Shield },
  { href: '/dashboard/regions', label: 'Regiões', permission: 'Acessar Configurações', icon: Map },
  { href: '/dashboard/exportar', label: 'Exportar Dados', permission: 'Acessar Configurações', icon: Download },
];

export default function DashboardSidebarNav({ permissions }: { permissions: string[] }) {
    const pathname = usePathname();
    const isLinkActive = (href: string) => {
        const cleanHref = href.split('?')[0];
        const cleanPathname = pathname.split('?')[0];
        if (cleanHref === '/dashboard') {
            return cleanPathname === '/dashboard';
        }
        return cleanPathname.startsWith(cleanHref);
    };

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
            {navLinks
            .filter(link => permissions.includes(link.permission))
            .map((link) => {
                const isActive = isLinkActive(link.href);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-muted",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        )}
                    >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
