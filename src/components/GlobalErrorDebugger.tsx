'use client';

import { useEffect } from 'react';

export function GlobalErrorDebugger() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (process.env.NODE_ENV !== 'development') return;
      console.debug('[GLOBAL-ERROR-DEBUG]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorName: event.error?.name,
        errorMessage: event.error?.message,
        errorStack: event.error?.stack,
        errorCause: event.error?.cause,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (process.env.NODE_ENV !== 'development') return;
      console.debug('[GLOBAL-UNHANDLED-REJECTION-DEBUG]', {
        reasonMessage: event.reason?.message,
        reasonStack: event.reason?.stack,
        reasonName: event.reason?.name,
        reasonCause: event.reason?.cause,
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
