'use client';

import React from 'react';

export function PrivacyPreferencesTrigger() {
  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('oraora_open_cookie_preferences'));
  };

  return (
    <button
      onClick={handleOpen}
      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4"
    >
      Privacidade e Cookies
    </button>
  );
}
