import AppError from "@/common/error/app.error.js";
import { rolePermissions } from "@/config/rbac.config.js";
import type { Permission } from "@/common/constants/permissions.constant.js";
import type { AuthenticatedUser } from "./authorization.interface.js";

class AuthorizationQuery {
  private currentUser: AuthenticatedUser | undefined;
  private permission?: Permission;

  user(user: AuthenticatedUser | undefined): this {
    this.currentUser = user;
    return this;
  }

  can(permission: Permission): this {
    this.permission = permission;
    return this;
  }

  check(): void {
    if (!this.currentUser) {
      throw AppError.unauthorized();
    }
    if (!this.permission) {
      throw new Error(
        "authorization().can(permission) was not called before check()"
      );
    }

    const grants = rolePermissions[this.currentUser.role];

    const hasWildcardAccess = grants.includes("*");
    if (hasWildcardAccess) {
      return;
    }

    const hasSpecificPermission = grants.includes(this.permission);
    if (hasSpecificPermission) {
      return;
    }

    throw AppError.forbidden(
      "You do not have permission to perform this action."
    );
  }
}

export function authorization(): AuthorizationQuery {
  return new AuthorizationQuery();
}
