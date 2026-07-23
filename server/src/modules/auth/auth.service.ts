import mongoose from "mongoose";
import * as Db from "@/common/lib/db.util.js";
import * as UserService from "@/modules/user/user.service.js";
import * as OtpService from "@/modules/otp/otp.service.js";
import * as TwoFactorService from "@/modules/twofactor/twofactor.service.js";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import Sessions from "@/services/session.service.js";
import AppError from "@/common/error/app.error.js";
import AppConfig from "@/config/app.config.js";
import GoogleProvider from "@/common/auth/providers/google.provider.js";
import GithubProvider, {
  getAuthorizeUrl as getGithubProviderAuthorizeUrl,
} from "@/common/auth/providers/github.provider.js";
import * as GithubOAuthState from "@/common/auth/github-oauth-state.util.js";
import * as OAuthSignupToken from "@/common/auth/oauth-signup-token.util.js";
import * as PendingLoginToken from "@/common/auth/pending-login-token.util.js";
import { formatDevice } from "@/common/lib/user-agent.util.js";
import type { AuthProviderLink } from "@/models/user.model.js";
import type { AuthProviderProfile } from "@/common/auth/providers/auth-provider.interface.js";
import type {
  RegisterInput,
  LoginInput,
  LoginPrecheckInput,
  CompleteOAuthSignupInput,
  GithubLoginInput,
  ForgotPasswordInput,
  ChangePasswordInput,
  ResolveLoginSessionLimitInput,
  ResolveOAuthTwoFactorInput,
} from "./auth.validator.js";
import type {
  AuthSession,
  OAuthLoginResponse,
  LoginOutcome,
  SessionSummary,
} from "./auth.interface.js";

interface CreateAccountInput {
  username: string;
  name: {
    firstName: string;
    middleName?: string | undefined;
    lastName: string;
  };
  email: string;
  password: string;
  providers?: AuthProviderLink[];
  avatar?: { url: string };
}

async function createAccountWithRootDirectory(
  input: CreateAccountInput
): Promise<mongoose.Types.ObjectId> {
  const userId = new mongoose.Types.ObjectId();

  await Db.withTransaction(async (session) => {
    const rootDir = await DirectoryRepository.createRoot(userId, session);
    await UserService.createUser(
      {
        _id: userId,
        username: input.username,
        name: {
          firstName: input.name.firstName,
          lastName: input.name.lastName,
          ...(input.name.middleName !== undefined && {
            middleName: input.name.middleName,
          }),
        },
        email: input.email,
        password: input.password,
        ...(input.providers && { providers: input.providers }),
        ...(input.avatar && { avatar: input.avatar }),
        rootDirId: rootDir._id,
      },
      session
    );
  });

  return userId;
}

async function startSession(
  userId: string,
  userAgent?: string
): Promise<LoginOutcome> {
  const sessions = await Sessions.listUserSessions(userId);
  if (sessions.length >= AppConfig.session.maxPerUser) {
    const token = PendingLoginToken.createToken({ userId });
    return {
      requiresSessionSelection: true,
      token,
      sessions: sessions
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((session) => ({
          sessionId: session.sessionId,
          device: formatDevice(session.userAgent),
          createdAt: session.createdAt,
        })),
    };
  }

  const sessionId = await Sessions.createSession(userId, userAgent);
  return { requiresSessionSelection: false, session: { userId, sessionId } };
}

export async function register(input: RegisterInput): Promise<void> {
  await OtpService.verifyOtp(input.email, input.code, "register");

  await createAccountWithRootDirectory({
    username: input.username,
    name: input.name,
    email: input.email,
    password: input.password,
  });
}

async function verifyActiveCredentials(identifier: string, password: string) {
  const credentials = await UserService.verifyCredentials(identifier, password);
  if (!credentials) {
    throw AppError.unauthorized("Invalid email/username or password");
  }
  if (credentials.status !== "active") {
    throw AppError.forbidden("Your account is not active.");
  }
  return credentials;
}

export async function login(
  input: LoginInput,
  userAgent?: string
): Promise<LoginOutcome> {
  const credentials = await verifyActiveCredentials(
    input.identifier,
    input.password
  );

  if (credentials.twoFactorEnabled) {
    const isValid = await TwoFactorService.verifyLoginCode(
      credentials.id,
      input.code
    );
    if (!isValid) {
      throw AppError.unauthorized("Invalid code");
    }
  } else {
    await OtpService.verifyOtp(credentials.email, input.code, "login");
  }

  return startSession(credentials.id, userAgent);
}

export async function precheckLogin(
  input: LoginPrecheckInput
): Promise<{ email: string; twoFactorEnabled: boolean }> {
  const credentials = await verifyActiveCredentials(
    input.identifier,
    input.password
  );
  return {
    email: credentials.email,
    twoFactorEnabled: credentials.twoFactorEnabled,
  };
}

async function resolveOAuthLogin(
  profile: AuthProviderProfile,
  provider: string,
  userAgent?: string
): Promise<OAuthLoginResponse> {
  const existingUser = await UserService.findByEmail(profile.email);
  if (existingUser) {
    if (existingUser.status !== "active") {
      throw AppError.forbidden("Your account is not active.");
    }

    if (!existingUser.profile?.avatar?.url && profile.avatarUrl) {
      await UserService.updateProfile(existingUser._id.toString(), {
        profile: { avatar: { url: profile.avatarUrl } },
      });
    }

    const hasProviderLink = existingUser.auth.providers.some(
      (link) =>
        link.provider === provider && link.providerId === profile.providerId
    );
    if (!hasProviderLink) {
      await UserService.addProviderLink(existingUser._id.toString(), {
        provider,
        providerId: profile.providerId,
      });
    }

    if (existingUser.auth.twoFactor.enabled) {
      const token = PendingLoginToken.createToken({
        userId: existingUser._id.toString(),
      });
      return { isNewUser: false, requiresTwoFactor: true, token };
    }

    const outcome = await startSession(existingUser._id.toString(), userAgent);
    return { isNewUser: false, requiresTwoFactor: false, ...outcome };
  }

  const token = OAuthSignupToken.createToken({
    email: profile.email,
    provider,
    providerId: profile.providerId,
  });

  return {
    isNewUser: true,
    signup: {
      token,
      ...(profile.name?.firstName !== undefined && {
        firstName: profile.name.firstName,
      }),
      ...(profile.name?.lastName !== undefined && {
        lastName: profile.name.lastName,
      }),
      ...(profile.avatarUrl !== undefined && { avatarUrl: profile.avatarUrl }),
    },
  };
}

export async function loginWithGoogle(
  idToken: string,
  userAgent?: string
): Promise<OAuthLoginResponse> {
  const profile = await GoogleProvider.verify({ idToken });
  return resolveOAuthLogin(profile, "google", userAgent);
}

export function getGithubAuthorizeUrl(): string {
  const state = GithubOAuthState.createState();
  return getGithubProviderAuthorizeUrl(state);
}

export async function loginWithGithub(
  input: GithubLoginInput,
  userAgent?: string
): Promise<OAuthLoginResponse> {
  if (!GithubOAuthState.verifyState(input.state)) {
    throw AppError.unauthorized(
      "Sign-in session expired. Please try signing in with GitHub again."
    );
  }

  const profile = await GithubProvider.verify({ code: input.code });
  return resolveOAuthLogin(profile, "github", userAgent);
}

export async function completeOAuthSignup(
  input: CompleteOAuthSignupInput,
  userAgent?: string
): Promise<AuthSession> {
  const payload = OAuthSignupToken.verifyToken(input.token);
  if (!payload) {
    throw AppError.unauthorized(
      "Signup session expired. Please try signing in again."
    );
  }

  const userId = await createAccountWithRootDirectory({
    username: input.username,
    name: input.name,
    email: payload.email,
    password: input.password,
    providers: [{ provider: payload.provider, providerId: payload.providerId }],
    ...(input.avatar && { avatar: input.avatar }),
  });

  const sessionId = await Sessions.createSession(userId.toString(), userAgent);
  return { userId: userId.toString(), sessionId };
}

export async function resolveOAuthTwoFactor(
  input: ResolveOAuthTwoFactorInput,
  userAgent?: string
): Promise<LoginOutcome> {
  const payload = PendingLoginToken.verifyToken(input.token);
  if (!payload) {
    throw AppError.unauthorized("Sign-in session expired. Please try again.");
  }

  const isValid = await TwoFactorService.verifyLoginCode(
    payload.userId,
    input.code
  );
  if (!isValid) {
    throw AppError.unauthorized("Invalid code");
  }

  return startSession(payload.userId, userAgent);
}

export async function resolveLoginSessionLimit(
  input: ResolveLoginSessionLimitInput,
  userAgent?: string
): Promise<AuthSession> {
  const payload = PendingLoginToken.verifyToken(input.token);
  if (!payload) {
    throw AppError.unauthorized("Login session expired. Please sign in again.");
  }

  const session = await Sessions.getSession(input.sessionIdToEnd);
  if (!session || session.userId !== payload.userId) {
    throw AppError.notFound("Session not found");
  }

  await Sessions.deleteSession(input.sessionIdToEnd);
  const sessionId = await Sessions.createSession(payload.userId, userAgent);
  return { userId: payload.userId, sessionId };
}

export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<void> {
  await OtpService.verifyOtp(input.email, input.code, "reset-password");

  const user = await UserService.findByEmail(input.email);
  if (!user) {
    throw AppError.notFound("No account found with this email");
  }

  await UserService.updatePassword(user._id.toString(), input.newPassword);
  await Sessions.deleteUserSessions(user._id.toString());
}

export async function changePassword(
  userId: string,
  currentSessionId: string,
  input: ChangePasswordInput
): Promise<void> {
  await UserService.verifyPassword(userId, input.currentPassword);

  await UserService.updatePassword(userId, input.newPassword);
  await Sessions.deleteUserSessions(userId, currentSessionId);
}

export async function listSessions(
  userId: string,
  currentSessionId: string
): Promise<SessionSummary[]> {
  const sessions = await Sessions.listUserSessions(userId);

  return sessions
    .map((session) => ({
      sessionId: session.sessionId,
      device: formatDevice(session.userAgent),
      createdAt: session.createdAt,
      isCurrent: session.sessionId === currentSessionId,
    }))
    .sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
}

export async function revokeSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const session = await Sessions.getSession(sessionId);
  if (!session || session.userId !== userId) {
    throw AppError.notFound("Session not found");
  }

  await Sessions.deleteSession(sessionId);
}

export async function logout(sessionId: string): Promise<void> {
  await Sessions.deleteSession(sessionId);
}

export async function logoutAll(userId: string): Promise<void> {
  await Sessions.deleteUserSessions(userId);
}
