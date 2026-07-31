import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
import { z } from "zod";

export const directoryStatusSchema = z.enum(["active", "trashed"]);
export type DirectoryStatus = z.infer<typeof directoryStatusSchema>;

export interface Directory {
  name: string;
  sizeInBytes: number;
  userId: Types.ObjectId;
  parentDirId: Types.ObjectId | null;
  ancestorIds: Types.ObjectId[];
  status: DirectoryStatus;
  trashedAt?: Date;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const directorySchema = new Schema<Directory>(
  {
    name: {
      type: String,
      required: true,
    },
    sizeInBytes: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentDirId: {
      type: Schema.Types.ObjectId,
      ref: "Directory",
      default: null,
    },
    ancestorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Directory",
      },
    ],
    status: {
      type: String,
      enum: directoryStatusSchema.options,
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

directorySchema.index({ userId: 1, status: 1, parentDirId: 1 });
directorySchema.index({ userId: 1, ancestorIds: 1 });

const Directory = model<Directory>("Directory", directorySchema);
export default Directory;
