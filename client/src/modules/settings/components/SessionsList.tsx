import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ConfirmDialogContent } from "@/components/ConfirmDialogContent";
import { SessionRow } from "@/modules/auth/components/SessionRow";
import { SessionRowSkeleton } from "@/modules/auth/components/SessionRowSkeleton";
import { useSessionsList } from "@/modules/auth/hooks/useSessionsList";

interface SessionsListProps {
  onLogoutCurrentDevice: () => void;
  isLoggingOutCurrentDevice: boolean;
  onNestedDialogOpenChange?: (open: boolean) => void;
}

export function SessionsList({
  onLogoutCurrentDevice,
  isLoggingOutCurrentDevice,
  onNestedDialogOpenChange,
}: SessionsListProps) {
  const { sessions, isLoading, isError, revokeSession, revokingSessionId } =
    useSessionsList();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <SessionRowSkeleton />
        <SessionRowSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        Couldn&apos;t load sessions. Try reloading the page.
      </p>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No other active sessions.</p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionRow
          key={session.sessionId}
          device={session.device}
          relativeTime={session.relativeTime}
          isCurrent={session.isCurrent}
          action={
            session.isCurrent ? (
              <AlertDialog onOpenChange={onNestedDialogOpenChange}>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoggingOutCurrentDevice}
                    />
                  }
                >
                  {isLoggingOutCurrentDevice ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut />
                      Log out
                    </>
                  )}
                </AlertDialogTrigger>
                <ConfirmDialogContent
                  title="Log out of this device?"
                  description="You'll need to sign in again on this device."
                  confirmLabel="Log out"
                  onConfirm={() => {
                    onNestedDialogOpenChange?.(false);
                    onLogoutCurrentDevice();
                  }}
                  isConfirming={isLoggingOutCurrentDevice}
                />
              </AlertDialog>
            ) : (
              <AlertDialog onOpenChange={onNestedDialogOpenChange}>
                <AlertDialogTrigger
                  render={<Button variant="ghost" size="sm" />}
                >
                  End session
                </AlertDialogTrigger>
                <ConfirmDialogContent
                  title="End this session?"
                  description={`${session.device} will be signed out immediately.`}
                  confirmLabel="End session"
                  onConfirm={() => {
                    onNestedDialogOpenChange?.(false);
                    revokeSession(session.sessionId);
                  }}
                  isConfirming={revokingSessionId === session.sessionId}
                />
              </AlertDialog>
            )
          }
        />
      ))}
    </div>
  );
}
