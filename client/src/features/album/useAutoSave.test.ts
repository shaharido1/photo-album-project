/// <reference types="jest" />
import { renderHook } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { saveAlbum } from './albumSlice';

// Mock the hooks and slice
jest.mock('@/app/hooks');
jest.mock('./albumSlice', () => ({
    ...jest.requireActual('./albumSlice') as any,
    saveAlbum: jest.fn(),
}));

describe('useAutoSave', () => {
    let dispatch: any;

    beforeEach(() => {
        dispatch = jest.fn().mockReturnValue({
            unwrap: () => Promise.resolve()
        });
        (useAppDispatch as jest.Mock).mockReturnValue(dispatch);
        (saveAlbum as unknown as jest.Mock).mockReturnValue({ type: 'album/saveAlbum' });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should not dispatch saveAlbum if no album ID', () => {
        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            // Logic to return empty album
            return { id: null, name: 'Untitled' };
        });

        renderHook(() => useAutoSave());
        jest.advanceTimersByTime(5000);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('should dispatch saveAlbum when album changes and interval passes', () => {
        let album = { id: 'album-1', name: 'Original', pages: [] };

        // First render with initial state
        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            // Simplified: return the album for any selector for now, 
            // or check which one it is if we want to be precise
            return album;
        });

        const { rerender } = renderHook(() => useAutoSave());

        // Update album
        album = { id: 'album-1', name: 'Changed', pages: [] };
        rerender();

        // Advance time
        jest.advanceTimersByTime(5000);

        expect(saveAlbum).toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalled();
    });

    it('should not dispatch if status is loading', () => {
        let album = { id: 'album-1', name: 'Original', pages: [] };

        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            // If it's selectAlbumStatus, return 'loading'
            if (selector.toString().includes('status')) return 'loading';
            return album;
        });

        renderHook(() => useAutoSave());

        album = { id: 'album-1', name: 'Changed', pages: [] };
        jest.advanceTimersByTime(5000);

        expect(dispatch).not.toHaveBeenCalled();
    });
});
