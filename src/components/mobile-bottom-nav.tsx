
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Search, Radar, User } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import SearchForm from './search-form';
import { useAuth } from '@/context/auth-context';
import AuthModal from './auth-modal';

export default function MobileBottomNav() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [redirectToFavorites, setRedirectToFavorites] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleRadarClick = (e: React.MouseEvent) => {
    if (loading) return;
    if (user) {
      router.push('/favoritos');
    } else {
      e.preventDefault();
      setRedirectToFavorites(true);
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    if (loading) return;
    if (!user) {
      e.preventDefault();
      setRedirectToFavorites(false);
      setIsAuthModalOpen(true);
    }
    // If user is logged in, this button can either be hidden or open a user menu.
    // For now, if user is logged in, we'll let it navigate to favorites as a default action.
    else {
        router.push('/favoritos');
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          <Link href="/" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted">
            <Home className="w-5 h-5 mb-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Home</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted"
          >
            <Search className="w-5 h-5 mb-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Busca</span>
          </button>
          <a
            href="/favoritos"
            onClick={handleRadarClick}
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted"
          >
            <Radar className="w-5 h-5 mb-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Radar</span>
          </a>
          <a
            href={user ? "/favoritos" : "#"}
            onClick={handleLoginClick}
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted"
          >
            <User className="w-5 h-5 mb-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{user ? 'Perfil' : 'Entrar'}</span>
          </a>
        </div>
      </div>

      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buscar Imóveis</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <SearchForm isHomePage />
          </div>
        </DialogContent>
      </Dialog>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onOpenChange={open => {
          setIsAuthModalOpen(open);
          if (!open) setRedirectToFavorites(false);
        }}
        redirectToFavorites={redirectToFavorites}
      />
    </>
  );
}
