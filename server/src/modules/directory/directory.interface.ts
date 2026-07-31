import type { SortOrder, Types } from "mongoose";
import type { Directory } from "@/models/directory.model.js";

export type LeanDirectoryDocument = Directory & { _id: Types.ObjectId };

export interface CreateDirectoryInput {
  name: string;
  parentDirId: Types.ObjectId;
  userId: Types.ObjectId;
  ancestorIds: Types.ObjectId[];
}

export interface ListActiveFilesOptions {
  parentDirId: Types.ObjectId;
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
}

export interface BreadcrumbEntry {
  id: string;
  name: string;
}

export interface DirectoryProfile {
  id: string;
  name: string;
  parentDirId: string | null;
  sizeInBytes: number;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}
