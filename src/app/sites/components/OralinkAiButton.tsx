'use client';

import React from 'react';

interface OralinkAiButtonProps {
  btnBgHex: string;
  btnTextHex: string;
}

export default function OralinkAiButton({ btnBgHex, btnTextHex }: OralinkAiButtonProps) {
  return (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('open-broker-ai-chat'));
      }}
      className="flex items-center justify-center gap-3 w-full text-center py-5 px-6 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-all active:scale-95 cursor-pointer border-none outline-none"
      style={{ backgroundColor: btnBgHex, color: btnTextHex }}
    >
      <span className="material-symbols-outlined text-[22px]">smart_toy</span>
      <span>Conversar com Assistente IA</span>
    </button>
  );
}
