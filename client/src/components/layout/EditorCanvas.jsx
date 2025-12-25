import { ImagePlus } from 'lucide-react';

export function EditorCanvas() {
  return (
    <div className="flex-1 bg-muted/50 flex items-center justify-center p-8">
      <div className="bg-background rounded-lg shadow-lg aspect-square w-full max-w-xl flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-2">Drag photos here</p>
        <p className="text-sm text-muted-foreground">
          or select from your library
        </p>
      </div>
    </div>
  );
}
