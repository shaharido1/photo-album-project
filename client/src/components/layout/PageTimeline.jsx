import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import {
  selectPages,
  selectCurrentPageIndex,
  selectAlbumId,
  setCurrentPage,
  addPage,
  removePage,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import { cn } from '@/lib/utils';

function PageThumbnail({ page, pageIndex, isCurrent, photos, onClick, onRemove, canRemove }) {
  const layout = getLayoutById(page.layoutId);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 w-16 h-16 rounded-md border-2 cursor-pointer transition-all hover:border-primary/50 group',
        isCurrent ? 'border-primary ring-2 ring-primary/20' : 'border-muted-foreground/25',
        'bg-background overflow-hidden'
      )}
      style={{ backgroundColor: page.background }}
    >
      {/* Mini layout preview */}
      <div className="w-full h-full relative p-0.5">
        {layout?.slots.map((slotDef, i) => {
          const slot = page.slots[i];
          const photo = slot?.photoId
            ? photos.find(p => p.id === slot.photoId)
            : null;

          return (
            <div
              key={i}
              className="absolute rounded-sm overflow-hidden"
              style={{
                left: `${slotDef.x}%`,
                top: `${slotDef.y}%`,
                width: `${slotDef.width}%`,
                height: `${slotDef.height}%`,
                backgroundColor: photo ? undefined : '#e5e7eb',
              }}
            >
              {photo && (
                <img
                  src={photo.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Page number */}
      <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
        {pageIndex + 1}
      </div>

      {/* Delete button on hover */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

export function PageTimeline() {
  const dispatch = useDispatch();
  const albumId = useSelector(selectAlbumId);
  const pages = useSelector(selectPages);
  const currentPageIndex = useSelector(selectCurrentPageIndex);
  const photos = useSelector(selectAllPhotos);

  const handlePageClick = (index) => {
    dispatch(setCurrentPage(index));
  };

  const handleAddPage = () => {
    dispatch(addPage('single'));
  };

  const handleRemovePage = (index) => {
    dispatch(removePage(index));
  };

  if (!albumId) {
    return (
      <div className="h-24 border-t bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Create an album to see pages
        </p>
      </div>
    );
  }

  return (
    <div className="h-24 border-t bg-muted/30">
      <ScrollArea className="h-full">
        <div className="flex items-center gap-2 p-3 h-full">
          {pages.map((page, index) => (
            <PageThumbnail
              key={page.id}
              page={page}
              pageIndex={index}
              isCurrent={currentPageIndex === index}
              photos={photos}
              onClick={() => handlePageClick(index)}
              onRemove={() => handleRemovePage(index)}
              canRemove={pages.length > 1}
            />
          ))}

          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 w-16 h-16 rounded-md border-dashed"
            onClick={handleAddPage}
            aria-label="Add new page"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
