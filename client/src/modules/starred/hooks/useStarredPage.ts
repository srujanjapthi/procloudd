import { useFilePreview } from "@/modules/drive/hooks/useFilePreview";
import { useStarredQuery } from "../queries";
import { useStarredSort } from "./useStarredSort";

export function useStarredPage() {
  const { sortBy, setSortBy, sortOrder, toggleSortOrder } = useStarredSort();

  const {
    data,
    isLoading,
    isPlaceholderData,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStarredQuery(sortBy, sortOrder);

  const firstPage = data?.pages[0];
  const directories = data?.pages.flatMap((page) => page.directories) ?? [];
  const files = data?.pages.flatMap((page) => page.files) ?? [];
  const filePreview = useFilePreview(files, isLoading, Boolean(hasNextPage));

  return {
    directories,
    files,
    isLoading,
    isPlaceholderData,
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
    ...filePreview,
  };
}
