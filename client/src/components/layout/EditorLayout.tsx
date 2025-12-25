import { Header } from './Header';
import { PhotoLibraryPanel } from './PhotoLibraryPanel';
import { EditorCanvas } from './EditorCanvas';
import { BookView } from './BookView';
import { PropertiesPanel } from './PropertiesPanel';
import { PageTimeline } from './PageTimeline';
import { selectViewMode } from '@/features/album/albumSlice';
import { useAppSelector } from '@/app/hooks';

export function EditorLayout(): JSX.Element {
  const viewMode = useAppSelector(selectViewMode);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'edit' && <PhotoLibraryPanel />}
        {viewMode === 'book' ? <BookView /> : <EditorCanvas />}
        {viewMode === 'edit' && <PropertiesPanel />}
      </div>

      <PageTimeline />
    </div>
  );
}
