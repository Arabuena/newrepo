import React, { createContext, useState, useContext } from 'react';

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const [currentRide, setCurrentRide] = useState(null);

  const value = {
    currentRide,
    setCurrentRide
  };

  return (
    <RideContext.Provider value={value}>
      {children}
    </RideContext.Provider>
  );
}

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide deve ser usado dentro de um RideProvider');
  }
  return context;
}; 