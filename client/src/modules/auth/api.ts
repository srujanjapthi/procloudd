import apiClient from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  RegisterInput,
  LoginInput,
  LoginPrecheckInput,
  LoginPrecheckResult,
  LoginOutcome,
  GoogleLoginResult,
  GithubLoginResult,
  GithubLoginInput,
  CompleteOAuthSignupInput,
  ForgotPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  ResolveLoginSessionLimitInput,
  ResolveOAuthTwoFactorInput,
  CheckOtpInput,
  AvailabilityQuery,
  AvailabilityResult,
  SessionSummary,
  OtpPurpose,
  CurrentUser,
  TwoFactorSetupResult,
  TwoFactorEnableResult,
  DisableTwoFactorInput,
  RegenerateRecoveryCodesInput,
} from "./types";

export async function register(input: RegisterInput): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/register", input);
}

export async function login(input: LoginInput): Promise<LoginOutcome> {
  const response = await apiClient.post<ApiSuccessResponse<LoginOutcome>>(
    "/auth/login",
    input
  );
  return response.data.data;
}

export async function precheckLogin(
  input: LoginPrecheckInput
): Promise<LoginPrecheckResult> {
  const response = await apiClient.post<
    ApiSuccessResponse<LoginPrecheckResult>
  >("/auth/login/precheck", input);
  return response.data.data;
}

export async function checkAvailability(
  query: AvailabilityQuery
): Promise<AvailabilityResult> {
  const response = await apiClient.get<
    ApiSuccessResponse<{ available: AvailabilityResult }>
  >("/users/availability", { params: query });
  return response.data.data.available;
}

export async function logout(): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/logout");
}

export async function logoutAll(): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/logout-all");
}

export async function loginWithGoogle(
  idToken: string
): Promise<GoogleLoginResult> {
  const response = await apiClient.post<ApiSuccessResponse<GoogleLoginResult>>(
    "/auth/google",
    { idToken }
  );
  return response.data.data;
}

export async function completeOAuthSignup(
  input: CompleteOAuthSignupInput
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>(
    "/auth/complete-oauth-signup",
    input
  );
}

export async function getGithubAuthorizeUrl(): Promise<string> {
  const response = await apiClient.get<ApiSuccessResponse<{ url: string }>>(
    "/auth/github/authorize-url"
  );
  return response.data.data.url;
}

export async function loginWithGithub(
  input: GithubLoginInput
): Promise<GithubLoginResult> {
  const response = await apiClient.post<ApiSuccessResponse<GithubLoginResult>>(
    "/auth/github",
    input
  );
  return response.data.data;
}

export async function resolveOAuthTwoFactor(
  input: ResolveOAuthTwoFactorInput
): Promise<LoginOutcome> {
  const response = await apiClient.post<ApiSuccessResponse<LoginOutcome>>(
    "/auth/resolve-oauth-two-factor",
    input
  );
  return response.data.data;
}

export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>(
    "/auth/forgot-password",
    input
  );
}

export async function changePassword(
  input: ChangePasswordInput
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>(
    "/auth/change-password",
    input
  );
}

export async function resolveLoginSessionLimit(
  input: ResolveLoginSessionLimitInput
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>(
    "/auth/login/resolve-session-limit",
    input
  );
}

export async function listSessions(): Promise<SessionSummary[]> {
  const response =
    await apiClient.get<ApiSuccessResponse<SessionSummary[]>>("/auth/sessions");
  return response.data.data;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(
    `/auth/sessions/${sessionId}`
  );
}

export async function sendOtp(
  email: string,
  purpose: OtpPurpose
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/otp/send", {
    email,
    purpose,
  });
}

export async function checkOtp(input: CheckOtpInput): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/otp/verify", input);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response =
    await apiClient.get<ApiSuccessResponse<CurrentUser>>("/users/me");
  return response.data.data;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<CurrentUser> {
  const response = await apiClient.patch<ApiSuccessResponse<CurrentUser>>(
    "/users/me",
    input
  );
  return response.data.data;
}

export async function setupTwoFactor(): Promise<TwoFactorSetupResult> {
  const response =
    await apiClient.post<ApiSuccessResponse<TwoFactorSetupResult>>(
      "/auth/2fa/setup"
    );
  return response.data.data;
}

export async function verifyTwoFactorSetup(
  code: string
): Promise<TwoFactorEnableResult> {
  const response = await apiClient.post<
    ApiSuccessResponse<TwoFactorEnableResult>
  >("/auth/2fa/verify-setup", { code });
  return response.data.data;
}

export async function disableTwoFactor(
  input: DisableTwoFactorInput
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/2fa/disable", input);
}

export async function regenerateRecoveryCodes(
  input: RegenerateRecoveryCodesInput
): Promise<TwoFactorEnableResult> {
  const response = await apiClient.post<
    ApiSuccessResponse<TwoFactorEnableResult>
  >("/auth/2fa/recovery-codes/regenerate", input);
  return response.data.data;
}
