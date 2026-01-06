/**
 * Export Preview Debug Component
 * Shows side-by-side comparison of editor rendering vs PDF export rendering
 *
 * To use: Add <ExportPreview /> to your app layout or create a /debug route
 */

import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Group } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentPage, selectAlbumSize, ALBUM_SIZE_PRESETS } from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import { renderPageToCanvas, processSlotImage, processFreestyleImage } from '@/features/export/services/imageProcessor';
import type { Photo, PageSlot, LayoutSlot, FreestyleItem } from '@/types';
import type Konva from 'konva';

const PREVIEW_SIZE = 400;

interface ImageState {
  image: HTMLImageElement | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

function useImage(url: string | undefined): [HTMLImageElement | null, string] {
  const [state, setState] = useState<ImageState>({ image: null, status: url ? 'loading' : 'idle' });

  useEffect(() => {
    if (!url) {
      setState({ image: null, status: 'idle' });
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setState({ image: img, status: 'loaded' });
    img.onerror = () => setState({ image: null, status: 'error' });
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [state.image, state.status];
}

interface SlotPreviewProps {
  slot: PageSlot;
  slotDef: LayoutSlot;
  photo: Photo | null;
  stageWidth: number;
  stageHeight: number;
}

function SlotPreview({ slot, slotDef, photo, stageWidth, stageHeight }: SlotPreviewProps) {
  const [image] = useImage(photo?.fullSize || photo?.thumbnail || slot.photoUrl || undefined);

  const slotX = (slotDef.x / 100) * stageWidth;
  const slotY = (slotDef.y / 100) * stageHeight;
  const slotWidth = (slotDef.width / 100) * stageWidth;
  const slotHeight = (slotDef.height / 100) * stageHeight;

  let imageWidth = slotWidth;
  let imageHeight = slotHeight;
  const imageX = slotX + (slot.position.x / 100) * slotWidth;
  const imageY = slotY + (slot.position.y / 100) * slotHeight;

  if (image) {
    const imgAspect = image.width / image.height;
    const slotAspect = slotWidth / slotHeight;

    if (imgAspect > slotAspect) {
      imageHeight = slotHeight * slot.scale;
      imageWidth = imageHeight * imgAspect;
    } else {
      imageWidth = slotWidth * slot.scale;
      imageHeight = imageWidth / imgAspect;
    }
  }

  return (
    <Group>
      <Rect
        x={slotX}
        y={slotY}
        width={slotWidth}
        height={slotHeight}
        fill={photo ? 'transparent' : '#f3f4f6'}
        stroke="#e5e7eb"
        strokeWidth={1}
        dash={!photo ? [5, 5] : undefined}
      />
      {photo && image && (
        <Group clipFunc={(ctx) => ctx.rect(slotX, slotY, slotWidth, slotHeight)}>
          <KonvaImage
            image={image}
            x={imageX}
            y={imageY}
            width={imageWidth}
            height={imageHeight}
          />
        </Group>
      )}
    </Group>
  );
}

interface FreestyleItemPreviewProps {
  item: FreestyleItem;
  photo: Photo | null;
  stageWidth: number;
  stageHeight: number;
}

function FreestyleItemPreview({ item, photo, stageWidth, stageHeight }: FreestyleItemPreviewProps) {
  const [image] = useImage(photo?.fullSize || photo?.thumbnail || item.photoUrl || undefined);

  const x = (item.x / 100) * stageWidth;
  const y = (item.y / 100) * stageHeight;
  const width = (item.width / 100) * stageWidth;
  const height = (item.height / 100) * stageHeight;

  if (!image) {
    return (
      <Rect x={x} y={y} width={width} height={height} fill="#f3f4f6" stroke="#e5e7eb" dash={[5, 5]} />
    );
  }

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={item.rotation}
    />
  );
}

export function ExportPreview() {
  const currentPage = useAppSelector(selectCurrentPage);
  const albumSize = useAppSelector(selectAlbumSize);
  const photos = useAppSelector(selectAllPhotos);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizePreset = ALBUM_SIZE_PRESETS[albumSize] || ALBUM_SIZE_PRESETS['10x10'];
  const aspectRatio = sizePreset.dimensions.width / sizePreset.dimensions.height;

  const previewWidth = aspectRatio >= 1 ? PREVIEW_SIZE : PREVIEW_SIZE * aspectRatio;
  const previewHeight = aspectRatio >= 1 ? PREVIEW_SIZE / aspectRatio : PREVIEW_SIZE;

  const layout = currentPage ? getLayoutById(currentPage.layoutId) : null;
  const isFreestyle = currentPage?.layoutId === 'freestyle';

  const generatePdfPreview = async () => {
    if (!currentPage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const canvasWidth = 1000;
      const canvasHeight = Math.round(canvasWidth / aspectRatio);

      const placements = [];

      if (isFreestyle && currentPage.freestyleItems) {
        for (const item of currentPage.freestyleItems) {
          const photo = photos.find((p) => p.id === item.photoId) || null;
          const placement = await processFreestyleImage(item, photo, canvasWidth, canvasHeight, 'rgb');
          if (placement) placements.push(placement);
        }
      } else if (layout) {
        for (let i = 0; i < layout.slots.length; i++) {
          const slot = currentPage.slots[i];
          const slotDef = layout.slots[i];
          if (!slot) continue;

          const photo = slot.photoId ? photos.find((p) => p.id === slot.photoId) || null : null;
          const placement = await processSlotImage(slot, slotDef, photo, canvasWidth, canvasHeight, 'rgb');
          if (placement) placements.push(placement);
        }
      }

      const dataUrl = await renderPageToCanvas(placements, canvasWidth, canvasHeight, currentPage.background);
      setPdfPreview(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentPage) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Export Preview Debug</CardTitle>
          <CardDescription>No page selected</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Export Preview Debug</CardTitle>
        <CardDescription>
          Compare editor rendering (left) with PDF export rendering (right)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-start">
          {/* Editor Preview (Konva) */}
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-medium text-sm">Editor (Konva)</h3>
            <div
              className="border rounded overflow-hidden"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <Stage width={previewWidth} height={previewHeight}>
                <Layer>
                  <Rect
                    x={0}
                    y={0}
                    width={previewWidth}
                    height={previewHeight}
                    fill={currentPage.background}
                  />
                  {isFreestyle ? (
                    currentPage.freestyleItems
                      ?.slice()
                      .sort((a, b) => a.zIndex - b.zIndex)
                      .map((item) => (
                        <FreestyleItemPreview
                          key={item.id}
                          item={item}
                          photo={photos.find((p) => p.id === item.photoId) || null}
                          stageWidth={previewWidth}
                          stageHeight={previewHeight}
                        />
                      ))
                  ) : layout ? (
                    currentPage.slots.map((slot, index) => {
                      const slotDef = layout.slots[index];
                      if (!slotDef) return null;
                      return (
                        <SlotPreview
                          key={slot.id}
                          slot={slot}
                          slotDef={slotDef}
                          photo={slot.photoId ? photos.find((p) => p.id === slot.photoId) || null : null}
                          stageWidth={previewWidth}
                          stageHeight={previewHeight}
                        />
                      );
                    })
                  ) : null}
                </Layer>
              </Stage>
            </div>
            <div className="text-xs text-muted-foreground">
              {previewWidth.toFixed(0)} x {previewHeight.toFixed(0)} px
            </div>
          </div>

          {/* PDF Export Preview (Canvas) */}
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-medium text-sm">PDF Export (Canvas)</h3>
            <div
              className="border rounded overflow-hidden bg-gray-100 flex items-center justify-center"
              style={{ width: previewWidth, height: previewHeight }}
            >
              {pdfPreview ? (
                <img
                  src={pdfPreview}
                  alt="PDF Preview"
                  style={{ width: previewWidth, height: previewHeight, objectFit: 'contain' }}
                />
              ) : (
                <span className="text-sm text-muted-foreground">Click Generate</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {isGenerating ? 'Generating...' : error ? `Error: ${error}` : 'Click to generate'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={generatePdfPreview} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate PDF Preview'}
          </Button>
        </div>

        {/* Debug Info */}
        <div className="mt-4 text-xs font-mono bg-gray-100 p-2 rounded">
          <div>Page: {currentPage.layoutId}</div>
          <div>Background: {currentPage.background}</div>
          <div>Album Size: {albumSize}</div>
          <div>Aspect Ratio: {aspectRatio.toFixed(3)}</div>
          {isFreestyle ? (
            <div>Freestyle Items: {currentPage.freestyleItems?.length || 0}</div>
          ) : (
            <div>Slots: {currentPage.slots.length} (Layout: {layout?.slots.length || 0})</div>
          )}
          {currentPage.slots.map((slot, i) => (
            <div key={slot.id} className="ml-2">
              Slot {i}: pos({slot.position.x.toFixed(1)}, {slot.position.y.toFixed(1)}) scale={slot.scale.toFixed(2)} rot={slot.rotation}
              {slot.photoId ? ` photo=${slot.photoId.slice(0, 8)}...` : ' (empty)'}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExportPreview;
