import { Book, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  selectViewMode,
  selectAlbumId,
  setViewMode,
} from '@/features/album/albumSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';

export function ViewModeToggle(): JSX.Element | null {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(selectViewMode);
  const albumId = useAppSelector(selectAlbumId);

  // Don't show toggle if no album exists
  if (!albumId) {
    return null;
  }

  const handleToggle = (mode: 'book' | 'edit'): void => {
    dispatch(setViewMode(mode));
  };

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          viewMode === 'book' && 'bg-background shadow-sm'
        )}
        onClick={() => handleToggle('book')}
      >
        <Book className="h-4 w-4" />
        <span className="hidden sm:inline">Book</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          viewMode === 'edit' && 'bg-background shadow-sm'
        )}
        onClick={() => handleToggle('edit')}
      >
        <Pencil className="h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
      </Button>
    </div>
  );
}
