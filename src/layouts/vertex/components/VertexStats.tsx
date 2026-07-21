
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
}

interface VertexStatsProps {
  stats: Stat[];
}

export function VertexStats({ stats }: VertexStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
      {stats.map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex flex-col items-center text-center gap-2"
        >
          <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {stat.prefix}<span className="text-primary">{stat.value}</span>{stat.suffix}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
