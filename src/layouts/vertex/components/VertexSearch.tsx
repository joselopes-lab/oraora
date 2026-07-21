'use client';

import React from 'react';
import SearchFilters from '@/components/SearchFilters';
import { cn } from '@/lib/utils';

/**
 * @fileOverview VertexSearch - Integração do Search Engine no Tema Vertex
 */

interface VertexSearchProps {
  className?: string;
}

export function VertexSearch({ className }: VertexSearchProps) {
  return (
    <div className={cn("w-full max-w-5xl mx-auto px-6", className)}>
       <SearchFilters variant="vertex" />
    </div>
  );
}
