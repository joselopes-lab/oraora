
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getStates, State } from '@/services/location';
import StateSelectionModal from '@/components/state-selection-modal';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';
import { queryInBatches } from '@/lib/firestoreUtils';

interface LocationContextType {
  selectedState: State | null;
  selectState: (state: State) => void;
  states: State[];
  isLoading: boolean;
}

export const LocationContext = createContext<LocationContextType>({
  selectedState: null,
  selectState: () => {},
  states: [],
  isLoading: true,
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch all states from IBGE API first
        const allStates = await getStates();

        // Fetch enabled states from settings
        const regionSettingsRef = doc(db, 'settings', 'regions');
        const regionSettingsSnap = await getDoc(regionSettingsRef);
        const enabledStateAcronyms = regionSettingsSnap.exists() ? regionSettingsSnap.data().enabledStates : [];

        // If no states are enabled in settings, there's nothing to show.
        if (enabledStateAcronyms.length === 0) {
            setStates([]);
            setSelectedState(null);
            localStorage.removeItem('selectedState');
            setIsLoading(false);
            return;
        }

        // Filter all states by what's enabled in settings
        const enabledStates = allStates.filter(s => enabledStateAcronyms.includes(s.sigla));

        // Then, find which of the enabled states actually have visible properties
        const buildersSnapshot = await getDocs(query(collection(db, 'builders'), where('isVisibleOnSite', '==', true)));
        const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

        let availableStates: State[] = [];

        if (visibleBuilderIds.length > 0) {
            const properties = await queryInBatches<Property>(
              'properties',
              'builderId',
              visibleBuilderIds,
              [where('isVisibleOnSite', '==', true)]
            );
            
            const statesWithProperties = new Set(properties.map(p => p.localizacao.estado).filter(Boolean));

            // Final filter: states must be enabled AND have properties
            availableStates = enabledStates.filter(s => statesWithProperties.has(s.sigla));
        }

        setStates(availableStates);
        
        const storedState = localStorage.getItem('selectedState');
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          // Ensure the stored state is one of the available states
          if(availableStates.some(s => s.sigla === parsedState.sigla)) {
            setSelectedState(parsedState);
          } else {
             // If stored state is no longer valid, remove it and open modal
             localStorage.removeItem('selectedState');
             if(availableStates.length > 0) {
                setIsModalOpen(true);
             }
          }
        } else {
           if(availableStates.length > 0) {
             setIsModalOpen(true);
           }
        }
      } catch (error) {
        console.error("Failed to fetch location data", error);
        setStates([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const selectState = useCallback((state: State) => {
    setSelectedState(state);
    localStorage.setItem('selectedState', JSON.stringify(state));
    setIsModalOpen(false);
  }, []);

  return (
    <LocationContext.Provider value={{ selectedState, selectState, states, isLoading }}>
      {children}
      <StateSelectionModal
        isOpen={isModalOpen && !isLoading && states.length > 0 && !selectedState}
        states={states}
        onStateSelect={selectState}
        isLoading={isLoading}
      />
    </LocationContext.Provider>
  );
};
