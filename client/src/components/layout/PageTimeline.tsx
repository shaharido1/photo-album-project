import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import {
  selectPages,
  selectCurrentPageIndex,
  selectAlbumId,
  selectViewMode,
  selectCurrentSpread,
  setCurrentPage,
  setCurrentSpread,
  editPage,
  addPage,
  removePage,
} from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { AlbumPage, Photo } from '@/types';

interface PageThumbnailProps {
  page: AlbumPage;
  pageIndex: number;
  isCurrent: boolean;
  isInCurrentSpread: boolean;
  photos: Photo[];
  onClick: () => void;
  onRemove: () => void;
  canRemove: boolean;
  viewMode: 'book' | 'edit';
}

function PageThumbnail({
  page,
  pageIndex,
  isCurrent,
  isInCurrentSpread,
  photos,
  onClick,
  onRemove,
  canRemove,
  viewMode,
}: PageThumbnailProps): JSX.Element {
  const layout = getLayoutById(page.layoutId);

  // In book view, highlight pages in current spread
  const isHighlighted = viewMode === 'book' ? isInCurrentSpread : isCurrent;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 w-16 h-16 rounded-md border-2 cursor-pointer transition-all hover:border-primary/50 group',
        isHighlighted
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-muted-foreground/25',
        'bg-background overflow-hidden'
      )}
      style={{ backgroundColor: page.background }}
    >
      {/* Mini layout preview */}
      <div className="w-full h-full relative p-0.5">
        {layout?.slots.map((slotDef, i) => {
          const slot = page.slots[i];
          const photo = slot?.photoId
            ? photos.find((p) => p.id === slot.photoId)
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

// Helper function to get spread index for a page
function getSpreadIndexForPage(pageIndex: number): number {
  if (pageIndex === 0) return 0; // Cover
  return Math.ceil(pageIndex / 2); // Spread 1 = pages 1-2, Spread 2 = pages 3-4, etc.
}

// Helper to check if a page is in the current spread
function isPageInSpread(pageIndex: number, spreadIndex: number): boolean {
  if (spreadIndex === 0) {
    return pageIndex === 0; // Cover only has page 0
  }
  const leftPage = spreadIndex * 2 - 1;
  const rightPage = spreadIndex * 2;
  return pageIndex === leftPage || pageIndex === rightPage;
}

export function PageTimeline(): JSX.Element {
  const dispatch = useAppDispatch();
  const albumId = useAppSelector(selectAlbumId);
  const pages = useAppSelector(selectPages);
  const currentPageIndex = useAppSelector(selectCurrentPageIndex);
  const viewMode = useAppSelector(selectViewMode);
  const currentSpread = useAppSelector(selectCurrentSpread);
  const photos = useAppSelector(selectAllPhotos);

  const handlePageClick = (index: number): void => {
    if (viewMode === 'book') {
      // In book view, clicking a page navigates to its spread
      const spreadIndex = getSpreadIndexForPage(index);
      dispatch(setCurrentSpread(spreadIndex));
    } else {
      // In edit view, select the page for editing
      dispatch(setCurrentPage(index));
    }
  };

  const handlePageDoubleClick = (index: number): void => {
    // Double-click in book view switches to edit mode for that page
    if (viewMode === 'book') {
      dispatch(editPage(index));
    }
  };

  const handleAddPage = (): void => {
    dispatch(addPage('single'));
  };

  const handleRemovePage = (index: number): void => {
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

  // Group pages into spreads for visual indication in book view
  const renderPages = (): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < pages.length) {
      const page = pages[i];
      const isInSpread = isPageInSpread(i, currentSpread);

      // In book view, add spread grouping brackets
      if (viewMode === 'book') {
        const spreadIndex = getSpreadIndexForPage(i);
        const isFirstInSpread =
          i === 0 || getSpreadIndexForPage(i - 1) !== spreadIndex;
        const nextSpreadIndex =
          i + 1 < pages.length ? getSpreadIndexForPage(i + 1) : -1;
        const isLastInSpread = nextSpreadIndex !== spreadIndex;

        elements.push(
          <div
            key={page.id}
            className={cn(
              'relative',
              isFirstInSpread && 'ml-1',
              isLastInSpread && 'mr-1'
            )}
            onDoubleClick={() => handlePageDoubleClick(i)}
          >
            {/* Spread bracket start */}
            {isFirstInSpread && (
              <div
                className={cn(
                  'absolute -left-1 top-0 bottom-0 w-1 rounded-l',
                  isInSpread ? 'bg-primary/30' : 'bg-muted-foreground/10'
                )}
              />
            )}
            <PageThumbnail
              page={page}
              pageIndex={i}
              isCurrent={currentPageIndex === i}
              isInCurrentSpread={isInSpread}
              photos={photos}
              onClick={() => handlePageClick(i)}
              onRemove={() => handleRemovePage(i)}
              canRemove={pages.length > 1}
              viewMode={viewMode}
            />
            {/* Spread bracket end */}
            {isLastInSpread && (
              <div
                className={cn(
                  'absolute -right-1 top-0 bottom-0 w-1 rounded-r',
                  isInSpread ? 'bg-primary/30' : 'bg-muted-foreground/10'
                )}
              />
            )}
          </div>
        );
      } else {
        elements.push(
          <PageThumbnail
            key={page.id}
            page={page}
            pageIndex={i}
            isCurrent={currentPageIndex === i}
            isInCurrentSpread={isInSpread}
            photos={photos}
            onClick={() => handlePageClick(i)}
            onRemove={() => handleRemovePage(i)}
            canRemove={pages.length > 1}
            viewMode={viewMode}
          />
        );
      }
      i++;
    }

    return elements;
  };

  return (
    <div className="h-24 border-t bg-muted/30">
      <ScrollArea className="h-full">
        <div className="flex items-center gap-2 p-3 h-full">
          {renderPages()}

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
