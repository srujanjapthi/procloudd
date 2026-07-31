import type { ClientSession, Types } from "mongoose";
import File from "@/models/file.model.js";
import * as Db from "@/common/lib/db.util.js";
import type { CreateFileInput } from "./file.interface.js";

export async function create(
  input: CreateFileInput,
  session: ClientSession | null = null
) {
  const [file] = await File.create([input], Db.sessionOption(session));
  return file!;
}

export async function createMany(
  docs: Array<{
    _id: Types.ObjectId;
    baseName: string;
    sizeInBytes: number;
    extension: string;
    mimeType: string;
    userId: Types.ObjectId;
    parentDirId: Types.ObjectId;
    ancestorIds: Types.ObjectId[];
    storageKey: string;
  }>,
  session: ClientSession
): Promise<void> {
  if (docs.length === 0) {
    return;
  }
  await File.create(docs, { session, ordered: true });
}

export function findActiveById(userId: Types.ObjectId, id: Types.ObjectId) {
  return File.findOne({ _id: id, userId, status: "active" }).lean();
}

export function findTrashedById(userId: Types.ObjectId, id: Types.ObjectId) {
  return File.findOne({ _id: id, userId, status: "trashed" }).lean();
}

export async function rename(
  id: Types.ObjectId,
  baseName: string,
  session: ClientSession | null = null
) {
  return File.findOneAndUpdate(
    { _id: id },
    { $set: { baseName } },
    { returnDocument: "after", ...Db.sessionOption(session) }
  ).lean();
}

export async function updateParent(
  id: Types.ObjectId,
  parentDirId: Types.ObjectId,
  ancestorIds: Types.ObjectId[],
  session: ClientSession | null = null
): Promise<void> {
  await File.updateOne(
    { _id: id },
    { $set: { parentDirId, ancestorIds } },
    Db.sessionOption(session)
  );
}

export async function trash(
  userId: Types.ObjectId,
  id: Types.ObjectId,
  session: ClientSession | null = null
): Promise<void> {
  await File.updateOne(
    { _id: id, userId },
    { $set: { status: "trashed", trashedAt: new Date() } },
    Db.sessionOption(session)
  );
}

export async function hardDelete(
  id: Types.ObjectId,
  session: ClientSession | null = null
): Promise<void> {
  await File.deleteOne({ _id: id }, Db.sessionOption(session));
}
