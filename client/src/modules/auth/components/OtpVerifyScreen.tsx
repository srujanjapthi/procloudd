import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useOtpVerifyScreen } from "../hooks/useOtpVerifyScreen";
import type { OtpPurpose } from "../types";
import APP_CONFIG from "@/constants/config";

const CODE_LENGTH = APP_CONFIG.otp.codeLength;

interface OtpVerifyScreenProps {
  email: string;
  purpose: OtpPurpose;
  onVerified: (code: string) => Promise<void>;
  onBack: () => void;
  submitLabel: string;
}

export function OtpVerifyScreen({
  email,
  purpose,
  onVerified,
  onBack,
  submitLabel,
}: OtpVerifyScreenProps) {
  const {
    code,
    status,
    handleChange,
    handleComplete,
    cooldown,
    canResend,
    isResending,
    resend,
    isSubmitting,
    submit,
    canSubmit,
  } = useOtpVerifyScreen(email, purpose, onVerified);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <p className="text-muted-foreground text-sm">
        We sent a code to{" "}
        <span className="text-foreground font-medium">{email}</span>
      </p>

      <div className="flex flex-col items-center gap-3">
        <InputOTP
          maxLength={CODE_LENGTH}
          value={code}
          onChange={handleChange}
          onComplete={handleComplete}
          disabled={isSubmitting}
        >
          <InputOTPGroup aria-invalid={status === "invalid"}>
            {Array.from({ length: CODE_LENGTH }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="size-11 text-base"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <div className="flex h-5 items-center justify-center">
          {status === "checking" && (
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <Loader2 className="size-3 animate-spin" /> Checking…
            </p>
          )}
          {status === "valid" && (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="size-3" /> Code verified
            </p>
          )}
          {status === "invalid" && (
            <p className="text-destructive flex items-center gap-1 text-xs">
              <XCircle className="size-3" /> Incorrect code
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={resend}
          disabled={!canResend}
          className="h-auto p-0 text-xs"
        >
          {isResending
            ? "Sending…"
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </Button>
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Verifying…" : submitLabel}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="w-full"
      >
        Back
      </Button>
    </form>
  );
}
