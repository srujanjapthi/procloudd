import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { cancelGoogleOneTap } from "@/lib/google-one-tap.util";
import { formatRelativeTime } from "@/lib/date.util";
import type { SessionChoice } from "../types";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

interface SessionLimitState {
  token: string;
  sessions: SessionChoice[];
}

export function useSessionLimitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolveLoginSessionLimit } = useAuth();
  const state = location.state as SessionLimitState | null;
  const [endingSessionId, setEndingSessionId] = useState<string>();

  async function selectSession(sessionId: string) {
    if (!state) return;

    setEndingSessionId(sessionId);
    try {
      await resolveLoginSessionLimit({
        token: state.token,
        sessionIdToEnd: sessionId,
      });
      cancelGoogleOneTap();
      navigate(ROUTES.dashboard);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setEndingSessionId(undefined);
    }
  }

  const sessions = (state?.sessions ?? []).map((session) => ({
    sessionId: session.sessionId,
    device: session.device,
    relativeTime: formatRelativeTime(session.createdAt),
  }));

  return {
    isValid: Boolean(state?.token),
    sessions,
    selectSession,
    endingSessionId,
  };
}
