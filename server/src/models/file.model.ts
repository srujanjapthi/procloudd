import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
import { z } from "zod";

export const fileStatusSchema = z.enum(["active", "trashed"]);
export type FileStatus = z.infer<typeof fileStatusSchema>;

export interface File {
  baseName: string;
  sizeInBytes: number;
  extension: string;
  mimeType: string;
  parentDirId: Types.ObjectId;
  ancestorIds: Types.ObjectId[];
  userId: Types.ObjectId;
  storageKey: string;
  checksum?: string;
  status: FileStatus;
  trashedAt?: Date;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<File>(
  {
    baseName: {
      type: String,
      required: true,
    },
    sizeInBytes: {
      type: Number,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    parentDirId: {
      type: Schema.Types.ObjectId,
      ref: "Directory",
      required: true,
    },
    ancestorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Directory",
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
    },
    status: {
      type: String,
      enum: fileStatusSchema.options,
      default: "active",
    },
    trashedAt: {
      type: Date,
    },
    starred: {
      type: Boolean,
      default: false,
    },
  },
  { strict: "throw", timestamps: true }
);

fileSchema.index({ userId: 1, status: 1, parentDirId: 1 });
fileSchema.index({ userId: 1, ancestorIds: 1 });

const File = model<File>("File", fileSchema);
export default File;
