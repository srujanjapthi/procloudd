import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY } from "@/modules/auth/queries";
import * as FilesApi from "./api";
import type { DirectoryContents } from "./types";
import type { DriveSortBy, DriveSortOrder } from "./hooks/useDriveSort";

export const FILES_QUERY_KEY = ["files", "contents"];

export function directoryContentsQueryKey(dirId: string) {
  return [...FILES_QUERY_KEY, dirId];
}

export function useDirectoryContentsQuery(
  dirId: string,
  sortBy: DriveSortBy,
  sortOrder: DriveSortOrder
) {
  return useInfiniteQuery({
    queryKey: [...directoryContentsQueryKey(dirId), sortBy, sortOrder],
    queryFn: ({ pageParam }) =>
      FilesApi.getDirectoryContents(dirId, pageParam, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: Boolean(dirId),
    placeholderData: keepPreviousData,
  });
}

export function useDirectoryPickerQuery(dirId: string) {
  return useInfiniteQuery({
    queryKey: [...directoryContentsQueryKey(dirId), "picker"],
    queryFn: ({ pageParam }) =>
      FilesApi.getDirectoryContents(dirId, pageParam, "name", "asc"),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.directories.length > 0 &&
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: Boolean(dirId),
    placeholderData: keepPreviousData,
  });
}

export function useInvalidateFiles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.removeQueries({
      queryKey: FILES_QUERY_KEY,
      predicate: (query) => !query.isActive(),
    });
    void queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
  };
}

function useInvalidateFilesAndUsage() {
  const invalidateFiles = useInvalidateFiles();
  const queryClient = useQueryClient();
  return () => {
    invalidateFiles();
    void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
  };
}

export function useCreateDirectoryMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: FilesApi.createDirectory,
    onSuccess: invalidate,
  });
}

export function useRenameDirectoryMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({ dirId, name }: { dirId: string; name: string }) =>
      FilesApi.renameDirectory(dirId, name),
    onSuccess: invalidate,
  });
}

export function useMoveDirectoryMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({
      dirId,
      parentDirId,
    }: {
      dirId: string;
      parentDirId: string;
    }) => FilesApi.moveDirectory(dirId, parentDirId),
    onSuccess: invalidate,
  });
}

export function useDuplicateDirectoryMutation() {
  const invalidate = useInvalidateFilesAndUsage();
  return useMutation({
    mutationFn: ({ dirId }: { dirId: string }) =>
      FilesApi.duplicateDirectory(dirId, {}),
    onSuccess: invalidate,
  });
}

export function removeFromContentsCache<
  T extends { directories: { id: string }[]; files: { id: string }[] },
>(
  old: InfiniteData<T> | undefined,
  type: "directory" | "file",
  id: string
): InfiniteData<T> | undefined {
  if (!old) {
    return old;
  }
  return {
    ...old,
    pages: old.pages.map((page) =>
      type === "directory"
        ? {
            ...page,
            directories: page.directories.filter((dir) => dir.id !== id),
          }
        : {
            ...page,
            files: page.files.filter((file) => file.id !== id),
          }
    ),
  };
}

export function useTrashDirectoryMutation(dirId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateFiles();
  const queryKey = directoryContentsQueryKey(dirId);

  return useMutation({
    mutationFn: FilesApi.trashDirectory,
    onMutate: async (trashedId) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueriesData<InfiniteData<DirectoryContents>>(
        { queryKey },
        (old) => removeFromContentsCache(old, "directory", trashedId)
      );
    },
    onError: invalidate,
    onSettled: invalidate,
  });
}

export function useTrashFileMutation(dirId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateFiles();
  const queryKey = directoryContentsQueryKey(dirId);

  return useMutation({
    mutationFn: FilesApi.trashFile,
    onMutate: async (trashedId) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueriesData<InfiniteData<DirectoryContents>>(
        { queryKey },
        (old) => removeFromContentsCache(old, "file", trashedId)
      );
    },
    onError: invalidate,
    onSettled: invalidate,
  });
}

export function useRenameFileMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({ fileId, name }: { fileId: string; name: string }) =>
      FilesApi.renameFile(fileId, name),
    onSuccess: invalidate,
  });
}

export function useMoveFileMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({
      fileId,
      parentDirId,
    }: {
      fileId: string;
      parentDirId: string;
    }) => FilesApi.moveFile(fileId, parentDirId),
    onSuccess: invalidate,
  });
}

export function useCopyFileMutation() {
  const invalidate = useInvalidateFilesAndUsage();
  return useMutation({
    mutationFn: ({ fileId }: { fileId: string }) =>
      FilesApi.copyFile(fileId, {}),
    onSuccess: invalidate,
  });
}

export function useFilePreviewUrlQuery(fileId: string | null) {
  return useQuery({
    queryKey: ["files", "previewUrl", fileId],
    queryFn: () => FilesApi.getFilePreviewUrl(fileId!),
    enabled: fileId !== null,
  });
}
