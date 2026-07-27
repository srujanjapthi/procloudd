import { AlertDialog } from "@/components/ui/alert-dialog";
import { ConfirmDialogContent } from "@/components/ConfirmDialogContent";
import { useAccountActions } from "../hooks/useAccountActions";
import type { CurrentUser } from "../types";

interface LogoutDialogProps {
  user: CurrentUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutDialog({ user, open, onOpenChange }: LogoutDialogProps) {
  const { handleLogout, isLoggingOut } = useAccountActions(user);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <ConfirmDialogContent
        title="Log out?"
        description="You'll need to sign in again on this device."
        confirmLabel="Log out"
        onConfirm={() => handleLogout(false)}
        isConfirming={isLoggingOut}
      />
    </AlertDialog>
  );
}
