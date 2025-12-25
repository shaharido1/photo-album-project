import { Button } from '@/components/ui/button';
import { Download, Save, Moon, Sun, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAlbumName, selectAlbumId } from '@/features/album/albumSlice';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  }
  return prefersDark;
};

export function Header() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const albumId = useSelector(selectAlbumId);
  const albumName = useSelector(selectAlbumName);

  const toggleDarkMode = () => {
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
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
            <Button size="sm">
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
      </div>

      <CreateAlbumDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </header>
  );
}
