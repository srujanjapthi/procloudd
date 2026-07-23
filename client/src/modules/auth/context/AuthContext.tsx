import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import {
  useCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGoogleLoginMutation,
  useCompleteOAuthSignupMutation,
  useGithubAuthorizeUrlMutation,
  useGithubLoginMutation,
  useResolveLoginSessionLimitMutation,
  useResolveOAuthTwoFactorMutation,
} from "../queries";
import type {
  CurrentUser,
  LoginInput,
  LoginOutcome,
  CompleteOAuthSignupInput,
  GoogleLoginResult,
  GithubLoginResult,
  GithubLoginInput,
  ResolveLoginSessionLimitInput,
  ResolveOAuthTwoFactorInput,
} from "../types";
import { cancelGoogleOneTap } from "@/lib/google-one-tap.util";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<LoginOutcome>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  isLoggingOut: boolean;
  isLoggingOutAll: boolean;
  loginWithGoogle: (idToken: string) => Promise<GoogleLoginResult>;
  completeOAuthSignup: (input: CompleteOAuthSignupInput) => Promise<void>;
  getGithubAuthorizeUrl: () => Promise<string>;
  loginWithGithub: (input: GithubLoginInput) => Promise<GithubLoginResult>;
  resolveOAuthTwoFactor: (
    input: ResolveOAuthTwoFactorInput
  ) => Promise<LoginOutcome>;
  resolveLoginSessionLimit: (
    input: ResolveLoginSessionLimitInput
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUserQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const logoutAllMutation = useLogoutAllMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const completeOAuthSignupMutation = useCompleteOAuthSignupMutation();
  const githubAuthorizeUrlMutation = useGithubAuthorizeUrlMutation();
  const githubLoginMutation = useGithubLoginMutation();
  const resolveOAuthTwoFactorMutation = useResolveOAuthTwoFactorMutation();
  const resolveLoginSessionLimitMutation =
    useResolveLoginSessionLimitMutation();

  useEffect(() => {
    if (user) {
      cancelGoogleOneTap();
    }
  }, [user]);

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    login: (input) => loginMutation.mutateAsync(input),
    logout: () => logoutMutation.mutateAsync(),
    logoutAll: () => logoutAllMutation.mutateAsync(),
    isLoggingOut: logoutMutation.isPending,
    isLoggingOutAll: logoutAllMutation.isPending,
    loginWithGoogle: (idToken) => googleLoginMutation.mutateAsync(idToken),
    completeOAuthSignup: (input) =>
      completeOAuthSignupMutation.mutateAsync(input),
    getGithubAuthorizeUrl: () => githubAuthorizeUrlMutation.mutateAsync(),
    loginWithGithub: (input) => githubLoginMutation.mutateAsync(input),
    resolveOAuthTwoFactor: (input) =>
      resolveOAuthTwoFactorMutation.mutateAsync(input),
    resolveLoginSessionLimit: (input) =>
      resolveLoginSessionLimitMutation.mutateAsync(input),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
