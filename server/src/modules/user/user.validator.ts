import { z } from "zod";
import { paginationQuerySchema } from "@/common/pagination/pagination.validator.js";
import { RoleSchema } from "@/common/constants/roles.constant.js";
import { AccountStatusSchema } from "@/models/user.model.js";
import AppConfig from "@/config/app.config.js";

export const usernameSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(
      `^[a-z0-9_-]{${AppConfig.username.minLength},${AppConfig.username.maxLength}}$`
    ),
    `Username must be ${AppConfig.username.minLength}-${AppConfig.username.maxLength} characters and can only contain lowercase letters, numbers, underscores, and hyphens.`
  );

export const nameSchema = z.object({
  firstName: z.string().trim().min(1),
  middleName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1),
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  role: RoleSchema.optional(),
  status: AccountStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "lastLoginAt"]).default("createdAt"),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const availabilityQuerySchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).optional(),
    email: z.email().trim().toLowerCase().optional(),
  })
  .refine((data) => data.username !== undefined || data.email !== undefined, {
    message: "Provide at least one of username or email",
  });
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  name: nameSchema
    .partial()
    .extend({ middleName: z.string().trim().min(1).nullable().optional() })
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
