
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Play, Zap } from 'lucide-react';

interface VertexHeroProps {
  tagline?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export function VertexHero({ 
  tagline = "Luxo e Minimalismo", 
  title = "Sua nova definição de <span class='text-primary'>viver bem</span>.", 
  subtitle = "Curadoria exclusiva de ativos imobiliários de alto padrão selecionados para o seu estilo de vida.",
  imageUrl 
}: VertexHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 pt-20">
      {/* Dynamic Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              {tagline}
            </span>
            <h1 
              className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tighter"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mt-6 max-w-xl font-medium leading-relaxed">
              {subtitle}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all border-none">
              Explorar Catálogo
            </Button>
            <Button variant="ghost" size="lg" className="h-16 px-8 rounded-2xl gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Play className="size-4 fill-current" />
              </div>
              Apresentação
            </Button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white dark:border-slate-900">
            <img 
              src={imageUrl || 'https://picsum.photos/seed/vertex-hero/800/1000'} 
              alt="Hero" 
              className="object-cover w-full h-full"
            />
          </div>
          {/* Floating Element */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -bottom-8 -left-8 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 hidden sm:block"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center">
                <Zap className="size-6 text-slate-900" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos Premiuns</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">+124 Imóveis</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
