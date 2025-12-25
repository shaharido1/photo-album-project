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
import { useDispatch } from 'react-redux';
import { cn } from '@/lib/utils';
import { createAlbum } from '@/features/album/albumSlice';

const ALBUM_SIZES = [
  { id: '8x8', name: '8×8"', dimensions: '20×20 cm', pixels: '2400×2400', aspectRatio: 1 },
  { id: '10x10', name: '10×10"', dimensions: '25×25 cm', pixels: '3000×3000', aspectRatio: 1 },
  { id: '12x12', name: '12×12"', dimensions: '30×30 cm', pixels: '3600×3600', aspectRatio: 1 },
  { id: 'a4-landscape', name: 'A4 Landscape', dimensions: '297×210 mm', pixels: '3508×2480', aspectRatio: 297 / 210 },
  { id: 'a4-portrait', name: 'A4 Portrait', dimensions: '210×297 mm', pixels: '2480×3508', aspectRatio: 210 / 297 },
];

export function CreateAlbumDialog({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const [albumName, setAlbumName] = React.useState('');
  const [selectedSize, setSelectedSize] = React.useState(ALBUM_SIZES[1]);

  const handleCreate = () => {
    if (!albumName.trim()) return;

    dispatch(createAlbum({ name: albumName, size: selectedSize.id }));
    setAlbumName('');
    setSelectedSize(ALBUM_SIZES[1]);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen) => {
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

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="album-name">Album Name</Label>
            <Input
              id="album-name"
              placeholder="My Photo Album"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && albumName.trim() && handleCreate()}
            />
          </div>

          <div className="grid gap-3">
            <Label>Album Size</Label>
            <div className="grid grid-cols-2 gap-3">
              {ALBUM_SIZES.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent',
                    selectedSize.id === size.id ? 'border-primary bg-accent' : 'border-muted'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-semibold">{size.name}</span>
                    <div
                      className={cn(
                        'rounded border-2 border-muted-foreground',
                        selectedSize.id === size.id && 'border-primary'
                      )}
                      style={{
                        width: size.aspectRatio >= 1 ? '32px' : `${32 * size.aspectRatio}px`,
                        height: size.aspectRatio <= 1 ? '32px' : `${32 / size.aspectRatio}px`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>{size.dimensions}</div>
                    <div>{size.pixels} pixels</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/50 p-6">
            <Label className="text-muted-foreground">Preview</Label>
            <div
              className="rounded border-2 border-primary bg-background shadow-sm"
              style={{
                width: selectedSize.aspectRatio >= 1 ? '120px' : `${120 * selectedSize.aspectRatio}px`,
                height: selectedSize.aspectRatio <= 1 ? '120px' : `${120 / selectedSize.aspectRatio}px`,
              }}
            />
            <div className="text-center text-sm">
              <div className="font-medium">{selectedSize.name}</div>
              <div className="text-muted-foreground">{selectedSize.dimensions}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!albumName.trim()}>
            Create Album
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
