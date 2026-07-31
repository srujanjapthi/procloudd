import mongoose from "mongoose";
import type { Types } from "mongoose";
import * as DirectoryRepository from "./directory.repository.js";
import * as FileRepository from "@/modules/file/file.repository.js";
import * as UserRepository from "@/modules/user/user.repository.js";
import Storage from "@/services/storage.service.js";
import AppError from "@/common/error/app.error.js";
import * as Db from "@/common/lib/db.util.js";
import * as Pagination from "@/common/pagination/pagination.util.js";
import type {
  CreateDirectoryBody,
  DuplicateDirectoryBody,
  ListDirectoryContentsQuery,
} from "./directory.validator.js";
import type {
  DirectoryProfile,
  LeanDirectoryDocument,
  BreadcrumbEntry,
} from "./directory.interface.js";
import { toFileProfile } from "@/modules/file/file.service.js";

const DIRECTORY_SORT_FIELDS = {
  name: "name",
  createdAt: "createdAt",
  sizeInBytes: "sizeInBytes",
} as const;

const FILE_SORT_FIELDS = {
  name: "baseName",
  createdAt: "createdAt",
  sizeInBytes: "sizeInBytes",
} as const;

function toDirectoryProfile(dir: LeanDirectoryDocument): DirectoryProfile {
  return {
    id: dir._id.toString(),
    name: dir.name,
    parentDirId: dir.parentDirId ? dir.parentDirId.toString() : null,
    sizeInBytes: dir.sizeInBytes,
    starred: dir.starred,
    createdAt: dir.createdAt,
    updatedAt: dir.updatedAt,
  };
}

export async function assertOwnedActiveDirectory(
  userId: Types.ObjectId,
  id: Types.ObjectId
): Promise<LeanDirectoryDocument> {
  const dir = await DirectoryRepository.findActiveById(userId, id);
  if (!dir) {
    throw AppError.notFound("Directory not found");
  }
  return dir;
}

function assertNotRoot(dir: LeanDirectoryDocument): void {
  if (dir.parentDirId === null) {
    throw AppError.badRequest("The root directory cannot be modified.");
  }
}

export function excludingRoot(
  ids: Types.ObjectId[],
  rootId: Types.ObjectId
): Types.ObjectId[] {
  return ids.filter((id) => !id.equals(rootId));
}

export async function assertQuotaAvailable(
  userId: Types.ObjectId,
  additionalBytes: number
): Promise<void> {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  const rootDir = await DirectoryRepository.findActiveById(
    userId,
    user.storage.rootDirId
  );
  const usedBytes = rootDir?.sizeInBytes ?? 0;
  if (usedBytes + additionalBytes > user.storage.maxStorageInBytes) {
    throw AppError.badRequest("Not enough storage space available.");
  }
}

export async function createDirectory(
  userId: Types.ObjectId,
  input: CreateDirectoryBody
): Promise<DirectoryProfile> {
  const parentId = new mongoose.Types.ObjectId(input.parentDirId);
  const parent = await assertOwnedActiveDirectory(userId, parentId);

  const dir = await DirectoryRepository.create({
    name: input.name,
    userId,
    parentDirId: parentId,
    ancestorIds: [...parent.ancestorIds, parent._id],
  });

  return toDirectoryProfile(dir.toObject());
}

async function buildBreadcrumb(
  userId: Types.ObjectId,
  dir: LeanDirectoryDocument
): Promise<BreadcrumbEntry[]> {
  const chain = [...dir.ancestorIds, dir._id];
  const entries = await DirectoryRepository.findNamesByIds(userId, chain);
  const namesById = new Map(
    entries.map((entry) => [entry._id.toString(), entry.name])
  );
  return chain.map((id) => ({
    id: id.toString(),
    name: namesById.get(id.toString()) ?? "",
  }));
}

export async function listContents(
  userId: Types.ObjectId,
  dirId: Types.ObjectId,
  query: ListDirectoryContentsQuery
) {
  const dir = await assertOwnedActiveDirectory(userId, dirId);
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

  const [dirCount, fileCount, breadcrumb] = await Promise.all([
    DirectoryRepository.countActiveChildDirectories(userId, dirId),
    DirectoryRepository.countActiveFiles(userId, dirId),
    buildBreadcrumb(userId, dir),
  ]);

  const dirLimit = Math.max(0, Math.min(limit, dirCount - skip));
  const dirSkip = Math.min(skip, dirCount);
  const fileSkip = Math.max(0, skip - dirCount);
  const fileLimit = limit - dirLimit;

  const [subdirectories, files] = await Promise.all([
    dirLimit > 0
      ? DirectoryRepository.listActiveChildDirectories(userId, dirId, {
          sort: dirSort,
          skip: dirSkip,
          limit: dirLimit,
        })
      : Promise.resolve([]),
    fileLimit > 0
      ? DirectoryRepository.listActiveFiles(userId, {
          parentDirId: dirId,
          skip: fileSkip,
          limit: fileLimit,
          sort: fileSort,
        })
      : Promise.resolve([]),
  ]);

  return {
    breadcrumb,
    directories: subdirectories.map(toDirectoryProfile),
    files: files.map(toFileProfile),
    meta: Pagination.buildPaginationMeta(
      query.page,
      query.limit,
      dirCount + fileCount
    ),
  };
}

export async function renameDirectory(
  userId: Types.ObjectId,
  dirId: Types.ObjectId,
  name: string
): Promise<DirectoryProfile> {
  const dir = await assertOwnedActiveDirectory(userId, dirId);
  assertNotRoot(dir);

  const updated = await DirectoryRepository.rename(dirId, name);
  return toDirectoryProfile(updated!);
}

export async function moveDirectory(
  userId: Types.ObjectId,
  dirId: Types.ObjectId,
  newParentDirId: Types.ObjectId
): Promise<DirectoryProfile> {
  const dir = await assertOwnedActiveDirectory(userId, dirId);
  assertNotRoot(dir);

  const newParent = await assertOwnedActiveDirectory(userId, newParentDirId);

  if (
    newParent._id.equals(dirId) ||
    newParent.ancestorIds.some((id) => id.equals(dirId))
  ) {
    throw AppError.badRequest(
      "Cannot move a directory into itself or one of its own subdirectories."
    );
  }

  const oldAncestorIds = dir.ancestorIds;
  const newAncestorIds = [...newParent.ancestorIds, newParent._id];

  await Db.withTransaction(async (session) => {
    await DirectoryRepository.updateParent(
      dirId,
      newParentDirId,
      newAncestorIds,
      session
    );
    await DirectoryRepository.cascadeAncestorIdsOnMove(
      dirId,
      oldAncestorIds,
      newAncestorIds,
      session
    );
    if (dir.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        [dir.parentDirId!, ...oldAncestorIds],
        -dir.sizeInBytes,
        session
      );
      await DirectoryRepository.adjustSizes(
        [newParentDirId, ...newParent.ancestorIds],
        dir.sizeInBytes,
        session
      );
    }
  });

  const updated = await DirectoryRepository.findActiveById(userId, dirId);
  return toDirectoryProfile(updated!);
}

export async function trashDirectory(
  userId: Types.ObjectId,
  dirId: Types.ObjectId
): Promise<void> {
  const dir = await assertOwnedActiveDirectory(userId, dirId);
  assertNotRoot(dir);

  await Db.withTransaction(async (session) => {
    await DirectoryRepository.trashWithCascade(userId, dirId, session);
    if (dir.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        excludingRoot(
          [dir.parentDirId!, ...dir.ancestorIds],
          dir.ancestorIds[0]!
        ),
        -dir.sizeInBytes,
        session
      );
    }
  });
}

export async function hardDeleteDirectory(
  userId: Types.ObjectId,
  dirId: Types.ObjectId
): Promise<void> {
  const dir = await DirectoryRepository.findTrashedById(userId, dirId);
  if (!dir) {
    throw AppError.notFound(
      "Directory not found in trash. It must be moved to trash before it can be permanently deleted."
    );
  }

  const { deletedFileStorageKeys } = await Db.withTransaction(
    async (session) => {
      const result = await DirectoryRepository.hardDeleteWithCascade(
        userId,
        dirId,
        session
      );
      if (dir.sizeInBytes > 0) {
        await DirectoryRepository.adjustSizes(
          [dir.ancestorIds[0]!],
          -dir.sizeInBytes,
          session
        );
      }
      return result;
    }
  );

  await Storage.deleteObjects(deletedFileStorageKeys);
}

export async function duplicateDirectory(
  userId: Types.ObjectId,
  dirId: Types.ObjectId,
  override: DuplicateDirectoryBody
): Promise<DirectoryProfile> {
  const source = await assertOwnedActiveDirectory(userId, dirId);
  assertNotRoot(source);

  const destinationParentId = override.parentDirId
    ? new mongoose.Types.ObjectId(override.parentDirId)
    : source.parentDirId!;
  const destinationParent = await assertOwnedActiveDirectory(
    userId,
    destinationParentId
  );

  await assertQuotaAvailable(userId, source.sizeInBytes);

  const [descendantDirs, descendantFiles] =
    await DirectoryRepository.findDescendants(userId, dirId);

  const dirIdMap = new Map<string, Types.ObjectId>();
  const newRootId = new mongoose.Types.ObjectId();
  dirIdMap.set(dirId.toString(), newRootId);

  const newAncestorIdsFor = (
    oldAncestorIds: Types.ObjectId[]
  ): Types.ObjectId[] => {
    const splitIndex = oldAncestorIds.findIndex((id) => id.equals(dirId));
    const relativeChain = oldAncestorIds.slice(splitIndex + 1);
    const mapped = relativeChain.map((id) => dirIdMap.get(id.toString())!);
    return [
      ...destinationParent.ancestorIds,
      destinationParent._id,
      newRootId,
      ...mapped,
    ];
  };

  const sortedDirs = [...descendantDirs].sort(
    (a, b) => a.ancestorIds.length - b.ancestorIds.length
  );

  const newDirDocs = [
    {
      _id: newRootId,
      name: override.name ?? `Copy of ${source.name}`,
      sizeInBytes: source.sizeInBytes,
      userId,
      parentDirId: destinationParentId,
      ancestorIds: [...destinationParent.ancestorIds, destinationParent._id],
    },
    ...sortedDirs.map((oldDir) => {
      const newId = new mongoose.Types.ObjectId();
      dirIdMap.set(oldDir._id.toString(), newId);
      const newParentId = dirIdMap.get(oldDir.parentDirId!.toString())!;
      return {
        _id: newId,
        name: oldDir.name,
        sizeInBytes: oldDir.sizeInBytes,
        userId,
        parentDirId: newParentId,
        ancestorIds: newAncestorIdsFor(oldDir.ancestorIds),
      };
    }),
  ];

  const newFileDocs = await Promise.all(
    descendantFiles.map(async (oldFile) => {
      const newFileId = new mongoose.Types.ObjectId();
      const newParentId = dirIdMap.get(oldFile.parentDirId.toString())!;
      const newStorageKey = Storage.buildKey(
        userId.toString(),
        newFileId.toString()
      );
      await Storage.copyObject(oldFile.storageKey, newStorageKey);
      return {
        _id: newFileId,
        baseName: oldFile.baseName,
        sizeInBytes: oldFile.sizeInBytes,
        extension: oldFile.extension,
        mimeType: oldFile.mimeType,
        userId,
        parentDirId: newParentId,
        ancestorIds: newAncestorIdsFor(oldFile.ancestorIds),
        storageKey: newStorageKey,
      };
    })
  );

  await Db.withTransaction(async (session) => {
    await DirectoryRepository.createMany(newDirDocs, session);
    await FileRepository.createMany(newFileDocs, session);
    if (source.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        [destinationParentId, ...destinationParent.ancestorIds],
        source.sizeInBytes,
        session
      );
    }
  });

  const created = await DirectoryRepository.findActiveById(userId, newRootId);
  return toDirectoryProfile(created!);
}
