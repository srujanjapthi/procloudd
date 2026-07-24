import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import { createTestUser, createSessions } from "@/test/fixtures.js";
import User from "@/models/user.model.js";
import Sessions from "@/services/session.service.js";
import AppConfig from "@/config/app.config.js";
import { Role } from "@/common/constants/roles.constant.js";
import * as UserService from "../user.service.js";
import type { ListUsersQuery } from "../user.validator.js";

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

function listQuery(overrides: Partial<ListUsersQuery> = {}): ListUsersQuery {
  return {
    page: 1,
    limit: 20,
    sortOrder: "desc",
    sortBy: "createdAt",
    ...overrides,
  };
}

describe("createUser", () => {
  it("creates a user and persists it", async () => {
    const input = {
      _id: new mongoose.Types.ObjectId(),
      username: "brandnew",
      name: { firstName: "Brand", lastName: "New" },
      email: "brandnew@example.com",
      password: "Password1!",
      rootDirId: new mongoose.Types.ObjectId(),
    };

    const created = await UserService.createUser(input);

    expect(created.username).toBe("brandnew");
    const stored = await User.findById(input._id).lean();
    expect(stored).not.toBeNull();
    expect(stored!.email).toBe("brandnew@example.com");
  });

  it("throws a conflict error when the email is already taken", async () => {
    const { doc: existing } = await createTestUser();

    await expect(
      UserService.createUser({
        _id: new mongoose.Types.ObjectId(),
        username: "someoneelse",
        name: { firstName: "Someone", lastName: "Else" },
        email: existing.email,
        password: "Password1!",
        rootDirId: new mongoose.Types.ObjectId(),
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("throws a conflict error when the username is already taken", async () => {
    const { doc: existing } = await createTestUser();

    await expect(
      UserService.createUser({
        _id: new mongoose.Types.ObjectId(),
        username: existing.username,
        name: { firstName: "Someone", lastName: "Else" },
        email: "unique@example.com",
        password: "Password1!",
        rootDirId: new mongoose.Types.ObjectId(),
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("checkAvailability", () => {
  it("reports username and email availability independently", async () => {
    const { doc: existing } = await createTestUser();

    const result = await UserService.checkAvailability({
      username: existing.username,
      email: "free@example.com",
    });

    expect(result).toEqual({ username: false, email: true });
  });

  it("returns an empty result when no fields are queried", async () => {
    await expect(UserService.checkAvailability({})).resolves.toEqual({});
  });
});

describe("findById", () => {
  it("returns a profile without optional fields when they are unset", async () => {
    const { doc: user } = await createTestUser();

    const profile = await UserService.findById(user._id.toString());

    expect(profile).toMatchObject({
      id: user._id.toString(),
      username: user.username,
      twoFactorEnabled: false,
      storage: {
        maxStorageInBytes: AppConfig.storage.defaultMaxStorageInBytes,
      },
    });
    expect(profile).not.toHaveProperty("profile");
    expect(profile).not.toHaveProperty("lastLoginAt");
  });

  it("includes profile and lastLoginAt when present", async () => {
    const { doc: user } = await createTestUser();
    const lastLoginAt = new Date();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          "profile.avatar.url": "https://example.com/a.png",
          "auth.lastLoginAt": lastLoginAt,
        },
      }
    );

    const profile = await UserService.findById(user._id.toString());

    expect(profile?.profile?.avatar?.url).toBe("https://example.com/a.png");
    expect(profile?.lastLoginAt).toEqual(lastLoginAt);
  });

  it("returns null for a non-existent id", async () => {
    const profile = await UserService.findById(
      new mongoose.Types.ObjectId().toString()
    );
    expect(profile).toBeNull();
  });
});

describe("verifyPassword", () => {
  it("resolves for the correct password", async () => {
    const { doc: user, password } = await createTestUser();

    await expect(
      UserService.verifyPassword(user._id.toString(), password)
    ).resolves.toBeUndefined();
  });

  it("rejects for an incorrect password", async () => {
    const { doc: user } = await createTestUser();

    await expect(
      UserService.verifyPassword(user._id.toString(), "WrongPassword1!")
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects for an OAuth-only account with no local password", async () => {
    const doc = await User.create({
      username: "oauthonly",
      name: { firstName: "OAuth", lastName: "Only" },
      email: "oauthonly@example.com",
      storage: { rootDirId: new mongoose.Types.ObjectId() },
      auth: { providers: [{ provider: "google", providerId: "g-1" }] },
    });

    await expect(
      UserService.verifyPassword(doc._id.toString(), "anything")
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects for a non-existent user", async () => {
    await expect(
      UserService.verifyPassword(
        new mongoose.Types.ObjectId().toString(),
        "anything"
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("verifyCredentials", () => {
  it("returns credentials for a correct password matched by email", async () => {
    const { doc: user, password } = await createTestUser();

    const result = await UserService.verifyCredentials(user.email, password);

    expect(result).toMatchObject({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    });
  });

  it("returns credentials for a correct password matched by username", async () => {
    const { doc: user, password } = await createTestUser();

    const result = await UserService.verifyCredentials(user.username, password);

    expect(result?.id).toBe(user._id.toString());
  });

  it("returns null for an unknown identifier", async () => {
    const result = await UserService.verifyCredentials(
      "nobody@example.com",
      "whatever"
    );
    expect(result).toBeNull();
  });

  it("returns null for an OAuth-only account with no local password", async () => {
    await User.create({
      username: "oauthonly2",
      name: { firstName: "OAuth", lastName: "Only" },
      email: "oauthonly2@example.com",
      storage: { rootDirId: new mongoose.Types.ObjectId() },
      auth: { providers: [{ provider: "google", providerId: "g-2" }] },
    });

    const result = await UserService.verifyCredentials(
      "oauthonly2@example.com",
      "anything"
    );
    expect(result).toBeNull();
  });

  it("returns null and increments failedLoginAttempts for an incorrect password", async () => {
    const { doc: user } = await createTestUser();

    const result = await UserService.verifyCredentials(
      user.email,
      "WrongPassword1!"
    );

    expect(result).toBeNull();
    const stored = await User.findById(user._id).lean();
    expect(stored!.auth.failedLoginAttempts).toBe(1);
  });

  it("locks the account after reaching the max failed attempts", async () => {
    const { doc: user } = await createTestUser();

    for (let i = 0; i < AppConfig.login.maxFailedAttempts; i++) {
      await UserService.verifyCredentials(user.email, "WrongPassword1!");
    }

    const stored = await User.findById(user._id).lean();
    expect(stored!.auth.failedLoginAttempts).toBe(
      AppConfig.login.maxFailedAttempts
    );
    expect(stored!.auth.lockedUntil).toBeDefined();
    expect(stored!.auth.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  }, 15_000);

  it("rejects with a remaining-time message when the account is already locked, even with the correct password", async () => {
    const { doc: user, password } = await createTestUser();
    await User.updateOne(
      { _id: user._id },
      { $set: { "auth.lockedUntil": new Date(Date.now() + 60_000) } }
    );

    await expect(
      UserService.verifyCredentials(user.email, password)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("clears the lockout and resets failed attempts after a successful login", async () => {
    const { doc: user, password } = await createTestUser();
    await UserService.verifyCredentials(user.email, "WrongPassword1!");
    await UserService.verifyCredentials(user.email, "WrongPassword1!");

    const result = await UserService.verifyCredentials(user.email, password);

    expect(result).not.toBeNull();
    const stored = await User.findById(user._id).lean();
    expect(stored!.auth.failedLoginAttempts).toBe(0);
    expect(stored!.auth.lockedUntil).toBeUndefined();
    expect(stored!.auth.lastLoginAt).toBeDefined();
  });
});

describe("updateProfile", () => {
  it("updates the username and name fields", async () => {
    const { doc: user } = await createTestUser();

    const profile = await UserService.updateProfile(user._id.toString(), {
      username: "updatedname",
      name: { firstName: "Updated" },
    });

    expect(profile.username).toBe("updatedname");
    expect(profile.name.firstName).toBe("Updated");
  });

  it("unsets middleName when explicitly set to null", async () => {
    const { doc: user } = await createTestUser();
    await User.updateOne(
      { _id: user._id },
      { $set: { "name.middleName": "Middle" } }
    );

    const profile = await UserService.updateProfile(user._id.toString(), {
      name: { middleName: null },
    });

    expect(profile.name.middleName).toBeUndefined();
  });

  it("throws 404 for a non-existent user", async () => {
    await expect(
      UserService.updateProfile(new mongoose.Types.ObjectId().toString(), {
        username: "whatever",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 409 when the new username is already taken", async () => {
    const { doc: taker } = await createTestUser();
    const { doc: user } = await createTestUser();

    await expect(
      UserService.updateProfile(user._id.toString(), {
        username: taker.username,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("updatePassword", () => {
  it("replaces the stored password with a new hashed one", async () => {
    const { doc: user, password: oldPassword } = await createTestUser();

    await UserService.updatePassword(user._id.toString(), "NewPassword1!");

    await expect(
      UserService.verifyPassword(user._id.toString(), "NewPassword1!")
    ).resolves.toBeUndefined();
    await expect(
      UserService.verifyPassword(user._id.toString(), oldPassword)
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("listUsers", () => {
  it("Admin sees Manager and User roles but not other Admins", async () => {
    await createTestUser({ role: Role.Admin });
    await createTestUser({ role: Role.Manager });
    await createTestUser({ role: Role.User });

    const { users } = await UserService.listUsers(Role.Admin, listQuery());

    expect(users).toHaveLength(2);
    expect(users.every((u) => u.role !== Role.Admin)).toBe(true);
  });

  it("Manager sees only the User role", async () => {
    await createTestUser({ role: Role.Admin });
    await createTestUser({ role: Role.Manager });
    await createTestUser({ role: Role.User });

    const { users } = await UserService.listUsers(Role.Manager, listQuery());

    expect(users).toHaveLength(1);
    expect(users[0]!.role).toBe(Role.User);
  });

  it("intersects an explicit role filter with the allowed roles", async () => {
    await createTestUser({ role: Role.Admin });
    await createTestUser({ role: Role.Manager });

    const { users } = await UserService.listUsers(
      Role.Manager,
      listQuery({ role: Role.Admin })
    );

    expect(users).toHaveLength(0);
  });

  it("excludes soft-deleted users by default and includes them when requested", async () => {
    await createTestUser({ role: Role.User, status: "active" });
    await createTestUser({ role: Role.User, status: "deleted" });

    const activeOnly = await UserService.listUsers(Role.Admin, listQuery());
    expect(activeOnly.users).toHaveLength(1);

    const deletedOnly = await UserService.listUsers(
      Role.Admin,
      listQuery({ status: "deleted" })
    );
    expect(deletedOnly.users).toHaveLength(1);
  });

  it("searches across email, username, and name", async () => {
    const { doc: target } = await createTestUser({ role: Role.User });
    await createTestUser({ role: Role.User });

    const { users } = await UserService.listUsers(
      Role.Admin,
      listQuery({ search: target.username })
    );

    expect(users).toHaveLength(1);
    expect(users[0]!.id).toBe(target._id.toString());
  });

  it("returns pagination metadata based on total matching items", async () => {
    await createTestUser({ role: Role.User });
    await createTestUser({ role: Role.User });
    await createTestUser({ role: Role.User });

    const { meta } = await UserService.listUsers(
      Role.Admin,
      listQuery({ limit: 2 })
    );

    expect(meta).toEqual({
      page: 1,
      limit: 2,
      totalItems: 3,
      totalPages: 2,
    });
  });
});

describe("deleteUser", () => {
  it("soft-deletes the target and revokes their sessions when the actor outranks them", async () => {
    const { doc: target } = await createTestUser({ role: Role.User });
    const [sessionId] = await createSessions(target._id, 1);

    await UserService.deleteUser(Role.Manager, target._id.toString());

    const stored = await User.findById(target._id).lean();
    expect(stored!.status).toBe("deleted");
    expect(await Sessions.getSession(sessionId!)).toBeNull();
  });

  it("throws 403 when the actor does not outrank the target", async () => {
    const { doc: target } = await createTestUser({ role: Role.Manager });

    await expect(
      UserService.deleteUser(Role.Manager, target._id.toString())
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows an Admin actor to act on another Admin", async () => {
    const { doc: target } = await createTestUser({ role: Role.Admin });

    await expect(
      UserService.deleteUser(Role.Admin, target._id.toString())
    ).resolves.toBeUndefined();
  });

  it("throws 404 when the target does not exist", async () => {
    await expect(
      UserService.deleteUser(
        Role.Admin,
        new mongoose.Types.ObjectId().toString()
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("hardDeleteUser", () => {
  it("permanently removes the target and revokes their sessions", async () => {
    const { doc: target } = await createTestUser({ role: Role.User });
    const [sessionId] = await createSessions(target._id, 1);

    await UserService.hardDeleteUser(Role.Manager, target._id.toString());

    expect(await User.findById(target._id).lean()).toBeNull();
    expect(await Sessions.getSession(sessionId!)).toBeNull();
  });

  it("throws 403 when the actor does not outrank the target", async () => {
    const { doc: target } = await createTestUser({ role: Role.Admin });

    await expect(
      UserService.hardDeleteUser(Role.Manager, target._id.toString())
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("forceLogout", () => {
  it("revokes all of the target's sessions without altering their document", async () => {
    const { doc: target } = await createTestUser({ role: Role.User });
    const [sessionId] = await createSessions(target._id, 2);

    await UserService.forceLogout(Role.Manager, target._id.toString());

    expect(await Sessions.getSession(sessionId!)).toBeNull();
    const stored = await User.findById(target._id).lean();
    expect(stored!.status).toBe("active");
  });

  it("throws 403 when the actor does not outrank the target", async () => {
    const { doc: target } = await createTestUser({ role: Role.Admin });

    await expect(
      UserService.forceLogout(Role.Manager, target._id.toString())
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
