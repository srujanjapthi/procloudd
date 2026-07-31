import mongoose from "mongoose";
import User from "@/models/user.model.js";
import type { User as UserDoc } from "@/models/user.model.js";
import Directory from "@/models/directory.model.js";
import type { Directory as DirectoryDoc } from "@/models/directory.model.js";
import Otp from "@/models/otp.model.js";
import type { OtpPurpose } from "@/models/otp.model.js";
import * as CredentialHasher from "@/common/lib/credential-hasher.util.js";
import * as OtpHasher from "@/common/lib/otp-hasher.util.js";
import * as Totp from "@/common/lib/totp.util.js";
import * as Encryption from "@/common/lib/encryption.util.js";
import { Role } from "@/common/constants/roles.constant.js";
import type { Role as RoleType } from "@/common/constants/roles.constant.js";
import Sessions from "@/services/session.service.js";

let counter = 0;

function unique(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now()}${counter}`;
}

export interface CreateTestUserOptions {
  status?: "active" | "deleted";
  password?: string;
  role?: RoleType;
}

export interface TestUser {
  doc: UserDoc & { _id: mongoose.Types.ObjectId };
  password: string;
}

export async function createTestUser(
  options: CreateTestUserOptions = {}
): Promise<TestUser> {
  const password = options.password ?? "Password1!";

  const doc = await User.create({
    username: unique("user"),
    name: { firstName: "Test", lastName: "User" },
    email: `${unique("user")}@example.com`,
    role: options.role ?? Role.User,
    status: options.status ?? "active",
    storage: { rootDirId: new mongoose.Types.ObjectId() },
    auth: { password },
  });

  return { doc: doc.toObject(), password };
}

export interface CreateTestDirectoryOptions {
  name?: string;
  parentDirId?: mongoose.Types.ObjectId | null;
  ancestorIds?: mongoose.Types.ObjectId[];
  sizeInBytes?: number;
  status?: "active" | "trashed";
  starred?: boolean;
}

export async function createTestDirectory(
  userId: mongoose.Types.ObjectId,
  options: CreateTestDirectoryOptions = {}
): Promise<DirectoryDoc & { _id: mongoose.Types.ObjectId }> {
  const doc = await Directory.create({
    name: options.name ?? unique("dir"),
    userId,
    parentDirId: options.parentDirId ?? null,
    ancestorIds: options.ancestorIds ?? [],
    sizeInBytes: options.sizeInBytes ?? 0,
    status: options.status ?? "active",
    starred: options.starred ?? false,
  });
  return doc.toObject();
}

export interface TestUserWithRoot extends TestUser {
  rootDirId: mongoose.Types.ObjectId;
}

export async function createTestUserWithRoot(
  options: CreateTestUserOptions = {}
): Promise<TestUserWithRoot> {
  const { doc: user, password } = await createTestUser(options);
  const root = await createTestDirectory(user._id, { name: "root" });
  await User.updateOne(
    { _id: user._id },
    { $set: { "storage.rootDirId": root._id } }
  );

  return {
    doc: { ...user, storage: { ...user.storage, rootDirId: root._id } },
    password,
    rootDirId: root._id,
  };
}

export interface TwoFactorFixture {
  secret: string;
  recoveryCodes: string[];
}

export async function enableTwoFactor(
  userId: mongoose.Types.ObjectId
): Promise<TwoFactorFixture> {
  const secret = Totp.generateSecret();
  const recoveryCodes = ["AAAAA-11111", "BBBBB-22222", "CCCCC-33333"];
  const hashedRecoveryCodes = await Promise.all(
    recoveryCodes.map(async (code) => ({
      codeHash: await CredentialHasher.hash(code),
    }))
  );

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        "auth.twoFactor.enabled": true,
        "auth.twoFactor.secret": Encryption.encrypt(secret),
        "auth.twoFactor.recoveryCodes": hashedRecoveryCodes,
      },
    }
  );

  return { secret, recoveryCodes };
}

export async function generateTotpCode(secret: string): Promise<string> {
  const { generate } = await import("otplib");
  return generate({ secret });
}

export async function createSessions(
  userId: mongoose.Types.ObjectId,
  count: number
): Promise<string[]> {
  const sessionIds: string[] = [];
  for (let i = 0; i < count; i++) {
    sessionIds.push(await Sessions.createSession(userId.toString()));
  }

  const expected = new Set(sessionIds);
  let stableChecks = 0;
  for (let attempt = 0; attempt < 40 && stableChecks < 3; attempt++) {
    const sessions = await Sessions.listUserSessions(userId.toString());
    const actual = new Set(sessions.map((session) => session.sessionId));
    const matches =
      actual.size === expected.size &&
      [...expected].every((id) => actual.has(id));
    stableChecks = matches ? stableChecks + 1 : 0;
    if (stableChecks < 3) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  return sessionIds;
}

export async function seedOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<void> {
  await Otp.create({
    email,
    code: OtpHasher.hash(code),
    purpose,
    attempts: 0,
  });
}
