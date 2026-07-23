import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface File {
  name: string;
  sizeInBytes: number;
  extension: string;
  mimeType: string;
  parentDirId: Types.ObjectId;
  userId: Types.ObjectId;
}

const fileSchema = new Schema<File>(
  {
    name: {
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { strict: "throw", timestamps: true }
);

fileSchema.index({ userId: 1, parentDirId: 1 });

const File = model<File>("File", fileSchema);
export default File;
