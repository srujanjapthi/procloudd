import { toast } from "react-hot-toast";
import { useSessionsQuery, useRevokeSessionMutation } from "../queries";
import { formatRelativeTime } from "@/lib/date.util";
import { getApiErrorMessage } from "@/error/api.error";

export function useSessionsList() {
  const { data: sessions, isLoading, isError } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();

  async function revokeSession(sessionId: string) {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      toast.success("Session ended");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const items = (sessions ?? []).map((session) => ({
    ...session,
    relativeTime: formatRelativeTime(session.createdAt),
  }));

  const revokingSessionId = revokeSessionMutation.isPending
    ? revokeSessionMutation.variables
    : undefined;

  return {
    sessions: items,
    isLoading,
    isError,
    revokeSession,
    revokingSessionId,
  };
}
