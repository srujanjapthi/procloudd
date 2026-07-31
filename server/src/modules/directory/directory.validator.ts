import { z } from "zod";
import { paginationQuerySchema } from "@/common/pagination/pagination.validator.js";
import * as Db from "@/common/lib/db.util.js";

const objectIdSchema = z.string().refine(Db.isValidId, "Invalid ID");

export const directoryNameSchema = z
  .string()
  .trim()
  .min(1, "Name cannot be empty.")
  .max(255, "Name is too long.")
  .refine(
    (name) => !name.includes("/") && !name.includes("\\"),
    "Name cannot contain / or \\."
  );

export const createDirectorySchema = z.object({
  name: directoryNameSchema,
  parentDirId: objectIdSchema,
});
export type CreateDirectoryBody = z.infer<typeof createDirectorySchema>;

export const renameDirectorySchema = z.object({
  name: directoryNameSchema,
});
export type RenameDirectoryBody = z.infer<typeof renameDirectorySchema>;

export const moveDirectorySchema = z.object({
  parentDirId: objectIdSchema,
});
export type MoveDirectoryBody = z.infer<typeof moveDirectorySchema>;

export const duplicateDirectorySchema = z.object({
  name: directoryNameSchema.optional(),
  parentDirId: objectIdSchema.optional(),
});
export type DuplicateDirectoryBody = z.infer<typeof duplicateDirectorySchema>;

export const listDirectoryContentsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["name", "createdAt", "sizeInBytes"]).default("name"),
});
export type ListDirectoryContentsQuery = z.infer<
  typeof listDirectoryContentsQuerySchema
>;
