import type { Response } from "express";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as Cookie from "@/common/lib/cookie.util.js";
import AppConfig from "@/config/app.config.js";
import * as AuthService from "./auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  LoginPrecheckInput,
  GoogleLoginInput,
  GithubLoginInput,
  CompleteOAuthSignupInput,
  ForgotPasswordInput,
  ChangePasswordInput,
  ResolveLoginSessionLimitInput,
  ResolveOAuthTwoFactorInput,
} from "./auth.validator.js";
import type { OAuthLoginResponse } from "./auth.interface.js";

const SESSION_COOKIE_MAX_AGE_MS = AppConfig.session.ttlSeconds * 1000;

function setSessionCookie(res: Response, sessionId: string): void {
  Cookie.setCookie(res, AppConfig.session.cookieName, sessionId, {
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
  });
}

function respondToOAuthLogin(res: Response, result: OAuthLoginResponse): void {
  if (result.isNewUser) {
    ApiResponse.success(
      res,
      { isNewUser: true, signup: result.signup },
      { message: "Please complete your account setup" }
    );
    return;
  }

  if (result.requiresTwoFactor) {
    ApiResponse.success(
      res,
      { isNewUser: false, requiresTwoFactor: true, token: result.token },
      { message: "Enter your two-factor code to continue" }
    );
    return;
  }

  if (result.requiresSessionSelection) {
    ApiResponse.success(
      res,
      {
        isNewUser: false,
        requiresTwoFactor: false,
        requiresSessionSelection: true,
        token: result.token,
        sessions: result.sessions,
      },
      { message: "Choose a device to sign out to continue" }
    );
    return;
  }

  setSessionCookie(res, result.session.sessionId);
  ApiResponse.success(
    res,
    {
      isNewUser: false,
      requiresTwoFactor: false,
      requiresSessionSelection: false,
    },
    { message: "Signed in successfully" }
  );
}

export async function register(
  req: TypedRequest<{ body: RegisterInput }>,
  res: Response
): Promise<void> {
  await AuthService.register(req.body);
  ApiResponse.success(res, null, { message: "Account created successfully" });
}

export async function login(
  req: TypedRequest<{ body: LoginInput }>,
  res: Response
): Promise<void> {
  const outcome = await AuthService.login(req.body, req.get("user-agent"));

  if (outcome.requiresSessionSelection) {
    ApiResponse.success(
      res,
      {
        requiresSessionSelection: true,
        token: outcome.token,
        sessions: outcome.sessions,
      },
      { message: "Choose a device to sign out to continue" }
    );
    return;
  }

  setSessionCookie(res, outcome.session.sessionId);
  ApiResponse.success(
    res,
    { requiresSessionSelection: false },
    { message: "Signed in successfully" }
  );
}

export async function precheckLogin(
  req: TypedRequest<{ body: LoginPrecheckInput }>,
  res: Response
): Promise<void> {
  const { email, twoFactorEnabled } = await AuthService.precheckLogin(req.body);
  ApiResponse.success(
    res,
    { email, twoFactorEnabled },
    { message: "Credentials verified" }
  );
}

export async function loginWithGoogle(
  req: TypedRequest<{ body: GoogleLoginInput }>,
  res: Response
): Promise<void> {
  const result = await AuthService.loginWithGoogle(
    req.body.idToken,
    req.get("user-agent")
  );
  respondToOAuthLogin(res, result);
}

export function getGithubAuthorizeUrl(_req: TypedRequest, res: Response): void {
  const url = AuthService.getGithubAuthorizeUrl();
  ApiResponse.success(res, { url });
}

export async function loginWithGithub(
  req: TypedRequest<{ body: GithubLoginInput }>,
  res: Response
): Promise<void> {
  const result = await AuthService.loginWithGithub(
    req.body,
    req.get("user-agent")
  );
  respondToOAuthLogin(res, result);
}

export async function resolveOAuthTwoFactor(
  req: TypedRequest<{ body: ResolveOAuthTwoFactorInput }>,
  res: Response
): Promise<void> {
  const outcome = await AuthService.resolveOAuthTwoFactor(
    req.body,
    req.get("user-agent")
  );

  if (outcome.requiresSessionSelection) {
    ApiResponse.success(
      res,
      {
        requiresSessionSelection: true,
        token: outcome.token,
        sessions: outcome.sessions,
      },
      { message: "Choose a device to sign out to continue" }
    );
    return;
  }

  setSessionCookie(res, outcome.session.sessionId);
  ApiResponse.success(
    res,
    { requiresSessionSelection: false },
    { message: "Signed in successfully" }
  );
}

export async function resolveLoginSessionLimit(
  req: TypedRequest<{ body: ResolveLoginSessionLimitInput }>,
  res: Response
): Promise<void> {
  const { sessionId } = await AuthService.resolveLoginSessionLimit(
    req.body,
    req.get("user-agent")
  );
  setSessionCookie(res, sessionId);
  ApiResponse.success(res, null, { message: "Signed in successfully" });
}

export async function completeOAuthSignup(
  req: TypedRequest<{ body: CompleteOAuthSignupInput }>,
  res: Response
): Promise<void> {
  const { sessionId } = await AuthService.completeOAuthSignup(
    req.body,
    req.get("user-agent")
  );
  setSessionCookie(res, sessionId);
  ApiResponse.success(res, null, { message: "Account created successfully" });
}

export async function forgotPassword(
  req: TypedRequest<{ body: ForgotPasswordInput }>,
  res: Response
): Promise<void> {
  await AuthService.forgotPassword(req.body);
  ApiResponse.success(res, null, { message: "Password reset successfully" });
}

export async function changePassword(
  req: TypedRequest<{ body: ChangePasswordInput }>,
  res: Response
): Promise<void> {
  const sessionId = req.signedCookies[AppConfig.session.cookieName] as string;
  await AuthService.changePassword(req.user!.id, sessionId, req.body);
  ApiResponse.success(res, null, { message: "Password changed successfully" });
}

export async function listSessions(
  req: TypedRequest,
  res: Response
): Promise<void> {
  const currentSessionId = req.signedCookies[
    AppConfig.session.cookieName
  ] as string;
  const sessions = await AuthService.listSessions(
    req.user!.id,
    currentSessionId
  );
  ApiResponse.success(res, sessions);
}

export async function revokeSession(
  req: TypedRequest<{ params: { sessionId: string } }>,
  res: Response
): Promise<void> {
  await AuthService.revokeSession(req.user!.id, req.params.sessionId);
  ApiResponse.success(res, null, { message: "Session ended" });
}

export async function logout(req: TypedRequest, res: Response): Promise<void> {
  const sessionId = req.signedCookies[AppConfig.session.cookieName] as
    string | undefined;
  if (sessionId) {
    await AuthService.logout(sessionId);
  }
  Cookie.clearCookie(res, AppConfig.session.cookieName);
  ApiResponse.success(res, null, { message: "Signed out successfully" });
}

export async function logoutAll(
  req: TypedRequest,
  res: Response
): Promise<void> {
  await AuthService.logoutAll(req.user!.id);
  Cookie.clearCookie(res, AppConfig.session.cookieName);
  ApiResponse.success(res, null, {
    message: "Signed out from all devices",
  });
}
