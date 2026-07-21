
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar?: string;
}

interface VertexTestimonialsProps {
  items: Testimonial[];
}

export function VertexTestimonials({ items }: VertexTestimonialsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {items.map((item, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-soft flex flex-col text-left group hover:border-primary transition-all duration-500"
        >
          <Quote className="size-10 text-primary/20 mb-6 group-hover:text-primary transition-colors fill-current" />
          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic mb-8 flex-1">
            "{item.text}"
          </p>
          <div className="flex items-center gap-4 border-t border-slate-50 dark:border-white/5 pt-6">
            <div className="size-12 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex items-center justify-center font-bold text-slate-400">
              {item.avatar ? <img src={item.avatar} alt={item.name} className="size-full object-cover" /> : item.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.role}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
