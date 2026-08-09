import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY } from "@/modules/auth/queries";
import { STORAGE_OVERVIEW_QUERY_KEY } from "@/modules/dashboard/queries";
import * as FilesApi from "./api";
import type { DirectoryContents } from "./types";
import type { DriveSortBy, DriveSortOrder } from "./hooks/useDriveSort";

export const FILES_QUERY_KEY = ["files", "contents"];
export const STARRED_QUERY_KEY = ["files", "starred"];
export const RECENT_QUERY_KEY = ["files", "recent"];

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

export function useDirectoryPickerQuery(dirId: string, enabled: boolean) {
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
    enabled: enabled && Boolean(dirId),
    placeholderData: keepPreviousData,
  });
}

export function useInvalidateFiles() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
  };
}

export function useInvalidateStorageUsage() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    void queryClient.invalidateQueries({
      queryKey: STORAGE_OVERVIEW_QUERY_KEY,
    });
  };
}

function useInvalidateFilesAndUsage() {
  const invalidateFiles = useInvalidateFiles();
  const invalidateUsage = useInvalidateStorageUsage();
  return () => {
    invalidateFiles();
    invalidateUsage();
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

export function setStarredInContentsCache<
  T extends {
    directories?: { id: string; starred: boolean }[];
    files?: { id: string; starred: boolean }[];
  },
>(
  old: InfiniteData<T> | undefined,
  type: "directory" | "file",
  id: string,
  starred: boolean,
  options: { dropUnstarred?: boolean } = {}
): InfiniteData<T> | undefined {
  if (!old) {
    return old;
  }
  const key = type === "directory" ? "directories" : "files";
  return {
    ...old,
    pages: old.pages.map((page) => {
      const entries = page[key];
      if (!entries) {
        return page;
      }
      return {
        ...page,
        [key]:
          options.dropUnstarred && !starred
            ? entries.filter((entry) => entry.id !== id)
            : entries.map((entry) =>
                entry.id === id ? { ...entry, starred } : entry
              ),
      };
    }),
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

const STARRABLE_QUERY_KEYS = [
  FILES_QUERY_KEY,
  STARRED_QUERY_KEY,
  RECENT_QUERY_KEY,
];

type StarVariables = { id: string; starred: boolean };
type StarSnapshot = [QueryKey, InfiniteData<DirectoryContents> | undefined][];

function useStarMutationOptions(type: "directory" | "file") {
  const queryClient = useQueryClient();

  return {
    onMutate: async ({ id, starred }: StarVariables) => {
      await Promise.all(
        STARRABLE_QUERY_KEYS.map((queryKey) =>
          queryClient.cancelQueries({ queryKey })
        )
      );

      const snapshot: StarSnapshot = STARRABLE_QUERY_KEYS.flatMap((queryKey) =>
        queryClient.getQueriesData<InfiniteData<DirectoryContents>>({
          queryKey,
        })
      );

      for (const queryKey of STARRABLE_QUERY_KEYS) {
        queryClient.setQueriesData<InfiniteData<DirectoryContents>>(
          { queryKey },
          (old) =>
            setStarredInContentsCache(old, type, id, starred, {
              dropUnstarred: queryKey === STARRED_QUERY_KEY,
            })
        );
      }

      return { snapshot };
    },
    onError: (
      _error: unknown,
      _variables: StarVariables,
      context: { snapshot: StarSnapshot } | undefined
    ) => {
      for (const [queryKey, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STARRED_QUERY_KEY });
    },
  };
}

export function useSetDirectoryStarredMutation() {
  const options = useStarMutationOptions("directory");
  return useMutation({
    mutationFn: ({ id, starred }: StarVariables) =>
      FilesApi.setDirectoryStarred(id, starred),
    ...options,
  });
}

export function useSetFileStarredMutation() {
  const options = useStarMutationOptions("file");
  return useMutation({
    mutationFn: ({ id, starred }: StarVariables) =>
      FilesApi.setFileStarred(id, starred),
    ...options,
  });
}

export function useFilePreviewUrlQuery(fileId: string | null) {
  return useQuery({
    queryKey: ["files", "previewUrl", fileId],
    queryFn: () => FilesApi.getFilePreviewUrl(fileId!),
    enabled: fileId !== null,
  });
}
