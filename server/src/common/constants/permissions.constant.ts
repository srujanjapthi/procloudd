import { z } from "zod";

const UserPermissions = z.enum([
  "user:list",
  "user:delete",
  "user:hard-delete",
  "user:force-logout",
]);

export const PermissionSchema = z.union([UserPermissions]);
export type Permission = z.infer<typeof PermissionSchema>;
