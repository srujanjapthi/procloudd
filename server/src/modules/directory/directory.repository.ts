import type { ClientSession, SortOrder, Types } from "mongoose";
import Directory from "@/models/directory.model.js";
import File from "@/models/file.model.js";
import * as Db from "@/common/lib/db.util.js";
import type {
  CreateDirectoryInput,
  ListActiveFilesOptions,
} from "./directory.interface.js";

export async function createRoot(
  userId: Types.ObjectId,
  session: ClientSession
) {
  const [directory] = await Directory.create(
    [{ name: "root", userId, parentDirId: null, ancestorIds: [] }],
    { session }
  );
  return directory!;
}

export async function create(
  input: CreateDirectoryInput,
  session: ClientSession | null = null
) {
  const [directory] = await Directory.create(
    [
      {
        name: input.name,
        userId: input.userId,
        parentDirId: input.parentDirId,
        ancestorIds: input.ancestorIds,
      },
    ],
    Db.sessionOption(session)
  );
  return directory!;
}

export async function createMany(
  docs: Array<{
    _id: Types.ObjectId;
    name: string;
    sizeInBytes: number;
    userId: Types.ObjectId;
    parentDirId: Types.ObjectId;
    ancestorIds: Types.ObjectId[];
  }>,
  session: ClientSession
): Promise<void> {
  if (docs.length === 0) {
    return;
  }
  await Directory.create(docs, { session, ordered: true });
}

export function findActiveById(userId: Types.ObjectId, id: Types.ObjectId) {
  return Directory.findOne({ _id: id, userId, status: "active" }).lean();
}

export function findTrashedById(userId: Types.ObjectId, id: Types.ObjectId) {
  return Directory.findOne({ _id: id, userId, status: "trashed" }).lean();
}

export function findTrashRootById(userId: Types.ObjectId, id: Types.ObjectId) {
  return Directory.findOne({
    _id: id,
    userId,
    status: "trashed",
    trashedAt: { $exists: true },
  }).lean();
}

export function findNamesByIds(userId: Types.ObjectId, ids: Types.ObjectId[]) {
  return Directory.find({ userId, _id: { $in: ids } })
    .select("_id name")
    .lean();
}

export function listActiveChildDirectories(
  userId: Types.ObjectId,
  parentDirId: Types.ObjectId,
  options: { sort: Record<string, SortOrder>; skip: number; limit: number }
) {
  return Directory.find({ userId, parentDirId, status: "active" })
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .lean();
}

export function countActiveChildDirectories(
  userId: Types.ObjectId,
  parentDirId: Types.ObjectId
) {
  return Directory.countDocuments({ userId, parentDirId, status: "active" });
}

export function listTrashRootDirectories(
  userId: Types.ObjectId,
  options: { sort: Record<string, SortOrder>; skip: number; limit: number }
) {
  return Directory.find({
    userId,
    status: "trashed",
    trashedAt: { $exists: true },
  })
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .lean();
}

export function countTrashRootDirectories(userId: Types.ObjectId) {
  return Directory.countDocuments({
    userId,
    status: "trashed",
    trashedAt: { $exists: true },
  });
}

export function findAllTrashRootDirectories(userId: Types.ObjectId) {
  return Directory.find({
    userId,
    status: "trashed",
    trashedAt: { $exists: true },
  }).lean();
}

export async function rename(
  id: Types.ObjectId,
  name: string,
  session: ClientSession | null = null
) {
  return Directory.findOneAndUpdate(
    { _id: id },
    { $set: { name } },
    { returnDocument: "after", ...Db.sessionOption(session) }
  ).lean();
}

export async function updateParent(
  id: Types.ObjectId,
  parentDirId: Types.ObjectId,
  ancestorIds: Types.ObjectId[],
  session: ClientSession
): Promise<void> {
  await Directory.updateOne(
    { _id: id },
    { $set: { parentDirId, ancestorIds } },
    { session }
  );
}

export async function cascadeAncestorIdsOnMove(
  dirId: Types.ObjectId,
  oldAncestorIds: Types.ObjectId[],
  newAncestorIds: Types.ObjectId[],
  session: ClientSession
): Promise<void> {
  const oldPrefixLength = oldAncestorIds.length + 1;
  const pipeline = [
    {
      $set: {
        ancestorIds: {
          $concatArrays: [
            [...newAncestorIds, dirId],
            {
              $cond: {
                if: {
                  $gt: [
                    { $subtract: [{ $size: "$ancestorIds" }, oldPrefixLength] },
                    0,
                  ],
                },
                then: {
                  $slice: [
                    "$ancestorIds",
                    oldPrefixLength,
                    {
                      $subtract: [{ $size: "$ancestorIds" }, oldPrefixLength],
                    },
                  ],
                },
                else: [],
              },
            },
          ],
        },
      },
    },
  ];

  await Directory.updateMany({ ancestorIds: dirId }, pipeline, {
    session,
    updatePipeline: true,
  });
  await File.updateMany({ ancestorIds: dirId }, pipeline, {
    session,
    updatePipeline: true,
  });
}

export async function adjustSizes(
  ids: Types.ObjectId[],
  delta: number,
  session: ClientSession | null = null
): Promise<void> {
  if (ids.length === 0 || delta === 0) {
    return;
  }
  await Directory.updateMany(
    { _id: { $in: ids } },
    { $inc: { sizeInBytes: delta } },
    Db.sessionOption(session)
  );
}

export async function trashWithCascade(
  userId: Types.ObjectId,
  id: Types.ObjectId,
  session: ClientSession
): Promise<void> {
  await Directory.updateOne(
    { _id: id, userId },
    { $set: { status: "trashed", trashedAt: new Date() } },
    { session }
  );

  await Directory.updateMany(
    { userId, ancestorIds: id, status: "active" },
    { $set: { status: "trashed" } },
    { session }
  );
  await File.updateMany(
    { userId, ancestorIds: id, status: "active" },
    { $set: { status: "trashed" } },
    { session }
  );
}

export async function restoreWithCascade(
  userId: Types.ObjectId,
  id: Types.ObjectId,
  newParentDirId: Types.ObjectId,
  newAncestorIds: Types.ObjectId[],
  session: ClientSession
): Promise<void> {
  await Directory.updateOne(
    { _id: id, userId },
    {
      $set: {
        status: "active",
        parentDirId: newParentDirId,
        ancestorIds: newAncestorIds,
      },
      $unset: { trashedAt: "" },
    },
    { session }
  );

  const trappedRoots = await Directory.find({
    userId,
    ancestorIds: id,
    trashedAt: { $exists: true },
  })
    .select("_id")
    .session(session)
    .lean();
  const trappedIds = trappedRoots.map((root) => root._id);

  await Directory.updateMany(
    {
      $and: [
        { userId },
        { ancestorIds: id },
        { status: "trashed" },
        { _id: { $nin: trappedIds } },
        { ancestorIds: { $nin: trappedIds } },
      ],
    },
    { $set: { status: "active" } },
    { session }
  );
  await File.updateMany(
    {
      $and: [
        { userId },
        { ancestorIds: id },
        { status: "trashed" },
        { trashedAt: { $exists: false } },
        { ancestorIds: { $nin: trappedIds } },
      ],
    },
    { $set: { status: "active" } },
    { session }
  );
}

export function findDescendants(userId: Types.ObjectId, id: Types.ObjectId) {
  return Promise.all([
    Directory.find({ userId, ancestorIds: id, status: "active" }).lean(),
    File.find({ userId, ancestorIds: id, status: "active" }).lean(),
  ]);
}

export async function hardDeleteWithCascade(
  userId: Types.ObjectId,
  id: Types.ObjectId,
  session: ClientSession
): Promise<{ deletedFileStorageKeys: string[] }> {
  const descendantDirs = await Directory.find({ userId, ancestorIds: id })
    .session(session)
    .lean();
  const descendantFiles = await File.find({ userId, ancestorIds: id })
    .session(session)
    .lean();

  const dirIds = [id, ...descendantDirs.map((dir) => dir._id)];
  const fileIds = descendantFiles.map((file) => file._id);
  const deletedFileStorageKeys = descendantFiles.map((file) => file.storageKey);

  await Directory.deleteMany({ _id: { $in: dirIds } }, { session });
  await File.deleteMany({ _id: { $in: fileIds } }, { session });

  return { deletedFileStorageKeys };
}

export function listActiveFiles(
  userId: Types.ObjectId,
  options: ListActiveFilesOptions
) {
  return File.find({
    userId,
    parentDirId: options.parentDirId,
    status: "active",
  })
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .lean();
}

export function countActiveFiles(
  userId: Types.ObjectId,
  parentDirId: Types.ObjectId
) {
  return File.countDocuments({ userId, parentDirId, status: "active" });
}
