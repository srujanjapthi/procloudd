import { useParams } from "react-router";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { useDirectoryContentsQuery } from "../queries";
import { useDriveSort } from "./useDriveSort";

export function useDrivePage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const { user } = useAuth();
  const dirId = folderId ?? user?.storage.rootDirId ?? "";
  const { sortBy, setSortBy, sortOrder, toggleSortOrder } = useDriveSort();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDirectoryContentsQuery(dirId, sortBy, sortOrder);

  const firstPage = data?.pages[0];
  const directories = data?.pages.flatMap((page) => page.directories) ?? [];
  const files = data?.pages.flatMap((page) => page.files) ?? [];

  return {
    dirId,
    isRoot: dirId === user?.storage.rootDirId,
    breadcrumb: firstPage?.breadcrumb ?? [],
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
