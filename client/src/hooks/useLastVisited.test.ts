import { renderHook, act } from '@testing-library/react';
import { useLastVisited } from './useLastVisited';

describe('useLastVisited', () => {
  const STORAGE_KEY = 'lastVisited';

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getLastVisited', () => {
    it('returns null when no data is stored', () => {
      const { result } = renderHook(() => useLastVisited());
      expect(result.current.getLastVisited()).toBeNull();
    });

    it('returns stored data when valid', () => {
      const data = {
        albumId: 'album-123',
        pageIndex: 2,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const { result } = renderHook(() => useLastVisited());
      const retrieved = result.current.getLastVisited();

      expect(retrieved).toEqual(data);
    });

    it('returns null and clears storage when data is expired (>30 days)', () => {
      const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const data = {
        albumId: 'album-123',
        timestamp: thirtyOneDaysAgo,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const { result } = renderHook(() => useLastVisited());
      const retrieved = result.current.getLastVisited();

      expect(retrieved).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('returns data when not expired (within 30 days)', () => {
      const twentyNineDaysAgo = Date.now() - 29 * 24 * 60 * 60 * 1000;
      const data = {
        albumId: 'album-123',
        timestamp: twentyNineDaysAgo,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const { result } = renderHook(() => useLastVisited());
      const retrieved = result.current.getLastVisited();

      expect(retrieved).toEqual(data);
    });

    it('returns null on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useLastVisited());
      expect(result.current.getLastVisited()).toBeNull();
    });
  });

  describe('setLastVisited', () => {
    it('stores albumId and timestamp', () => {
      const { result } = renderHook(() => useLastVisited());
      const now = Date.now();
      jest.setSystemTime(now);

      act(() => {
        result.current.setLastVisited('album-456');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.albumId).toBe('album-456');
      expect(stored.timestamp).toBe(now);
      expect(stored.pageIndex).toBeUndefined();
    });

    it('stores albumId, pageIndex, and timestamp', () => {
      const { result } = renderHook(() => useLastVisited());
      const now = Date.now();
      jest.setSystemTime(now);

      act(() => {
        result.current.setLastVisited('album-789', 5);
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.albumId).toBe('album-789');
      expect(stored.pageIndex).toBe(5);
      expect(stored.timestamp).toBe(now);
    });
  });

  describe('clearLastVisited', () => {
    it('removes the stored data', () => {
      const data = {
        albumId: 'album-123',
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const { result } = renderHook(() => useLastVisited());

      act(() => {
        result.current.clearLastVisited();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('does nothing if no data is stored', () => {
      const { result } = renderHook(() => useLastVisited());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.clearLastVisited();
        });
      }).not.toThrow();
    });
  });

  describe('function stability', () => {
    it('returns stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useLastVisited());

      const firstGetLastVisited = result.current.getLastVisited;
      const firstSetLastVisited = result.current.setLastVisited;
      const firstClearLastVisited = result.current.clearLastVisited;

      rerender();

      expect(result.current.getLastVisited).toBe(firstGetLastVisited);
      expect(result.current.setLastVisited).toBe(firstSetLastVisited);
      expect(result.current.clearLastVisited).toBe(firstClearLastVisited);
    });
  });
});
