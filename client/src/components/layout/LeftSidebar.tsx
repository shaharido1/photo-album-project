import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Book } from 'lucide-react';
import { PhotoLibraryPanel } from './PhotoLibraryPanel';
import { MyAlbumsPanel } from './MyAlbumsPanel';

type SidebarTab = 'photos' | 'albums';

interface LeftSidebarProps {
  onCreateAlbum: () => void;
}

export function LeftSidebar({ onCreateAlbum }: LeftSidebarProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<SidebarTab>('photos');

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      {/* Tab header */}
      <div className="p-2 border-b flex gap-1">
        <Button
          variant={activeTab === 'photos' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 justify-start"
          onClick={() => setActiveTab('photos')}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Photos
        </Button>
        <Button
          variant={activeTab === 'albums' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 justify-start"
          onClick={() => setActiveTab('albums')}
        >
          <Book className="h-4 w-4 mr-2" />
          Albums
        </Button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'photos' ? (
          <PhotoLibraryPanel />
        ) : (
          <MyAlbumsPanel onCreateAlbum={onCreateAlbum} />
        )}
      </div>
    </div>
  );
}
