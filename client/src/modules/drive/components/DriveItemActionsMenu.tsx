import {
  MoreVertical,
  Info,
  Pencil,
  Copy,
  Download,
  Trash2,
  Loader2,
  Move,
} from "lucide-react";
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
import { useDriveItemActions } from "../hooks/useDriveItemActions";
import { RenameDialog } from "./RenameDialog";
import { MoveDialog } from "./MoveDialog";
import { DetailsDialog } from "./DetailsDialog";
import type { DriveItemRef } from "../hooks/useDriveItemActions";

interface DriveItemActionsMenuProps {
  item: DriveItemRef;
  baseName?: string;
  extension?: string;
  sizeInBytes: number;
  createdAt: string;
  updatedAt: string;
  dirId: string;
  locationName: string;
}

export function DriveItemActionsMenu({
  item,
  baseName,
  extension,
  sizeInBytes,
  createdAt,
  updatedAt,
  dirId,
  locationName,
}: DriveItemActionsMenuProps) {
  const {
    isRenaming,
    setIsRenaming,
    rename,
    isRenamePending,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    remove,
    isDeletePending,
    duplicate,
    isDuplicating,
    download,
    isDownloading,
    isMoveOpen,
    setIsMoveOpen,
    move,
    isMovePending,
    isDetailsOpen,
    setIsDetailsOpen,
  } = useDriveItemActions(item, dirId);

  const isDirectory = item.type === "directory";
  const label = isDirectory ? "folder" : "file";

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
          <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
            <Info />
            Details
          </DropdownMenuItem>
          {!isDirectory && (
            <DropdownMenuItem
              onClick={() => void download()}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              Download
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void duplicate()}
            disabled={isDuplicating}
          >
            {isDuplicating ? <Loader2 className="animate-spin" /> : <Copy />}
            {isDirectory ? "Duplicate" : "Copy"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsMoveOpen(true)}>
            <Move />
            Move
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={isRenaming}
        onOpenChange={setIsRenaming}
        baseName={baseName ?? item.name}
        extension={isDirectory ? undefined : extension}
        onConfirm={rename}
        isPending={isRenamePending}
      />

      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <ConfirmDialogContent
          title={`Delete this ${label}?`}
          description={
            isDirectory
              ? `"${item.name}" and everything inside it will be moved to trash.`
              : `"${item.name}" will be moved to trash.`
          }
          confirmLabel="Delete"
          onConfirm={remove}
          isConfirming={isDeletePending}
        />
      </AlertDialog>

      <MoveDialog
        key={isMoveOpen ? "move-open" : "move-closed"}
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
        item={item}
        currentDirId={dirId}
        onConfirm={move}
        isPending={isMovePending}
      />

      <DetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        item={item}
        extension={extension}
        sizeInBytes={sizeInBytes}
        createdAt={createdAt}
        updatedAt={updatedAt}
        locationName={locationName}
      />
    </>
  );
}
