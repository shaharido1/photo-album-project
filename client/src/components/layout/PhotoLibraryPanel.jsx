import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  ImagePlus,
  Check,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import {
  fetchPhotos,
  selectAllPhotos,
  selectPhotosStatus,
  selectPhotosError,
  selectSelectedPhotoIds,
  togglePhotoSelection,
  addPhotos,
} from '@/features/photos/photosSlice';
import {
  selectAlbumId,
  selectCurrentPageIndex,
  assignPhotoToSlot,
  selectCurrentPage,
  selectSlot,
} from '@/features/album/albumSlice';
import { cn } from '@/lib/utils';

// Accepted image types
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Generate unique ID
const generateId = () =>
  `upload-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Process a single file into a photo object
const processFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(
        new Error(
          `Invalid file type: ${file.name}. Accepted: JPEG, PNG, GIF, WebP`
        )
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File too large: ${file.name}. Maximum size: 20MB`));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        id: generateId(),
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        thumbnail: url,
        fullSize: url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        createdAt: new Date().toISOString(),
        isUploaded: true,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
};

export function PhotoLibraryPanel() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Process uploaded files
  const handleFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadError(null);

      const fileArray = Array.from(files);
      const results = await Promise.allSettled(fileArray.map(processFile));

      const successfulPhotos = [];
      const errors = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successfulPhotos.push(result.value);
        } else {
          errors.push(result.reason.message);
        }
      });

      if (successfulPhotos.length > 0) {
        dispatch(addPhotos(successfulPhotos));
      }

      if (errors.length > 0) {
        setUploadError(errors.join('\n'));
        // Auto-clear error after 5 seconds
        setTimeout(() => setUploadError(null), 5000);
      }

      setIsUploading(false);
    },
    [dispatch]
  );

  // Handle file input change
  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag-and-drop handlers for file upload
  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging if files are being dragged (not photos from library)
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFiles(true);
    }
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

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
    const emptySlotIndex = currentPage.slots.findIndex((slot) => !slot.photoId);
    if (emptySlotIndex !== -1) {
      dispatch(
        assignPhotoToSlot({
          pageIndex: currentPageIndex,
          slotIndex: emptySlotIndex,
          photoId,
        })
      );
      dispatch(
        selectSlot({ pageIndex: currentPageIndex, slotIndex: emptySlotIndex })
      );
    }
  };

  return (
    <div
      className={cn(
        'w-64 border-r bg-muted/30 flex flex-col relative',
        isDraggingFiles && 'ring-2 ring-primary ring-inset'
      )}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag overlay */}
      {isDraggingFiles && (
        <div className="absolute inset-0 bg-primary/10 z-10 flex items-center justify-center border-2 border-dashed border-primary rounded-lg m-2">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">Drop photos here</p>
          </div>
        </div>
      )}

      <div className="p-3 border-b">
        <h2 className="text-sm font-medium mb-2">Photo Library</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-1" />
            {isUploading ? 'Adding...' : 'Upload'}
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <ImagePlus className="h-4 w-4 mr-1" />
            Google
          </Button>
        </div>

        {/* Upload error message */}
        {uploadError && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="whitespace-pre-wrap">{uploadError}</span>
          </div>
        )}

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
