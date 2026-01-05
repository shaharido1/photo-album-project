import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Trash2,
  RotateCw,
  ZoomIn,
  Move,
  Layers,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FilterControls } from './FilterControls';
import { FreestyleFilterControls } from './FreestyleFilterControls';
import {
  selectSelectedSlot,
  selectSelectedFreestyleItem,
  selectCurrentPage,
  selectCurrentPageIndex,
  selectAlbumId,
  updateSlotPosition,
  updateSlotScale,
  updateSlotRotation,
  removePhotoFromSlot,
  updatePageLayout,
  setPageBackground,
  updateFreestyleItem,
  removeFreestyleItem,
  bringFreestyleItemToFront,
  sendFreestyleItemToBack,
  bringFreestyleItemForward,
  sendFreestyleItemBackward,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getAllLayouts } from '@/features/layouts/layoutTemplates';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

interface BackgroundColor {
  id: string;
  color: string;
  name: string;
}

const BACKGROUND_COLORS: BackgroundColor[] = [
  { id: 'white', color: '#ffffff', name: 'White' },
  { id: 'cream', color: '#faf7f2', name: 'Cream' },
  { id: 'black', color: '#000000', name: 'Black' },
  { id: 'gray', color: '#6b7280', name: 'Gray' },
];

export function PropertiesPanel(): JSX.Element {
  const dispatch = useAppDispatch();
  const albumId = useAppSelector(selectAlbumId);
  const selectedSlot = useAppSelector(selectSelectedSlot);
  const selectedFreestyleItem = useAppSelector(selectSelectedFreestyleItem);
  const currentPage = useAppSelector(selectCurrentPage);
  const currentPageIndex = useAppSelector(selectCurrentPageIndex);
  const photos = useAppSelector(selectAllPhotos);

  // State for layout change confirmation dialog
  const [pendingLayoutId, setPendingLayoutId] = useState<string | null>(null);

  const layouts = getAllLayouts();
  const isFreestyleMode = currentPage?.layoutId === 'freestyle';

  // Check if page has content
  const pageHasContent = currentPage
    ? isFreestyleMode
      ? (currentPage.freestyleItems?.length || 0) > 0
      : currentPage.slots.some((slot) => slot.photoId)
    : false;

  // Get selected slot data (for template layouts)
  const slot =
    selectedSlot && currentPage && !isFreestyleMode
      ? currentPage.slots[selectedSlot.slotIndex]
      : null;

  // Get selected freestyle item data
  const freestyleItem =
    selectedFreestyleItem && currentPage?.freestyleItems
      ? currentPage.freestyleItems.find((i) => i.id === selectedFreestyleItem.itemId)
      : null;

  const photo = slot?.photoId
    ? photos.find((p) => p.id === slot.photoId)
    : freestyleItem?.photoId
    ? photos.find((p) => p.id === freestyleItem.photoId)
    : null;

  const handleScaleChange = (value: number[]): void => {
    if (!selectedSlot) return;
    dispatch(
      updateSlotScale({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
        scale: value[0],
      })
    );
  };

  const handleRotate = (): void => {
    if (!selectedSlot || !slot) return;
    const newRotation = (slot.rotation + 90) % 360;
    dispatch(
      updateSlotRotation({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
        rotation: newRotation,
      })
    );
  };

  const handleResetPosition = (): void => {
    if (!selectedSlot) return;
    dispatch(
      updateSlotPosition({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
        position: { x: 0, y: 0 },
      })
    );
  };

  const handleRemove = (): void => {
    if (!selectedSlot) return;
    dispatch(
      removePhotoFromSlot({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
      })
    );
  };

  const handleLayoutChange = (layoutId: string): void => {
    // If page has content and we're changing to a different layout type, show confirmation
    if (pageHasContent && layoutId !== currentPage?.layoutId) {
      const isChangingToOrFromFreestyle =
        layoutId === 'freestyle' || currentPage?.layoutId === 'freestyle';
      if (isChangingToOrFromFreestyle) {
        setPendingLayoutId(layoutId);
        return;
      }
    }
    dispatch(
      updatePageLayout({
        pageIndex: currentPageIndex,
        layoutId,
      })
    );
  };

  const handleConfirmLayoutChange = (): void => {
    if (pendingLayoutId) {
      dispatch(
        updatePageLayout({
          pageIndex: currentPageIndex,
          layoutId: pendingLayoutId,
        })
      );
      setPendingLayoutId(null);
    }
  };

  const handleCancelLayoutChange = (): void => {
    setPendingLayoutId(null);
  };

  const handleBackgroundChange = (color: string): void => {
    dispatch(
      setPageBackground({
        pageIndex: currentPageIndex,
        color,
      })
    );
  };

  // Freestyle item handlers
  const handleFreestyleRotate = (): void => {
    if (!selectedFreestyleItem || !freestyleItem) return;
    const newRotation = (freestyleItem.rotation + 90) % 360;
    dispatch(
      updateFreestyleItem({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
        updates: { rotation: newRotation },
      })
    );
  };

  const handleFreestyleResetTransform = (): void => {
    if (!selectedFreestyleItem) return;
    dispatch(
      updateFreestyleItem({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
        updates: { rotation: 0 },
      })
    );
  };

  const handleFreestyleRemove = (): void => {
    if (!selectedFreestyleItem) return;
    dispatch(
      removeFreestyleItem({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
      })
    );
  };

  // Layer control handlers
  const handleBringToFront = (): void => {
    if (!selectedFreestyleItem) return;
    dispatch(
      bringFreestyleItemToFront({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
      })
    );
  };

  const handleSendToBack = (): void => {
    if (!selectedFreestyleItem) return;
    dispatch(
      sendFreestyleItemToBack({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
      })
    );
  };

  const handleBringForward = (): void => {
    if (!selectedFreestyleItem) return;
    dispatch(
      bringFreestyleItemForward({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
      })
    );
  };

  const handleSendBackward = (): void => {
    if (!selectedFreestyleItem) return;
    dispatch(
      sendFreestyleItemBackward({
        pageIndex: selectedFreestyleItem.pageIndex,
        itemId: selectedFreestyleItem.itemId,
      })
    );
  };

  if (!albumId) {
    return (
      <div className="w-64 border-l bg-muted/30 flex flex-col">
        <div className="p-3 border-b">
          <h2 className="text-sm font-medium">Properties</h2>
        </div>
        <div className="p-3 flex-1">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Create an album to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-l bg-muted/30 flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-sm font-medium">Properties</h2>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Page Layout Section */}
        <div className="space-y-3 mb-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Page Layout
          </Label>
          <div className="grid grid-cols-4 gap-1">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => handleLayoutChange(layout.id)}
                className={cn(
                  'aspect-square rounded border-2 p-1 hover:border-primary/50 transition-colors',
                  currentPage?.layoutId === layout.id
                    ? 'border-primary bg-primary/10'
                    : 'border-muted'
                )}
                title={layout.name}
              >
                <div className="w-full h-full relative flex items-center justify-center">
                  {layout.id === 'freestyle' ? (
                    // Special icon for freestyle layout
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    layout.slots.map((s, i) => (
                      <div
                        key={i}
                        className="absolute bg-muted-foreground/30 rounded-sm"
                        style={{
                          left: `${s.x}%`,
                          top: `${s.y}%`,
                          width: `${s.width}%`,
                          height: `${s.height}%`,
                        }}
                      />
                    ))
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Background Color Section */}
        <div className="space-y-3 mb-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Background
          </Label>
          <div className="flex gap-2">
            {BACKGROUND_COLORS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleBackgroundChange(bg.color)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
                  currentPage?.background === bg.color
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-muted hover:border-primary/50'
                )}
                style={{ backgroundColor: bg.color }}
                title={bg.name}
              />
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Selected Photo Section - Template Slots */}
        {slot && photo ? (
          <div className="space-y-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Selected Photo
            </Label>

            {/* Photo Preview */}
            <div className="aspect-video rounded-md overflow-hidden bg-muted">
              <img
                src={photo.thumbnail}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Zoom/Scale Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <ZoomIn className="h-3 w-3" />
                  Zoom
                </Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(slot.scale * 100)}%
                </span>
              </div>
              <Slider
                value={[slot.scale]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={handleScaleChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4 mr-1" />
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleResetPosition}
              >
                <Move className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            <Separator />

            {/* Filter Controls */}
            {selectedSlot && (
              <FilterControls
                slot={slot}
                pageIndex={selectedSlot.pageIndex}
                slotIndex={selectedSlot.slotIndex}
                photoThumbnail={photo.thumbnail}
              />
            )}

            <Separator />

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from page
            </Button>
          </div>
        ) : freestyleItem && photo ? (
          /* Selected Photo Section - Freestyle Items */
          <div className="space-y-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Selected Photo
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Freestyle
              </span>
            </Label>

            {/* Photo Preview */}
            <div className="aspect-video rounded-md overflow-hidden bg-muted">
              <img
                src={photo.thumbnail}
                alt={photo.name}
                className="w-full h-full object-cover"
                style={{ transform: `rotate(${freestyleItem.rotation}deg)` }}
              />
            </div>

            {/* Size and Layer Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Size: {Math.round(freestyleItem.width)}% × {Math.round(freestyleItem.height)}%
                {freestyleItem.rotation !== 0 && (
                  <span className="ml-2">Rotation: {Math.round(freestyleItem.rotation)}°</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Layer: {freestyleItem.zIndex}
              </div>
            </div>

            {/* Layer Controls */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Layer Order
              </Label>
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleBringToFront}
                  title="Bring to Front"
                >
                  <ChevronsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleBringForward}
                  title="Bring Forward"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleSendBackward}
                  title="Send Backward"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleSendToBack}
                  title="Send to Back"
                >
                  <ChevronsDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Rotation Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleFreestyleRotate}
              >
                <RotateCw className="h-4 w-4 mr-1" />
                +90°
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleFreestyleResetTransform}
                disabled={freestyleItem.rotation === 0}
              >
                <Move className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            <Separator />

            {/* Filter Controls for Freestyle */}
            {selectedFreestyleItem && (
              <FreestyleFilterControls
                item={freestyleItem}
                pageIndex={selectedFreestyleItem.pageIndex}
                itemId={selectedFreestyleItem.itemId}
                photoThumbnail={photo.thumbnail}
              />
            )}

            <Separator />

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleFreestyleRemove}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from page
            </Button>
          </div>
        ) : slot ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Empty slot selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag a photo here to add it
            </p>
          </div>
        ) : isFreestyleMode ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Click a photo to select it
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag photos from the library to add them
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Select a photo slot to edit
            </p>
          </div>
        )}
      </div>

      {/* Layout Change Confirmation Dialog */}
      <AlertDialog open={!!pendingLayoutId} onOpenChange={(open) => !open && handleCancelLayoutChange()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Page Layout?</AlertDialogTitle>
            <AlertDialogDescription>
              This page has content. Switching between freestyle and template layouts will remove the current content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLayoutChange}>
              Change Layout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
