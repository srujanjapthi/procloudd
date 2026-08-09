import { z } from "zod";
import { paginationQuerySchema } from "@/common/pagination/pagination.validator.js";

export const listStarredQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["name", "updatedAt", "sizeInBytes"]).default("updatedAt"),
});
export type ListStarredQuery = z.infer<typeof listStarredQuerySchema>;
