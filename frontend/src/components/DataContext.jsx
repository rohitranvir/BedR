import React, { createContext, useContext, useRef, useCallback } from 'react';
import api from '../api';

const DataContext = createContext();

export function DataProvider({ children }) {
  // Use a ref to hold cache data so it persists instantly across renders without triggering unnecessary re-renders
  const cacheRef = useRef({});

  const fetchWithCache = useCallback(async (key, endpoint, force = false, persistAcrossNav = true) => {
    const cached = cacheRef.current[key];
    const STALE_TIME = 60000; // 1 minute

    if (!force && cached && (Date.now() - cached.timestamp < STALE_TIME)) {
      return cached.data;
    }

    try {
      const res = await api.get(endpoint);
      if (persistAcrossNav) {
        cacheRef.current[key] = {
          data: res.data,
          timestamp: Date.now()
        };
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const invalidateCache = useCallback((key) => {
    if (key) {
      delete cacheRef.current[key];
    } else {
      cacheRef.current = {};
    }
  }, []);

  const getCachedData = useCallback((key) => {
    const cached = cacheRef.current[key];
    const STALE_TIME = 60000;
    if (cached && (Date.now() - cached.timestamp < STALE_TIME)) {
      return cached.data;
    }
    return null;
  }, []);

  return (
    <DataContext.Provider value={{ fetchWithCache, invalidateCache, getCachedData }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
