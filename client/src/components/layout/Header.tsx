import { Button } from '@/components/ui/button';
import { Download, Save, Moon, Sun, Plus, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { selectAlbumName, selectAlbumId } from '@/features/album/albumSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserMenu } from '@/components/auth/UserMenu';
import { ViewModeToggle } from './ViewModeToggle';
import { useAppSelector } from '@/app/hooks';

interface HeaderProps {
  onCreateAlbum?: () => void;
}

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  }
  return prefersDark;
};

export function Header({ onCreateAlbum }: HeaderProps): JSX.Element {
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const albumId = useAppSelector(selectAlbumId);
  const albumName = useAppSelector(selectAlbumName);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const toggleDarkMode = (): void => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Photo Album</h1>
        {albumId ? (
          <span className="text-sm text-muted-foreground">{albumName}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">No album</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ViewModeToggle />

        <Button
          variant="outline"
          size="sm"
          onClick={onCreateAlbum}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Album
        </Button>

        {albumId && (
          <>
            <span className="text-xs text-muted-foreground">Saved</span>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFeedbackDialogOpen(true)}
            aria-label="Send feedback"
            title="Send feedback"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}

        {/* Auth: Show login button or user menu */}
        {isAuthenticated ? <UserMenu /> : <LoginButton />}
      </div>

      <FeedbackDialog
        open={isFeedbackDialogOpen}
        onOpenChange={setIsFeedbackDialogOpen}
      />

      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </header>
  );
}
