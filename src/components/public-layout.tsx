
'use client';

import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { LocationProvider } from '@/context/location-context';
import { AuthProvider } from '@/context/auth-context';
import MobileBottomNav from './mobile-bottom-nav';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LocationProvider>
            <AuthProvider>
                <div className="flex flex-col min-h-screen bg-muted/20">
                    <PublicHeader />
                    <div className="flex-grow">
                        {children}
                    </div>
                    <PublicFooter />
                    <MobileBottomNav />
                </div>
            </AuthProvider>
        </LocationProvider>
    );
}
