import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function PropertiesPanel() {
  // Nothing selected state
  const selectedElement = null;

  return (
    <div className="w-64 border-l bg-muted/30 flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-sm font-medium">Properties</h2>
      </div>

      <div className="p-3 flex-1">
        {selectedElement === null ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Select a photo or element to edit its properties
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input id="caption" placeholder="Add a caption..." />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="x" className="text-xs">
                    X
                  </Label>
                  <Input id="x" type="number" defaultValue={0} />
                </div>
                <div>
                  <Label htmlFor="y" className="text-xs">
                    Y
                  </Label>
                  <Input id="y" type="number" defaultValue={0} />
                </div>
              </div>
            </div>

            <Separator />

            <Button variant="destructive" size="sm" className="w-full">
              Remove from page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
