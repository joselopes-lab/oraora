'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function StudioHero({ 
  tagline, 
  title, 
  subtitle, 
  imageUrl,
  searchUrl,
  whatsappUrl 
}: { 
  tagline: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  searchUrl: string;
  whatsappUrl?: string;
}) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-secondary text-secondary-foreground py-20 px-6 lg:px-16">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
        <Image src={imageUrl} alt="Studio Hero" fill priority className="object-cover object-center scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent z-10" />

      <div className="relative z-20 max-w-5xl mx-auto text-center flex flex-col items-center">
        {tagline && (
          <span className="inline-block py-1.5 px-4 rounded-full bg-primary/20 backdrop-blur-md text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-6 border border-primary/30">
            {tagline}
          </span>
        )}
        <h1 
          className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white mb-8 leading-[1.1] max-w-4xl"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl font-light leading-relaxed mb-12">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-14 px-10 shadow-2xl hover:scale-105 transition-all">
            <Link href={searchUrl}>Explorar Portfólio</Link>
          </Button>
          {whatsappUrl && (
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 font-black text-xs uppercase tracking-widest h-14 px-10 backdrop-blur-md transition-all">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
