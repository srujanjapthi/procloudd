import type { Types } from "mongoose";
import type {
  User,
  AccountStatus,
  AuthProviderLink,
} from "@/models/user.model.js";
import type { Role } from "@/common/constants/roles.constant.js";

export interface CreateUserInput {
  _id: Types.ObjectId;
  username: string;
  name: { firstName: string; middleName?: string; lastName: string };
  email: string;
  password: string;
  providers?: AuthProviderLink[];
  avatar?: { url: string };
  rootDirId: Types.ObjectId;
}

export interface UpdateUserInput {
  username?: string | undefined;
  name?:
    | {
        firstName?: string | undefined;
        middleName?: string | null | undefined;
        lastName?: string | undefined;
      }
    | undefined;
  profile?: { avatar?: { url?: string; variant?: string } };
}

export type LeanUserDocument = User & { _id: Types.ObjectId };

export interface ListUsersResult {
  users: LeanUserDocument[];
  totalItems: number;
}

export interface AuthenticatedCredentials {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  twoFactorEnabled: boolean;
}

export interface AvailabilityResult {
  username?: boolean;
  email?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  name: { firstName: string; middleName?: string; lastName: string };
  email: string;
  role: Role;
  status: AccountStatus;
  profile?: { avatar?: { url?: string; variant?: string } };
  storage: { maxStorageInBytes: number };
  lastLoginAt?: Date;
  twoFactorEnabled: boolean;
}

export interface CurrentUserProfile extends Omit<UserProfile, "storage"> {
  storage: { rootDirId: string; maxStorageInBytes: number; usedBytes: number };
}
