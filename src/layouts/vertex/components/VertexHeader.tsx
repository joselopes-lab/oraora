'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BrokerSDK } from '../../sdk.types';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigation } from '@/lib/navigation/navigationService';

interface VertexHeaderProps {
  broker: BrokerSDK;
}

export function VertexHeader({ broker }: VertexHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const nav = useNavigation(broker.slug);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Início', href: nav.home() },
    { label: 'Imóveis', href: nav.search() },
    { label: 'Sobre', href: nav.about() },
    { label: 'Contato', href: nav.contact() },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6",
        isScrolled ? "py-4" : "py-8"
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto rounded-full transition-all duration-500 flex items-center justify-between px-6 py-2",
        isScrolled 
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl" 
          : "bg-transparent"
      )}>
        {/* Logo */}
        <Link href={nav.home()} className="flex items-center gap-2 group cursor-pointer">
          {broker.logoUrl ? (
            <div className="relative h-8 w-auto">
              <img src={broker.logoUrl} alt={broker.brandName} className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-lg font-bold">vertex</span>
              </div>
              <span className="font-bold text-lg tracking-tighter uppercase">{broker.brandName}</span>
            </div>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/60 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:flex rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-glow">
            <Link href={nav.contact()}>Fale Comigo</Link>
          </Button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 cursor-pointer border-none"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex flex-col p-8 text-left"
          >
            <div className="flex justify-between items-center mb-16">
               <span className="text-primary font-black text-xl uppercase tracking-tighter">Vertex</span>
               <button onClick={() => setIsMobileMenuOpen(false)} className="size-12 rounded-full bg-white/5 flex items-center justify-center text-white cursor-pointer border-none">
                 <X className="size-6" />
               </button>
            </div>
            <nav className="flex flex-col gap-8">
              {navItems.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link href={item.href} className="text-4xl font-black text-white uppercase tracking-tighter hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
