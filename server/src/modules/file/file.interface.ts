import type { Types } from "mongoose";
import type { File } from "@/models/file.model.js";

export type LeanFileDocument = File & { _id: Types.ObjectId };

export interface CreateFileInput {
  baseName: string;
  sizeInBytes: number;
  extension: string;
  mimeType: string;
  parentDirId: Types.ObjectId;
  ancestorIds: Types.ObjectId[];
  userId: Types.ObjectId;
  storageKey: string;
  checksum?: string;
}

export interface FileProfile {
  id: string;
  name: string;
  baseName: string;
  extension: string;
  sizeInBytes: number;
  mimeType: string;
  parentDirId: string;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}
