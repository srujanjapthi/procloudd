import { z } from "zod";
import { paginationQuerySchema } from "@/common/pagination/pagination.validator.js";

export const listTrashQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["name", "trashedAt", "sizeInBytes"]).default("trashedAt"),
});
export type ListTrashQuery = z.infer<typeof listTrashQuerySchema>;
