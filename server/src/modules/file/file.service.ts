import path from "node:path";
import mongoose from "mongoose";
import type { Types } from "mongoose";
import * as FileRepository from "./file.repository.js";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import * as UserRepository from "@/modules/user/user.repository.js";
import {
  assertOwnedActiveDirectory,
  assertQuotaAvailable,
  excludingRoot,
} from "@/modules/directory/directory.service.js";
import Storage from "@/services/storage.service.js";
import AppError from "@/common/error/app.error.js";
import * as Db from "@/common/lib/db.util.js";
import type {
  RequestUploadUrlBody,
  ConfirmUploadBody,
  CopyFileBody,
} from "./file.validator.js";
import type { FileProfile, LeanFileDocument } from "./file.interface.js";

function composeFileName(baseName: string, extension: string): string {
  return extension ? `${baseName}.${extension}` : baseName;
}

export function toFileProfile(file: LeanFileDocument): FileProfile {
  return {
    id: file._id.toString(),
    name: composeFileName(file.baseName, file.extension),
    baseName: file.baseName,
    extension: file.extension,
    sizeInBytes: file.sizeInBytes,
    mimeType: file.mimeType,
    parentDirId: file.parentDirId.toString(),
    starred: file.starred,
    ...(file.trashedAt !== undefined && { trashedAt: file.trashedAt }),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

async function assertOwnedActiveFile(
  userId: Types.ObjectId,
  id: Types.ObjectId
): Promise<LeanFileDocument> {
  const file = await FileRepository.findActiveById(userId, id);
  if (!file) {
    throw AppError.notFound("File not found");
  }
  return file;
}

export async function requestUploadUrl(
  userId: Types.ObjectId,
  input: RequestUploadUrlBody
): Promise<{ storageKey: string; uploadUrl: string }> {
  const parentId = new mongoose.Types.ObjectId(input.parentDirId);
  await assertOwnedActiveDirectory(userId, parentId);

  await assertQuotaAvailable(userId, input.sizeInBytes);

  const fileId = new mongoose.Types.ObjectId();
  const storageKey = Storage.buildKey(userId.toString(), fileId.toString());
  const uploadUrl = await Storage.getUploadUrl(storageKey, input.mimeType);

  return { storageKey, uploadUrl };
}

export async function confirmUpload(
  userId: Types.ObjectId,
  input: ConfirmUploadBody
): Promise<FileProfile> {
  const parentId = new mongoose.Types.ObjectId(input.parentDirId);
  const parent = await assertOwnedActiveDirectory(userId, parentId);

  const uploaded = await Storage.headObject(input.storageKey);
  if (!uploaded) {
    throw AppError.badRequest(
      "Upload not found. The file may not have finished uploading."
    );
  }

  try {
    await assertQuotaAvailable(userId, uploaded.sizeInBytes);
  } catch (error) {
    await Storage.deleteObject(input.storageKey);
    throw error;
  }

  const ancestorIds = [...parent.ancestorIds, parent._id];
  const rawExtension = path.extname(input.name);
  const extension = rawExtension.replace(/^\./, "");
  const baseName = path.basename(input.name, rawExtension);

  const file = await Db.withTransaction(async (session) => {
    const created = await FileRepository.create(
      {
        baseName,
        sizeInBytes: uploaded.sizeInBytes,
        extension,
        mimeType: input.mimeType,
        parentDirId: parentId,
        ancestorIds,
        userId,
        storageKey: input.storageKey,
        ...(input.checksum !== undefined && { checksum: input.checksum }),
      },
      session
    );
    await DirectoryRepository.adjustSizes(
      [parentId, ...ancestorIds],
      uploaded.sizeInBytes,
      session
    );
    return created;
  });

  return toFileProfile(file.toObject());
}

export async function getDownloadUrl(
  userId: Types.ObjectId,
  fileId: Types.ObjectId
): Promise<string> {
  const file = await assertOwnedActiveFile(userId, fileId);
  return Storage.getDownloadUrl(
    file.storageKey,
    composeFileName(file.baseName, file.extension)
  );
}

export async function getPreviewUrl(
  userId: Types.ObjectId,
  fileId: Types.ObjectId
): Promise<string> {
  const file = await assertOwnedActiveFile(userId, fileId);
  return Storage.getPreviewUrl(
    file.storageKey,
    composeFileName(file.baseName, file.extension)
  );
}

export async function renameFile(
  userId: Types.ObjectId,
  fileId: Types.ObjectId,
  name: string
): Promise<FileProfile> {
  await assertOwnedActiveFile(userId, fileId);
  const updated = await FileRepository.rename(fileId, name);
  return toFileProfile(updated!);
}

export async function moveFile(
  userId: Types.ObjectId,
  fileId: Types.ObjectId,
  newParentDirId: Types.ObjectId
): Promise<FileProfile> {
  const file = await assertOwnedActiveFile(userId, fileId);
  const newParent = await assertOwnedActiveDirectory(userId, newParentDirId);

  const oldAncestorIds = file.ancestorIds;
  const newAncestorIds = [...newParent.ancestorIds, newParent._id];

  await Db.withTransaction(async (session) => {
    await FileRepository.updateParent(
      fileId,
      newParentDirId,
      newAncestorIds,
      session
    );
    if (file.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        [file.parentDirId, ...oldAncestorIds],
        -file.sizeInBytes,
        session
      );
      await DirectoryRepository.adjustSizes(
        [newParentDirId, ...newParent.ancestorIds],
        file.sizeInBytes,
        session
      );
    }
  });

  const updated = await FileRepository.findActiveById(userId, fileId);
  return toFileProfile(updated!);
}

export async function trashFile(
  userId: Types.ObjectId,
  fileId: Types.ObjectId
): Promise<void> {
  const file = await assertOwnedActiveFile(userId, fileId);

  await Db.withTransaction(async (session) => {
    await FileRepository.trash(userId, fileId, session);
    if (file.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        excludingRoot(
          [file.parentDirId, ...file.ancestorIds],
          file.ancestorIds[0]!
        ),
        -file.sizeInBytes,
        session
      );
    }
  });
}

export async function restoreFile(
  userId: Types.ObjectId,
  fileId: Types.ObjectId
): Promise<FileProfile> {
  const file = await FileRepository.findTrashRootById(userId, fileId);
  if (!file) {
    throw AppError.notFound(
      "File not found in trash. It may have already been restored or permanently deleted."
    );
  }

  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const originalParent = await DirectoryRepository.findActiveById(
    userId,
    file.parentDirId
  );
  const parent =
    originalParent ??
    (await DirectoryRepository.findActiveById(userId, user.storage.rootDirId))!;
  const newAncestorIds = [...parent.ancestorIds, parent._id];

  await Db.withTransaction(async (session) => {
    await FileRepository.restore(
      userId,
      fileId,
      parent._id,
      newAncestorIds,
      session
    );
    if (file.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        excludingRoot([parent._id, ...newAncestorIds], user.storage.rootDirId),
        file.sizeInBytes,
        session
      );
    }
  });

  const restored = await FileRepository.findActiveById(userId, fileId);
  return toFileProfile(restored!);
}

export async function hardDeleteFile(
  userId: Types.ObjectId,
  fileId: Types.ObjectId
): Promise<void> {
  const file = await FileRepository.findTrashedById(userId, fileId);
  if (!file) {
    throw AppError.notFound(
      "File not found in trash. It must be moved to trash before it can be permanently deleted."
    );
  }

  await Db.withTransaction(async (session) => {
    await FileRepository.hardDelete(fileId, session);
    if (file.sizeInBytes > 0) {
      await DirectoryRepository.adjustSizes(
        [file.ancestorIds[0]!],
        -file.sizeInBytes,
        session
      );
    }
  });

  await Storage.deleteObject(file.storageKey);
}

export async function copyFile(
  userId: Types.ObjectId,
  fileId: Types.ObjectId,
  override: CopyFileBody
): Promise<FileProfile> {
  const source = await assertOwnedActiveFile(userId, fileId);

  const destinationParentId = override.parentDirId
    ? new mongoose.Types.ObjectId(override.parentDirId)
    : source.parentDirId;
  const destinationParent = await assertOwnedActiveDirectory(
    userId,
    destinationParentId
  );

  await assertQuotaAvailable(userId, source.sizeInBytes);

  const newFileId = new mongoose.Types.ObjectId();
  const newStorageKey = Storage.buildKey(
    userId.toString(),
    newFileId.toString()
  );
  await Storage.copyObject(source.storageKey, newStorageKey);

  const ancestorIds = [...destinationParent.ancestorIds, destinationParent._id];

  const created = await Db.withTransaction(async (session) => {
    const file = await FileRepository.create(
      {
        baseName: override.name ?? `Copy of ${source.baseName}`,
        sizeInBytes: source.sizeInBytes,
        extension: source.extension,
        mimeType: source.mimeType,
        parentDirId: destinationParentId,
        ancestorIds,
        userId,
        storageKey: newStorageKey,
      },
      session
    );
    await DirectoryRepository.adjustSizes(
      [destinationParentId, ...destinationParent.ancestorIds],
      source.sizeInBytes,
      session
    );
    return file;
  });

  return toFileProfile(created.toObject());
}
