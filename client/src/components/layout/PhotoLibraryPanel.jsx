import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, ImagePlus, Check, GripVertical } from 'lucide-react';
import {
  fetchPhotos,
  selectAllPhotos,
  selectPhotosStatus,
  selectPhotosError,
  selectSelectedPhotoIds,
  togglePhotoSelection,
} from '@/features/photos/photosSlice';
import {
  selectAlbumId,
  selectCurrentPageIndex,
  assignPhotoToSlot,
  selectCurrentPage,
  selectSlot,
} from '@/features/album/albumSlice';
import { cn } from '@/lib/utils';

export function PhotoLibraryPanel() {
  const dispatch = useDispatch();
  const photos = useSelector(selectAllPhotos);
  const status = useSelector(selectPhotosStatus);
  const error = useSelector(selectPhotosError);
  const selectedIds = useSelector(selectSelectedPhotoIds);
  const albumId = useSelector(selectAlbumId);
  const currentPageIndex = useSelector(selectCurrentPageIndex);
  const currentPage = useSelector(selectCurrentPage);

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

  const handleDragStart = (e, photoId) => {
    e.dataTransfer.setData('photoId', photoId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (photoId) => {
    if (!albumId || !currentPage) return;

    // Find first empty slot
    const emptySlotIndex = currentPage.slots.findIndex(slot => !slot.photoId);
    if (emptySlotIndex !== -1) {
      dispatch(assignPhotoToSlot({
        pageIndex: currentPageIndex,
        slotIndex: emptySlotIndex,
        photoId
      }));
      dispatch(selectSlot({ pageIndex: currentPageIndex, slotIndex: emptySlotIndex }));
    }
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
        {albumId && (
          <p className="text-xs text-primary mt-2">
            Drag photos to canvas or double-click to add
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
                    draggable={!!albumId}
                    onDragStart={(e) => handleDragStart(e, photo.id)}
                    onClick={() => handlePhotoClick(photo.id)}
                    onDoubleClick={() => handleDoubleClick(photo.id)}
                    className={cn(
                      'relative aspect-square rounded-md bg-muted overflow-hidden cursor-pointer transition-all group',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:ring-2 hover:ring-primary/50',
                      albumId && 'cursor-grab active:cursor-grabbing'
                    )}
                  >
                    <img
                      src={photo.thumbnail}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {albumId && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-3 w-3 text-white" />
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
