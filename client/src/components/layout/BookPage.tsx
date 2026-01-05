import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { editPage } from '@/features/album/albumSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { buildFilterString } from './FilterControls';
import { DEFAULT_FILTER_VALUES } from '@/types';
import type { AlbumPage, Photo, FreestyleItem } from '@/types';

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
    const url = photo?.fullSize || photo?.thumbnail || slot.photoUrl;
    if (!url || !imageLoaded) {
      return {};
    }

    // Use photo dimensions if available, otherwise assume 1:1 or use image natural dimensions if we had them
    const imgAspect = photo ? photo.width / photo.height : 1;
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
    const url = photo?.fullSize || photo?.thumbnail || slot.photoUrl;
    if (url) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = url;
    }
  }, [photo, slot.photoUrl]);

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
      {(photo || slot.photoUrl) && (
        <img
          src={photo?.fullSize || photo?.thumbnail || slot.photoUrl || ''}
          alt=""
          className="absolute top-0 left-0"
          style={calculateImageStyle()}
          draggable={false}
        />
      )}
    </div>
  );
}

interface FreestyleItemDisplayProps {
  item: FreestyleItem;
  photo: Photo | null;
  pageWidth: number;
  pageHeight: number;
}

function FreestyleItemDisplay({
  item,
  photo,
  pageWidth,
  pageHeight,
}: FreestyleItemDisplayProps): JSX.Element {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate item position and size in pixels from percentages
  const itemX = (item.x / 100) * pageWidth;
  const itemY = (item.y / 100) * pageHeight;
  const itemWidth = (item.width / 100) * pageWidth;
  const itemHeight = (item.height / 100) * pageHeight;

  // Build filter string
  const filterStyle = buildFilterString(item.filters || DEFAULT_FILTER_VALUES);

  useEffect(() => {
    const url = photo?.fullSize || photo?.thumbnail || item.photoUrl;
    if (url) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = url;
    }
  }, [photo, item.photoUrl]);

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: itemX,
        top: itemY,
        width: itemWidth,
        height: itemHeight,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: item.zIndex,
      }}
    >
      {(photo || item.photoUrl) && imageLoaded && (
        <img
          src={photo?.fullSize || photo?.thumbnail || item.photoUrl || ''}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: filterStyle }}
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
        {/* Render template slots for non-freestyle layouts */}
        {page.layoutId !== 'freestyle' &&
          layout?.slots.map((slotDef, i) => {
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

        {/* Render freestyle items for freestyle layouts */}
        {page.layoutId === 'freestyle' &&
          page.freestyleItems
            ?.slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((item) => {
              const photo = photos.find((p) => p.id === item.photoId);
              return (
                <FreestyleItemDisplay
                  key={item.id}
                  item={item}
                  photo={photo ?? null}
                  pageWidth={pageWidth}
                  pageHeight={pageHeight}
                />
              );
            })}
      </div>

      {/* Page number */}
      <div
        className={`absolute bottom-2 text-xs text-muted-foreground ${position === 'left' ? 'left-2' : 'right-2'
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
