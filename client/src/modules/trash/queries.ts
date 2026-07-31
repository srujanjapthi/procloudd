import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import * as DriveApi from "@/modules/drive/api";
import {
  useInvalidateFiles,
  removeFromContentsCache,
} from "@/modules/drive/queries";
import { CURRENT_USER_QUERY_KEY } from "@/modules/auth/queries";
import * as TrashApi from "./api";
import type { TrashContents } from "./types";
import type { TrashSortBy, TrashSortOrder } from "./hooks/useTrashSort";

export const TRASH_QUERY_KEY = ["files", "trash"];

export function useTrashQuery(sortBy: TrashSortBy, sortOrder: TrashSortOrder) {
  return useInfiniteQuery({
    queryKey: [...TRASH_QUERY_KEY, sortBy, sortOrder],
    queryFn: ({ pageParam }) => TrashApi.getTrash(pageParam, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTrash() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: TRASH_QUERY_KEY });
  };
}

export function useRestoreDirectoryMutation() {
  const queryClient = useQueryClient();
  const invalidateFiles = useInvalidateFiles();
  const invalidateTrash = useInvalidateTrash();

  return useMutation({
    mutationFn: DriveApi.restoreDirectory,
    onMutate: async (dirId) => {
      await queryClient.cancelQueries({ queryKey: TRASH_QUERY_KEY });
      queryClient.setQueriesData<InfiniteData<TrashContents>>(
        { queryKey: TRASH_QUERY_KEY },
        (old) => removeFromContentsCache(old, "directory", dirId)
      );
    },
    onError: invalidateTrash,
    onSettled: () => {
      invalidateTrash();
      invalidateFiles();
    },
  });
}

export function useRestoreFileMutation() {
  const queryClient = useQueryClient();
  const invalidateFiles = useInvalidateFiles();
  const invalidateTrash = useInvalidateTrash();

  return useMutation({
    mutationFn: DriveApi.restoreFile,
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: TRASH_QUERY_KEY });
      queryClient.setQueriesData<InfiniteData<TrashContents>>(
        { queryKey: TRASH_QUERY_KEY },
        (old) => removeFromContentsCache(old, "file", fileId)
      );
    },
    onError: invalidateTrash,
    onSettled: () => {
      invalidateTrash();
      invalidateFiles();
    },
  });
}

export function useHardDeleteDirectoryMutation() {
  const queryClient = useQueryClient();
  const invalidateTrash = useInvalidateTrash();

  return useMutation({
    mutationFn: DriveApi.hardDeleteDirectory,
    onMutate: async (dirId) => {
      await queryClient.cancelQueries({ queryKey: TRASH_QUERY_KEY });
      queryClient.setQueriesData<InfiniteData<TrashContents>>(
        { queryKey: TRASH_QUERY_KEY },
        (old) => removeFromContentsCache(old, "directory", dirId)
      );
    },
    onError: invalidateTrash,
    onSettled: () => {
      invalidateTrash();
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

export function useEmptyTrashMutation() {
  const queryClient = useQueryClient();
  const invalidateTrash = useInvalidateTrash();

  return useMutation({
    mutationFn: TrashApi.emptyTrash,
    onSuccess: () => {
      invalidateTrash();
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

export function useHardDeleteFileMutation() {
  const queryClient = useQueryClient();
  const invalidateTrash = useInvalidateTrash();

  return useMutation({
    mutationFn: DriveApi.hardDeleteFile,
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: TRASH_QUERY_KEY });
      queryClient.setQueriesData<InfiniteData<TrashContents>>(
        { queryKey: TRASH_QUERY_KEY },
        (old) => removeFromContentsCache(old, "file", fileId)
      );
    },
    onError: invalidateTrash,
    onSettled: () => {
      invalidateTrash();
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}
