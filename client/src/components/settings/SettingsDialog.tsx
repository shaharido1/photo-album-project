/**
 * Settings Dialog Component
 *
 * Modal dialog for managing user settings
 */

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchSettings,
  toggleAutoImageTagging,
  selectSettings,
  selectSettingsStatus,
} from '@/features/settings/settingsSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { Sparkles, Loader2 } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps): JSX.Element {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const status = useAppSelector(selectSettingsStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Fetch settings when dialog opens
  useEffect(() => {
    if (open && isAuthenticated) {
      dispatch(fetchSettings());
    }
  }, [open, isAuthenticated, dispatch]);

  const handleAutoTaggingToggle = (): void => {
    dispatch(toggleAutoImageTagging());
  };

  const isLoading = status === 'loading';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your photo album preferences
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* AI Features Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              AI Features
            </h3>

            {/* Auto Image Tagging Toggle */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <Label
                    htmlFor="auto-tagging"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Auto Image Tagging
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate captions and tags for uploaded photos
                    using AI
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    id="auto-tagging"
                    checked={settings.autoImageTagging}
                    onCheckedChange={handleAutoTaggingToggle}
                    disabled={isLoading}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground">
            Note: Auto tagging requires a local Moondream server running at
            localhost:2020. Tags and captions are generated after photos are
            uploaded.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
