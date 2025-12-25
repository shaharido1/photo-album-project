import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, ImagePlus, Check } from 'lucide-react';
import {
  fetchPhotos,
  selectAllPhotos,
  selectPhotosStatus,
  selectPhotosError,
  selectSelectedPhotoIds,
  togglePhotoSelection,
} from '@/features/photos/photosSlice';
import { cn } from '@/lib/utils';

export function PhotoLibraryPanel() {
  const dispatch = useDispatch();
  const photos = useSelector(selectAllPhotos);
  const status = useSelector(selectPhotosStatus);
  const error = useSelector(selectPhotosError);
  const selectedIds = useSelector(selectSelectedPhotoIds);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPhotos());
    }
  }, [status, dispatch]);

  const isLoading = status === 'loading';
  const hasError = status === 'failed';

  const handlePhotoClick = (photoId) => {
    dispatch(togglePhotoSelection(photoId));
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-sm font-medium mb-2">Photo Library</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <ImagePlus className="h-4 w-4 mr-1" />
            Google
          </Button>
        </div>
        {selectedIds.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {selectedIds.length} photo{selectedIds.length !== 1 ? 's' : ''}{' '}
            selected
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-destructive mb-2">
                Failed to load photos
              </p>
              <p className="text-xs text-muted-foreground mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(fetchPhotos())}
              >
                Try again
              </Button>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                No photos yet
              </p>
              <p className="text-xs text-muted-foreground">
                Upload photos or connect Google Photos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo) => {
                const isSelected = selectedIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => handlePhotoClick(photo.id)}
                    className={cn(
                      'relative aspect-square rounded-md bg-muted overflow-hidden cursor-pointer transition-all',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:ring-2 hover:ring-primary/50'
                    )}
                  >
                    <img
                      src={photo.thumbnail}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
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
