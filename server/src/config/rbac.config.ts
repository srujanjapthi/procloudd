import { Role } from "@/common/constants/roles.constant.js";
import type { Role as RoleType } from "@/common/constants/roles.constant.js";
import type { Permission } from "@/common/constants/permissions.constant.js";

export const rolePermissions: Record<
  RoleType,
  ReadonlyArray<Permission | "*">
> = {
  [Role.Admin]: ["*"],
  [Role.Manager]: ["user:list", "user:force-logout"],
  [Role.User]: [],
};
