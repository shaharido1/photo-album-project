import { useSelector, useDispatch } from 'react-redux';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trash2, RotateCw, ZoomIn, Move } from 'lucide-react';
import {
  selectSelectedSlot,
  selectCurrentPage,
  selectCurrentPageIndex,
  selectAlbumId,
  updateSlotPosition,
  updateSlotScale,
  updateSlotRotation,
  removePhotoFromSlot,
  updatePageLayout,
  setPageBackground,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getAllLayouts } from '@/features/layouts/layoutTemplates';
import { cn } from '@/lib/utils';

const BACKGROUND_COLORS = [
  { id: 'white', color: '#ffffff', name: 'White' },
  { id: 'cream', color: '#faf7f2', name: 'Cream' },
  { id: 'black', color: '#000000', name: 'Black' },
  { id: 'gray', color: '#6b7280', name: 'Gray' },
];

export function PropertiesPanel() {
  const dispatch = useDispatch();
  const albumId = useSelector(selectAlbumId);
  const selectedSlot = useSelector(selectSelectedSlot);
  const currentPage = useSelector(selectCurrentPage);
  const currentPageIndex = useSelector(selectCurrentPageIndex);
  const photos = useSelector(selectAllPhotos);

  const layouts = getAllLayouts();

  // Get selected slot data
  const slot =
    selectedSlot && currentPage
      ? currentPage.slots[selectedSlot.slotIndex]
      : null;

  const photo = slot?.photoId
    ? photos.find((p) => p.id === slot.photoId)
    : null;

  const handleScaleChange = (value) => {
    if (!selectedSlot) return;
    dispatch(
      updateSlotScale({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
        scale: value[0],
      })
    );
  };

  const handleRotate = () => {
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

  const handleResetPosition = () => {
    if (!selectedSlot) return;
    dispatch(
      updateSlotPosition({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
        position: { x: 0, y: 0 },
      })
    );
  };

  const handleRemove = () => {
    if (!selectedSlot) return;
    dispatch(
      removePhotoFromSlot({
        pageIndex: selectedSlot.pageIndex,
        slotIndex: selectedSlot.slotIndex,
      })
    );
  };

  const handleLayoutChange = (layoutId) => {
    dispatch(
      updatePageLayout({
        pageIndex: currentPageIndex,
        layoutId,
      })
    );
  };

  const handleBackgroundChange = (color) => {
    dispatch(
      setPageBackground({
        pageIndex: currentPageIndex,
        color,
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
                <div className="w-full h-full relative">
                  {layout.slots.map((s, i) => (
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
                  ))}
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

        {/* Selected Photo Section */}
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
        ) : slot ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Empty slot selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag a photo here to add it
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
    </div>
  );
}
