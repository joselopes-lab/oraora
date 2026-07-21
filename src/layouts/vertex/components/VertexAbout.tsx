'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VertexAboutProps {
  title: string;
  text: string;
  imageUrl: string;
  quote?: string;
  reverse?: boolean;
}

export function VertexAbout({ title, text, imageUrl, quote, reverse = false }: VertexAboutProps) {
  return (
    <div className={cn(
      "flex flex-col gap-16 items-center",
      reverse ? "lg:flex-row-reverse" : "lg:flex-row"
    )}>
      <div className="flex-1 relative">
        <div className="relative z-10 aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100">
          <img src={imageUrl} alt="About" className="size-full object-cover" />
        </div>
        <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] blur-3xl -z-10"></div>
        {quote && (
          <motion.div 
            initial={{ opacity: 0, x: reverse ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            className={cn(
              "absolute bottom-10 z-20 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl max-w-xs",
              reverse ? "-left-10" : "-right-10"
            )}
          >
            <Quote className="size-8 text-primary mb-4 fill-current" />
            <p className="font-display text-lg font-bold leading-tight italic">"{quote}"</p>
          </motion.div>
        )}
      </div>

      <div className="flex-1 text-left space-y-8">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
          {title}
        </h2>
        <div className="space-y-6 text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {text.split('\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  );
}
