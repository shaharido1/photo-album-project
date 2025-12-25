import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { editPage } from '@/features/album/albumSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { AlbumPage, Photo } from '@/types';

interface BookPageProps {
  page: AlbumPage;
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  position: 'left' | 'right' | 'cover';
}

interface PhotoSlotDisplayProps {
  slot: AlbumPage['slots'][0];
  slotDef: { x: number; y: number; width: number; height: number };
  photo: Photo | null;
  pageWidth: number;
  pageHeight: number;
}

function PhotoSlotDisplay({
  slot,
  slotDef,
  photo,
  pageWidth,
  pageHeight,
}: PhotoSlotDisplayProps): JSX.Element {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate slot position and size in pixels
  const slotX = (slotDef.x / 100) * pageWidth;
  const slotY = (slotDef.y / 100) * pageHeight;
  const slotWidth = (slotDef.width / 100) * pageWidth;
  const slotHeight = (slotDef.height / 100) * pageHeight;

  // Calculate image display dimensions with aspect ratio fit
  const calculateImageStyle = (): React.CSSProperties => {
    if (!photo || !imageLoaded) {
      return {};
    }

    const imgAspect = photo.width / photo.height;
    const slotAspect = slotWidth / slotHeight;

    let imageWidth: number;
    let imageHeight: number;

    if (imgAspect > slotAspect) {
      // Image is wider - fit by height, crop width
      imageHeight = slotHeight * slot.scale;
      imageWidth = imageHeight * imgAspect;
    } else {
      // Image is taller - fit by width, crop height
      imageWidth = slotWidth * slot.scale;
      imageHeight = imageWidth / imgAspect;
    }

    // Apply position offset
    const offsetX = (slot.position.x / 100) * slotWidth;
    const offsetY = (slot.position.y / 100) * slotHeight;

    return {
      width: imageWidth,
      height: imageHeight,
      transform: `translate(${offsetX}px, ${offsetY}px)`,
      objectFit: 'cover' as const,
    };
  };

  useEffect(() => {
    if (photo) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = photo.fullSize || photo.thumbnail;
    }
  }, [photo]);

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: slotX,
        top: slotY,
        width: slotWidth,
        height: slotHeight,
        backgroundColor: photo ? 'transparent' : '#f3f4f6',
        border: photo ? 'none' : '1px dashed #d1d5db',
      }}
    >
      {photo && (
        <img
          src={photo.fullSize || photo.thumbnail}
          alt=""
          className="absolute top-0 left-0"
          style={calculateImageStyle()}
          draggable={false}
        />
      )}
    </div>
  );
}

export function BookPage({
  page,
  pageIndex,
  pageWidth,
  pageHeight,
  position,
}: BookPageProps): JSX.Element {
  const dispatch = useAppDispatch();
  const photos = useAppSelector(selectAllPhotos);
  const layout = getLayoutById(page.layoutId);

  const handleEditClick = (): void => {
    dispatch(editPage(pageIndex));
  };

  return (
    <div
      className="relative bg-white group"
      style={{
        width: pageWidth,
        height: pageHeight,
        backgroundColor: page.background || '#ffffff',
        boxShadow:
          position === 'cover'
            ? '0 4px 20px rgba(0, 0, 0, 0.15)'
            : position === 'left'
              ? 'inset -4px 0 8px rgba(0, 0, 0, 0.05)'
              : 'inset 4px 0 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Page content */}
      <div className="absolute inset-0">
        {layout?.slots.map((slotDef, i) => {
          const slot = page.slots[i];
          if (!slot) return null;

          const photo = slot.photoId
            ? photos.find((p) => p.id === slot.photoId)
            : null;

          return (
            <PhotoSlotDisplay
              key={slot.id}
              slot={slot}
              slotDef={slotDef}
              photo={photo ?? null}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
            />
          );
        })}
      </div>

      {/* Page number */}
      <div
        className={`absolute bottom-2 text-xs text-muted-foreground ${
          position === 'left' ? 'left-2' : 'right-2'
        }`}
      >
        {pageIndex + 1}
      </div>

      {/* Edit overlay on hover */}
      <div
        className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center"
        onClick={handleEditClick}
      >
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick();
          }}
        >
          <Pencil className="h-4 w-4" />
          <span className="text-sm font-medium">Edit Page</span>
        </button>
      </div>
    </div>
  );
}
