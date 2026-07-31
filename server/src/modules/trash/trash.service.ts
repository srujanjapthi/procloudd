import type { Types } from "mongoose";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import * as FileRepository from "@/modules/file/file.repository.js";
import { toDirectoryProfile } from "@/modules/directory/directory.service.js";
import { toFileProfile } from "@/modules/file/file.service.js";
import * as Pagination from "@/common/pagination/pagination.util.js";
import type { ListTrashQuery } from "./trash.validator.js";

const DIRECTORY_TRASH_SORT_FIELDS = {
  name: "name",
  trashedAt: "trashedAt",
  sizeInBytes: "sizeInBytes",
} as const;

const FILE_TRASH_SORT_FIELDS = {
  name: "baseName",
  trashedAt: "trashedAt",
  sizeInBytes: "sizeInBytes",
} as const;

export async function listTrash(userId: Types.ObjectId, query: ListTrashQuery) {
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const dirSort = {
    [DIRECTORY_TRASH_SORT_FIELDS[query.sortBy]]: sortDirection,
    _id: 1,
  } as const;
  const fileSort = {
    [FILE_TRASH_SORT_FIELDS[query.sortBy]]: sortDirection,
    _id: 1,
  } as const;
  const { skip, limit } = Pagination.toParams(query.page, query.limit);

  const [dirCount, fileCount] = await Promise.all([
    DirectoryRepository.countTrashRootDirectories(userId),
    FileRepository.countTrashRootFiles(userId),
  ]);

  const dirLimit = Math.max(0, Math.min(limit, dirCount - skip));
  const dirSkip = Math.min(skip, dirCount);
  const fileSkip = Math.max(0, skip - dirCount);
  const fileLimit = limit - dirLimit;

  const [directories, files] = await Promise.all([
    dirLimit > 0
      ? DirectoryRepository.listTrashRootDirectories(userId, {
          sort: dirSort,
          skip: dirSkip,
          limit: dirLimit,
        })
      : Promise.resolve([]),
    fileLimit > 0
      ? FileRepository.listTrashRootFiles(userId, {
          sort: fileSort,
          skip: fileSkip,
          limit: fileLimit,
        })
      : Promise.resolve([]),
  ]);

  return {
    directories: directories.map(toDirectoryProfile),
    files: files.map(toFileProfile),
    meta: Pagination.buildPaginationMeta(
      query.page,
      query.limit,
      dirCount + fileCount
    ),
  };
}
