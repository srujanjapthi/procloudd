import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { FieldGroup } from "@/components/ui/field";
import type { ForgotPasswordFormValues } from "../validation";

interface ForgotPasswordFormProps {
  form: UseFormReturn<ForgotPasswordFormValues>;
  onSubmit: (values: ForgotPasswordFormValues) => void;
}

export function ForgotPasswordForm({
  form,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField<ForgotPasswordFormValues>
          name="email"
          control={form.control}
          label="Email"
          type="email"
          autoComplete="email"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <PasswordField<ForgotPasswordFormValues>
            name="newPassword"
            control={form.control}
            label="New password"
            autoComplete="new-password"
            required
          />
          <PasswordField<ForgotPasswordFormValues>
            name="confirmNewPassword"
            control={form.control}
            label="Confirm password"
            autoComplete="new-password"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="transition-transform active:scale-[0.98]"
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {form.formState.isSubmitting ? "Verifying…" : "Continue"}
        </Button>
      </FieldGroup>
    </form>
  );
}
