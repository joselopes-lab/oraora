'use client';

import { useAuthContext } from '@/firebase';
import { CanalProManager } from '../components/CanalProManager';

export default function CanalProPage() {
  const { user } = useAuthContext();

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1 uppercase">Canal Pro</h1>
        <p className="text-slate-500">
          Distribua seus imóveis nos canais parceiros e receba os contatos diretamente no OraOra.
        </p>
      </div>

      <CanalProManager brokerId={user?.uid || ''} />
    </main>
  );
}
