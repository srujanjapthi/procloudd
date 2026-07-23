import { useState } from "react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/error/api.error";

type TotpLoginMode = "totp" | "recovery";

export function useTotpLoginScreen(
  onVerified: (code: string) => Promise<void>
) {
  const [mode, setMode] = useState<TotpLoginMode>("totp");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleMode() {
    setMode((current) => (current === "totp" ? "recovery" : "totp"));
    setCode("");
  }

  async function submit() {
    if (!code) return;
    setIsSubmitting(true);
    try {
      await onVerified(code);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    mode,
    toggleMode,
    code,
    setCode,
    isSubmitting,
    submit,
    canSubmit: code.length > 0 && !isSubmitting,
  };
}
