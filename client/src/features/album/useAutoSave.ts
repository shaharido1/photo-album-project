import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { saveAlbum, selectAlbum, selectAlbumStatus } from './albumSlice';

const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

/**
 * Custom hook to auto-save the album every 5 seconds if there are changes.
 */
export function useAutoSave() {
    const dispatch = useAppDispatch();
    const album = useAppSelector(selectAlbum);
    const status = useAppSelector(selectAlbumStatus);
    const lastSavedAlbumRef = useRef<string>(JSON.stringify(album));
    const isSavingRef = useRef(false);

    useEffect(() => {
        if (!album.id) return;

        const interval = setInterval(() => {
            const currentAlbumStr = JSON.stringify(album);

            // Only save if the album has changed and we're not already saving
            if (currentAlbumStr !== lastSavedAlbumRef.current && status !== 'loading' && !isSavingRef.current) {
                console.log('Auto-saving album...');
                isSavingRef.current = true;
                dispatch(saveAlbum())
                    .unwrap()
                    .then(() => {
                        lastSavedAlbumRef.current = currentAlbumStr;
                    })
                    .catch((err) => {
                        console.error('Auto-save failed:', err);
                    })
                    .finally(() => {
                        isSavingRef.current = false;
                    });
            }
        }, AUTO_SAVE_INTERVAL);

        return () => clearInterval(interval);
    }, [album, status, dispatch]);
}
