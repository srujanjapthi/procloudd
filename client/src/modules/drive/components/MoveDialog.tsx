import { useState } from "react";
import { ChevronRight, Folder, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDirectoryPickerQuery } from "../queries";
import { useLoadMoreOnScroll } from "../hooks/useLoadMoreOnScroll";
import type { DriveItemRef } from "../hooks/useDriveItemActions";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DriveItemRef;
  currentDirId: string;
  onConfirm: (targetDirId: string) => void;
  isPending: boolean;
}

export function MoveDialog({
  open,
  onOpenChange,
  item,
  currentDirId,
  onConfirm,
  isPending,
}: MoveDialogProps) {
  const [pickerDirId, setPickerDirId] = useState(currentDirId);

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDirectoryPickerQuery(pickerDirId, open);

  const breadcrumb = data?.pages[0]?.breadcrumb ?? [];
  const directories = (
    data?.pages.flatMap((page) => page.directories) ?? []
  ).filter((dir) => !(item.type === "directory" && dir.id === item.id));

  const sentinelRef = useLoadMoreOnScroll(
    fetchNextPage,
    hasNextPage && !isFetchingNextPage
  );

  const isSameLocation = pickerDirId === currentDirId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move &quot;{item.name}&quot;</DialogTitle>
        </DialogHeader>

        <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          {breadcrumb.map((entry, index) => (
            <span key={entry.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3" />}
              <button
                type="button"
                className="hover:text-foreground rounded hover:underline disabled:pointer-events-none disabled:font-medium disabled:no-underline"
                disabled={entry.id === pickerDirId}
                onClick={() => setPickerDirId(entry.id)}
              >
                {index === 0 ? "My Drive" : entry.name}
              </button>
            </span>
          ))}
        </div>

        <div
          className={cn(
            "h-64 overflow-y-auto rounded-lg border transition-opacity",
            isFetching && !isLoading && "opacity-50"
          )}
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : directories.length === 0 ? (
            <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No folders here
            </p>
          ) : (
            <>
              {directories.map((dir) => (
                <button
                  key={dir.id}
                  type="button"
                  className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  onClick={() => setPickerDirId(dir.id)}
                >
                  <Folder className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate">{dir.name}</span>
                </button>
              ))}
              {hasNextPage && (
                <div ref={sentinelRef} className="flex justify-center py-2">
                  {isFetchingNextPage && (
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || isSameLocation}
            onClick={() => onConfirm(pickerDirId)}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Moving…" : "Move here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
