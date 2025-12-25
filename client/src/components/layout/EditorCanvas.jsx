import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Group, Transformer } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import { ImagePlus } from 'lucide-react';
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
  ALBUM_SIZE_PRESETS,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getLayoutById } from '@/features/layouts/layoutTemplates';

// Custom hook to load images
function useImage(url) {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!url) {
      setImage(null);
      setStatus('idle');
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImage(img);
      setStatus('loaded');
    };

    img.onerror = () => {
      setImage(null);
      setStatus('error');
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [image, status];
}

// Photo slot component with image
function PhotoSlot({ slot, slotDef, slotIndex, pageIndex, photo, isSelected, stageWidth, stageHeight, onSelect }) {
  const dispatch = useDispatch();
  const shapeRef = useRef();
  const transformerRef = useRef();
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
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e) => {
    e.cancelBubble = true;
    onSelect(slotIndex);
  };

  const handleDragEnd = (e) => {
    const node = e.target;
    // Calculate offset from slot position as percentage
    const offsetX = ((node.x() - slotX) / slotWidth) * 100;
    const offsetY = ((node.y() - slotY) / slotHeight) * 100;
    dispatch(updateSlotPosition({
      pageIndex,
      slotIndex,
      position: { x: offsetX, y: offsetY }
    }));
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);
    dispatch(updateSlotScale({ pageIndex, slotIndex, scale: slot.scale * scaleX }));
  };

  // Calculate image display dimensions
  let imageWidth = slotWidth;
  let imageHeight = slotHeight;
  let imageX = slotX + (slot.position.x / 100) * slotWidth;
  let imageY = slotY + (slot.position.y / 100) * slotHeight;

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
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={false}
        />
      )}
    </Group>
  );
}

export function EditorCanvas() {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 500, height: 500 });

  const albumId = useSelector(selectAlbumId);
  const albumSize = useSelector(selectAlbumSize);
  const currentPage = useSelector(selectCurrentPage);
  const currentPageIndex = useSelector(selectCurrentPageIndex);
  const selectedSlot = useSelector(selectSelectedSlot);
  const photos = useSelector(selectAllPhotos);

  // Get album dimensions for aspect ratio
  const sizePreset = ALBUM_SIZE_PRESETS[albumSize] || ALBUM_SIZE_PRESETS['10x10'];
  const aspectRatio = sizePreset.dimensions.width / sizePreset.dimensions.height;

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const maxWidth = container.clientWidth - 64; // padding
        const maxHeight = container.clientHeight - 64;

        let width, height;
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
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const photoId = e.dataTransfer.getData('photoId');
    if (!photoId || !currentPage) return;

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
  }, [dispatch, currentPage, currentPageIndex]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleStageClick = (e) => {
    // Deselect when clicking on empty space
    if (e.target === e.target.getStage()) {
      dispatch(selectSlot(null));
    }
  };

  const handleSlotSelect = (slotIndex) => {
    dispatch(selectSlot({ pageIndex: currentPageIndex, slotIndex }));
  };

  // Get layout definition
  const layout = currentPage ? getLayoutById(currentPage.layoutId) : null;

  // No album created yet
  if (!albumId) {
    return (
      <div className="flex-1 bg-muted/50 flex items-center justify-center p-8">
        <div className="bg-background rounded-lg shadow-lg aspect-square w-full max-w-xl flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">Create an album to start</p>
          <p className="text-sm text-muted-foreground">
            Click &quot;New Album&quot; in the header
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-muted/50 flex items-center justify-center p-8"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
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
            {currentPage && layout && currentPage.slots.map((slot, index) => {
              const slotDef = layout.slots[index];
              if (!slotDef) return null;

              const photo = slot.photoId
                ? photos.find(p => p.id === slot.photoId)
                : null;

              const isSelected = selectedSlot?.pageIndex === currentPageIndex &&
                                 selectedSlot?.slotIndex === index;

              return (
                <PhotoSlot
                  key={slot.id}
                  slot={slot}
                  slotDef={slotDef}
                  slotIndex={index}
                  pageIndex={currentPageIndex}
                  photo={photo}
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
