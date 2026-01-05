import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Sparkles, SunMedium, Contrast, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  setFreestyleItemFilterPreset,
  updateFreestyleItemFilters,
  resetFreestyleItemFilters,
} from '@/features/album/albumSlice';
import { useAppDispatch } from '@/app/hooks';
import { buildFilterString } from './FilterControls';
import {
  FILTER_PRESETS,
  DEFAULT_FILTER_VALUES,
  type PhotoFilterValues,
  type FilterPresetName,
  type FreestyleItem,
} from '@/types';

interface FreestyleFilterControlsProps {
  item: FreestyleItem;
  pageIndex: number;
  itemId: string;
  photoThumbnail: string;
}

export function FreestyleFilterControls({
  item,
  pageIndex,
  itemId,
  photoThumbnail,
}: FreestyleFilterControlsProps): JSX.Element {
  const dispatch = useAppDispatch();
  const currentFilters = item.filters || DEFAULT_FILTER_VALUES;
  const currentPreset = item.filterPreset || 'none';

  const handlePresetChange = (presetName: FilterPresetName): void => {
    dispatch(setFreestyleItemFilterPreset({ pageIndex, itemId, preset: presetName }));
  };

  const handleFilterChange = (
    filterName: keyof PhotoFilterValues,
    value: number
  ): void => {
    dispatch(
      updateFreestyleItemFilters({
        pageIndex,
        itemId,
        filters: { [filterName]: value },
      })
    );
  };

  const handleReset = (): void => {
    dispatch(resetFreestyleItemFilters({ pageIndex, itemId }));
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
