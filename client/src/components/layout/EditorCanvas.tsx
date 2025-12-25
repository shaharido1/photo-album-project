import { useEffect, useRef, useState, useCallback, DragEvent } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Group,
  Transformer,
} from 'react-konva';
import { ImagePlus, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import {
  selectCurrentPage,
  selectCurrentPageIndex,
  selectAlbumId,
  selectAlbumSize,
  selectSelectedSlot,
  assignPhotoToSlot,
  updateSlotPosition,
  updateSlotScale,
  selectSlot,
  setViewMode,
  ALBUM_SIZE_PRESETS,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { PageSlot, LayoutSlot, Photo } from '@/types';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';

type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseImageState {
  image: HTMLImageElement | null;
  status: ImageStatus;
}

// Custom hook to load images
function useImage(
  url: string | undefined
): [HTMLImageElement | null, ImageStatus] {
  const [state, setState] = useState<UseImageState>({
    image: null,
    status: url ? 'loading' : 'idle',
  });

  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when URL is cleared
      setState({ image: null, status: 'idle' });
      return;
    }

    // Reset to loading state when URL changes
    setState((prev) =>
      prev.status === 'loading' ? prev : { image: null, status: 'loading' }
    );

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setState({ image: img, status: 'loaded' });
    };

    img.onerror = () => {
      setState({ image: null, status: 'error' });
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [state.image, state.status];
}

interface PhotoSlotProps {
  slot: PageSlot;
  slotDef: LayoutSlot;
  slotIndex: number;
  pageIndex: number;
  photo: Photo | null;
  isSelected: boolean;
  stageWidth: number;
  stageHeight: number;
  onSelect: (slotIndex: number) => void;
}

// Photo slot component with image
function PhotoSlot({
  slot,
  slotDef,
  slotIndex,
  pageIndex,
  photo,
  isSelected,
  stageWidth,
  stageHeight,
  onSelect,
}: PhotoSlotProps): JSX.Element {
  const dispatch = useAppDispatch();
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(photo?.fullSize || photo?.thumbnail);

  // Calculate slot position and size in pixels
  const slotX = (slotDef.x / 100) * stageWidth;
  const slotY = (slotDef.y / 100) * stageHeight;
  const slotWidth = (slotDef.width / 100) * stageWidth;
  const slotHeight = (slotDef.height / 100) * stageHeight;

  // Update transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>): void => {
    e.cancelBubble = true;
    onSelect(slotIndex);
  };

  const handleDragEnd = (e: KonvaEventObject<globalThis.DragEvent>): void => {
    const node = e.target;
    // Calculate offset from slot position as percentage
    const offsetX = ((node.x() - slotX) / slotWidth) * 100;
    const offsetY = ((node.y() - slotY) / slotHeight) * 100;
    dispatch(
      updateSlotPosition({
        pageIndex,
        slotIndex,
        position: { x: offsetX, y: offsetY },
      })
    );
  };

  const handleTransformEnd = (): void => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);
    dispatch(
      updateSlotScale({ pageIndex, slotIndex, scale: slot.scale * scaleX })
    );
  };

  // Calculate image display dimensions
  let imageWidth = slotWidth;
  let imageHeight = slotHeight;
  const imageX = slotX + (slot.position.x / 100) * slotWidth;
  const imageY = slotY + (slot.position.y / 100) * slotHeight;

  if (image) {
    // Calculate aspect ratio fit
    const imgAspect = image.width / image.height;
    const slotAspect = slotWidth / slotHeight;

    if (imgAspect > slotAspect) {
      // Image is wider - fit by height, crop width
      imageHeight = slotHeight * slot.scale;
      imageWidth = imageHeight * imgAspect;
    } else {
      // Image is taller - fit by width, crop height
      imageWidth = slotWidth * slot.scale;
      imageHeight = imageWidth / imgAspect;
    }
  }

  return (
    <Group>
      {/* Slot background/border */}
      <Rect
        x={slotX}
        y={slotY}
        width={slotWidth}
        height={slotHeight}
        fill={photo ? 'transparent' : '#f3f4f6'}
        stroke={isSelected ? '#8b5cf6' : '#e5e7eb'}
        strokeWidth={isSelected ? 2 : 1}
        dash={!photo ? [5, 5] : undefined}
      />

      {/* Photo image with clipping */}
      {photo && image && (
        <Group
          clipFunc={(ctx) => {
            ctx.rect(slotX, slotY, slotWidth, slotHeight);
          }}
        >
          <KonvaImage
            ref={shapeRef}
            image={image}
            x={imageX}
            y={imageY}
            width={imageWidth}
            height={imageHeight}
            draggable={isSelected}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        </Group>
      )}

      {/* Empty slot click area */}
      {!photo && (
        <Rect
          x={slotX}
          y={slotY}
          width={slotWidth}
          height={slotHeight}
          fill="transparent"
          onClick={handleClick}
          onTap={handleClick}
        />
      )}

      {/* Transformer for selected slot */}
      {isSelected && photo && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          rotateEnabled={false}
        />
      )}
    </Group>
  );
}

interface StageSize {
  width: number;
  height: number;
}

export function EditorCanvas(): JSX.Element {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<StageSize>({
    width: 500,
    height: 500,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const albumId = useAppSelector(selectAlbumId);
  const albumSize = useAppSelector(selectAlbumSize);
  const currentPage = useAppSelector(selectCurrentPage);
  const currentPageIndex = useAppSelector(selectCurrentPageIndex);
  const selectedSlot = useAppSelector(selectSelectedSlot);
  const photos = useAppSelector(selectAllPhotos);

  // Get album dimensions for aspect ratio
  const sizePreset =
    ALBUM_SIZE_PRESETS[albumSize] || ALBUM_SIZE_PRESETS['10x10'];
  const aspectRatio =
    sizePreset.dimensions.width / sizePreset.dimensions.height;

  // Get layout definition
  const layout = currentPage ? getLayoutById(currentPage.layoutId) : null;

  // Handle container resize
  useEffect(() => {
    const updateSize = (): void => {
      if (containerRef.current) {
        const container = containerRef.current;
        const maxWidth = container.clientWidth - 64; // padding
        const maxHeight = container.clientHeight - 64;

        let width: number, height: number;
        if (maxWidth / maxHeight > aspectRatio) {
          // Container is wider - fit by height
          height = Math.min(maxHeight, 600);
          width = height * aspectRatio;
        } else {
          // Container is taller - fit by width
          width = Math.min(maxWidth, 600);
          height = width / aspectRatio;
        }

        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [aspectRatio]);

  // Handle dropping photos onto canvas
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const photoId = e.dataTransfer.getData('photoId');
      if (!photoId || !currentPage || !layout) return;

      // Get drop position relative to the container
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      // Calculate the position of the stage within the container (centered with padding)
      const stageLeft = (containerRect.width - stageSize.width) / 2;
      const stageTop = (containerRect.height - stageSize.height) / 2;

      // Calculate drop position relative to the stage
      const dropX = e.clientX - containerRect.left - stageLeft;
      const dropY = e.clientY - containerRect.top - stageTop;

      // Find which slot was dropped on (if any)
      let targetSlotIndex = -1;
      for (let i = 0; i < layout.slots.length; i++) {
        const slotDef = layout.slots[i];
        const slotX = (slotDef.x / 100) * stageSize.width;
        const slotY = (slotDef.y / 100) * stageSize.height;
        const slotWidth = (slotDef.width / 100) * stageSize.width;
        const slotHeight = (slotDef.height / 100) * stageSize.height;

        if (
          dropX >= slotX &&
          dropX <= slotX + slotWidth &&
          dropY >= slotY &&
          dropY <= slotY + slotHeight
        ) {
          targetSlotIndex = i;
          break;
        }
      }

      // If dropped on a specific slot, use that slot (replace if occupied)
      // Otherwise, find first empty slot
      if (targetSlotIndex === -1) {
        targetSlotIndex = currentPage.slots.findIndex((slot) => !slot.photoId);
      }

      if (targetSlotIndex !== -1) {
        dispatch(
          assignPhotoToSlot({
            pageIndex: currentPageIndex,
            slotIndex: targetSlotIndex,
            photoId,
          })
        );
        dispatch(
          selectSlot({
            pageIndex: currentPageIndex,
            slotIndex: targetSlotIndex,
          })
        );
      }
    },
    [dispatch, currentPage, currentPageIndex, layout, stageSize]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleStageClick = (
    e: KonvaEventObject<MouseEvent | TouchEvent>
  ): void => {
    // Deselect when clicking on empty space
    if (e.target === e.target.getStage()) {
      dispatch(selectSlot(null));
    }
  };

  const handleSlotSelect = (slotIndex: number): void => {
    dispatch(selectSlot({ pageIndex: currentPageIndex, slotIndex }));
  };

  // No album created yet
  if (!albumId) {
    return (
      <div className="flex-1 bg-muted/50 flex items-center justify-center p-8">
        <div
          className="bg-background rounded-lg shadow-lg aspect-square w-full max-w-xl flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="empty-state-create-album"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">Create an album to start</p>
          <p className="text-sm text-muted-foreground">
            Click here or &quot;New Album&quot; in the header
          </p>
        </div>
        <CreateAlbumDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    );
  }

  const handleBackToBook = (): void => {
    dispatch(setViewMode('book'));
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-muted/50 flex items-center justify-center p-8 relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Back to Book button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 gap-2"
        onClick={handleBackToBook}
      >
        <Book className="h-4 w-4" />
        Back to Book
      </Button>

      {/* Page indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
        Page {currentPageIndex + 1}
      </div>

      <div
        className="bg-background rounded-lg shadow-lg overflow-hidden"
        style={{ width: stageSize.width, height: stageSize.height }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Page background */}
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill={currentPage?.background || '#ffffff'}
            />

            {/* Render slots */}
            {currentPage &&
              layout &&
              currentPage.slots.map((slot, index) => {
                const slotDef = layout.slots[index];
                if (!slotDef) return null;

                const photo = slot.photoId
                  ? photos.find((p) => p.id === slot.photoId)
                  : null;

                const isSelected =
                  selectedSlot?.pageIndex === currentPageIndex &&
                  selectedSlot?.slotIndex === index;

                return (
                  <PhotoSlot
                    key={slot.id}
                    slot={slot}
                    slotDef={slotDef}
                    slotIndex={index}
                    pageIndex={currentPageIndex}
                    photo={photo ?? null}
                    isSelected={isSelected}
                    stageWidth={stageSize.width}
                    stageHeight={stageSize.height}
                    onSelect={handleSlotSelect}
                  />
                );
              })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
