import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GithubSignInButton } from "./GithubSignInButton";
import type { LoginFormValues } from "../validation";
import ROUTES from "@/constants/routes";

interface LoginFormProps {
  form: UseFormReturn<LoginFormValues>;
  onSubmit: (values: LoginFormValues) => void;
}

export function LoginForm({ form, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField<LoginFormValues>
          name="identifier"
          control={form.control}
          label="Email or username"
          type="text"
          autoComplete="username"
          required
        />

        <PasswordField<LoginFormValues>
          name="password"
          control={form.control}
          label="Password"
          autoComplete="current-password"
          required
        />

        <div className="flex justify-end">
          <Link
            to={ROUTES.auth.forgotPassword}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
          >
            Forgot password?
          </Link>
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
