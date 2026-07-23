import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";
import type { GithubLoginResult } from "../types";

export function useGithubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGithub } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function run() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const oauthError = searchParams.get("error");

      let result: GithubLoginResult | undefined;
      let errorMessage: string | undefined;

      if (oauthError) {
        errorMessage = "GitHub sign-in was cancelled";
      } else if (!code || !state) {
        errorMessage = "Invalid GitHub sign-in response";
      } else {
        try {
          result = await loginWithGithub({ code, state });
        } catch (error) {
          errorMessage = getApiErrorMessage(error, "GitHub sign-in failed");
        }
      }

      if (window.opener) {
        window.opener.postMessage(
          { type: "github-oauth-result", result, error: errorMessage },
          window.location.origin
        );
        window.close();
        return;
      }

      if (errorMessage) {
        toast.error(errorMessage);
        navigate(ROUTES.auth.login);
        return;
      }
      if (!result) return;

      if (result.isNewUser) {
        navigate(ROUTES.auth.complete, { state: result.signup });
      } else if (result.requiresTwoFactor) {
        navigate(ROUTES.auth.oauthTwoFactor, {
          state: { token: result.token },
        });
      } else if (result.requiresSessionSelection) {
        navigate(ROUTES.auth.sessionLimit, {
          state: { token: result.token, sessions: result.sessions },
        });
      } else {
        navigate(ROUTES.dashboard);
      }
    }

    run();
  }, [searchParams, loginWithGithub, navigate]);
}
