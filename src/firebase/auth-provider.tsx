'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider'; 

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  userType: 'admin' | 'broker' | 'constructor' | 'client';
  planId?: string;
  personaIds?: string[];
}

interface AuthContextState {
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  profileLoading: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // Começa como true

  useEffect(() => {
    if (!auth || !firestore) {
      setAuthLoading(false);
      setProfileLoading(false);
      return;
    }

    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      
      // Cleanup previous profile listener if user changes
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (firebaseUser) {
        setProfileLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(userDocRef, 
          (userDoc) => {
            if (userDoc.exists()) {
              setUserProfile({ id: userDoc.id, ...userDoc.data() } as UserProfile);
            } else {
              console.warn(`Perfil não encontrado no Firestore para o usuário: ${firebaseUser.uid}`);
              setUserProfile(null);
            }
            setProfileLoading(false);
          },
          (error) => {
              console.error("Erro ao buscar perfil do usuário:", error);
              setUserProfile(null);
              setProfileLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, [auth, firestore]);

  // isReady é verdadeiro apenas quando as duas etapas (auth e perfil) terminarem.
  const isReady = !authLoading && !profileLoading;

  const value = { user, userProfile, authLoading, profileLoading, isReady };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
