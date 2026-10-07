'use client';

import React from 'react';
import AgentChat from '@/components/ora/AgentChat';
import { usePathname } from 'next/navigation';

export default function AgenteOraOraPage() {
  const pathname = usePathname();
  return (
    <div className="max-w-4xl mx-auto p-4 h-[80vh]">
      <AgentChat currentPath={pathname} />
    </div>
  );
}
