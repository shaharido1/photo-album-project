import { useEffect, useRef, useState, useCallback, DragEvent } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Group,
  Transformer,
} from 'react-konva';
import { Book, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  selectCurrentPage,
  selectCurrentPageIndex,
  selectAlbumSize,
  selectSelectedFreestyleItem,
  addFreestyleItem,
  updateFreestyleItem,
  selectFreestyleItem,
  setViewMode,
  bringFreestyleItemToFront,
  sendFreestyleItemToBack,
  bringFreestyleItemForward,
  sendFreestyleItemBackward,
  ALBUM_SIZE_PRESETS,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { FreestyleItem, Photo } from '@/types';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { buildFilterString } from './FilterControls';

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

// Generate unique ID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

interface FreestyleItemComponentProps {
  item: FreestyleItem;
  pageIndex: number;
  photo: Photo | null;
  isSelected: boolean;
  stageWidth: number;
  stageHeight: number;
  onSelect: (itemId: string) => void;
}

function FreestyleItemComponent({
  item,
  pageIndex,
  photo,
  isSelected,
  stageWidth,
  stageHeight,
  onSelect,
}: FreestyleItemComponentProps): JSX.Element | null {
  const dispatch = useAppDispatch();
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(photo?.fullSize || photo?.thumbnail || item.photoUrl || undefined);

  // Get filter string for this item
  const filterString = item.filters
    ? buildFilterString(item.filters)
    : 'none';

  // Convert percentage to pixels
  const x = (item.x / 100) * stageWidth;
  const y = (item.y / 100) * stageHeight;
  const width = (item.width / 100) * stageWidth;
  const height = (item.height / 100) * stageHeight;

  // Cache the image node when filters change
  useEffect(() => {
    if (shapeRef.current && image && filterString !== 'none') {
      shapeRef.current.cache();
      shapeRef.current.getLayer()?.batchDraw();
    } else if (shapeRef.current && filterString === 'none') {
      shapeRef.current.clearCache();
      shapeRef.current.getLayer()?.batchDraw();
    }
  }, [image, filterString]);

  // Update transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>): void => {
    e.cancelBubble = true;
    onSelect(item.id);
  };

  const handleDragEnd = (e: KonvaEventObject<globalThis.DragEvent>): void => {
    const node = e.target;
    // Convert pixel position back to percentage
    const newX = (node.x() / stageWidth) * 100;
    const newY = (node.y() / stageHeight) * 100;
    dispatch(
      updateFreestyleItem({
        pageIndex,
        itemId: item.id,
        updates: { x: newX, y: newY },
      })
    );
  };

  const handleTransformEnd = (): void => {
    const node = shapeRef.current;
    if (!node) return;

    // Get the new dimensions and position after transform
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Calculate new width/height in pixels
    const newWidthPx = node.width() * scaleX;
    const newHeightPx = node.height() * scaleY;

    // Convert to percentages
    const newWidth = (newWidthPx / stageWidth) * 100;
    const newHeight = (newHeightPx / stageHeight) * 100;
    const newX = (node.x() / stageWidth) * 100;
    const newY = (node.y() / stageHeight) * 100;

    // Reset scale on the node
    node.scaleX(1);
    node.scaleY(1);
    node.width(newWidthPx);
    node.height(newHeightPx);

    dispatch(
      updateFreestyleItem({
        pageIndex,
        itemId: item.id,
        updates: {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          rotation: rotation,
        },
      })
    );
  };

  if (!image) {
    // Show placeholder while loading
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#f3f4f6"
        stroke={isSelected ? '#8b5cf6' : '#e5e7eb'}
        strokeWidth={isSelected ? 2 : 1}
        dash={[5, 5]}
        onClick={handleClick}
        onTap={handleClick}
      />
    );
  }

  // Handle drag start - select the item when dragging starts
  const handleDragStart = (): void => {
    if (!isSelected) {
      onSelect(item.id);
    }
  };

  return (
    <Group>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={item.rotation}
        draggable={true}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        filters={filterString !== 'none' ? [filterString] : undefined}
      />

      {/* Transformer for selected item - with rotation enabled */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          keepRatio={true}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraint
            if (newBox.width < 30 || newBox.height < 30) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
        />
      )}
    </Group>
  );
}

interface StageSize {
  width: number;
  height: number;
}

interface LayerControlsOverlayProps {
  item: FreestyleItem;
  pageIndex: number;
  stageWidth: number;
  stageHeight: number;
  stageOffset: { left: number; top: number };
  totalItems: number;
}

function LayerControlsOverlay({
  item,
  pageIndex,
  stageWidth,
  stageHeight,
  stageOffset,
  totalItems,
}: LayerControlsOverlayProps): JSX.Element {
  const dispatch = useAppDispatch();

  // Calculate position for the layer controls (top-right of the image)
  const itemX = (item.x / 100) * stageWidth;
  const itemY = (item.y / 100) * stageHeight;
  const itemWidth = (item.width / 100) * stageWidth;

  // Position the controls at the top-right corner of the image
  const controlsLeft = stageOffset.left + itemX + itemWidth + 4;
  const controlsTop = stageOffset.top + itemY;

  const handleBringToFront = (e: React.MouseEvent): void => {
    e.stopPropagation();
    dispatch(bringFreestyleItemToFront({ pageIndex, itemId: item.id }));
  };

  const handleBringForward = (e: React.MouseEvent): void => {
    e.stopPropagation();
    dispatch(bringFreestyleItemForward({ pageIndex, itemId: item.id }));
  };

  const handleSendBackward = (e: React.MouseEvent): void => {
    e.stopPropagation();
    dispatch(sendFreestyleItemBackward({ pageIndex, itemId: item.id }));
  };

  const handleSendToBack = (e: React.MouseEvent): void => {
    e.stopPropagation();
    dispatch(sendFreestyleItemToBack({ pageIndex, itemId: item.id }));
  };

  // Don't show layer controls if there's only one item
  if (totalItems <= 1) {
    return <></>;
  }

  return (
    <div
      className="absolute z-50 flex flex-col gap-0.5 bg-background/95 rounded-md shadow-lg p-1 border"
      style={{
        left: controlsLeft,
        top: controlsTop,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleBringToFront}
        title="Bring to Front"
      >
        <ChevronsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleBringForward}
        title="Bring Forward"
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleSendBackward}
        title="Send Backward"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleSendToBack}
        title="Send to Back"
      >
        <ChevronsDown className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function FreestyleCanvas(): JSX.Element {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<StageSize>({
    width: 500,
    height: 500,
  });
  const [stageOffset, setStageOffset] = useState({ left: 0, top: 0 });

  const albumSize = useAppSelector(selectAlbumSize);
  const currentPage = useAppSelector(selectCurrentPage);
  const currentPageIndex = useAppSelector(selectCurrentPageIndex);
  const selectedItem = useAppSelector(selectSelectedFreestyleItem);
  const photos = useAppSelector(selectAllPhotos);

  // Get album dimensions for aspect ratio
  const sizePreset =
    ALBUM_SIZE_PRESETS[albumSize] || ALBUM_SIZE_PRESETS['10x10'];
  const aspectRatio =
    sizePreset.dimensions.width / sizePreset.dimensions.height;

  // Handle container resize
  useEffect(() => {
    const updateSize = (): void => {
      if (containerRef.current) {
        const container = containerRef.current;
        const maxWidth = container.clientWidth - 64;
        const maxHeight = container.clientHeight - 64;

        let width: number, height: number;
        if (maxWidth / maxHeight > aspectRatio) {
          height = Math.min(maxHeight, 600);
          width = height * aspectRatio;
        } else {
          width = Math.min(maxWidth, 600);
          height = width / aspectRatio;
        }

        setStageSize({ width, height });
      }
    };

    const updateStageOffset = (): void => {
      if (stageContainerRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const stageRect = stageContainerRef.current.getBoundingClientRect();
        setStageOffset({
          left: stageRect.left - containerRect.left,
          top: stageRect.top - containerRect.top,
        });
      }
    };

    updateSize();
    // Update offset after a short delay to ensure stage is rendered
    const offsetTimer = setTimeout(updateStageOffset, 100);

    const handleResize = (): void => {
      updateSize();
      setTimeout(updateStageOffset, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(offsetTimer);
    };
  }, [aspectRatio]);

  // Handle dropping photos onto canvas
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const photoId = e.dataTransfer.getData('photoId');
      const photoUrl = e.dataTransfer.getData('photoUrl');
      if (!photoId || !currentPage) return;

      // Get drop position relative to the container
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const stageLeft = (containerRect.width - stageSize.width) / 2;
      const stageTop = (containerRect.height - stageSize.height) / 2;

      // Calculate drop position relative to the stage (as percentage)
      const dropX = e.clientX - containerRect.left - stageLeft;
      const dropY = e.clientY - containerRect.top - stageTop;
      const dropXPercent = (dropX / stageSize.width) * 100;
      const dropYPercent = (dropY / stageSize.height) * 100;

      // Find the photo to get its dimensions
      const photo = photos.find((p) => p.id === photoId);

      // Default size: 30% of canvas width, maintaining aspect ratio
      const defaultWidth = 30;
      let defaultHeight = 30;

      if (photo && photo.width && photo.height) {
        const photoAspect = photo.width / photo.height;
        defaultHeight = defaultWidth / photoAspect;
      }

      // Center the image on drop point
      const itemX = Math.max(0, Math.min(100 - defaultWidth, dropXPercent - defaultWidth / 2));
      const itemY = Math.max(0, Math.min(100 - defaultHeight, dropYPercent - defaultHeight / 2));

      // Calculate z-index (one above the max)
      const maxZIndex = currentPage.freestyleItems
        ? Math.max(...currentPage.freestyleItems.map((i) => i.zIndex), -1)
        : -1;

      const newItem: FreestyleItem = {
        id: generateId(),
        photoId,
        photoUrl: photoUrl || undefined,
        x: itemX,
        y: itemY,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
        zIndex: maxZIndex + 1,
      };

      dispatch(addFreestyleItem({ pageIndex: currentPageIndex, item: newItem }));
    },
    [dispatch, currentPage, currentPageIndex, stageSize, photos]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleStageClick = (
    e: KonvaEventObject<MouseEvent | TouchEvent>
  ): void => {
    // Deselect when clicking on empty space
    if (e.target === e.target.getStage()) {
      dispatch(selectFreestyleItem(null));
    }
  };

  const handleItemSelect = (itemId: string): void => {
    dispatch(selectFreestyleItem({ pageIndex: currentPageIndex, itemId }));
  };

  const handleBackToBook = (): void => {
    dispatch(setViewMode('book'));
  };

  // Sort items by z-index for proper rendering order
  const sortedItems = currentPage?.freestyleItems
    ? [...currentPage.freestyleItems].sort((a, b) => a.zIndex - b.zIndex)
    : [];

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

      {/* Page indicator with freestyle label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full flex items-center gap-2">
        <span>Page {currentPageIndex + 1}</span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          Freestyle
        </span>
      </div>

      {/* Drop hint when empty */}
      {sortedItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Freestyle Canvas</p>
            <p className="text-sm">Drop photos anywhere to place them freely</p>
          </div>
        </div>
      )}

      <div
        ref={stageContainerRef}
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

            {/* Render freestyle items sorted by z-index */}
            {sortedItems.map((item) => {
              const photo = photos.find((p) => p.id === item.photoId) || null;
              const isSelected =
                selectedItem?.pageIndex === currentPageIndex &&
                selectedItem?.itemId === item.id;

              return (
                <FreestyleItemComponent
                  key={item.id}
                  item={item}
                  pageIndex={currentPageIndex}
                  photo={photo}
                  isSelected={isSelected}
                  stageWidth={stageSize.width}
                  stageHeight={stageSize.height}
                  onSelect={handleItemSelect}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* Layer controls overlay for selected item */}
      {selectedItem?.pageIndex === currentPageIndex && selectedItem?.itemId && (() => {
        const item = sortedItems.find((i) => i.id === selectedItem.itemId);
        if (!item) return null;
        return (
          <LayerControlsOverlay
            item={item}
            pageIndex={currentPageIndex}
            stageWidth={stageSize.width}
            stageHeight={stageSize.height}
            stageOffset={stageOffset}
            totalItems={sortedItems.length}
          />
        );
      })()}
    </div>
  );
}
