/**
 * Export Dialog Component
 * Professional PDF export dialog with print house presets
 */

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
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import {
  Download,
  FileText,
  Printer,
  Monitor,
  Check,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectAlbum } from '@/features/album/albumSlice';
import { selectAllPhotos } from '@/features/photos/photosSlice';
import {
  generatePDF,
  downloadBlob,
  type ExportOptions,
  type ExportPresetId,
  type ExportProgress,
  type Resolution,
  type BleedMm,
  EXPORT_PRESETS,
  PAPER_TYPES,
  DEFAULT_EXPORT_OPTIONS,
  calculatePageDimensions,
  calculateSpineWidth,
  estimateFileSize,
} from '@/features/export';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps): JSX.Element {
  const album = useAppSelector(selectAlbum);
  const photos = useAppSelector(selectAllPhotos);

  // Export options state
  const [options, setOptions] = React.useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [progress, setProgress] = React.useState<ExportProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setOptions(DEFAULT_EXPORT_OPTIONS);
      setProgress(null);
      setError(null);
    }
  }, [open]);

  // Calculated values
  const dimensions = calculatePageDimensions(album.size, options.bleedMm, options.resolution);
  const spineWidth = calculateSpineWidth(album.pages.length, options.cover.paperType);
  const estimatedSize = estimateFileSize(album.pages.length, options.resolution, album.size);

  // Update options when preset changes
  const handlePresetChange = (presetId: ExportPresetId): void => {
    const preset = EXPORT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setOptions((prev) => ({
        ...prev,
        preset: presetId,
        ...preset.options,
      }));
    }
  };

  // Handle export
  const handleExport = async (): Promise<void> => {
    setError(null);
    setProgress({
      status: 'preparing',
      currentPage: 0,
      totalPages: album.pages.length,
      message: 'Preparing export...',
    });

    try {
      const result = await generatePDF(album, photos, options, setProgress);

      // Download main PDF
      downloadBlob(result.mainPdf, result.filename);

      // Download cover PDF if generated
      if (result.coverPdf && result.coverFilename) {
        // Small delay between downloads
        setTimeout(() => {
          downloadBlob(result.coverPdf!, result.coverFilename!);
        }, 500);
      }

      // Keep success state for a moment
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      setProgress(null);
    }
  };

  const isExporting = progress !== null && progress.status !== 'complete' && progress.status !== 'error';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Album as PDF
          </DialogTitle>
          <DialogDescription>
            Choose export settings for professional printing or digital viewing.
          </DialogDescription>
        </DialogHeader>

        {progress?.status === 'complete' ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Export Complete!</h3>
            <p className="text-sm text-muted-foreground">
              Your PDF{options.cover.exportSeparately ? 's have' : ' has'} been downloaded.
            </p>
          </div>
        ) : (
          <>
            {/* Preset Selection */}
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Export Preset</Label>
                <div className="grid grid-cols-1 gap-2">
                  {EXPORT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetChange(preset.id)}
                      disabled={isExporting}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors hover:bg-accent',
                        options.preset === preset.id
                          ? 'border-primary bg-accent'
                          : 'border-muted'
                      )}
                    >
                      <div className="mt-0.5">
                        {preset.id === 'professional' && <Printer className="h-5 w-5 text-muted-foreground" />}
                        {preset.id === 'modern' && <FileText className="h-5 w-5 text-muted-foreground" />}
                        {preset.id === 'digital' && <Monitor className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{preset.name}</span>
                          {preset.recommended && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.description}
                        </p>
                      </div>
                      {options.preset === preset.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Resolution & Bleed Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Resolution (DPI)</Label>
                  <div className="flex gap-1">
                    {([150, 300, 450] as Resolution[]).map((dpi) => (
                      <button
                        key={dpi}
                        type="button"
                        onClick={() => setOptions((prev) => ({ ...prev, resolution: dpi }))}
                        disabled={isExporting}
                        className={cn(
                          'flex-1 px-3 py-2 text-sm rounded border transition-colors',
                          options.resolution === dpi
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-muted hover:bg-accent'
                        )}
                      >
                        {dpi}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Bleed</Label>
                  <div className="flex gap-1">
                    {([0, 3, 6] as BleedMm[]).map((mm) => (
                      <button
                        key={mm}
                        type="button"
                        onClick={() => setOptions((prev) => ({ ...prev, bleedMm: mm }))}
                        disabled={isExporting}
                        className={cn(
                          'flex-1 px-3 py-2 text-sm rounded border transition-colors',
                          options.bleedMm === mm
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-muted hover:bg-accent'
                        )}
                      >
                        {mm === 0 ? 'None' : `${mm}mm`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Print Marks */}
              <div className="grid gap-3">
                <Label>Print Marks</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Crop marks</span>
                    <Switch
                      checked={options.printMarks.cropMarks}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          printMarks: { ...prev.printMarks, cropMarks: checked },
                        }))
                      }
                      disabled={isExporting}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bleed area</span>
                    <Switch
                      checked={options.printMarks.bleedArea}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          printMarks: { ...prev.printMarks, bleedArea: checked },
                        }))
                      }
                      disabled={isExporting}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Registration marks</span>
                    <Switch
                      checked={options.printMarks.registrationMarks}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          printMarks: { ...prev.printMarks, registrationMarks: checked },
                        }))
                      }
                      disabled={isExporting}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Page info</span>
                    <Switch
                      checked={options.printMarks.pageInfo}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          printMarks: { ...prev.printMarks, pageInfo: checked },
                        }))
                      }
                      disabled={isExporting}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cover Export Options */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export cover separately</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creates a spread file (back + spine + front) for print house covers
                    </p>
                  </div>
                  <Switch
                    checked={options.cover.exportSeparately}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        cover: { ...prev.cover, exportSeparately: checked },
                      }))
                    }
                    disabled={isExporting}
                  />
                </div>

                {options.cover.exportSeparately && (
                  <div className="ml-4 p-3 rounded-lg bg-muted/50 grid gap-3">
                    <div className="grid gap-2">
                      <Label className="text-sm">Paper type (for spine calculation)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PAPER_TYPES.map((paper) => (
                          <button
                            key={paper.id}
                            type="button"
                            onClick={() =>
                              setOptions((prev) => ({
                                ...prev,
                                cover: { ...prev.cover, paperType: paper.id },
                              }))
                            }
                            disabled={isExporting}
                            className={cn(
                              'p-2 text-left rounded border transition-colors',
                              options.cover.paperType === paper.id
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:bg-accent'
                            )}
                          >
                            <div className="text-sm font-medium">{paper.name}</div>
                            <div className="text-xs text-muted-foreground">{paper.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">
                        Calculated spine width: <strong>{spineWidth}mm</strong> ({album.pages.length} pages)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Include spine guide</span>
                      <Switch
                        checked={options.cover.includeSpineGuide}
                        onCheckedChange={(checked) =>
                          setOptions((prev) => ({
                            ...prev,
                            cover: { ...prev.cover, includeSpineGuide: checked },
                          }))
                        }
                        disabled={isExporting}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Output Info */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Output size:</span>{' '}
                    <span className="font-medium">
                      {dimensions.widthInches.toFixed(2)}&quot; × {dimensions.heightInches.toFixed(2)}&quot;
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pages:</span>{' '}
                    <span className="font-medium">{album.pages.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. file size:</span>{' '}
                    <span className="font-medium">~{estimatedSize} MB</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pixel size:</span>{' '}
                    <span className="font-medium">
                      {dimensions.widthPx} × {dimensions.heightPx}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Progress */}
              {isExporting && progress && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">{progress.message}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.currentPage / progress.totalPages) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting || album.pages.length === 0}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
