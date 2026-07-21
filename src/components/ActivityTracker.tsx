'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthContext, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, increment, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Componente global para rastrear atividade do usuário.
 * 
 * Corrigido para garantir sincronia entre Auth e Firestore.
 */
export function ActivityTracker() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  // Rotas que não devem ser rastreadas
  const publicRoutes = ['/login', '/registrar', '/esqueceu-a-senha', '/nova-senha', '/corretor'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // 1. Validação de Sessão e Existência de Documento
  useEffect(() => {
    async function verifyUserDocument() {
      if (!isReady || !user?.uid || !userProfile || !firestore || isPublicRoute) {
        if (isSessionVerified) setIsSessionVerified(false);
        return;
      }

      try {
        // Verifica se o documento do usuário realmente existe antes de tentar gravar logs
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setIsSessionVerified(true);
          // Registrar Último Acesso (apenas uma vez por sessão/refresh)
          setDocumentNonBlocking(userRef, { 
            lastAccess: serverTimestamp(),
            isOnline: true
          }, { merge: true });
        } else {
          console.log("ActivityTracker aguardando inicialização: Documento do usuário não encontrado.");
        }
      } catch (e) {
        console.warn("ActivityTracker aguardando inicialização: Sem permissão de leitura para verificação.");
      }
    }

    verifyUserDocument();
  }, [isReady, user?.uid, !!userProfile, firestore, isPublicRoute]);

  // 2. Registrar Histórico de Navegação
  useEffect(() => {
    if (!isSessionVerified || !user?.uid || isPublicRoute) return;

    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    if (fullPath !== lastPath.current) {
      lastPath.current = fullPath;
      
      const activityRef = collection(firestore, 'users', user.uid, 'activityLog');
      addDocumentNonBlocking(activityRef, {
        type: 'navigation',
        path: fullPath,
        timestamp: serverTimestamp(),
      });
    }
  }, [isSessionVerified, user?.uid, pathname, searchParams, isPublicRoute, firestore]);

  // 3. Heartbeat: Acumular tempo de sessão (a cada 30 segundos)
  useEffect(() => {
    if (!isSessionVerified || !user?.uid || isPublicRoute) return;

    const interval = setInterval(() => {
      // Apenas incrementa se a aba estiver visível e a sessão estiver verificada
      if (document.visibilityState === 'visible' && isSessionVerified) {
        const userRef = doc(firestore, 'users', user.uid);
        
        setDocumentNonBlocking(userRef, { 
          totalSessionSeconds: increment(30),
          lastHeartbeat: serverTimestamp(),
          isOnline: true
        }, { merge: true });
      } else if (document.visibilityState !== 'visible' && isSessionVerified) {
        // Se oculto, apenas marca como offline sem somar tempo
        const userRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userRef, { isOnline: false }, { merge: true });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isSessionVerified, user?.uid, isPublicRoute, firestore]);

  return null;
}
