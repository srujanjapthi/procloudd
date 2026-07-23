import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as Encryption from "@/common/lib/encryption.util.js";
import * as Totp from "@/common/lib/totp.util.js";
import * as CredentialHasher from "@/common/lib/credential-hasher.util.js";
import AppError from "@/common/error/app.error.js";
import AppConfig from "@/config/app.config.js";
import Sessions from "@/services/session.service.js";
import * as UserService from "@/modules/user/user.service.js";
import * as TwoFactorRepository from "./twofactor.repository.js";
import type { RecoveryCode } from "@/models/user.model.js";
import type { SetupResult, EnableResult } from "./twofactor.interface.js";

function generateRecoveryCode(): string {
  const raw = randomBytes(5).toString("hex").toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
}

async function generateRecoveryCodes(): Promise<{
  plain: string[];
  hashed: RecoveryCode[];
}> {
  const plain = Array.from(
    { length: AppConfig.totp.recoveryCodeCount },
    generateRecoveryCode
  );
  const hashed = await Promise.all(
    plain.map(async (code) => ({ codeHash: await CredentialHasher.hash(code) }))
  );
  return { plain, hashed };
}

export async function setup(userId: string): Promise<SetupResult> {
  const state = await TwoFactorRepository.getState(userId);
  if (!state) {
    throw AppError.notFound("User not found");
  }
  if (state.auth.twoFactor.enabled) {
    throw AppError.conflict("Two-factor authentication is already enabled");
  }

  const secret = Totp.generateSecret();
  await TwoFactorRepository.setPendingSecret(
    userId,
    Encryption.encrypt(secret)
  );

  const keyUri = Totp.getKeyUri(state.email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(keyUri);

  return { secret, qrCodeDataUrl };
}

export async function verifySetup(
  userId: string,
  code: string
): Promise<EnableResult> {
  const state = await TwoFactorRepository.getState(userId);
  if (!state?.auth.twoFactor.pendingSecret) {
    throw AppError.badRequest("No pending two-factor setup for this account");
  }

  const secret = Encryption.decrypt(state.auth.twoFactor.pendingSecret);
  const isValid = await Totp.verifyCode(code, secret);
  if (!isValid) {
    throw AppError.unauthorized("Invalid code");
  }

  const { plain, hashed } = await generateRecoveryCodes();
  await TwoFactorRepository.activate(
    userId,
    state.auth.twoFactor.pendingSecret,
    hashed
  );

  return { recoveryCodes: plain };
}

export async function verifyLoginCode(
  userId: string,
  code: string
): Promise<boolean> {
  const state = await TwoFactorRepository.getState(userId);
  if (!state?.auth.twoFactor.enabled || !state.auth.twoFactor.secret) {
    return false;
  }

  const secret = Encryption.decrypt(state.auth.twoFactor.secret);
  if (await Totp.verifyCode(code, secret)) {
    return true;
  }

  for (const recoveryCode of state.auth.twoFactor.recoveryCodes ?? []) {
    if (recoveryCode.usedAt) continue;
    if (await CredentialHasher.verify(code, recoveryCode.codeHash)) {
      await TwoFactorRepository.markRecoveryCodeUsed(
        userId,
        recoveryCode.codeHash
      );
      return true;
    }
  }

  return false;
}

export async function disable(
  userId: string,
  currentSessionId: string,
  password: string,
  code: string
): Promise<void> {
  await UserService.verifyPassword(userId, password);

  const isValid = await verifyLoginCode(userId, code);
  if (!isValid) {
    throw AppError.unauthorized("Invalid code");
  }

  await TwoFactorRepository.disable(userId);
  await Sessions.deleteUserSessions(userId, currentSessionId);
}

export async function regenerateRecoveryCodes(
  userId: string,
  currentSessionId: string,
  password: string,
  code: string
): Promise<EnableResult> {
  await UserService.verifyPassword(userId, password);

  const state = await TwoFactorRepository.getState(userId);
  if (!state?.auth.twoFactor.enabled) {
    throw AppError.badRequest("Two-factor authentication is not enabled");
  }

  const isValid = await verifyLoginCode(userId, code);
  if (!isValid) {
    throw AppError.unauthorized("Invalid code");
  }

  const { plain, hashed } = await generateRecoveryCodes();
  await TwoFactorRepository.replaceRecoveryCodes(userId, hashed);
  await Sessions.deleteUserSessions(userId, currentSessionId);

  return { recoveryCodes: plain };
}
