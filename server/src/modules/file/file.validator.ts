import { z } from "zod";
import * as Db from "@/common/lib/db.util.js";
import { directoryNameSchema } from "@/modules/directory/directory.validator.js";

const objectIdSchema = z.string().refine(Db.isValidId, "Invalid ID");

export const requestUploadUrlSchema = z.object({
  name: directoryNameSchema,
  parentDirId: objectIdSchema,
  sizeInBytes: z.number().int().positive(),
  mimeType: z.string().min(1),
});
export type RequestUploadUrlBody = z.infer<typeof requestUploadUrlSchema>;

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1),
  name: directoryNameSchema,
  parentDirId: objectIdSchema,
  mimeType: z.string().min(1),
  checksum: z.string().min(1).optional(),
});
export type ConfirmUploadBody = z.infer<typeof confirmUploadSchema>;

export const renameFileSchema = z.object({
  name: directoryNameSchema,
});
export type RenameFileBody = z.infer<typeof renameFileSchema>;

export const moveFileSchema = z.object({
  parentDirId: objectIdSchema,
});
export type MoveFileBody = z.infer<typeof moveFileSchema>;

export const copyFileSchema = z.object({
  name: directoryNameSchema.optional(),
  parentDirId: objectIdSchema.optional(),
});
export type CopyFileBody = z.infer<typeof copyFileSchema>;
