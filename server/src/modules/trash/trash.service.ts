import type { Types } from "mongoose";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import * as FileRepository from "@/modules/file/file.repository.js";
import * as UserRepository from "@/modules/user/user.repository.js";
import { toDirectoryProfile } from "@/modules/directory/directory.service.js";
import { toFileProfile } from "@/modules/file/file.service.js";
import Storage from "@/services/storage.service.js";
import AppError from "@/common/error/app.error.js";
import * as Db from "@/common/lib/db.util.js";
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

export async function emptyTrash(userId: Types.ObjectId): Promise<void> {
  const [allDirs, allFiles, trashedFiles] = await Promise.all([
    DirectoryRepository.findAllTrashRootDirectories(userId),
    FileRepository.findAllTrashRootFiles(userId),
    FileRepository.findAllTrashedFiles(userId),
  ]);

  if (allDirs.length === 0 && allFiles.length === 0) {
    return;
  }

  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const dirRootIds = new Set(allDirs.map((dir) => dir._id.toString()));
  const isNestedUnderAnotherRoot = (ancestorIds: Types.ObjectId[]): boolean =>
    ancestorIds.some((id) => dirRootIds.has(id.toString()));

  const freedBytes =
    allDirs
      .filter((dir) => !isNestedUnderAnotherRoot(dir.ancestorIds))
      .reduce((total, dir) => total + dir.sizeInBytes, 0) +
    allFiles
      .filter((file) => !isNestedUnderAnotherRoot(file.ancestorIds))
      .reduce((total, file) => total + file.sizeInBytes, 0);

  await Db.withTransaction(async (session) => {
    await DirectoryRepository.deleteAllTrashed(userId, session);
    await FileRepository.deleteAllTrashed(userId, session);
    if (freedBytes > 0) {
      await DirectoryRepository.adjustSizes(
        [user.storage.rootDirId],
        -freedBytes,
        session
      );
    }
  });

  await Storage.deleteObjects(trashedFiles.map((file) => file.storageKey));
}
