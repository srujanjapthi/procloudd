import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { cancelGoogleOneTap } from "@/lib/google-one-tap.util";
import ROUTES from "@/constants/routes";

interface OAuthTwoFactorState {
  token: string;
}

export function useOAuthTwoFactorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolveOAuthTwoFactor } = useAuth();
  const state = location.state as OAuthTwoFactorState | null;
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleVerified(code: string) {
    if (!state) return;
    setIsProcessing(true);
    try {
      const outcome = await resolveOAuthTwoFactor({
        token: state.token,
        code,
      });
      if (outcome.requiresSessionSelection) {
        navigate(ROUTES.auth.sessionLimit, {
          state: { token: outcome.token, sessions: outcome.sessions },
        });
      } else {
        cancelGoogleOneTap();
        navigate(ROUTES.dashboard);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function goBack() {
    navigate(ROUTES.auth.login);
  }

  return {
    isValid: Boolean(state?.token),
    handleVerified,
    isProcessing,
    goBack,
  };
}
