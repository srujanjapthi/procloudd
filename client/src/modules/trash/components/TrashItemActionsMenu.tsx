import { MoreVertical, RotateCcw, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ConfirmDialogContent } from "@/components/ConfirmDialogContent";
import type { DriveItemRef } from "@/modules/drive/hooks/useDriveItemActions";
import { useTrashItemActions } from "../hooks/useTrashItemActions";

interface TrashItemActionsMenuProps {
  item: DriveItemRef;
}

export function TrashItemActionsMenu({ item }: TrashItemActionsMenuProps) {
  const {
    restore,
    isRestorePending,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleteForever,
    isDeletePending,
  } = useTrashItemActions(item);

  const label = item.type === "directory" ? "folder" : "file";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${item.name} actions`}
            />
          }
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => void restore()}
            disabled={isRestorePending}
          >
            {isRestorePending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            Restore
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 />
            Delete forever
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <ConfirmDialogContent
          title={`Delete this ${label} forever?`}
          description={
            item.type === "directory"
              ? `"${item.name}" and everything inside it will be permanently deleted. This can't be undone.`
              : `"${item.name}" will be permanently deleted. This can't be undone.`
          }
          confirmLabel="Delete forever"
          onConfirm={deleteForever}
          isConfirming={isDeletePending}
        />
      </AlertDialog>
    </>
  );
}
