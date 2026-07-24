import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import {
  createTestUser,
  createSessions,
  enableTwoFactor,
  generateTotpCode,
} from "@/test/fixtures.js";
import User from "@/models/user.model.js";
import Sessions from "@/services/session.service.js";
import AppConfig from "@/config/app.config.js";
import * as TwoFactorService from "../twofactor.service.js";

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("setup", () => {
  it("returns a secret and QR code, and stores an encrypted pending secret", async () => {
    const { doc: user } = await createTestUser();

    const result = await TwoFactorService.setup(user._id.toString());

    expect(typeof result.secret).toBe("string");
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);

    const stored = await User.findById(user._id)
      .select("+auth.twoFactor.pendingSecret")
      .lean();
    expect(stored!.auth.twoFactor.pendingSecret).toBeDefined();
    expect(stored!.auth.twoFactor.pendingSecret).not.toBe(result.secret);
    expect(stored!.auth.twoFactor.enabled).toBe(false);
  });

  it("rejects a non-existent user", async () => {
    await expect(
      TwoFactorService.setup(new mongoose.Types.ObjectId().toString())
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects when 2FA is already enabled", async () => {
    const { doc: user } = await createTestUser();
    await enableTwoFactor(user._id);

    await expect(
      TwoFactorService.setup(user._id.toString())
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("overwrites the pending secret when called again before verifySetup", async () => {
    const { doc: user } = await createTestUser();

    const first = await TwoFactorService.setup(user._id.toString());
    const second = await TwoFactorService.setup(user._id.toString());

    expect(second.secret).not.toBe(first.secret);
  });
});

describe("verifySetup", () => {
  async function setupPending(userId: mongoose.Types.ObjectId) {
    const { secret } = await TwoFactorService.setup(userId.toString());
    return secret;
  }

  it("activates 2FA and returns recovery codes for a correct code", async () => {
    const { doc: user } = await createTestUser();
    const secret = await setupPending(user._id);
    const code = await generateTotpCode(secret);

    const result = await TwoFactorService.verifySetup(
      user._id.toString(),
      code
    );

    expect(result.recoveryCodes).toHaveLength(AppConfig.totp.recoveryCodeCount);

    const stored = await User.findById(user._id)
      .select("+auth.twoFactor.secret +auth.twoFactor.pendingSecret")
      .lean();
    expect(stored!.auth.twoFactor.enabled).toBe(true);
    expect(stored!.auth.twoFactor.secret).toBeDefined();
    expect(stored!.auth.twoFactor.pendingSecret).toBeUndefined();
  });

  it("rejects when there is no pending setup", async () => {
    const { doc: user } = await createTestUser();

    await expect(
      TwoFactorService.verifySetup(user._id.toString(), "123456")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an incorrect code and leaves 2FA disabled", async () => {
    const { doc: user } = await createTestUser();
    await setupPending(user._id);

    await expect(
      TwoFactorService.verifySetup(user._id.toString(), "000000")
    ).rejects.toMatchObject({ statusCode: 401 });

    const stored = await User.findById(user._id).lean();
    expect(stored!.auth.twoFactor.enabled).toBe(false);
  });
});

describe("verifyLoginCode", () => {
  it("returns false for a non-existent user", async () => {
    const result = await TwoFactorService.verifyLoginCode(
      new mongoose.Types.ObjectId().toString(),
      "123456"
    );
    expect(result).toBe(false);
  });

  it("returns false when 2FA is not enabled", async () => {
    const { doc: user } = await createTestUser();
    const result = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      "123456"
    );
    expect(result).toBe(false);
  });

  it("returns true for a correct TOTP code", async () => {
    const { doc: user } = await createTestUser();
    const { secret } = await enableTwoFactor(user._id);
    const code = await generateTotpCode(secret);

    const result = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      code
    );
    expect(result).toBe(true);
  });

  it("returns false for an incorrect code", async () => {
    const { doc: user } = await createTestUser();
    await enableTwoFactor(user._id);

    const result = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      "000000"
    );
    expect(result).toBe(false);
  });

  it("returns true for a valid, unused recovery code and marks it used", async () => {
    const { doc: user } = await createTestUser();
    const { recoveryCodes } = await enableTwoFactor(user._id);

    const result = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      recoveryCodes[0]!
    );
    expect(result).toBe(true);

    const stored = await User.findById(user._id)
      .select("+auth.twoFactor.recoveryCodes")
      .lean();
    const used = stored!.auth.twoFactor.recoveryCodes!.find(
      (rc) => rc.usedAt !== undefined
    );
    expect(used).toBeDefined();
  });

  it("rejects reusing an already-used recovery code", async () => {
    const { doc: user } = await createTestUser();
    const { recoveryCodes } = await enableTwoFactor(user._id);

    const first = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      recoveryCodes[0]!
    );
    expect(first).toBe(true);

    const second = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      recoveryCodes[0]!
    );
    expect(second).toBe(false);
  });

  it("rejects a recovery code that does not match any stored hash", async () => {
    const { doc: user } = await createTestUser();
    await enableTwoFactor(user._id);

    const result = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      "ZZZZZ-99999"
    );
    expect(result).toBe(false);
  });
});

describe("disable", () => {
  it("disables 2FA and revokes other sessions but keeps the current one", async () => {
    const { doc: user, password } = await createTestUser();
    const { secret } = await enableTwoFactor(user._id);
    const code = await generateTotpCode(secret);
    const [currentSessionId, otherSessionId] = await createSessions(
      user._id,
      2
    );

    await TwoFactorService.disable(
      user._id.toString(),
      currentSessionId!,
      password,
      code
    );

    const stored = await User.findById(user._id)
      .select(
        "+auth.twoFactor.secret +auth.twoFactor.pendingSecret +auth.twoFactor.recoveryCodes"
      )
      .lean();
    expect(stored!.auth.twoFactor.enabled).toBe(false);
    expect(stored!.auth.twoFactor.secret).toBeUndefined();
    expect(stored!.auth.twoFactor.recoveryCodes).toEqual([]);

    expect(await Sessions.getSession(currentSessionId!)).not.toBeNull();
    expect(await Sessions.getSession(otherSessionId!)).toBeNull();
  });

  it("rejects an incorrect password", async () => {
    const { doc: user } = await createTestUser();
    const { secret } = await enableTwoFactor(user._id);
    const code = await generateTotpCode(secret);

    await expect(
      TwoFactorService.disable(
        user._id.toString(),
        "any-session",
        "WrongPassword1!",
        code
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects an incorrect code", async () => {
    const { doc: user, password } = await createTestUser();
    await enableTwoFactor(user._id);

    await expect(
      TwoFactorService.disable(
        user._id.toString(),
        "any-session",
        password,
        "000000"
      )
    ).rejects.toMatchObject({ statusCode: 401 });

    const stored = await User.findById(user._id).lean();
    expect(stored!.auth.twoFactor.enabled).toBe(true);
  });
});

describe("regenerateRecoveryCodes", () => {
  it("issues new recovery codes, invalidates the old ones, and revokes other sessions", async () => {
    const { doc: user, password } = await createTestUser();
    const { secret, recoveryCodes: oldCodes } = await enableTwoFactor(user._id);
    const code = await generateTotpCode(secret);
    const [currentSessionId, otherSessionId] = await createSessions(
      user._id,
      2
    );

    const result = await TwoFactorService.regenerateRecoveryCodes(
      user._id.toString(),
      currentSessionId!,
      password,
      code
    );

    expect(result.recoveryCodes).toHaveLength(AppConfig.totp.recoveryCodeCount);
    expect(result.recoveryCodes).not.toEqual(oldCodes);

    const oldStillValid = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      oldCodes[0]!
    );
    expect(oldStillValid).toBe(false);

    const newIsValid = await TwoFactorService.verifyLoginCode(
      user._id.toString(),
      result.recoveryCodes[0]!
    );
    expect(newIsValid).toBe(true);

    expect(await Sessions.getSession(currentSessionId!)).not.toBeNull();
    expect(await Sessions.getSession(otherSessionId!)).toBeNull();
  });

  it("rejects an incorrect password", async () => {
    const { doc: user } = await createTestUser();
    const { secret } = await enableTwoFactor(user._id);
    const code = await generateTotpCode(secret);

    await expect(
      TwoFactorService.regenerateRecoveryCodes(
        user._id.toString(),
        "any-session",
        "WrongPassword1!",
        code
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects when 2FA is not enabled", async () => {
    const { doc: user, password } = await createTestUser();

    await expect(
      TwoFactorService.regenerateRecoveryCodes(
        user._id.toString(),
        "any-session",
        password,
        "123456"
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an incorrect code", async () => {
    const { doc: user, password } = await createTestUser();
    await enableTwoFactor(user._id);

    await expect(
      TwoFactorService.regenerateRecoveryCodes(
        user._id.toString(),
        "any-session",
        password,
        "000000"
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
