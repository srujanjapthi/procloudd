import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface Directory {
  name: string;
  sizeInBytes: number;
  userId: Types.ObjectId;
  parentDirId: Types.ObjectId | null;
  ancestorIds: Types.ObjectId[];
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
  },
  { strict: "throw", timestamps: true }
);

directorySchema.index({ userId: 1, parentDirId: 1 });

const Directory = model<Directory>("Directory", directorySchema);
export default Directory;
