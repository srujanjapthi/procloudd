import { MonitorX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ConfirmDialogContent } from "@/components/ConfirmDialogContent";
import { useAccountActions } from "@/modules/auth/hooks/useAccountActions";
import type { CurrentUser } from "@/modules/auth/types";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { TwoFactorSettings } from "./TwoFactorSettings";
import { SessionsList } from "./SessionsList";

interface SecuritySectionProps {
  user: CurrentUser;
  onNestedDialogOpenChange?: (open: boolean) => void;
}

export function SecuritySection({
  user,
  onNestedDialogOpenChange,
}: SecuritySectionProps) {
  const { handleLogout, isLoggingOut, isLoggingOutAll } =
    useAccountActions(user);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium">Security</h3>
        <p className="text-muted-foreground text-sm">
          Manage your password and active sessions.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Password</h4>
          <p className="text-muted-foreground text-xs">
            Update the password used to sign in.
          </p>
        </div>
        <ChangePasswordForm />
      </div>

      <div className="border-t pt-5">
        <TwoFactorSettings user={user} />
      </div>

      <div className="space-y-3 border-t pt-5">
        <h4 className="text-sm font-medium">Sessions</h4>

        <SessionsList
          onLogoutCurrentDevice={() => handleLogout(false)}
          isLoggingOutCurrentDevice={isLoggingOut}
          onNestedDialogOpenChange={onNestedDialogOpenChange}
        />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm">Log out of all devices</p>
            <p className="text-muted-foreground text-xs">
              End every active session, including this one.
            </p>
          </div>
          <AlertDialog onOpenChange={onNestedDialogOpenChange}>
            <AlertDialogTrigger
              render={<Button variant="destructive" size="sm" />}
            >
              <MonitorX />
              Log out of all
            </AlertDialogTrigger>
            <ConfirmDialogContent
              title="Log out of all devices?"
              description="This will end every active session for your account, including this one. You'll need to sign in again on every device."
              confirmLabel="Log out everywhere"
              onConfirm={() => {
                onNestedDialogOpenChange?.(false);
                handleLogout(true);
              }}
              isConfirming={isLoggingOutAll}
            />
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
