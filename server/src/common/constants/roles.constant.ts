import { z } from "zod";

export const RoleSchema = z.enum(["Admin", "Manager", "User"]);
export type Role = z.infer<typeof RoleSchema>;

export const Role = RoleSchema.enum;

export const RoleRank: Record<Role, number> = {
  [Role.Admin]: 2,
  [Role.Manager]: 1,
  [Role.User]: 0,
};

export function outranks(actorRole: Role, targetRole: Role): boolean {
  return actorRole === Role.Admin || RoleRank[actorRole] > RoleRank[targetRole];
}

export function rolesBelow(role: Role): Role[] {
  return RoleSchema.options.filter(
    (candidate) => RoleRank[candidate] < RoleRank[role]
  );
}
