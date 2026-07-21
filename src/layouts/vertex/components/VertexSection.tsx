
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface VertexSectionProps {
  children: React.ReactNode;
  tagline?: string;
  title?: string;
  description?: string;
  className?: string;
  centered?: boolean;
}

export function VertexSection({ 
  children, 
  tagline, 
  title, 
  description, 
  className,
  centered = false
}: VertexSectionProps) {
  return (
    <section className={cn("py-20 lg:py-32", className)}>
      <div className="max-w-7xl mx-auto px-6">
        {(tagline || title || description) && (
          <div className={cn(
            "mb-16 space-y-4",
            centered ? "text-center mx-auto max-w-3xl" : "text-left"
          )}>
            {tagline && (
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-[10px] font-black text-primary uppercase tracking-[0.3em]"
              >
                {tagline}
              </motion.span>
            )}
            {title && (
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter"
              >
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
