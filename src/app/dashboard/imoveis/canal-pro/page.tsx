'use client';

import { useAuthContext } from '@/firebase';
import { CanalProManager } from '../components/CanalProManager';

export default function CanalProPage() {
  const { user } = useAuthContext();

  return (
    <div className="w-full text-left space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1 uppercase">Canal Pro</h1>
        <p className="text-slate-500">
          Distribua seus imóveis nos canais parceiros e receba os contatos diretamente no OraOra.
        </p>
      </div>

      <CanalProManager brokerId={user?.uid || ''} />
    </div>
  );
}
