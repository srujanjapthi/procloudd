import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { FieldGroup } from "@/components/ui/field";
import { useCompleteSignupForm } from "../hooks/useCompleteSignupForm";
import type { CompleteOAuthSignupFormValues } from "../validation";
import type { OAuthSignup } from "../types";

interface CompleteSignupFormProps {
  signup: OAuthSignup;
}

export function CompleteSignupForm({ signup }: CompleteSignupFormProps) {
  const { form, submitCompleteSignup } = useCompleteSignupForm(signup);

  return (
    <form onSubmit={form.handleSubmit(submitCompleteSignup)} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-3 gap-3">
          <TextField<CompleteOAuthSignupFormValues>
            name="name.firstName"
            control={form.control}
            label="First name"
            autoComplete="given-name"
            required
          />
          <TextField<CompleteOAuthSignupFormValues>
            name="name.middleName"
            control={form.control}
            label="Middle name"
            autoComplete="additional-name"
          />
          <TextField<CompleteOAuthSignupFormValues>
            name="name.lastName"
            control={form.control}
            label="Last name"
            autoComplete="family-name"
            required
          />
        </div>

        <TextField<CompleteOAuthSignupFormValues>
          name="username"
          control={form.control}
          label="Username"
          autoComplete="username"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <PasswordField<CompleteOAuthSignupFormValues>
            name="password"
            control={form.control}
            label="Password"
            autoComplete="new-password"
            required
          />
          <PasswordField<CompleteOAuthSignupFormValues>
            name="confirmPassword"
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
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
