import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';

export function PageTimeline() {
  // Start with one empty page
  const pages = [{ id: 1, thumbnail: null }];
  const currentPage = 1;

  return (
    <div className="h-24 border-t bg-muted/30">
      <ScrollArea className="h-full">
        <div className="flex items-center gap-2 p-3 h-full">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className={`
                relative flex-shrink-0 w-14 h-14 rounded-md border-2 cursor-pointer
                transition-all hover:border-primary/50
                ${currentPage === page.id ? 'border-primary ring-2 ring-primary/20' : 'border-muted-foreground/25'}
                ${page.thumbnail ? '' : 'bg-background'}
              `}
            >
              {page.thumbnail ? (
                <img
                  src={page.thumbnail}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 w-14 h-14 rounded-md border-dashed"
            aria-label="Add new page"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
