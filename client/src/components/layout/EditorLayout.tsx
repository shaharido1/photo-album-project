import { Header } from './Header';
import { PhotoLibraryPanel } from './PhotoLibraryPanel';
import { EditorCanvas } from './EditorCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { PageTimeline } from './PageTimeline';

export function EditorLayout(): JSX.Element {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <PhotoLibraryPanel />
        <EditorCanvas />
        <PropertiesPanel />
      </div>

      <PageTimeline />
    </div>
  );
}
