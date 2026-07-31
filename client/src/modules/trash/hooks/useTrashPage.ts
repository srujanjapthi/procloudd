import { useTrashQuery } from "../queries";
import { useTrashSort } from "./useTrashSort";

export function useTrashPage() {
  const { sortBy, setSortBy, sortOrder, toggleSortOrder } = useTrashSort();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTrashQuery(sortBy, sortOrder);

  const firstPage = data?.pages[0];
  const directories = data?.pages.flatMap((page) => page.directories) ?? [];
  const files = data?.pages.flatMap((page) => page.files) ?? [];

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
  };
}
