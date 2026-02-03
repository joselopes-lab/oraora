'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider'; 

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  userType: 'admin' | 'broker' | 'constructor';
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
    if (!auth) {
      setAuthLoading(false);
      setProfileLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      
      if (firebaseUser) {
        if (!profileLoading) setProfileLoading(true);
        try {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile({ id: userDoc.id, ...userDoc.data() } as UserProfile);
          } else {
            console.warn(`Perfil não encontrado no Firestore para o usuário: ${firebaseUser.uid}`);
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
          setUserProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
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
