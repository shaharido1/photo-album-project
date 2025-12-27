import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Book, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
  fetchAlbums,
  fetchAlbum,
  deleteAlbum,
  selectAlbums,
  selectAlbumsStatus,
  selectAlbumId,
} from '@/features/album/albumSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { ALBUM_SIZE_PRESETS } from '@/features/album/albumSlice';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

interface MyAlbumsPanelProps {
  onCreateAlbum: () => void;
}

export function MyAlbumsPanel({ onCreateAlbum }: MyAlbumsPanelProps): JSX.Element {
  const dispatch = useAppDispatch();
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | null>(null);

  const albums = useAppSelector(selectAlbums);
  const albumsStatus = useAppSelector(selectAlbumsStatus);
  const currentAlbumId = useAppSelector(selectAlbumId);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated && albumsStatus === 'idle') {
      void dispatch(fetchAlbums());
    }
  }, [isAuthenticated, albumsStatus, dispatch]);

  const isLoading = albumsStatus === 'loading';
  const hasFailed = albumsStatus === 'failed';

  const handleSelectAlbum = async (albumId: string): Promise<void> => {
    if (albumId === currentAlbumId || loadingAlbumId) return;
    setLoadingAlbumId(albumId);
    try {
      await dispatch(fetchAlbum(albumId)).unwrap();
    } finally {
      setLoadingAlbumId(null);
    }
  };

  const handleDeleteAlbum = (albumId: string): void => {
    void dispatch(deleteAlbum(albumId));
  };

  const handleRetry = (): void => {
    void dispatch(fetchAlbums());
  };

  if (!isAuthenticated) {
    return (
      <div className="p-3">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Book className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Sign in to view albums</p>
          <p className="text-xs text-muted-foreground">
            Your albums are saved to your account
          </p>
        </div>
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="p-3">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-destructive mb-1">Failed to load albums</p>
          <p className="text-xs text-muted-foreground mb-3">
            Please try again
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onCreateAlbum}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Album
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Book className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">No albums yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first album to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {albums.map((album) => {
                const isSelected = album.id === currentAlbumId;
                const sizePreset = ALBUM_SIZE_PRESETS[album.size];
                return (
                  <div
                    key={album.id}
                    onClick={() => album.id && void handleSelectAlbum(album.id)}
                    className={cn(
                      'relative p-3 rounded-md border cursor-pointer transition-all group',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    {loadingAlbumId === album.id && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{album.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sizePreset?.name || album.size}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete album?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{album.name}&quot;. This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => album.id && handleDeleteAlbum(album.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
