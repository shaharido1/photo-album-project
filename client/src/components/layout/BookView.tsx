import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookPage } from './BookPage';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import {
  selectAlbumId,
  selectAlbumSize,
  selectSpreadInfo,
  selectTotalSpreads,
  selectCurrentSpread,
  selectPages,
  nextSpread,
  prevSpread,
  ALBUM_SIZE_PRESETS,
} from '@/features/album/albumSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

type FlipDirection = 'next' | 'prev' | null;

export function BookView(): JSX.Element {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [bookSize, setBookSize] = useState({ width: 800, height: 500 });
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<FlipDirection>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const albumId = useAppSelector(selectAlbumId);
  const albumSize = useAppSelector(selectAlbumSize);
  const spreadInfo = useAppSelector(selectSpreadInfo);
  const totalSpreads = useAppSelector(selectTotalSpreads);
  const currentSpread = useAppSelector(selectCurrentSpread);
  const pages = useAppSelector(selectPages);

  // Get album dimensions for aspect ratio
  const sizePreset =
    ALBUM_SIZE_PRESETS[albumSize] || ALBUM_SIZE_PRESETS['10x10'];
  const pageAspectRatio =
    sizePreset.dimensions.width / sizePreset.dimensions.height;

  // Calculate book dimensions based on container size
  useEffect(() => {
    const updateSize = (): void => {
      if (containerRef.current) {
        const container = containerRef.current;
        const maxWidth = container.clientWidth - 120; // padding for nav buttons
        const maxHeight = container.clientHeight - 80;

        // Book shows two pages side by side (or one for cover)
        const bookAspectRatio = spreadInfo.isCover
          ? pageAspectRatio
          : pageAspectRatio * 2;

        let width: number, height: number;
        if (maxWidth / maxHeight > bookAspectRatio) {
          // Container is wider - fit by height
          height = Math.min(maxHeight, 600);
          width = height * bookAspectRatio;
        } else {
          // Container is taller - fit by width
          width = Math.min(maxWidth, 1000);
          height = width / bookAspectRatio;
        }

        setBookSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [pageAspectRatio, spreadInfo.isCover]);

  // Handle page navigation
  const handleNextSpread = useCallback((): void => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('next');
      setTimeout(() => {
        dispatch(nextSpread());
        setTimeout(() => {
          setIsFlipping(false);
          setFlipDirection(null);
        }, 50);
      }, 500);
    }
  }, [dispatch, currentSpread, totalSpreads, isFlipping]);

  const handlePrevSpread = useCallback((): void => {
    if (currentSpread > 0 && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('prev');
      setTimeout(() => {
        dispatch(prevSpread());
        setTimeout(() => {
          setIsFlipping(false);
          setFlipDirection(null);
        }, 50);
      }, 500);
    }
  }, [dispatch, currentSpread, isFlipping]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') {
        handleNextSpread();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSpread();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSpread, handlePrevSpread]);

  // Calculate page dimensions
  const pageWidth = spreadInfo.isCover ? bookSize.width : bookSize.width / 2;
  const pageHeight = bookSize.height;

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

  // No pages yet
  if (pages.length === 0) {
    return (
      <div className="flex-1 bg-muted/50 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p>No pages in this album yet.</p>
          <p className="text-sm">Add pages from the timeline below.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-muted/50 flex items-center justify-center p-8"
    >
      {/* Navigation button - Previous */}
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-full mr-4 flex-shrink-0"
        onClick={handlePrevSpread}
        disabled={currentSpread === 0 || isFlipping}
        aria-label="Previous spread"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* Book container with 3D perspective */}
      <div
        className="relative"
        style={{
          perspective: '2000px',
          perspectiveOrigin: 'center center',
        }}
      >
        {/* Book wrapper */}
        <div
          className="relative bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-sm"
          style={{
            width: bookSize.width + 8,
            height: bookSize.height + 8,
            padding: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Book pages container */}
          <div
            className="relative overflow-hidden bg-white"
            style={{
              width: bookSize.width,
              height: bookSize.height,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Cover view */}
            {spreadInfo.isCover && spreadInfo.leftPage && (
              <div
                className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${
                  flipDirection === 'next' ? 'animate-flip-out' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'right center',
                }}
              >
                <BookPage
                  page={spreadInfo.leftPage}
                  pageIndex={spreadInfo.leftPageIndex!}
                  pageWidth={pageWidth}
                  pageHeight={pageHeight}
                  position="cover"
                />
              </div>
            )}

            {/* Spread view (two pages) */}
            {!spreadInfo.isCover && (
              <div className="absolute inset-0 flex">
                {/* Left page */}
                <div
                  className={`relative transition-transform duration-500 ${
                    flipDirection === 'prev' ? 'animate-flip-in-left' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'right center',
                  }}
                >
                  {spreadInfo.leftPage && (
                    <BookPage
                      page={spreadInfo.leftPage}
                      pageIndex={spreadInfo.leftPageIndex!}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                      position="left"
                    />
                  )}
                  {!spreadInfo.leftPage && (
                    <div
                      className="bg-gray-100 flex items-center justify-center"
                      style={{ width: pageWidth, height: pageHeight }}
                    >
                      <span className="text-muted-foreground text-sm">
                        Empty Page
                      </span>
                    </div>
                  )}
                </div>

                {/* Book spine/gutter */}
                <div
                  className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
                  style={{
                    boxShadow:
                      'inset 0 0 8px rgba(0, 0, 0, 0.1), 0 0 4px rgba(0, 0, 0, 0.05)',
                  }}
                />

                {/* Right page */}
                <div
                  className={`relative transition-transform duration-500 ${
                    flipDirection === 'next' ? 'animate-flip-out-right' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'left center',
                  }}
                >
                  {spreadInfo.rightPage && (
                    <BookPage
                      page={spreadInfo.rightPage}
                      pageIndex={spreadInfo.rightPageIndex!}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                      position="right"
                    />
                  )}
                  {!spreadInfo.rightPage && spreadInfo.leftPage && (
                    <div
                      className="bg-gray-50 flex items-center justify-center"
                      style={{ width: pageWidth, height: pageHeight }}
                    >
                      <span className="text-muted-foreground text-sm">
                        End of Album
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Page flip animation overlay */}
            {isFlipping && (
              <div
                className={`absolute inset-0 pointer-events-none ${
                  flipDirection === 'next' ? 'page-flip-next' : 'page-flip-prev'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Animated page */}
                <div
                  className="absolute bg-white shadow-2xl"
                  style={{
                    width: pageWidth,
                    height: pageHeight,
                    left: flipDirection === 'next' ? pageWidth : 0,
                    transformOrigin:
                      flipDirection === 'next' ? 'left center' : 'right center',
                    animation:
                      flipDirection === 'next'
                        ? 'flipPageNext 0.5s ease-in-out forwards'
                        : 'flipPagePrev 0.5s ease-in-out forwards',
                    backfaceVisibility: 'hidden',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Page indicator */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
          {spreadInfo.isCover ? (
            <span>Cover</span>
          ) : (
            <span>
              Pages{' '}
              {spreadInfo.leftPageIndex !== null
                ? spreadInfo.leftPageIndex + 1
                : '-'}
              {spreadInfo.rightPageIndex !== null &&
                ` - ${spreadInfo.rightPageIndex + 1}`}
            </span>
          )}
          <span className="mx-2">|</span>
          <span>
            Spread {currentSpread + 1} of {totalSpreads}
          </span>
        </div>
      </div>

      {/* Navigation button - Next */}
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-full ml-4 flex-shrink-0"
        onClick={handleNextSpread}
        disabled={currentSpread >= totalSpreads - 1 || isFlipping}
        aria-label="Next spread"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* CSS for page flip animations */}
      <style>{`
        @keyframes flipPageNext {
          0% {
            transform: rotateY(0deg);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
          }
          100% {
            transform: rotateY(-180deg);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          }
        }

        @keyframes flipPagePrev {
          0% {
            transform: rotateY(0deg);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
          }
          100% {
            transform: rotateY(180deg);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          }
        }

        .animate-flip-out {
          animation: flipOut 0.5s ease-in-out forwards;
        }

        .animate-flip-in-left {
          animation: flipInLeft 0.5s ease-in-out forwards;
        }

        .animate-flip-out-right {
          animation: flipOutRight 0.5s ease-in-out forwards;
        }

        @keyframes flipOut {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-90deg); }
        }

        @keyframes flipInLeft {
          0% { transform: rotateY(90deg); }
          100% { transform: rotateY(0deg); }
        }

        @keyframes flipOutRight {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(90deg); }
        }
      `}</style>
    </div>
  );
}
