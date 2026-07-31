import { z } from "zod";

export const driveNameSchema = z
  .string()
  .trim()
  .min(1, "Name cannot be empty")
  .max(255, "Name is too long")
  .refine(
    (name) => !name.includes("/") && !name.includes("\\"),
    "Name cannot contain / or \\"
  );

export const renameSchema = z.object({ name: driveNameSchema });
export type RenameFormValues = z.infer<typeof renameSchema>;

export const createFolderSchema = z.object({ name: driveNameSchema });
export type CreateFolderFormValues = z.infer<typeof createFolderSchema>;
