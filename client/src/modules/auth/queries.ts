import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import * as AuthApi from "./api";
import type { OtpPurpose, SessionSummary } from "./types";

export const CURRENT_USER_QUERY_KEY = ["auth", "currentUser"];
export const SESSIONS_QUERY_KEY = ["auth", "sessions"];

async function refreshCurrentUser(queryClient: QueryClient): Promise<void> {
  const user = await AuthApi.getCurrentUser();
  queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      try {
        return await AuthApi.getCurrentUser();
      } catch {
        return null;
      }
    },
  });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: AuthApi.register });
}

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: ({ email, purpose }: { email: string; purpose: OtpPurpose }) =>
      AuthApi.sendOtp(email, purpose),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: AuthApi.forgotPassword });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });
}

export function useSetupTwoFactorMutation() {
  return useMutation({ mutationFn: AuthApi.setupTwoFactor });
}

export function useVerifyTwoFactorSetupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.verifyTwoFactorSetup,
    onSuccess: () => refreshCurrentUser(queryClient),
  });
}

export function useDisableTwoFactorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.disableTwoFactor,
    onSuccess: () => {
      refreshCurrentUser(queryClient);
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useRegenerateRecoveryCodesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.regenerateRecoveryCodes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useCheckOtpMutation() {
  return useMutation({ mutationFn: AuthApi.checkOtp });
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: AuthApi.listSessions,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.revokeSession,
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: SESSIONS_QUERY_KEY });
      const previousSessions =
        queryClient.getQueryData<SessionSummary[]>(SESSIONS_QUERY_KEY);
      queryClient.setQueryData<SessionSummary[]>(SESSIONS_QUERY_KEY, (old) =>
        old?.filter((session) => session.sessionId !== sessionId)
      );
      return { previousSessions };
    },
    onError: (_error, _sessionId, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(SESSIONS_QUERY_KEY, context.previousSessions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.login,
    onSuccess: async (outcome) => {
      if (!outcome.requiresSessionSelection) {
        await refreshCurrentUser(queryClient);
      }
    },
  });
}

export function usePrecheckLoginMutation() {
  return useMutation({ mutationFn: AuthApi.precheckLogin });
}

export function useCheckAvailabilityMutation() {
  return useMutation({ mutationFn: AuthApi.checkAvailability });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
    },
  });
}

export function useLogoutAllMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.logoutAll,
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
    },
  });
}

export function useCompleteOAuthSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.completeOAuthSignup,
    onSuccess: () => refreshCurrentUser(queryClient),
  });
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.loginWithGoogle,
    onSuccess: async (result) => {
      if (
        !result.isNewUser &&
        !result.requiresTwoFactor &&
        !result.requiresSessionSelection
      ) {
        await refreshCurrentUser(queryClient);
      }
    },
  });
}

export function useGithubAuthorizeUrlMutation() {
  return useMutation({ mutationFn: AuthApi.getGithubAuthorizeUrl });
}

export function useGithubLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.loginWithGithub,
    onSuccess: async (result) => {
      if (
        !result.isNewUser &&
        !result.requiresTwoFactor &&
        !result.requiresSessionSelection
      ) {
        await refreshCurrentUser(queryClient);
      }
    },
  });
}

export function useResolveOAuthTwoFactorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.resolveOAuthTwoFactor,
    onSuccess: async (outcome) => {
      if (!outcome.requiresSessionSelection) {
        await refreshCurrentUser(queryClient);
      }
    },
  });
}

export function useResolveLoginSessionLimitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.resolveLoginSessionLimit,
    onSuccess: () => refreshCurrentUser(queryClient),
  });
}
