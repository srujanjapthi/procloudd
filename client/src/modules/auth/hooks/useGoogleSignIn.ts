import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

export function useGoogleSignIn() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleCredential(credential: string | undefined) {
    if (!credential) {
      toast.error("Google sign-in failed");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await loginWithGoogle(credential);
      if (result.isNewUser) {
        navigate(ROUTES.auth.complete, { state: result.signup });
        return;
      }

      if (result.requiresTwoFactor) {
        navigate(ROUTES.auth.oauthTwoFactor, {
          state: { token: result.token },
        });
        return;
      }

      if (result.requiresSessionSelection) {
        navigate(ROUTES.auth.sessionLimit, {
          state: { token: result.token, sessions: result.sessions },
        });
        return;
      }

      navigate(ROUTES.dashboard);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Google sign-in failed"));
    } finally {
      setIsProcessing(false);
    }
  }

  return { handleCredential, isProcessing };
}
