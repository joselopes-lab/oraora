'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/firebase/auth-provider';
import { usePathname } from 'next/navigation';

const DomusHeader = () => {
  const { user, isReady } = useAuthContext();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/imoveis', label: 'Imóveis' },
    { href: '/sobre', label: 'Sobre Nós' },
    { href: '/fale-conosco', label: 'Fale Conosco' },
    { href: '/explorar-no-mapa', label: 'Explorar no Mapa' },
  ];

  const isActive = (href: string) => pathname === href;

  const MobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-md">
            <div className="flex flex-col p-4 space-y-2">
                {navLinks.map(link => (
                    <Link key={link.href} href={link.href} className="text-gray-800 hover:text-primary">{link.label}</Link>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-domus.png" alt="Domus" width={40} height={40} className="rounded-full"/>
              <span className="text-xl font-bold">Domus</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map(link => (
                <Link key={link.href} href={link.href} className={`font-medium transition-colors ${isActive(link.href) ? 'text-primary' : 'text-gray-300 hover:text-white'}`}>
                    {link.label}
                </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isReady && (
              <Link href={user ? "/dashboard" : "/login"} className="hidden md:flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
                {user ? 'Painel' : 'Login'}
              </Link>
            )}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DomusHeader;
