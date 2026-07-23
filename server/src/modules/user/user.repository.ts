import type { ClientSession, QueryFilter, SortOrder, Types } from "mongoose";
import User from "@/models/user.model.js";
import type { User as UserDoc, AuthProviderLink } from "@/models/user.model.js";
import * as Pagination from "@/common/pagination/pagination.util.js";
import { toDotNotation } from "@/common/lib/object.util.js";
import { rolesBelow } from "@/common/constants/roles.constant.js";
import type { Role } from "@/common/constants/roles.constant.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersResult,
} from "./user.interface.js";
import type { ListUsersQuery } from "./user.validator.js";

export async function create(
  input: CreateUserInput,
  session: ClientSession | null = null
) {
  const [user] = await User.create(
    [
      {
        _id: input._id,
        username: input.username,
        name: input.name,
        email: input.email,
        auth: {
          password: input.password,
          ...(input.providers && { providers: input.providers }),
        },
        ...(input.avatar && { profile: { avatar: input.avatar } }),
        storage: { rootDirId: input.rootDirId },
      },
    ],
    { session }
  );
  return user!;
}

export function findByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase() }).lean();
}

export async function exists(filter: QueryFilter<UserDoc>): Promise<boolean> {
  return (await User.exists(filter)) !== null;
}

export function findByIdentifierWithPassword(identifier: string) {
  const normalized = identifier.toLowerCase();
  return User.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  })
    .select("+auth.password")
    .lean();
}

export function findById(id: Types.ObjectId | string) {
  return User.findById(id).lean();
}

export function findByIdWithPassword(id: Types.ObjectId | string) {
  return User.findById(id).select("+auth.password").lean();
}

export async function updatePassword(
  id: Types.ObjectId | string,
  newPassword: string
): Promise<void> {
  const user = await User.findById(id);
  if (!user) {
    return;
  }
  user.auth.password = newPassword;
  await user.save();
}

export async function incrementFailedLoginAttempts(
  id: Types.ObjectId | string
): Promise<number> {
  const user = await User.findByIdAndUpdate(
    id,
    { $inc: { "auth.failedLoginAttempts": 1 } },
    { returnDocument: "after" }
  ).select("auth.failedLoginAttempts");
  return user?.auth.failedLoginAttempts ?? 0;
}

export async function lockAccount(
  id: Types.ObjectId | string,
  until: Date
): Promise<void> {
  await User.updateOne({ _id: id }, { $set: { "auth.lockedUntil": until } });
}

export async function resetFailedLoginAttempts(
  id: Types.ObjectId | string
): Promise<void> {
  await User.updateOne(
    { _id: id },
    {
      $set: { "auth.failedLoginAttempts": 0, "auth.lastLoginAt": new Date() },
      $unset: { "auth.lockedUntil": "" },
    }
  );
}

export function updateById(
  id: Types.ObjectId | string,
  input: UpdateUserInput
) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};

  for (const [key, value] of Object.entries(toDotNotation(input))) {
    if (value === null) {
      unset[key] = "";
    } else {
      set[key] = value;
    }
  }

  return User.findOneAndUpdate(
    { _id: id },
    { $set: set, $unset: unset },
    { returnDocument: "after", runValidators: true }
  ).lean();
}

export async function softDeleteById(
  id: Types.ObjectId | string
): Promise<void> {
  await User.updateOne(
    { _id: id },
    { $set: { status: "deleted" } },
    { runValidators: true }
  );
}

export async function hardDeleteById(
  id: Types.ObjectId | string
): Promise<void> {
  await User.deleteOne({ _id: id });
}

export async function addProviderLink(
  id: Types.ObjectId | string,
  link: AuthProviderLink
): Promise<void> {
  await User.updateOne(
    { _id: id, "auth.providers.providerId": { $ne: link.providerId } },
    { $push: { "auth.providers": link } }
  );
}

const SORT_FIELDS = {
  createdAt: "createdAt",
  lastLoginAt: "auth.lastLoginAt",
} as const;

function searchConditions(search: string): QueryFilter<UserDoc>[] {
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  return [
    { email: regex },
    { username: regex },
    { "name.firstName": regex },
    { "name.lastName": regex },
  ];
}

function buildListFilter(
  actorRole: Role,
  query: ListUsersQuery
): QueryFilter<UserDoc> {
  const allowedRoles = rolesBelow(actorRole);
  const roles = query.role
    ? allowedRoles.filter((role) => role === query.role)
    : allowedRoles;

  return {
    status: query.status ?? "active",
    role: { $in: roles },
    ...(query.search && { $or: searchConditions(query.search) }),
  };
}

export async function list(
  actorRole: Role,
  query: ListUsersQuery
): Promise<ListUsersResult> {
  const filter = buildListFilter(actorRole, query);
  const sort: Record<string, SortOrder> = {
    [SORT_FIELDS[query.sortBy]]: query.sortOrder === "asc" ? 1 : -1,
  };
  const { skip } = Pagination.toParams(query.page, query.limit);

  const [users, totalItems] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
    User.countDocuments(filter),
  ]);
  return { users, totalItems };
}
