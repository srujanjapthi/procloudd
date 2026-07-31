import type { ClientSession } from "mongoose";
import * as UserRepository from "./user.repository.js";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import LocalProvider from "@/common/auth/providers/local.provider.js";
import AppError from "@/common/error/app.error.js";
import * as MongoError from "@/common/error/mongo.error.js";
import Sessions from "@/services/session.service.js";
import * as Pagination from "@/common/pagination/pagination.util.js";
import AppConfig from "@/config/app.config.js";
import { outranks } from "@/common/constants/roles.constant.js";
import type { Role } from "@/common/constants/roles.constant.js";
import type { AuthProviderLink } from "@/models/user.model.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  AuthenticatedCredentials,
  AvailabilityResult,
  UserProfile,
  CurrentUserProfile,
  LeanUserDocument,
} from "./user.interface.js";
import type { ListUsersQuery, AvailabilityQuery } from "./user.validator.js";

export async function createUser(
  input: CreateUserInput,
  session: ClientSession | null = null
) {
  try {
    return await UserRepository.create(input, session);
  } catch (error) {
    if (MongoError.isDuplicateKey(error)) {
      throw AppError.conflict("Email or username already in use");
    }
    throw error;
  }
}

export function findByEmail(email: string) {
  return UserRepository.findByEmail(email);
}

export function addProviderLink(userId: string, link: AuthProviderLink) {
  return UserRepository.addProviderLink(userId, link);
}

export async function checkAvailability(
  query: AvailabilityQuery
): Promise<AvailabilityResult> {
  const result: AvailabilityResult = {};

  if (query.username !== undefined) {
    result.username = !(await UserRepository.exists({
      username: query.username,
    }));
  }
  if (query.email !== undefined) {
    result.email = !(await UserRepository.exists({ email: query.email }));
  }

  return result;
}

function toUserProfile(user: LeanUserDocument): UserProfile {
  return {
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    ...(user.profile && { profile: user.profile }),
    storage: { maxStorageInBytes: user.storage.maxStorageInBytes },
    ...(user.auth.lastLoginAt && { lastLoginAt: user.auth.lastLoginAt }),
    twoFactorEnabled: user.auth.twoFactor.enabled,
  };
}

async function toCurrentUserProfile(
  user: LeanUserDocument
): Promise<CurrentUserProfile> {
  const rootDir = await DirectoryRepository.findActiveById(
    user._id,
    user.storage.rootDirId
  );
  return {
    ...toUserProfile(user),
    storage: {
      rootDirId: user.storage.rootDirId.toString(),
      maxStorageInBytes: user.storage.maxStorageInBytes,
      usedBytes: rootDir?.sizeInBytes ?? 0,
    },
  };
}

export async function findById(id: string): Promise<CurrentUserProfile | null> {
  const user = await UserRepository.findById(id);
  return user ? toCurrentUserProfile(user) : null;
}

export function findByIdWithPassword(id: string) {
  return UserRepository.findByIdWithPassword(id);
}

export async function verifyPassword(
  userId: string,
  password: string
): Promise<void> {
  const user = await UserRepository.findByIdWithPassword(userId);
  if (!user?.auth.password) {
    throw AppError.unauthorized("Current password is incorrect");
  }

  try {
    await LocalProvider.verify({
      password,
      user: {
        id: user._id.toString(),
        email: user.email,
        password: user.auth.password,
      },
    });
  } catch {
    throw AppError.unauthorized("Current password is incorrect");
  }
}

export async function verifyCredentials(
  identifier: string,
  password: string
): Promise<AuthenticatedCredentials | null> {
  const user = await UserRepository.findByIdentifierWithPassword(identifier);
  if (!user?.auth.password) {
    return null;
  }

  const lockedUntil = user.auth.lockedUntil;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    const minutesRemaining = Math.ceil(
      (lockedUntil.getTime() - Date.now()) / 60_000
    );
    throw AppError.forbidden(
      `Too many failed login attempts. Try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`
    );
  }

  try {
    await LocalProvider.verify({
      password,
      user: {
        id: user._id.toString(),
        email: user.email,
        password: user.auth.password,
      },
    });
  } catch {
    const attempts = await UserRepository.incrementFailedLoginAttempts(
      user._id
    );
    if (attempts >= AppConfig.login.maxFailedAttempts) {
      await UserRepository.lockAccount(
        user._id,
        new Date(Date.now() + AppConfig.login.lockoutDurationMs)
      );
    }
    return null;
  }

  await UserRepository.resetFailedLoginAttempts(user._id);

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.auth.twoFactor.enabled,
  };
}

export async function updateProfile(
  userId: string,
  input: UpdateUserInput
): Promise<CurrentUserProfile> {
  try {
    const user = await UserRepository.updateById(userId, input);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return toCurrentUserProfile(user);
  } catch (error) {
    if (MongoError.isDuplicateKey(error)) {
      throw AppError.conflict("Username already in use");
    }
    throw error;
  }
}

export function updatePassword(userId: string, newPassword: string) {
  return UserRepository.updatePassword(userId, newPassword);
}

export async function listUsers(actorRole: Role, query: ListUsersQuery) {
  const { users, totalItems } = await UserRepository.list(actorRole, query);
  return {
    users: users.map(toUserProfile),
    meta: Pagination.buildPaginationMeta(query.page, query.limit, totalItems),
  };
}

async function assertOutranks(actorRole: Role, userId: string): Promise<void> {
  const target = await UserRepository.findById(userId);
  if (!target) {
    throw AppError.notFound("User not found");
  }
  if (!outranks(actorRole, target.role)) {
    throw AppError.forbidden(
      "You cannot perform this action on a user with equal or higher privileges."
    );
  }
}

export async function deleteUser(
  actorRole: Role,
  userId: string
): Promise<void> {
  await assertOutranks(actorRole, userId);
  await UserRepository.softDeleteById(userId);
  await Sessions.deleteUserSessions(userId);
}

export async function hardDeleteUser(
  actorRole: Role,
  userId: string
): Promise<void> {
  await assertOutranks(actorRole, userId);
  await UserRepository.hardDeleteById(userId);
  await Sessions.deleteUserSessions(userId);
}

export async function forceLogout(
  actorRole: Role,
  userId: string
): Promise<void> {
  await assertOutranks(actorRole, userId);
  await Sessions.deleteUserSessions(userId);
}
