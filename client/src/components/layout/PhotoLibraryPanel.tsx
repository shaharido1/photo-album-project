import { useEffect, useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
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
import {
  Upload,
  ImagePlus,
  Check,
  GripVertical,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  fetchPhotos,
  selectAllPhotos,
  selectPhotosStatus,
  selectPhotosError,
  selectSelectedPhotoIds,
  togglePhotoSelection,
  deleteSelectedPhotos,
  clearSelection,
  uploadPhotos,
  selectUploadStatus,
  selectUploadProgress,
  selectUploadError,
  deletePhotoFromServer,
} from '@/features/photos/photosSlice';
import {
  checkGooglePhotosStatus,
  checkGooglePhotosPickerStatus,
  startGooglePhotosAuth,
  startGooglePhotosPicker,
  selectGooglePhotosIsConnected,
  selectGooglePhotosConnectionStatus,
  selectGooglePhotosPickerStatus,
  selectGooglePhotosPickerSessionId,
  selectGooglePhotosImportStatus,
  selectGooglePhotosImportProgress,
  resetImportState,
  resetPickerState,
} from '@/features/googlePhotos/googlePhotosSlice';
import {
  selectAlbumId,
  selectCurrentPageIndex,
  assignPhotoToSlot,
  selectCurrentPage,
  selectSlot,
} from '@/features/album/albumSlice';
import { cn, getPhotoUrl } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { Photo } from '@/types';

// Accepted image types
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Validate files before upload
const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
  const valid: File[] = [];
  const errors: string[] = [];

  files.forEach((file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push(`Invalid file type: ${file.name}. Accepted: JPEG, PNG, GIF, WebP`);
    } else if (file.size > MAX_FILE_SIZE) {
      errors.push(`File too large: ${file.name}. Maximum size: 20MB`);
    } else {
      valid.push(file);
    }
  });

  return { valid, errors };
};

export function PhotoLibraryPanel(): JSX.Element {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const photos = useAppSelector(selectAllPhotos);
  const status = useAppSelector(selectPhotosStatus);
  const error = useAppSelector(selectPhotosError);
  const selectedIds = useAppSelector(selectSelectedPhotoIds);
  const albumId = useAppSelector(selectAlbumId);
  const currentPageIndex = useAppSelector(selectCurrentPageIndex);
  const currentPage = useAppSelector(selectCurrentPage);
  const uploadStatus = useAppSelector(selectUploadStatus);
  const uploadProgress = useAppSelector(selectUploadProgress);
  const uploadError = useAppSelector(selectUploadError);

  const isGoogleConnected = useAppSelector(selectGooglePhotosIsConnected);
  const googleConnectionStatus = useAppSelector(selectGooglePhotosConnectionStatus);
  const googlePickerStatus = useAppSelector(selectGooglePhotosPickerStatus);
  const googleImportStatus = useAppSelector(selectGooglePhotosImportStatus);
  const googleImportProgress = useAppSelector(selectGooglePhotosImportProgress);

  const googlePickerSessionId = useAppSelector(selectGooglePhotosPickerSessionId);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchPhotos());
    }
  }, [status, dispatch]);

  // Check Google Photos status on mount
  useEffect(() => {
    if (googleConnectionStatus === 'idle') {
      void dispatch(checkGooglePhotosStatus());
    }
  }, [googleConnectionStatus, dispatch]);

  // Poll for Google Photos picker status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (googlePickerStatus === 'polling' && googlePickerSessionId) {
      interval = setInterval(() => {
        void dispatch(checkGooglePhotosPickerStatus(googlePickerSessionId));
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [googlePickerStatus, googlePickerSessionId, dispatch]);

  // Reset Google Photos state after successful import
  useEffect(() => {
    if (googleImportStatus === 'succeeded') {
      const timer = setTimeout(() => {
        dispatch(resetImportState());
        dispatch(resetPickerState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [googleImportStatus, dispatch]);

  const isLoading = status === 'loading';
  const hasError = status === 'failed';
  const isUploading = uploadStatus === 'uploading';
  const isGoogleActionLoading =
    googleConnectionStatus === 'loading' ||
    googlePickerStatus === 'creating' ||
    googlePickerStatus === 'polling' ||
    googleImportStatus === 'importing';

  // Process uploaded files - upload to server
  const handleFiles = useCallback(
    (files: FileList | null): void => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const { valid, errors } = validateFiles(fileArray);

      if (errors.length > 0) {
        setValidationError(errors.join('\n'));
        setTimeout(() => setValidationError(null), 5000);
      }

      if (valid.length > 0) {
        void dispatch(uploadPhotos(valid));
      }
    },
    [dispatch]
  );

  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    void handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle upload button click
  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  // Handle Google button click
  const handleGoogleClick = (): void => {
    if (!isGoogleConnected) {
      void dispatch(startGooglePhotosAuth());
    } else {
      void dispatch(startGooglePhotosPicker());
    }
  };

  // Drag-and-drop handlers for file upload
  const handleFileDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging if files are being dragged (not photos from library)
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFiles(true);
    }
  };

  const handleFileDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      void handleFiles(files);
    }
  };

  const handlePhotoClick = (photoId: string): void => {
    dispatch(togglePhotoSelection(photoId));
  };

  const handleDeleteSelected = (): void => {
    if (selectedIds.length === 0) return;
    // Delete from server for each selected photo
    selectedIds.forEach((id) => {
      void dispatch(deletePhotoFromServer(id));
    });
    dispatch(deleteSelectedPhotos());
  };

  const handleClearSelection = (): void => {
    dispatch(clearSelection());
  };

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    photo: Photo
  ): void => {
    e.dataTransfer.setData('photoId', photo.id);
    e.dataTransfer.setData('photoUrl', photo.fullSize || photo.thumbnail);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (photo: Photo): void => {
    if (!albumId || !currentPage) return;

    // Find first empty slot
    const emptySlotIndex = currentPage.slots.findIndex((slot) => !slot.photoId);
    if (emptySlotIndex !== -1) {
      dispatch(
        assignPhotoToSlot({
          pageIndex: currentPageIndex,
          slotIndex: emptySlotIndex,
          photoId: photo.id,
          photoUrl: photo.fullSize || photo.thumbnail,
        })
      );
      dispatch(
        selectSlot({ pageIndex: currentPageIndex, slotIndex: emptySlotIndex })
      );
    }
  };

  return (
    <div
      data-testid="photo-library-panel"
      className={cn(
        'flex flex-col h-full relative',
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
          {albumId && (
            <Button
              variant={isGoogleConnected ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex-1 transition-all",
                !isGoogleConnected && "opacity-80 hover:opacity-100 border-dashed"
              )}
              onClick={handleGoogleClick}
              disabled={isGoogleActionLoading}
            >
              {isGoogleActionLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ImagePlus className={cn("h-4 w-4 mr-1", !isGoogleConnected && "text-muted-foreground")} />
              )}
              {isGoogleConnected ? 'Google' : 'Connect'}
            </Button>
          )}
        </div>

        {/* Upload progress */}
        {isUploading && uploadProgress && (
          <div className="mt-2 p-2 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                Uploading {uploadProgress.current}/{uploadProgress.total}...
              </span>
            </div>
            <div className="w-full bg-muted-foreground/20 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload success message */}
        {uploadStatus === 'succeeded' && (
          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Photos uploaded successfully!</span>
          </div>
        )}

        {/* Upload error message */}
        {/* Google Photos status */}
        {googlePickerStatus === 'polling' && (
          <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs text-primary flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Waiting for Google Photos selection...</span>
          </div>
        )}

        {googleImportStatus === 'importing' && googleImportProgress && (
          <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs text-primary">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                Importing {googleImportProgress.imported + googleImportProgress.failed}/{googleImportProgress.total} photos...
              </span>
            </div>
            <div className="w-full bg-primary/10 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${((googleImportProgress.imported + googleImportProgress.failed) / googleImportProgress.total) * 100}%`,
                }}
              />
            </div>
            {googleImportProgress.failed > 0 && (
              <div className="mt-1 text-amber-600">
                {googleImportProgress.failed} failed
              </div>
            )}
          </div>
        )}
        {googleImportStatus === 'importing' && !googleImportProgress && (
          <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs text-primary">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Starting import...</span>
            </div>
          </div>
        )}

        {googleImportStatus === 'succeeded' && (
          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Google photos imported!</span>
          </div>
        )}

        {(uploadError || validationError) && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="whitespace-pre-wrap">
              {uploadError || validationError}
            </span>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} photo{selectedIds.length !== 1 ? 's' : ''}{' '}
              selected
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleClearSelection}
              >
                Clear
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete photos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedIds.length}{' '}
                      {selectedIds.length === 1 ? 'photo' : 'photos'} from your
                      library. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
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
                onClick={() => void dispatch(fetchPhotos())}
              >
                Try again
              </Button>
            </div>
          ) : !photos || photos.length === 0 ? (
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
                    onDragStart={(e) => handleDragStart(e, photo)}
                    onClick={() => handlePhotoClick(photo.id)}
                    onDoubleClick={() => handleDoubleClick(photo)}
                    className={cn(
                      'relative aspect-square rounded-md bg-muted overflow-hidden cursor-pointer transition-all group',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:ring-2 hover:ring-primary/50',
                      albumId && 'cursor-grab active:cursor-grabbing'
                    )}
                  >
                    <img
                      src={getPhotoUrl(photo)}
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
