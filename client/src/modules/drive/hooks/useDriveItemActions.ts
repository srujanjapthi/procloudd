import { useState } from "react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/error/api.error";
import * as DriveApi from "../api";
import {
  useRenameDirectoryMutation,
  useRenameFileMutation,
  useTrashDirectoryMutation,
  useTrashFileMutation,
  useDuplicateDirectoryMutation,
  useCopyFileMutation,
  useMoveDirectoryMutation,
  useMoveFileMutation,
} from "../queries";

export interface DriveItemRef {
  type: "directory" | "file";
  id: string;
  name: string;
}

function triggerDownload(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

export function useDriveItemActions(item: DriveItemRef, dirId: string) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const renameDirectory = useRenameDirectoryMutation();
  const renameFile = useRenameFileMutation();
  const trashDirectory = useTrashDirectoryMutation(dirId);
  const trashFile = useTrashFileMutation(dirId);
  const duplicateDirectory = useDuplicateDirectoryMutation();
  const copyFile = useCopyFileMutation();
  const moveDirectory = useMoveDirectoryMutation();
  const moveFile = useMoveFileMutation();

  const label = item.type === "directory" ? "Folder" : "File";

  async function rename(newName: string) {
    try {
      if (item.type === "directory") {
        await renameDirectory.mutateAsync({ dirId: item.id, name: newName });
      } else {
        await renameFile.mutateAsync({ fileId: item.id, name: newName });
      }
      toast.success(`${label} renamed`);
      setIsRenaming(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function remove() {
    try {
      if (item.type === "directory") {
        await trashDirectory.mutateAsync(item.id);
      } else {
        await trashFile.mutateAsync(item.id);
      }
      toast.success(`${label} moved to trash`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  }

  async function duplicate() {
    setIsDuplicating(true);
    try {
      if (item.type === "directory") {
        await duplicateDirectory.mutateAsync({ dirId: item.id });
      } else {
        await copyFile.mutateAsync({ fileId: item.id });
      }
      toast.success(`${label} duplicated`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDuplicating(false);
    }
  }

  async function move(targetDirId: string) {
    try {
      if (item.type === "directory") {
        await moveDirectory.mutateAsync({
          dirId: item.id,
          parentDirId: targetDirId,
        });
      } else {
        await moveFile.mutateAsync({
          fileId: item.id,
          parentDirId: targetDirId,
        });
      }
      toast.success(`${label} moved`);
      setIsMoveOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function download() {
    if (item.type !== "file") {
      return;
    }
    setIsDownloading(true);
    try {
      const url = await DriveApi.getFileDownloadUrl(item.id);
      triggerDownload(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    isRenaming,
    setIsRenaming,
    rename,
    isRenamePending: renameDirectory.isPending || renameFile.isPending,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    remove,
    isDeletePending: trashDirectory.isPending || trashFile.isPending,
    duplicate,
    isDuplicating,
    download,
    isDownloading,
    isMoveOpen,
    setIsMoveOpen,
    move,
    isMovePending: moveDirectory.isPending || moveFile.isPending,
    isDetailsOpen,
    setIsDetailsOpen,
  };
}
