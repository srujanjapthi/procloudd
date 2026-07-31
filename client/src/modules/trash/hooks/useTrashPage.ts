import { useState } from "react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/error/api.error";
import { useTrashQuery, useEmptyTrashMutation } from "../queries";
import { useTrashSort } from "./useTrashSort";

export function useTrashPage() {
  const { sortBy, setSortBy, sortOrder, toggleSortOrder } = useTrashSort();
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTrashQuery(sortBy, sortOrder);
  const emptyTrashMutation = useEmptyTrashMutation();

  const firstPage = data?.pages[0];
  const directories = data?.pages.flatMap((page) => page.directories) ?? [];
  const files = data?.pages.flatMap((page) => page.files) ?? [];

  async function emptyTrash() {
    try {
      await emptyTrashMutation.mutateAsync();
      toast.success("Trash emptied");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsEmptyTrashConfirmOpen(false);
    }
  }

  return {
    directories,
    files,
    isLoading,
    isFetching,
    isError,
    isEmpty:
      !isLoading && !isError && directories.length === 0 && files.length === 0,
    totalItems: firstPage?.meta.totalItems,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    emptyTrash,
    isEmptyingTrash: emptyTrashMutation.isPending,
    isEmptyTrashConfirmOpen,
    setIsEmptyTrashConfirmOpen,
  };
}
