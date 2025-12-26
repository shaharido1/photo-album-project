import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  Loader2,
  ImagePlus,
  FolderOpen,
  ArrowLeft,
  AlertCircle,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  closeDialog,
  selectAlbum,
  togglePhotoSelection,
  selectAllPhotos,
  clearPhotoSelection,
  resetImportState,
  checkGooglePhotosStatus,
  startGooglePhotosAuth,
  disconnectGooglePhotos,
  fetchGooglePhotosAlbums,
  fetchGooglePhotosPhotos,
  importGooglePhotos,
  selectGooglePhotosIsConnected,
  selectGooglePhotosConnectionStatus,
  selectGooglePhotosConnectedEmail,
  selectGooglePhotosAlbums,
  selectGooglePhotosAlbumsStatus,
  selectGooglePhotosPhotos,
  selectGooglePhotosPhotosStatus,
  selectGooglePhotosSelectedAlbumId,
  selectGooglePhotosSelectedPhotoIds,
  selectGooglePhotosImportStatus,
  selectGooglePhotosImportProgress,
  selectGooglePhotosIsDialogOpen,
  selectGooglePhotosHasMoreAlbums,
  selectGooglePhotosHasMorePhotos,
} from './googlePhotosSlice';
import type { ImportOptions } from '@photo-album/types';

export function GooglePhotosDialog(): JSX.Element {
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector(selectGooglePhotosIsDialogOpen);
  const isConnected = useAppSelector(selectGooglePhotosIsConnected);
  const connectionStatus = useAppSelector(selectGooglePhotosConnectionStatus);
  const connectedEmail = useAppSelector(selectGooglePhotosConnectedEmail);
  const albums = useAppSelector(selectGooglePhotosAlbums);
  const albumsStatus = useAppSelector(selectGooglePhotosAlbumsStatus);
  const photos = useAppSelector(selectGooglePhotosPhotos);
  const photosStatus = useAppSelector(selectGooglePhotosPhotosStatus);
  const selectedAlbumId = useAppSelector(selectGooglePhotosSelectedAlbumId);
  const selectedPhotoIds = useAppSelector(selectGooglePhotosSelectedPhotoIds);
  const importStatus = useAppSelector(selectGooglePhotosImportStatus);
  const importProgress = useAppSelector(selectGooglePhotosImportProgress);
  const hasMoreAlbums = useAppSelector(selectGooglePhotosHasMoreAlbums);
  const hasMorePhotos = useAppSelector(selectGooglePhotosHasMorePhotos);

  // Check connection status when dialog opens
  useEffect(() => {
    if (isOpen && connectionStatus === 'idle') {
      void dispatch(checkGooglePhotosStatus());
    }
  }, [isOpen, connectionStatus, dispatch]);

  // Load albums when connected
  useEffect(() => {
    if (isOpen && isConnected && albumsStatus === 'idle') {
      void dispatch(fetchGooglePhotosAlbums());
    }
  }, [isOpen, isConnected, albumsStatus, dispatch]);

  // Load photos when album is selected or "All Photos" is chosen
  useEffect(() => {
    if (isOpen && isConnected && photosStatus === 'idle' && selectedAlbumId !== undefined) {
      void dispatch(
        fetchGooglePhotosPhotos(
          selectedAlbumId ? { albumId: selectedAlbumId } : undefined
        )
      );
    }
  }, [isOpen, isConnected, photosStatus, selectedAlbumId, dispatch]);

  // Reset import state after success
  useEffect(() => {
    if (importStatus === 'succeeded') {
      const timer = setTimeout(() => {
        dispatch(resetImportState());
        dispatch(closeDialog());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [importStatus, dispatch]);

  const handleClose = () => {
    dispatch(closeDialog());
  };

  const handleConnect = () => {
    void dispatch(startGooglePhotosAuth());
  };

  const handleDisconnect = () => {
    void dispatch(disconnectGooglePhotos());
  };

  const handleSelectAlbum = (albumId: string | null) => {
    dispatch(selectAlbum(albumId));
  };

  const handleBackToAlbums = () => {
    dispatch(selectAlbum(undefined as unknown as null));
  };

  const handlePhotoClick = (photoId: string) => {
    dispatch(togglePhotoSelection(photoId));
  };

  const handleSelectAll = () => {
    dispatch(selectAllPhotos());
  };

  const handleClearSelection = () => {
    dispatch(clearPhotoSelection());
  };

  const handleImport = () => {
    if (selectedPhotoIds.length === 0) return;

    const options: ImportOptions = {
      storageType: 'firebase', // Store copies in Firebase
    };

    void dispatch(importGooglePhotos({ photoIds: selectedPhotoIds, options }));
  };

  const handleLoadMoreAlbums = () => {
    void dispatch(fetchGooglePhotosAlbums({ pageToken: albums[albums.length - 1]?.id }));
  };

  const handleLoadMorePhotos = () => {
    void dispatch(
      fetchGooglePhotosPhotos({
        albumId: selectedAlbumId ?? undefined,
        pageToken: photos[photos.length - 1]?.id,
      })
    );
  };

  const isLoading = connectionStatus === 'loading';
  const isImporting = importStatus === 'importing';

  // View: Not connected
  const renderConnectView = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <ImagePlus className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Connect Google Photos</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Import photos directly from your Google Photos library into your album.
      </p>
      <Button onClick={handleConnect} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4 mr-2" />
            Connect Google Photos
          </>
        )}
      </Button>
    </div>
  );

  // View: Album list
  const renderAlbumsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Connected as {connectedEmail}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          <Unlink className="h-4 w-4 mr-1" />
          Disconnect
        </Button>
      </div>

      <div className="space-y-2">
        {/* All Photos option */}
        <button
          onClick={() => handleSelectAlbum(null)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">All Photos</p>
            <p className="text-sm text-muted-foreground">
              Browse all your photos
            </p>
          </div>
        </button>

        {albumsStatus === 'loading' && albums.length === 0 ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-12 h-12 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => handleSelectAlbum(album.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                {album.coverPhotoBaseUrl ? (
                  <img
                    src={`${album.coverPhotoBaseUrl}=w96-h96-c`}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{album.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {album.mediaItemsCount ?? '0'} items
                  </p>
                </div>
              </button>
            ))}

            {hasMoreAlbums && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLoadMoreAlbums}
                disabled={albumsStatus === 'loading'}
              >
                {albumsStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load more albums
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  // View: Photo picker
  const renderPhotosView = () => {
    const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
    const title = selectedAlbum?.title ?? 'All Photos';

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackToAlbums}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span className="font-medium">{title}</span>
        </div>

        {selectedPhotoIds.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm">
              {selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select all
              </Button>
            </div>
          </div>
        )}

        {photosStatus === 'loading' && photos.length === 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No photos found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <button
                    key={photo.id}
                    onClick={() => handlePhotoClick(photo.id)}
                    className={cn(
                      'relative aspect-square rounded overflow-hidden transition-all',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:ring-2 hover:ring-primary/50'
                    )}
                  >
                    <img
                      src={`${photo.baseUrl}=w200-h200-c`}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {hasMorePhotos && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLoadMorePhotos}
                disabled={photosStatus === 'loading'}
              >
                {photosStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load more photos
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  // View: Import progress/success
  const renderImportView = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {importStatus === 'importing' ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium">Importing photos...</p>
          {importProgress && (
            <p className="text-sm text-muted-foreground">
              {importProgress.imported} of {importProgress.total} imported
            </p>
          )}
        </>
      ) : importStatus === 'succeeded' ? (
        <>
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-sm font-medium">Import complete!</p>
          {importProgress && (
            <p className="text-sm text-muted-foreground">
              {importProgress.imported} photo{importProgress.imported !== 1 ? 's' : ''} imported
              {importProgress.failed > 0 && `, ${importProgress.failed} failed`}
            </p>
          )}
        </>
      ) : importStatus === 'failed' ? (
        <>
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">Import failed</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => dispatch(resetImportState())}>
            Try again
          </Button>
        </>
      ) : null}
    </div>
  );

  // Determine which view to show
  const renderContent = () => {
    if (importStatus !== 'idle') {
      return renderImportView();
    }

    if (!isConnected) {
      return renderConnectView();
    }

    if (selectedAlbumId !== undefined) {
      return renderPhotosView();
    }

    return renderAlbumsView();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Google Photos</DialogTitle>
          <DialogDescription>
            {isConnected
              ? 'Select photos to import into your library'
              : 'Connect your Google Photos account to import photos'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">{renderContent()}</ScrollArea>

        {isConnected && selectedAlbumId !== undefined && selectedPhotoIds.length > 0 && importStatus === 'idle' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>Import {selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
