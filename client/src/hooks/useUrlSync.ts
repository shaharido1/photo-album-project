import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  selectAlbumId,
  selectCurrentPageIndex,
  fetchAlbum,
  setCurrentPage,
  clearAlbum,
} from '@/features/album/albumSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useLastVisited } from './useLastVisited';

/**
 * One-way sync: URL → Redux
 * URL is the source of truth. When URL changes, Redux is updated.
 * Components should use navigate() to change URLs, not dispatch Redux actions.
 */
export function useUrlSync() {
  const dispatch = useAppDispatch();
  const params = useParams<{ albumId?: string; pageIndex?: string }>();
  const { setLastVisited } = useLastVisited();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentReduxAlbumId = useAppSelector(selectAlbumId);
  const currentReduxPageIndex = useAppSelector(selectCurrentPageIndex);

  const urlAlbumId = params.albumId;
  const urlPageIndex = params.pageIndex ? parseInt(params.pageIndex, 10) : 0;

  // URL → Redux: When URL changes, update Redux
  useEffect(() => {

    // Not authenticated - do nothing
    if (!isAuthenticated) {
      return;
    }

    // No album in URL - clear Redux if there was one
    if (!urlAlbumId) {
      if (currentReduxAlbumId) {
        dispatch(clearAlbum());
      }
      return;
    }

    // Album in URL - fetch if different, or just set page
    if (urlAlbumId !== currentReduxAlbumId) {
      // Different album - fetch it (this will also set page to 0)
      dispatch(fetchAlbum(urlAlbumId)).then(() => {
        // After fetch, set the page if needed
        if (urlPageIndex > 0) {
          dispatch(setCurrentPage(urlPageIndex));
        }
        // Save to localStorage
        setLastVisited(urlAlbumId, urlPageIndex > 0 ? urlPageIndex : undefined);
      });
    } else if (urlPageIndex !== currentReduxPageIndex) {
      // Same album but different page - update page
      dispatch(setCurrentPage(urlPageIndex));
      // Save to localStorage
      setLastVisited(urlAlbumId, urlPageIndex > 0 ? urlPageIndex : undefined);
    }
  }, [
    urlAlbumId,
    urlPageIndex,
    currentReduxAlbumId,
    currentReduxPageIndex,
    isAuthenticated,
    dispatch,
    setLastVisited,
  ]);
}
