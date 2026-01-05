import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  selectSelectedFreestyleItem,
  selectCurrentPage,
  bringFreestyleItemToFront,
  sendFreestyleItemToBack,
  bringFreestyleItemForward,
  sendFreestyleItemBackward,
  removeFreestyleItem,
  updateFreestyleItem,
} from '@/features/album/albumSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

export function FreestyleToolbar(): JSX.Element | null {
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedFreestyleItem);
  const currentPage = useAppSelector(selectCurrentPage);

  // Only show toolbar when a freestyle item is selected
  if (!selectedItem || !currentPage || currentPage.layoutId !== 'freestyle') {
    return null;
  }

  const item = currentPage.freestyleItems?.find(
    (i) => i.id === selectedItem.itemId
  );

  if (!item) {
    return null;
  }

  const handleBringToFront = (): void => {
    dispatch(
      bringFreestyleItemToFront({
        pageIndex: selectedItem.pageIndex,
        itemId: selectedItem.itemId,
      })
    );
  };

  const handleSendToBack = (): void => {
    dispatch(
      sendFreestyleItemToBack({
        pageIndex: selectedItem.pageIndex,
        itemId: selectedItem.itemId,
      })
    );
  };

  const handleBringForward = (): void => {
    dispatch(
      bringFreestyleItemForward({
        pageIndex: selectedItem.pageIndex,
        itemId: selectedItem.itemId,
      })
    );
  };

  const handleSendBackward = (): void => {
    dispatch(
      sendFreestyleItemBackward({
        pageIndex: selectedItem.pageIndex,
        itemId: selectedItem.itemId,
      })
    );
  };

  const handleDelete = (): void => {
    dispatch(
      removeFreestyleItem({
        pageIndex: selectedItem.pageIndex,
        itemId: selectedItem.itemId,
      })
    );
  };

  const handleResetRotation = (): void => {
    dispatch(
      updateFreestyleItem({
        pageIndex: selectedItem.pageIndex,
        itemId: selectedItem.itemId,
        updates: { rotation: 0 },
      })
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border px-2 py-1.5 flex items-center gap-1">
        {/* Layer controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBringToFront}
              >
                <ChevronsUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bring to Front</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBringForward}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bring Forward</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSendBackward}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send Backward</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSendToBack}
              >
                <ChevronsDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send to Back</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Rotation reset */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleResetRotation}
              disabled={item.rotation === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset Rotation</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>

        {/* Layer indicator */}
        <div className="text-xs text-muted-foreground px-2 border-l ml-1">
          Layer: {item.zIndex}
        </div>
      </div>
    </TooltipProvider>
  );
}
