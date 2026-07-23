import { z } from "zod";
import AppConfig from "@/config/app.config.js";

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(AppConfig.pagination.defaultPage),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(AppConfig.pagination.maxLimit)
    .default(AppConfig.pagination.defaultLimit),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
