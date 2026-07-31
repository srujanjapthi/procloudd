import { useState } from "react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/error/api.error";
import type { DriveItemRef } from "@/modules/drive/hooks/useDriveItemActions";
import {
  useRestoreDirectoryMutation,
  useRestoreFileMutation,
  useHardDeleteDirectoryMutation,
  useHardDeleteFileMutation,
} from "../queries";

export function useTrashItemActions(item: DriveItemRef) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const restoreDirectory = useRestoreDirectoryMutation();
  const restoreFile = useRestoreFileMutation();
  const hardDeleteDirectory = useHardDeleteDirectoryMutation();
  const hardDeleteFile = useHardDeleteFileMutation();

  const label = item.type === "directory" ? "Folder" : "File";

  async function restore() {
    try {
      if (item.type === "directory") {
        await restoreDirectory.mutateAsync(item.id);
      } else {
        await restoreFile.mutateAsync(item.id);
      }
      toast.success(`${label} restored`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function deleteForever() {
    try {
      if (item.type === "directory") {
        await hardDeleteDirectory.mutateAsync(item.id);
      } else {
        await hardDeleteFile.mutateAsync(item.id);
      }
      toast.success(`${label} permanently deleted`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  }

  return {
    restore,
    isRestorePending: restoreDirectory.isPending || restoreFile.isPending,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleteForever,
    isDeletePending: hardDeleteDirectory.isPending || hardDeleteFile.isPending,
  };
}
