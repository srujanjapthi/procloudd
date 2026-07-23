import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSendOtpMutation } from "../queries";
import type { OtpPurpose } from "../types";
import { getApiErrorMessage } from "@/error/api.error";
import APP_CONFIG from "@/constants/config";

const RESEND_COOLDOWN_SECONDS: number = APP_CONFIG.otp.resendCooldownSeconds;

export function useOtpResend(
  email: string,
  purpose: OtpPurpose,
  onResendSuccess?: () => void
) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const sendOtp = useSendOtpMutation();

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, APP_CONFIG.ui.tickIntervalMs);
    return () => clearInterval(timer);
  }, [cooldown]);

  function resend() {
    sendOtp.mutate(
      { email, purpose },
      {
        onSuccess: () => {
          toast.success("Code sent — check your email");
          setCooldown(RESEND_COOLDOWN_SECONDS);
          onResendSuccess?.();
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Couldn't resend code"));
        },
      }
    );
  }

  const canResend = cooldown === 0 && !sendOtp.isPending;

  return { cooldown, canResend, isResending: sendOtp.isPending, resend };
}
