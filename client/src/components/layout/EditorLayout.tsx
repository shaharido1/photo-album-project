import { useState } from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { EditorCanvas } from './EditorCanvas';
import { BookView } from './BookView';
import { PropertiesPanel } from './PropertiesPanel';
import { PageTimeline } from './PageTimeline';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { selectViewMode } from '@/features/album/albumSlice';
import { useAppSelector } from '@/app/hooks';

export function EditorLayout(): JSX.Element {
  const viewMode = useAppSelector(selectViewMode);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onCreateAlbum={() => setIsCreateDialogOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'edit' && (
          <LeftSidebar onCreateAlbum={() => setIsCreateDialogOpen(true)} />
        )}
        {viewMode === 'book' ? <BookView /> : <EditorCanvas />}
        {viewMode === 'edit' && <PropertiesPanel />}
      </div>

      <PageTimeline />

      <CreateAlbumDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
