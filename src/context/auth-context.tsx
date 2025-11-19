
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

type PanelUserType = 'admin' | 'broker' | 'builder' | 'none';

interface Plan {
    id: string;
    propertyLimit?: number;
    storageLimit?: number;
}

interface AuthContextType {
  user: User | null;
  userName: string | null;
  loading: boolean;
  favorites: string[];
  toggleFavorite: (propertyId: string, forceAdd?: boolean, userOverride?: User) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  panelUserType: PanelUserType;
  selectedPersonaId: string | null;
  setSelectedPersonaId: (personaId: string | null) => void;
  propertyCount: number;
  propertyLimit: number | null;
  storageLimit: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [panelUserType, setPanelUserType] = useState<PanelUserType>('none');
  const [selectedPersonaId, _setSelectedPersonaId] = useState<string | null>(null);

  const [propertyCount, setPropertyCount] = useState(0);
  const [propertyLimit, setPropertyLimit] = useState<number | null>(null);
  const [storageLimit, setStorageLimit] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Listen to user document changes
        const unsubUser = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setFavorites(userData.favorites || []);
                setUserName(userData.name || user.displayName);
                _setSelectedPersonaId(userData.selectedPersonaId || null);
                
                 const fetchPlanData = async (planId: string) => {
                    const planDocRef = doc(db, 'plans', planId);
                    const planDoc = await getDoc(planDocRef);
                    if (planDoc.exists()) {
                        const planData = planDoc.data() as Plan;
                        setPropertyLimit(planData.propertyLimit ?? null);
                        setStorageLimit(planData.storageLimit ?? null);
                    } else {
                        setPropertyLimit(null);
                        setStorageLimit(null);
                    }
                };
                
                if (userData.planId) {
                    fetchPlanData(userData.planId);
                } else {
                    setPropertyLimit(null);
                    setStorageLimit(null);
                }

                if (userData.role === 'Corretor') {
                    setPanelUserType('broker');
                    const portfolioCount = userData.portfolioPropertyIds?.length || 0;
                    const avulsoQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
                    getDocs(avulsoQuery).then(avulsoSnapshot => {
                        setPropertyCount(portfolioCount + avulsoSnapshot.size);
                    });

                } else if (userData.role === 'Construtora') {
                    setPanelUserType('builder');
                } else if (userData.roleId || user.email === 'vinicius@teste.com' || userData.role === 'Admin') {
                    setPanelUserType('admin');
                } else {
                    setPanelUserType('none');
                }
            } else {
                setFavorites([]);
                setUserName(user.displayName);
                _setSelectedPersonaId(null);
                setPanelUserType('none');
                setPropertyCount(0);
                setPropertyLimit(null);
                setStorageLimit(null);
            }
            setLoading(false);
        });
        
        return () => unsubUser();

      } else {
        setFavorites([]);
        setUserName(null);
        _setSelectedPersonaId(null);
        setPanelUserType('none');
        setLoading(false);
        setPropertyCount(0);
        setPropertyLimit(null);
        setStorageLimit(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (propertyId: string, forceAdd = false, userOverride?: User) => {
    const currentUser = userOverride || user;
    if (!currentUser) {
      console.error("User not logged in to toggle favorite");
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let currentFavorites: string[] = favorites;

    if (forceAdd) {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            currentFavorites = userDoc.data().favorites || [];
        }
    }

    let newFavorites;
    if (forceAdd) {
      if (!currentFavorites.includes(propertyId)) {
        newFavorites = [...currentFavorites, propertyId];
      } else {
        newFavorites = currentFavorites; 
      }
    } else {
       newFavorites = currentFavorites.includes(propertyId)
        ? currentFavorites.filter((id) => id !== propertyId)
        : [...currentFavorites, propertyId];
    }
    
    setFavorites(newFavorites);

    await setDoc(userDocRef, { favorites: newFavorites }, { merge: true });
  };
  
  const isFavorite = (propertyId: string) => {
    return favorites.includes(propertyId);
  }

  const setSelectedPersonaId = async (personaId: string | null) => {
    _setSelectedPersonaId(personaId);
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { selectedPersonaId: personaId });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userName, loading, favorites, toggleFavorite, isFavorite, panelUserType, selectedPersonaId, setSelectedPersonaId, propertyCount, propertyLimit, storageLimit }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
