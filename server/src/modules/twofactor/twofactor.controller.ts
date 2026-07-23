import type { Response } from "express";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import AppConfig from "@/config/app.config.js";
import * as TwoFactorService from "./twofactor.service.js";
import type {
  VerifyTwoFactorSetupInput,
  DisableTwoFactorInput,
  RegenerateRecoveryCodesInput,
} from "./twofactor.validator.js";

export async function setup(req: TypedRequest, res: Response): Promise<void> {
  const result = await TwoFactorService.setup(req.user!.id);
  ApiResponse.success(res, result);
}

export async function verifySetup(
  req: TypedRequest<{ body: VerifyTwoFactorSetupInput }>,
  res: Response
): Promise<void> {
  const result = await TwoFactorService.verifySetup(
    req.user!.id,
    req.body.code
  );
  ApiResponse.success(res, result, {
    message: "Two-factor authentication enabled",
  });
}

export async function disable(
  req: TypedRequest<{ body: DisableTwoFactorInput }>,
  res: Response
): Promise<void> {
  const sessionId = req.signedCookies[AppConfig.session.cookieName] as string;
  await TwoFactorService.disable(
    req.user!.id,
    sessionId,
    req.body.password,
    req.body.code
  );
  ApiResponse.success(res, null, {
    message: "Two-factor authentication disabled",
  });
}

export async function regenerateRecoveryCodes(
  req: TypedRequest<{ body: RegenerateRecoveryCodesInput }>,
  res: Response
): Promise<void> {
  const sessionId = req.signedCookies[AppConfig.session.cookieName] as string;
  const result = await TwoFactorService.regenerateRecoveryCodes(
    req.user!.id,
    sessionId,
    req.body.password,
    req.body.code
  );
  ApiResponse.success(res, result, { message: "Recovery codes regenerated" });
}
