export interface Name {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export interface RegisterInput {
  username: string;
  name: Name;
  email: string;
  password: string;
  code: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
  code: string;
}

export interface LoginPrecheckInput {
  identifier: string;
  password: string;
}

export interface LoginPrecheckResult {
  email: string;
  twoFactorEnabled: boolean;
}

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeDataUrl: string;
}

export interface TwoFactorEnableResult {
  recoveryCodes: string[];
}

export interface DisableTwoFactorInput {
  password: string;
  code: string;
}

export interface RegenerateRecoveryCodesInput {
  password: string;
  code: string;
}

export interface OAuthSignup {
  token: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface SessionChoice {
  sessionId: string;
  device: string;
  createdAt: number;
}

export type LoginOutcome =
  | { requiresSessionSelection: false }
  | {
      requiresSessionSelection: true;
      token: string;
      sessions: SessionChoice[];
    };

export type OAuthLoginResult =
  | { isNewUser: true; signup: OAuthSignup }
  | { isNewUser: false; requiresTwoFactor: true; token: string }
  | ({ isNewUser: false; requiresTwoFactor: false } & LoginOutcome);

export type GoogleLoginResult = OAuthLoginResult;
export type GithubLoginResult = OAuthLoginResult;

export interface GithubLoginInput {
  code: string;
  state: string;
}

export interface ResolveOAuthTwoFactorInput {
  token: string;
  code: string;
}

export interface CompleteOAuthSignupInput {
  token: string;
  username: string;
  password: string;
  name: Name;
  avatar?: { url: string };
}

export type OtpPurpose = "register" | "login" | "reset-password";

export interface CheckOtpInput {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  username?: string;
  name?: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
  };
}

export interface ResolveLoginSessionLimitInput {
  token: string;
  sessionIdToEnd: string;
}

export interface SessionSummary extends SessionChoice {
  isCurrent: boolean;
}

export interface AvailabilityQuery {
  username?: string;
  email?: string;
}

export interface AvailabilityResult {
  username?: boolean;
  email?: boolean;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  name: Name;
  role: "Admin" | "Manager" | "User";
  status: "active" | "deleted";
  profile?: {
    avatar?: {
      url?: string;
      variant?: string;
    };
  };
  storage: {
    maxStorageInBytes: number;
  };
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
}
