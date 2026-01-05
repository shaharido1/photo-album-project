import { useState } from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { EditorCanvas } from './EditorCanvas';
import { FreestyleCanvas } from './FreestyleCanvas';
import { BookView } from './BookView';
import { PropertiesPanel } from './PropertiesPanel';
import { PageTimeline } from './PageTimeline';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { selectViewMode, selectAlbumId, selectCurrentPage } from '@/features/album/albumSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { HomePage } from '@/pages/HomePage';
import { Dashboard } from '@/features/album/Dashboard';
import { useAppSelector } from '@/app/hooks';
import { useAutoSave } from '@/features/album/useAutoSave';

export function EditorLayout(): JSX.Element {
  useAutoSave();
  const viewMode = useAppSelector(selectViewMode);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const albumId = useAppSelector(selectAlbumId);
  const currentPage = useAppSelector(selectCurrentPage);

  // Check if current page is freestyle mode
  const isFreestyleMode = currentPage?.layoutId === 'freestyle';

  // Render the appropriate canvas based on mode
  const renderCanvas = (): JSX.Element => {
    if (viewMode === 'book') {
      return <BookView />;
    }
    if (isFreestyleMode) {
      return <FreestyleCanvas />;
    }
    return <EditorCanvas />;
  };

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
          {renderCanvas()}
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
