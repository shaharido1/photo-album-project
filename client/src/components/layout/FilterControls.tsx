import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Sparkles, SunMedium, Contrast, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  setSlotFilterPreset,
  updateSlotFilters,
  resetSlotFilters,
} from '@/features/album/albumSlice';
import { useAppDispatch } from '@/app/hooks';
import {
  FILTER_PRESETS,
  DEFAULT_FILTER_VALUES,
  type PhotoFilterValues,
  type FilterPresetName,
  type PageSlot,
} from '@/types';

interface FilterControlsProps {
  slot: PageSlot;
  pageIndex: number;
  slotIndex: number;
  photoThumbnail: string;
}

/**
 * Build a CSS filter string from filter values
 */
export function buildFilterString(filters: PhotoFilterValues): string {
  const parts: string[] = [];

  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`);
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`);
  }
  if (filters.saturation !== 100) {
    parts.push(`saturate(${filters.saturation}%)`);
  }
  if (filters.hue !== 0) {
    parts.push(`hue-rotate(${filters.hue}deg)`);
  }
  if (filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }
  if (filters.invert > 0) {
    parts.push(`invert(${filters.invert}%)`);
  }
  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.opacity !== 100) {
    parts.push(`opacity(${filters.opacity}%)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function FilterControls({
  slot,
  pageIndex,
  slotIndex,
  photoThumbnail,
}: FilterControlsProps): JSX.Element {
  const dispatch = useAppDispatch();
  const currentFilters = slot.filters || DEFAULT_FILTER_VALUES;
  const currentPreset = slot.filterPreset || 'none';

  const handlePresetChange = (presetName: FilterPresetName): void => {
    dispatch(setSlotFilterPreset({ pageIndex, slotIndex, preset: presetName }));
  };

  const handleFilterChange = (
    filterName: keyof PhotoFilterValues,
    value: number
  ): void => {
    dispatch(
      updateSlotFilters({
        pageIndex,
        slotIndex,
        filters: { [filterName]: value },
      })
    );
  };

  const handleReset = (): void => {
    dispatch(resetSlotFilters({ pageIndex, slotIndex }));
  };

  return (
    <div className="space-y-4">
      {/* Filter Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Filter Presets
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Preset Grid with Preview */}
        <div className="grid grid-cols-3 gap-1.5">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetChange(preset.name)}
              className={cn(
                'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                currentPreset === preset.name
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-muted hover:border-primary/50'
              )}
              title={`${preset.label}: ${preset.description}`}
            >
              <img
                src={photoThumbnail}
                alt={preset.label}
                className="w-full h-full object-cover"
                style={{ filter: buildFilterString(preset.values) }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <span className="text-[9px] text-white truncate block">
                  {preset.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Manual Adjustments */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Adjustments
        </Label>

        {/* Brightness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <SunMedium className="h-3 w-3" />
              Brightness
            </Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.brightness}%
            </span>
          </div>
          <Slider
            value={[currentFilters.brightness]}
            min={0}
            max={200}
            step={1}
            onValueChange={([v]) => handleFilterChange('brightness', v)}
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <Contrast className="h-3 w-3" />
              Contrast
            </Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.contrast}%
            </span>
          </div>
          <Slider
            value={[currentFilters.contrast]}
            min={0}
            max={200}
            step={1}
            onValueChange={([v]) => handleFilterChange('contrast', v)}
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              Saturation
            </Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.saturation}%
            </span>
          </div>
          <Slider
            value={[currentFilters.saturation]}
            min={0}
            max={200}
            step={1}
            onValueChange={([v]) => handleFilterChange('saturation', v)}
          />
        </div>

        {/* Hue */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Hue Shift</Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.hue}°
            </span>
          </div>
          <Slider
            value={[currentFilters.hue]}
            min={-180}
            max={180}
            step={1}
            onValueChange={([v]) => handleFilterChange('hue', v)}
          />
        </div>

        {/* Grayscale */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Grayscale</Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.grayscale}%
            </span>
          </div>
          <Slider
            value={[currentFilters.grayscale]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => handleFilterChange('grayscale', v)}
          />
        </div>

        {/* Sepia */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Sepia</Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.sepia}%
            </span>
          </div>
          <Slider
            value={[currentFilters.sepia]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => handleFilterChange('sepia', v)}
          />
        </div>

        {/* Blur */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Blur</Label>
            <span className="text-xs text-muted-foreground">
              {currentFilters.blur.toFixed(1)}px
            </span>
          </div>
          <Slider
            value={[currentFilters.blur]}
            min={0}
            max={10}
            step={0.1}
            onValueChange={([v]) => handleFilterChange('blur', v)}
          />
        </div>
      </div>
    </div>
  );
}
