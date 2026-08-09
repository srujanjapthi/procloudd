import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/error/api.error";
import {
  useSetDirectoryStarredMutation,
  useSetFileStarredMutation,
} from "../queries";
import type { DriveItemRef } from "./useDriveItemActions";

export function useStarToggle(item: DriveItemRef) {
  const setDirectoryStarred = useSetDirectoryStarredMutation();
  const setFileStarred = useSetFileStarredMutation();

  async function toggleStar(starred: boolean) {
    try {
      if (item.type === "directory") {
        await setDirectoryStarred.mutateAsync({ id: item.id, starred });
      } else {
        await setFileStarred.mutateAsync({ id: item.id, starred });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return {
    toggleStar,
    isStarPending: setDirectoryStarred.isPending || setFileStarred.isPending,
  };
}
