import { useCallback } from 'react';

const STORAGE_KEY = 'lastVisited';

interface LastVisited {
  albumId: string;
  pageIndex?: number;
  timestamp: number;
}

/**
 * Hook for persisting and retrieving the last visited album/page
 * Used for "resume where you left off" functionality
 */
export function useLastVisited() {
  const getLastVisited = useCallback((): LastVisited | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as LastVisited;

      // Expire after 30 days
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > thirtyDays) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }, []);

  const setLastVisited = useCallback((albumId: string, pageIndex?: number) => {
    try {
      const data: LastVisited = {
        albumId,
        pageIndex,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or disabled - silently fail
    }
  }, []);

  const clearLastVisited = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }, []);

  return {
    getLastVisited,
    setLastVisited,
    clearLastVisited,
  };
}
