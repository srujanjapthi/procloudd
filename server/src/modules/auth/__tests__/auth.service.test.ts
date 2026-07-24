import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import mongoose from "mongoose";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import User from "@/models/user.model.js";
import AppConfig from "@/config/app.config.js";
import Sessions from "@/services/session.service.js";
import * as AuthService from "../auth.service.js";
import {
  createTestUser,
  createSessions,
  enableTwoFactor,
  generateTotpCode,
  seedOtp,
} from "./fixtures.js";

vi.mock("@/common/auth/providers/google.provider.js", () => ({
  default: { provider: "google", verify: vi.fn() },
}));
vi.mock("@/common/auth/providers/github.provider.js", () => ({
  default: { provider: "github", verify: vi.fn() },
  getAuthorizeUrl: vi.fn(
    (state: string) => `https://github.example/authorize?state=${state}`
  ),
}));

const { default: GoogleProvider } =
  await import("@/common/auth/providers/google.provider.js");
const { default: GithubProvider } =
  await import("@/common/auth/providers/github.provider.js");

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
  vi.mocked(GoogleProvider.verify).mockReset();
  vi.mocked(GithubProvider.verify).mockReset();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("register", () => {
  it("creates an account and a root directory when the OTP is valid", async () => {
    const email = "new-user@example.com";
    await seedOtp(email, "1234", "register");

    await AuthService.register({
      username: "newuser",
      name: { firstName: "New", lastName: "User" },
      email,
      password: "Password1!",
      code: "1234",
    });

    const user = await User.findOne({ email }).lean();
    expect(user).not.toBeNull();
    expect(user!.username).toBe("newuser");
    expect(user!.auth.password).not.toBe("Password1!");

    const directoryCount = await mongoose.connection
      .collection("directories")
      .countDocuments({ userId: user!._id });
    expect(directoryCount).toBe(1);
  });

  it("rejects an invalid OTP", async () => {
    const email = "new-user@example.com";
    await seedOtp(email, "1234", "register");

    await expect(
      AuthService.register({
        username: "newuser",
        name: { firstName: "New", lastName: "User" },
        email,
        password: "Password1!",
        code: "9999",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an OTP for the wrong purpose", async () => {
    const email = "new-user@example.com";
    await seedOtp(email, "1234", "login");

    await expect(
      AuthService.register({
        username: "newuser",
        name: { firstName: "New", lastName: "User" },
        email,
        password: "Password1!",
        code: "1234",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("consumes the OTP so it cannot be reused", async () => {
    const email = "new-user@example.com";
    await seedOtp(email, "1234", "register");

    await AuthService.register({
      username: "firstuser",
      name: { firstName: "New", lastName: "User" },
      email,
      password: "Password1!",
      code: "1234",
    });

    await expect(
      AuthService.register({
        username: "seconduser",
        name: { firstName: "New", lastName: "User" },
        email: "another@example.com",
        password: "Password1!",
        code: "1234",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a duplicate username", async () => {
    const { doc: existing } = await createTestUser();
    await seedOtp("another@example.com", "1234", "register");

    await expect(
      AuthService.register({
        username: existing.username,
        name: { firstName: "New", lastName: "User" },
        email: "another@example.com",
        password: "Password1!",
        code: "1234",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects a duplicate email", async () => {
    const { doc: existing } = await createTestUser();
    await seedOtp(existing.email, "1234", "register");

    await expect(
      AuthService.register({
        username: "brandnewusername",
        name: { firstName: "New", lastName: "User" },
        email: existing.email,
        password: "Password1!",
        code: "1234",
      })
    ).rejects.toMatchObject({ statusCode: 409 });

    const directoryCount = await mongoose.connection
      .collection("directories")
      .countDocuments({});
    expect(directoryCount).toBe(0);
  });
});

describe("login", () => {
  it("logs in with correct credentials and a valid OTP", async () => {
    const { doc: user, password } = await createTestUser();
    await seedOtp(user.email, "1234", "login");

    const outcome = await AuthService.login({
      identifier: user.email,
      password,
      code: "1234",
    });

    expect(outcome.requiresSessionSelection).toBe(false);
    if (!outcome.requiresSessionSelection) {
      expect(outcome.session.userId).toBe(user._id.toString());
    }
  });

  it("logs in by username as well as email", async () => {
    const { doc: user, password } = await createTestUser();
    await seedOtp(user.email, "1234", "login");

    const outcome = await AuthService.login({
      identifier: user.username,
      password,
      code: "1234",
    });

    expect(outcome.requiresSessionSelection).toBe(false);
  });

  it("rejects an incorrect password", async () => {
    const { doc: user } = await createTestUser();
    await seedOtp(user.email, "1234", "login");

    await expect(
      AuthService.login({
        identifier: user.email,
        password: "WrongPassword1!",
        code: "1234",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects an unknown identifier", async () => {
    await expect(
      AuthService.login({
        identifier: "nobody@example.com",
        password: "Password1!",
        code: "1234",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects login for a non-active account", async () => {
    const { doc: user, password } = await createTestUser({
      status: "deleted",
    });
    await seedOtp(user.email, "1234", "login");

    await expect(
      AuthService.login({ identifier: user.email, password, code: "1234" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects an invalid OTP for a non-2FA user", async () => {
    const { doc: user, password } = await createTestUser();
    await seedOtp(user.email, "1234", "login");

    await expect(
      AuthService.login({ identifier: user.email, password, code: "9999" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("logs in a 2FA-enabled user with a correct TOTP code, without needing an OTP", async () => {
    const { doc: user, password } = await createTestUser();
    const { secret } = await enableTwoFactor(user._id);
    const code = await generateTotpCode(secret);

    const outcome = await AuthService.login({
      identifier: user.email,
      password,
      code,
    });

    expect(outcome.requiresSessionSelection).toBe(false);
  });

  it("logs in a 2FA-enabled user with a correct recovery code", async () => {
    const { doc: user, password } = await createTestUser();
    const { recoveryCodes } = await enableTwoFactor(user._id);

    const outcome = await AuthService.login({
      identifier: user.email,
      password,
      code: recoveryCodes[0]!,
    });

    expect(outcome.requiresSessionSelection).toBe(false);

    const updated = await User.findById(user._id)
      .select("+auth.twoFactor.recoveryCodes")
      .lean();
    const used = updated!.auth.twoFactor.recoveryCodes!.find(
      (rc) => rc.usedAt !== undefined
    );
    expect(used).toBeDefined();
  });

  it("rejects a 2FA-enabled user with an incorrect code", async () => {
    const { doc: user, password } = await createTestUser();
    await enableTwoFactor(user._id);

    await expect(
      AuthService.login({ identifier: user.email, password, code: "000000" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("locks the account after too many failed attempts, even with the correct password on the next try", async () => {
    const { doc: user, password } = await createTestUser();

    for (let i = 0; i < AppConfig.login.maxFailedAttempts; i++) {
      await expect(
        AuthService.login({
          identifier: user.email,
          password: "WrongPassword1!",
          code: "1234",
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    }

    await seedOtp(user.email, "1234", "login");
    await expect(
      AuthService.login({ identifier: user.email, password, code: "1234" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("requires session selection once the user is at the session limit", async () => {
    const { doc: user, password } = await createTestUser();
    await createSessions(user._id, AppConfig.session.maxPerUser);
    await seedOtp(user.email, "1234", "login");

    const outcome = await AuthService.login({
      identifier: user.email,
      password,
      code: "1234",
    });

    expect(outcome.requiresSessionSelection).toBe(true);
    if (outcome.requiresSessionSelection) {
      expect(outcome.sessions).toHaveLength(AppConfig.session.maxPerUser);
      expect(typeof outcome.token).toBe("string");
    }
  });
});

describe("precheckLogin", () => {
  it("returns the account email and 2FA status without creating a session", async () => {
    const { doc: user, password } = await createTestUser();

    const result = await AuthService.precheckLogin({
      identifier: user.email,
      password,
    });

    expect(result).toEqual({ email: user.email, twoFactorEnabled: false });
    const sessions = await Sessions.listUserSessions(user._id.toString());
    expect(sessions).toHaveLength(0);
  });

  it("reports twoFactorEnabled: true for a 2FA-enabled user", async () => {
    const { doc: user, password } = await createTestUser();
    await enableTwoFactor(user._id);

    const result = await AuthService.precheckLogin({
      identifier: user.email,
      password,
    });

    expect(result.twoFactorEnabled).toBe(true);
  });

  it("rejects incorrect credentials", async () => {
    const { doc: user } = await createTestUser();

    await expect(
      AuthService.precheckLogin({
        identifier: user.email,
        password: "WrongPassword1!",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("loginWithGoogle (resolveOAuthLogin branches)", () => {
  it("returns a signup token for a brand-new email", async () => {
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: "brand-new@example.com",
      name: { firstName: "Ada", lastName: "Lovelace" },
    });

    const result = await AuthService.loginWithGoogle("fake-id-token");

    expect(result.isNewUser).toBe(true);
    if (result.isNewUser) {
      expect(result.signup.firstName).toBe("Ada");
      expect(typeof result.signup.token).toBe("string");
    }
  });

  it("logs in an existing user directly when 2FA is disabled and under the session limit", async () => {
    const { doc: user } = await createTestUser();
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
    });

    const result = await AuthService.loginWithGoogle("fake-id-token");

    expect(result.isNewUser).toBe(false);
    if (!result.isNewUser) {
      expect(result.requiresTwoFactor).toBe(false);
    }
  });

  it("returns requiresTwoFactor for an existing 2FA-enabled user, without creating a session", async () => {
    const { doc: user } = await createTestUser();
    await enableTwoFactor(user._id);
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
    });

    const result = await AuthService.loginWithGoogle("fake-id-token");

    expect(result.isNewUser).toBe(false);
    if (!result.isNewUser) {
      expect(result.requiresTwoFactor).toBe(true);
    }
    const sessions = await Sessions.listUserSessions(user._id.toString());
    expect(sessions).toHaveLength(0);
  });

  it("rejects login for an existing but non-active account", async () => {
    const { doc: user } = await createTestUser({ status: "deleted" });
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
    });

    await expect(
      AuthService.loginWithGoogle("fake-id-token")
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("links the provider on first login via that provider", async () => {
    const { doc: user } = await createTestUser();
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
    });

    await AuthService.loginWithGoogle("fake-id-token");

    const updated = await User.findById(user._id).lean();
    expect(updated!.auth.providers).toContainEqual({
      provider: "google",
      providerId: "google-123",
    });
  });

  it("does not duplicate the provider link on a second login via the same provider", async () => {
    const { doc: user } = await createTestUser();
    vi.mocked(GoogleProvider.verify)
      .mockResolvedValueOnce({ providerId: "google-123", email: user.email })
      .mockResolvedValueOnce({ providerId: "google-123", email: user.email });

    await AuthService.loginWithGoogle("fake-id-token");
    await AuthService.loginWithGoogle("fake-id-token");

    const updated = await User.findById(user._id).lean();
    const matching = updated!.auth.providers.filter(
      (link) => link.provider === "google" && link.providerId === "google-123"
    );
    expect(matching).toHaveLength(1);
  });

  it("fills in a missing avatar from the provider profile", async () => {
    const { doc: user } = await createTestUser();
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
      avatarUrl: "https://example.com/avatar.png",
    });

    await AuthService.loginWithGoogle("fake-id-token");

    const updated = await User.findById(user._id).lean();
    expect(updated!.profile?.avatar?.url).toBe(
      "https://example.com/avatar.png"
    );
  });

  it("does not overwrite an existing avatar with the provider's avatar", async () => {
    const { doc: user } = await createTestUser();
    await User.updateOne(
      { _id: user._id },
      { $set: { "profile.avatar.url": "https://example.com/original.png" } }
    );
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
      avatarUrl: "https://example.com/from-google.png",
    });

    await AuthService.loginWithGoogle("fake-id-token");

    const updated = await User.findById(user._id).lean();
    expect(updated!.profile?.avatar?.url).toBe(
      "https://example.com/original.png"
    );
  });

  it("requires session selection for an existing user at the session limit", async () => {
    const { doc: user } = await createTestUser();
    await createSessions(user._id, AppConfig.session.maxPerUser);
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-123",
      email: user.email,
    });

    const result = await AuthService.loginWithGoogle("fake-id-token");

    expect(result.isNewUser).toBe(false);
    if (!result.isNewUser && !result.requiresTwoFactor) {
      expect(result.requiresSessionSelection).toBe(true);
    }
  });

  it("propagates an error thrown by the provider", async () => {
    vi.mocked(GoogleProvider.verify).mockRejectedValueOnce(
      new Error("Invalid Google token")
    );

    await expect(AuthService.loginWithGoogle("bad-token")).rejects.toThrow(
      "Invalid Google token"
    );
  });
});

describe("getGithubAuthorizeUrl", () => {
  it("returns a URL containing a state parameter", () => {
    const url = AuthService.getGithubAuthorizeUrl();
    expect(url).toContain("state=");
  });
});

describe("loginWithGithub", () => {
  it("rejects an invalid/expired state", async () => {
    await expect(
      AuthService.loginWithGithub({ code: "some-code", state: "bogus-state" })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(GithubProvider.verify).not.toHaveBeenCalled();
  });

  it("resolves a new-user signup for a valid state", async () => {
    const state = AuthService.getGithubAuthorizeUrl().split("state=")[1]!;
    vi.mocked(GithubProvider.verify).mockResolvedValueOnce({
      providerId: "gh-1",
      email: "gh-new@example.com",
    });

    const result = await AuthService.loginWithGithub({
      code: "some-code",
      state,
    });

    expect(result.isNewUser).toBe(true);
  });
});

describe("completeOAuthSignup", () => {
  async function createSignupToken(email: string) {
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-999",
      email,
    });
    const result = await AuthService.loginWithGoogle("fake-id-token");
    if (!result.isNewUser) {
      throw new Error("expected a new-user signup response");
    }
    return result.signup.token;
  }

  it("creates the account with the provider link and starts a session", async () => {
    const token = await createSignupToken("signup@example.com");

    const session = await AuthService.completeOAuthSignup({
      token,
      username: "signupuser",
      name: { firstName: "Signup", lastName: "User" },
      password: "Password1!",
    });

    expect(session.sessionId).toBeTruthy();
    const user = await User.findOne({ email: "signup@example.com" }).lean();
    expect(user!.auth.providers).toContainEqual({
      provider: "google",
      providerId: "google-999",
    });
  });

  it("rejects reusing the token a second time, via the duplicate-email constraint", async () => {
    const token = await createSignupToken("signup2@example.com");
    await AuthService.completeOAuthSignup({
      token,
      username: "signupuser2",
      name: { firstName: "Signup", lastName: "User" },
      password: "Password1!",
    });

    await expect(
      AuthService.completeOAuthSignup({
        token,
        username: "anotherusername",
        name: { firstName: "Signup", lastName: "User" },
        password: "Password1!",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects a completely bogus token", async () => {
    await expect(
      AuthService.completeOAuthSignup({
        token: "not-a-real-token",
        username: "signupuser3",
        name: { firstName: "Signup", lastName: "User" },
        password: "Password1!",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects a duplicate username", async () => {
    const { doc: existing } = await createTestUser();
    const token = await createSignupToken("signup4@example.com");

    await expect(
      AuthService.completeOAuthSignup({
        token,
        username: existing.username,
        name: { firstName: "Signup", lastName: "User" },
        password: "Password1!",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("resolveOAuthTwoFactor", () => {
  async function createPendingToken() {
    const { doc: user } = await createTestUser();
    const { secret } = await enableTwoFactor(user._id);
    vi.mocked(GoogleProvider.verify).mockResolvedValueOnce({
      providerId: "google-2fa",
      email: user.email,
    });
    const result = await AuthService.loginWithGoogle("fake-id-token");
    if (result.isNewUser || !result.requiresTwoFactor) {
      throw new Error("expected requiresTwoFactor");
    }
    return { token: result.token, user, secret };
  }

  it("creates a session when given a valid token and correct code", async () => {
    const { token, secret } = await createPendingToken();
    const code = await generateTotpCode(secret);

    const outcome = await AuthService.resolveOAuthTwoFactor({ token, code });

    expect(outcome.requiresSessionSelection).toBe(false);
  });

  it("rejects an invalid token", async () => {
    await expect(
      AuthService.resolveOAuthTwoFactor({ token: "bogus", code: "123456" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects an incorrect code", async () => {
    const { token } = await createPendingToken();

    await expect(
      AuthService.resolveOAuthTwoFactor({ token, code: "000000" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("resolveLoginSessionLimit", () => {
  async function createSessionLimitToken() {
    const { doc: user, password } = await createTestUser();
    const sessionIds = await createSessions(
      user._id,
      AppConfig.session.maxPerUser
    );
    await seedOtp(user.email, "1234", "login");
    const outcome = await AuthService.login({
      identifier: user.email,
      password,
      code: "1234",
    });
    if (!outcome.requiresSessionSelection) {
      throw new Error("expected requiresSessionSelection");
    }
    return { token: outcome.token, user, sessionIds };
  }

  it("ends the chosen session and creates a new one", async () => {
    const { token, sessionIds } = await createSessionLimitToken();

    const result = await AuthService.resolveLoginSessionLimit({
      token,
      sessionIdToEnd: sessionIds[0]!,
    });

    expect(result.sessionId).not.toBe(sessionIds[0]);
    const remaining = await Sessions.getSession(sessionIds[0]!);
    expect(remaining).toBeNull();
  });

  it("rejects an invalid token", async () => {
    await expect(
      AuthService.resolveLoginSessionLimit({
        token: "bogus",
        sessionIdToEnd: "any",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects a session id that does not exist", async () => {
    const { token } = await createSessionLimitToken();

    await expect(
      AuthService.resolveLoginSessionLimit({
        token,
        sessionIdToEnd: "00000000-0000-0000-0000-000000000000",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects a session id belonging to a different user", async () => {
    const { token } = await createSessionLimitToken();
    const { doc: otherUser } = await createTestUser();
    const otherSessionId = await Sessions.createSession(
      otherUser._id.toString()
    );

    await expect(
      AuthService.resolveLoginSessionLimit({
        token,
        sessionIdToEnd: otherSessionId,
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    const stillThere = await Sessions.getSession(otherSessionId);
    expect(stillThere).not.toBeNull();
  });
});

describe("forgotPassword", () => {
  it("updates the password and revokes all sessions", async () => {
    const { doc: user } = await createTestUser();
    await Sessions.createSession(user._id.toString());
    await seedOtp(user.email, "1234", "reset-password");

    await AuthService.forgotPassword({
      email: user.email,
      code: "1234",
      newPassword: "NewPassword1!",
    });

    const sessions = await Sessions.listUserSessions(user._id.toString());
    expect(sessions).toHaveLength(0);

    await expect(
      AuthService.precheckLogin({
        identifier: user.email,
        password: "NewPassword1!",
      })
    ).resolves.toBeDefined();
  });

  it("rejects an invalid OTP", async () => {
    const { doc: user } = await createTestUser();
    await seedOtp(user.email, "1234", "reset-password");

    await expect(
      AuthService.forgotPassword({
        email: user.email,
        code: "9999",
        newPassword: "NewPassword1!",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a valid OTP for an email with no account", async () => {
    await seedOtp("ghost@example.com", "1234", "reset-password");

    await expect(
      AuthService.forgotPassword({
        email: "ghost@example.com",
        code: "1234",
        newPassword: "NewPassword1!",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("changePassword", () => {
  it("updates the password and revokes other sessions but keeps the current one", async () => {
    const { doc: user, password } = await createTestUser();
    const currentSessionId = await Sessions.createSession(user._id.toString());
    const otherSessionId = await Sessions.createSession(user._id.toString());

    await AuthService.changePassword(user._id.toString(), currentSessionId, {
      currentPassword: password,
      newPassword: "NewPassword1!",
    });

    expect(await Sessions.getSession(currentSessionId)).not.toBeNull();
    expect(await Sessions.getSession(otherSessionId)).toBeNull();
  });

  it("rejects an incorrect current password", async () => {
    const { doc: user } = await createTestUser();
    const currentSessionId = await Sessions.createSession(user._id.toString());

    await expect(
      AuthService.changePassword(user._id.toString(), currentSessionId, {
        currentPassword: "WrongPassword1!",
        newPassword: "NewPassword1!",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("listSessions", () => {
  it("marks the current session and sorts current-first, then by recency", async () => {
    const { doc: user } = await createTestUser();
    const older = await Sessions.createSession(user._id.toString());
    await new Promise((resolve) => setTimeout(resolve, 5));
    const current = await Sessions.createSession(user._id.toString());

    const sessions = await AuthService.listSessions(
      user._id.toString(),
      current
    );

    expect(sessions[0]!.sessionId).toBe(current);
    expect(sessions[0]!.isCurrent).toBe(true);
    expect(sessions[1]!.sessionId).toBe(older);
    expect(sessions[1]!.isCurrent).toBe(false);
  });

  it("returns an empty list when there are no sessions", async () => {
    const { doc: user } = await createTestUser();
    const sessions = await AuthService.listSessions(user._id.toString(), "any");
    expect(sessions).toEqual([]);
  });
});

describe("revokeSession", () => {
  it("deletes the caller's own session", async () => {
    const { doc: user } = await createTestUser();
    const sessionId = await Sessions.createSession(user._id.toString());

    await AuthService.revokeSession(user._id.toString(), sessionId);

    expect(await Sessions.getSession(sessionId)).toBeNull();
  });

  it("rejects revoking a session that does not exist", async () => {
    const { doc: user } = await createTestUser();

    await expect(
      AuthService.revokeSession(
        user._id.toString(),
        "00000000-0000-0000-0000-000000000000"
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects revoking another user's session", async () => {
    const { doc: user } = await createTestUser();
    const { doc: otherUser } = await createTestUser();
    const otherSessionId = await Sessions.createSession(
      otherUser._id.toString()
    );

    await expect(
      AuthService.revokeSession(user._id.toString(), otherSessionId)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(await Sessions.getSession(otherSessionId)).not.toBeNull();
  });
});

describe("logout / logoutAll", () => {
  it("logout deletes only the given session", async () => {
    const { doc: user } = await createTestUser();
    const sessionA = await Sessions.createSession(user._id.toString());
    const sessionB = await Sessions.createSession(user._id.toString());

    await AuthService.logout(sessionA);

    expect(await Sessions.getSession(sessionA)).toBeNull();
    expect(await Sessions.getSession(sessionB)).not.toBeNull();
  });

  it("logoutAll deletes every session for the user", async () => {
    const { doc: user } = await createTestUser();
    await Sessions.createSession(user._id.toString());
    await Sessions.createSession(user._id.toString());

    await AuthService.logoutAll(user._id.toString());

    const sessions = await Sessions.listUserSessions(user._id.toString());
    expect(sessions).toHaveLength(0);
  });
});
