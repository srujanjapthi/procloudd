import type { Role } from "@/common/constants/roles.constant.js";

export interface AuthenticatedUser {
  id: string;
  role: Role;
}
