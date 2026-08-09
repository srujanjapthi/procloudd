import type { Types } from "mongoose";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import * as FileRepository from "@/modules/file/file.repository.js";
import * as UserRepository from "@/modules/user/user.repository.js";
import {
  toDirectoryProfile,
  resolveLocationNames,
} from "@/modules/directory/directory.service.js";
import { toFileProfile } from "@/modules/file/file.service.js";
import AppError from "@/common/error/app.error.js";
import * as Pagination from "@/common/pagination/pagination.util.js";
import type { ListStarredQuery } from "./starred.validator.js";

const DIRECTORY_SORT_FIELDS = {
  name: "name",
  updatedAt: "updatedAt",
  sizeInBytes: "sizeInBytes",
} as const;

const FILE_SORT_FIELDS = {
  name: "baseName",
  updatedAt: "updatedAt",
  sizeInBytes: "sizeInBytes",
} as const;

export async function listStarred(
  userId: Types.ObjectId,
  query: ListStarredQuery
) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const dirSort = {
    [DIRECTORY_SORT_FIELDS[query.sortBy]]: sortDirection,
    _id: 1,
  } as const;
  const fileSort = {
    [FILE_SORT_FIELDS[query.sortBy]]: sortDirection,
    _id: 1,
  } as const;
  const { skip, limit } = Pagination.toParams(query.page, query.limit);

  const [dirCount, fileCount] = await Promise.all([
    DirectoryRepository.countStarredDirectories(userId),
    FileRepository.countStarredFiles(userId),
  ]);

  const dirLimit = Math.max(0, Math.min(limit, dirCount - skip));
  const dirSkip = Math.min(skip, dirCount);
  const fileSkip = Math.max(0, skip - dirCount);
  const fileLimit = limit - dirLimit;

  const [directories, files] = await Promise.all([
    dirLimit > 0
      ? DirectoryRepository.listStarredDirectories(userId, {
          sort: dirSort,
          skip: dirSkip,
          limit: dirLimit,
        })
      : Promise.resolve([]),
    fileLimit > 0
      ? FileRepository.listStarredFiles(userId, {
          sort: fileSort,
          skip: fileSkip,
          limit: fileLimit,
        })
      : Promise.resolve([]),
  ]);

  const locations = await resolveLocationNames(
    userId,
    [
      ...directories.map((dir) => dir.parentDirId!),
      ...files.map((file) => file.parentDirId),
    ],
    user.storage.rootDirId
  );

  return {
    directories: directories.map((dir) => ({
      ...toDirectoryProfile(dir),
      location: locations.get(dir.parentDirId!.toString()) ?? "",
    })),
    files: files.map((file) => ({
      ...toFileProfile(file),
      location: locations.get(file.parentDirId.toString()) ?? "",
    })),
    meta: Pagination.buildPaginationMeta(
      query.page,
      query.limit,
      dirCount + fileCount
    ),
  };
}
