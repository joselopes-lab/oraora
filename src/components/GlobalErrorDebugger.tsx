'use client';

import { useEffect } from 'react';

export function GlobalErrorDebugger() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[GLOBAL-ERROR-DEBUG]', {
        type: event.type,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        target: event.target,
        src: (event.target as any)?.src,
        href: (event.target as any)?.href,
        error: event.error,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GLOBAL-UNHANDLED-REJECTION-DEBUG]', {
        type: event.type,
        reason: event.reason,
        reasonMessage: event.reason?.message,
        reasonStack: event.reason?.stack,
        target: (event as any).target,
      });
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
