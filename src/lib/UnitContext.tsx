'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UnitSystem } from './measurements';

interface UnitContextValue {
  unit: UnitSystem;
  setUnit: (u: UnitSystem) => void;
  toggleUnit: () => void;
}

const UnitContext = createContext<UnitContextValue>({
  unit: 'us',
  setUnit: () => {},
  toggleUnit: () => {},
});

const STORAGE_KEY = 'recipe-book-unit';

export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<UnitSystem>('us');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'metric' || stored === 'us') {
        setUnitState(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setUnit = useCallback((u: UnitSystem) => {
    setUnitState(u);
    try {
      localStorage.setItem(STORAGE_KEY, u);
    } catch {
      // ignore
    }
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit(unit === 'metric' ? 'us' : 'metric');
  }, [unit, setUnit]);

  return (
    <UnitContext.Provider value={{ unit, setUnit, toggleUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit(): UnitContextValue {
  return useContext(UnitContext);
}
