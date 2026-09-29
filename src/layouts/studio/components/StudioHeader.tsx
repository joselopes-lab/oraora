'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useNavigation } from '@/lib/navigation/navigationService';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export function StudioHeader({ broker }: { broker: any }) {
  const nav = useNavigation(broker.slug);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 lg:px-16 transition-all">
      <div className="max-w-7xl mx-auto flex h-24 items-center justify-between">
        <Link href={nav.home()} className="flex items-center gap-3 group">
          {broker.logoUrl ? (
            <Image src={broker.logoUrl} alt={broker.brandName || 'Studio'} width={140} height={40} className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
          ) : (
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              {broker.brandName || 'STUDIO'}
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Link href={nav.home()} className="hover:text-primary transition-colors">Início</Link>
          <Link href={nav.search()} className="hover:text-primary transition-colors">Portfólio</Link>
          <Link href={nav.about()} className="hover:text-primary transition-colors">Sobre</Link>
          <Link href={nav.contact()} className="hover:text-primary transition-colors">Contato</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {broker.whatsappUrl && (
            <Button asChild className="rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-6 h-11 shadow-lg hover:scale-105 transition-all">
              <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp Direto
              </a>
            </Button>
          )}
        </div>

        <div className="md:hidden flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-foreground">
                <span className="material-symbols-outlined">menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background p-6 flex flex-col">
              <SheetHeader>
                <VisuallyHidden>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Navegação</SheetDescription>
                </VisuallyHidden>
              </SheetHeader>
              <div className="mb-8">
                <span className="font-serif text-xl font-bold">{broker.brandName || 'Studio'}</span>
              </div>
              <nav className="flex flex-col gap-6 text-sm font-bold uppercase tracking-wider">
                <Link href={nav.home()} onClick={() => setIsOpen(false)} className="hover:text-primary">Início</Link>
                <Link href={nav.search()} onClick={() => setIsOpen(false)} className="hover:text-primary">Portfólio</Link>
                <Link href={nav.about()} onClick={() => setIsOpen(false)} className="hover:text-primary">Sobre</Link>
                <Link href={nav.contact()} onClick={() => setIsOpen(false)} className="hover:text-primary">Contato</Link>
              </nav>
              {broker.whatsappUrl && (
                <div className="mt-auto pt-6 border-t">
                  <Button asChild className="w-full rounded-xl bg-primary text-primary-foreground h-12 font-bold uppercase text-xs tracking-wider">
                    <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp Direto</a>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
