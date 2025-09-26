
'use client';

// This file is no longer used for managing favorites since that logic has been
// moved into the AuthContext to link favorites with authenticated users.
// It can be safely deleted or kept for reference.

import React, { createContext, useContext } from 'react';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (propertyId: string) => void;
}

export const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The state and logic have been moved to AuthProvider.
  // This provider now just renders its children without providing any value.
  const value = {
      favorites: [],
      toggleFavorite: () => {
          console.warn("Favorites functionality is now handled by AuthContext for logged-in users.");
      }
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
