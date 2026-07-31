import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "../layout/AuthLayout";
import { SessionRow } from "../components/SessionRow";
import { useSessionLimitPage } from "../hooks/useSessionLimitPage";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import cloudSyncIllustration from "@/assets/illustrations/cloud-sync-animate.svg";
import ROUTES from "@/constants/routes";

export default function SessionLimitPage() {
  const { isValid, sessions, selectSession, endingSessionId } =
    useSessionLimitPage();

  if (!isValid) {
    return <Navigate to={ROUTES.auth.login} replace />;
  }

  return (
    <AuthLayout
      title="Too many devices signed in"
      description="You've reached the maximum number of signed-in devices. End one of these sessions to continue."
      illustration={cloudSyncIllustration}
    >
      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionRow
            key={session.sessionId}
            device={session.device}
            relativeTime={session.relativeTime}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectSession(session.sessionId)}
                disabled={endingSessionId === session.sessionId}
              >
                {endingSessionId === session.sessionId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "End & sign in"
                )}
              </Button>
            }
          />
        ))}
      </div>
      <ProcessingOverlay
        show={endingSessionId !== undefined}
        message="Signing you in…"
      />
    </AuthLayout>
  );
}
