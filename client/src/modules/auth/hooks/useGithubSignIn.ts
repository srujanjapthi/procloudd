import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { CURRENT_USER_QUERY_KEY } from "../queries";
import { cancelGoogleOneTap } from "@/lib/google-one-tap.util";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";
import type { GithubLoginResult } from "../types";

const POPUP_FEATURES = "width=600,height=700";

interface GithubOAuthMessage {
  type: "github-oauth-result";
  result?: GithubLoginResult;
  error?: string;
}

function isGithubOAuthMessage(data: unknown): data is GithubOAuthMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "github-oauth-result"
  );
}

export function useGithubSignIn() {
  const { getGithubAuthorizeUrl } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  function stopPolling() {
    if (pollRef.current !== undefined) {
      window.clearInterval(pollRef.current);
      pollRef.current = undefined;
    }
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!isGithubOAuthMessage(event.data)) return;

      stopPolling();
      popupRef.current?.close();
      setIsProcessing(false);

      if (event.data.error || !event.data.result) {
        toast.error(event.data.error ?? "GitHub sign-in failed");
        return;
      }

      const result = event.data.result;
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

      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      navigate(ROUTES.dashboard);
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      stopPolling();
    };
  }, [navigate, queryClient]);

  async function handleClick() {
    cancelGoogleOneTap();

    const popup = window.open("about:blank", "github-oauth", POPUP_FEATURES);
    if (!popup) {
      toast.error("Please allow popups to sign in with GitHub");
      return;
    }
    popupRef.current = popup;
    setIsProcessing(true);

    try {
      const url = await getGithubAuthorizeUrl();
      popup.location.href = url;
    } catch (error) {
      popup.close();
      setIsProcessing(false);
      toast.error(getApiErrorMessage(error, "GitHub sign-in failed"));
      return;
    }

    pollRef.current = window.setInterval(() => {
      if (popup.closed) {
        stopPolling();
        setIsProcessing(false);
      }
    }, 500);
  }

  return { handleClick, isProcessing };
}
