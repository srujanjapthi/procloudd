import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/PasswordField";
import { FieldGroup } from "@/components/ui/field";
import { useChangePasswordForm } from "@/modules/auth/hooks/useChangePasswordForm";
import type { ChangePasswordFormValues } from "@/modules/auth/validation";

export function ChangePasswordForm() {
  const { form, submitChangePassword } = useChangePasswordForm();

  return (
    <form onSubmit={form.handleSubmit(submitChangePassword)} noValidate>
      <FieldGroup className="gap-3">
        <PasswordField<ChangePasswordFormValues>
          name="currentPassword"
          control={form.control}
          label="Current password"
          autoComplete="current-password"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <PasswordField<ChangePasswordFormValues>
            name="newPassword"
            control={form.control}
            label="New password"
            autoComplete="new-password"
            required
          />
          <PasswordField<ChangePasswordFormValues>
            name="confirmNewPassword"
            control={form.control}
            label="Confirm password"
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {form.formState.isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
