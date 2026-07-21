
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Monitor global de erros do Firebase.
 * Surfa erros contextuais via toast em vez de crashar a aplicação.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Em vez de dar throw, notificamos o usuário e logamos o contexto para debug
      console.warn("[FIRESTORE PERMISSION ERROR]", error.request);
      
      toast({
        variant: "destructive",
        title: "Erro de Permissão",
        description: `Não foi possível acessar dados em: ${error.request.path}. Verifique suas regras de segurança.`,
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
