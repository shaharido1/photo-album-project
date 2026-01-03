import { useState } from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { EditorCanvas } from './EditorCanvas';
import { BookView } from './BookView';
import { PropertiesPanel } from './PropertiesPanel';
import { PageTimeline } from './PageTimeline';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { selectViewMode, selectAlbumId } from '@/features/album/albumSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { HomePage } from '@/pages/HomePage';
import { Dashboard } from '@/features/album/Dashboard';
import { useAppSelector } from '@/app/hooks';

export function EditorLayout(): JSX.Element {
  const viewMode = useAppSelector(selectViewMode);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const albumId = useAppSelector(selectAlbumId);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onCreateAlbum={() => setIsCreateDialogOpen(true)} />

      {!albumId ? (
        isAuthenticated ? <Dashboard /> : <HomePage />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'edit' && (
            <LeftSidebar onCreateAlbum={() => setIsCreateDialogOpen(true)} />
          )}
          {viewMode === 'book' ? <BookView /> : <EditorCanvas />}
          {viewMode === 'edit' && <PropertiesPanel />}
        </div>
      )}

      {albumId && <PageTimeline />}

      <CreateAlbumDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
