import { useState } from "react";
import { toast } from "react-hot-toast";
import { useOtpCheck } from "./useOtpCheck";
import { useOtpResend } from "./useOtpResend";
import type { OtpPurpose } from "../types";
import { getApiErrorMessage } from "@/error/api.error";

export function useOtpVerifyScreen(
  email: string,
  purpose: OtpPurpose,
  onVerified: (code: string) => Promise<void>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(value: string) {
    setIsSubmitting(true);
    try {
      await onVerified(value);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const { code, status, handleChange, handleComplete, reset } = useOtpCheck(
    email,
    purpose,
    submit
  );
  const { cooldown, canResend, isResending, resend } = useOtpResend(
    email,
    purpose,
    reset
  );

  return {
    code,
    status,
    handleChange,
    handleComplete,
    cooldown,
    canResend,
    isResending,
    resend,
    isSubmitting,
    submit: () => submit(code),
    canSubmit: status === "valid" && !isSubmitting,
  };
}
