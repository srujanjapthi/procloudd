import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GithubSignInButton } from "./GithubSignInButton";
import type { RegisterFormValues } from "../validation";

interface RegisterFormProps {
  form: UseFormReturn<RegisterFormValues>;
  onSubmit: (values: RegisterFormValues) => void;
}

export function RegisterForm({ form, onSubmit }: RegisterFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-3 gap-3">
          <TextField<RegisterFormValues>
            name="name.firstName"
            control={form.control}
            label="First name"
            autoComplete="given-name"
            required
          />
          <TextField<RegisterFormValues>
            name="name.middleName"
            control={form.control}
            label="Middle name"
            autoComplete="additional-name"
          />
          <TextField<RegisterFormValues>
            name="name.lastName"
            control={form.control}
            label="Last name"
            autoComplete="family-name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField<RegisterFormValues>
            name="username"
            control={form.control}
            label="Username"
            autoComplete="username"
            required
          />
          <TextField<RegisterFormValues>
            name="email"
            control={form.control}
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PasswordField<RegisterFormValues>
            name="password"
            control={form.control}
            label="Password"
            autoComplete="new-password"
            required
          />
          <PasswordField<RegisterFormValues>
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
          {form.formState.isSubmitting ? "Verifying…" : "Continue"}
        </Button>

        <FieldSeparator>Or continue with</FieldSeparator>

        <GoogleSignInButton />
        <GithubSignInButton />
      </FieldGroup>
    </form>
  );
}
