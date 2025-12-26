import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createAlbum, createAlbumAsync } from '@/features/album/albumSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import type { AlbumSizeKey } from '@/types';

interface AlbumSizeOption {
  id: AlbumSizeKey;
  name: string;
  dimensions: string;
  pixels: string;
  aspectRatio: number;
}

const ALBUM_SIZES: AlbumSizeOption[] = [
  {
    id: '8x8',
    name: '8×8"',
    dimensions: '20×20 cm',
    pixels: '2400×2400',
    aspectRatio: 1,
  },
  {
    id: '10x10',
    name: '10×10"',
    dimensions: '25×25 cm',
    pixels: '3000×3000',
    aspectRatio: 1,
  },
  {
    id: '12x12',
    name: '12×12"',
    dimensions: '30×30 cm',
    pixels: '3600×3600',
    aspectRatio: 1,
  },
  {
    id: 'a4-landscape',
    name: 'A4 Landscape',
    dimensions: '297×210 mm',
    pixels: '3508×2480',
    aspectRatio: 297 / 210,
  },
  {
    id: 'a4-portrait',
    name: 'A4 Portrait',
    dimensions: '210×297 mm',
    pixels: '2480×3508',
    aspectRatio: 210 / 297,
  },
];

interface CreateAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAlbumDialog({
  open,
  onOpenChange,
}: CreateAlbumDialogProps): JSX.Element {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [albumName, setAlbumName] = React.useState('');
  const [selectedSize, setSelectedSize] = React.useState<AlbumSizeOption>(
    ALBUM_SIZES[1]
  );
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async (): Promise<void> => {
    if (!albumName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Use async thunk to create album in Firebase if user is logged in
      // Otherwise, create locally for demo/unauthenticated use
      if (isAuthenticated) {
        await dispatch(
          createAlbumAsync({ name: albumName, size: selectedSize.id })
        ).unwrap();
      } else {
        dispatch(createAlbum({ name: albumName, size: selectedSize.id }));
      }
      setAlbumName('');
      setSelectedSize(ALBUM_SIZES[1]);
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create album:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen) {
      setAlbumName('');
      setSelectedSize(ALBUM_SIZES[1]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
          <DialogDescription>
            Choose a name and size for your photo album.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="album-name">Album Name</Label>
            <Input
              id="album-name"
              placeholder="My Photo Album"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && albumName.trim() && !isCreating) {
                  void handleCreate();
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label>Album Size</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALBUM_SIZES.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  data-testid={`album-size-${size.id}`}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left transition-colors hover:bg-accent',
                    selectedSize.id === size.id
                      ? 'border-primary bg-accent'
                      : 'border-muted'
                  )}
                >
                  <div>
                    <div className="text-sm font-semibold">{size.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {size.dimensions}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                      selectedSize.id === size.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  >
                    {selectedSize.id === size.id && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={!albumName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Album'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
