
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';
import { Icons } from '@/components/icons';
import DashboardSidebarNav from './dashboard-sidebar-nav';

export default function DashboardSidebar({ permissions }: { permissions: string[] }) {
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

    return (
        <div className="hidden bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
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
                   <DashboardSidebarNav permissions={permissions} />
                </div>
            </div>
        </div>
    );
}
