import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import {
  disableTwoFactorSchema,
  regenerateRecoveryCodesSchema,
} from "../validation";
import type {
  DisableTwoFactorFormValues,
  RegenerateRecoveryCodesFormValues,
} from "../validation";
import {
  useSetupTwoFactorMutation,
  useVerifyTwoFactorSetupMutation,
  useDisableTwoFactorMutation,
  useRegenerateRecoveryCodesMutation,
} from "../queries";
import type { CurrentUser, TwoFactorSetupResult } from "../types";
import { getApiErrorMessage } from "@/error/api.error";
import APP_CONFIG from "@/constants/config";

type TwoFactorView =
  "idle" | "setup" | "recovery-codes" | "disable" | "regenerate";

const COPY_FEEDBACK_MS = APP_CONFIG.ui.copyFeedbackMs;

export function useTwoFactorSettings(user: CurrentUser) {
  const [view, setView] = useState<TwoFactorView>("idle");
  const [setupData, setSetupData] = useState<TwoFactorSetupResult | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecoveryCodes, setCopiedRecoveryCodes] = useState(false);

  const setupMutation = useSetupTwoFactorMutation();
  const verifySetupMutation = useVerifyTwoFactorSetupMutation();
  const disableMutation = useDisableTwoFactorMutation();
  const regenerateMutation = useRegenerateRecoveryCodesMutation();

  const disableForm = useForm<DisableTwoFactorFormValues>({
    resolver: zodResolver(disableTwoFactorSchema),
    defaultValues: { password: "", code: "" },
  });

  const regenerateForm = useForm<RegenerateRecoveryCodesFormValues>({
    resolver: zodResolver(regenerateRecoveryCodesSchema),
    defaultValues: { password: "", code: "" },
  });

  async function startSetup() {
    try {
      const result = await setupMutation.mutateAsync();
      setSetupData(result);
      setSetupCode("");
      setView("setup");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function cancelSetup() {
    setSetupData(null);
    setSetupCode("");
    setView("idle");
  }

  async function copyWithFeedback(
    text: string,
    setCopied: (copied: boolean) => void
  ) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  function copySecret() {
    if (!setupData) return;
    void copyWithFeedback(setupData.secret, setCopiedSecret);
  }

  function copyRecoveryCodes() {
    void copyWithFeedback(recoveryCodes.join("\n"), setCopiedRecoveryCodes);
  }

  async function confirmSetup() {
    try {
      const result = await verifySetupMutation.mutateAsync(setupCode);
      setRecoveryCodes(result.recoveryCodes);
      setSetupData(null);
      setSetupCode("");
      setView("recovery-codes");
      toast.success("Two-factor authentication enabled");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid code"));
    }
  }

  function finishRecoveryCodes() {
    setRecoveryCodes([]);
    setView("idle");
  }

  function startDisable() {
    disableForm.reset({ password: "", code: "" });
    setView("disable");
  }

  function cancelDisable() {
    setView("idle");
  }

  async function submitDisable(values: DisableTwoFactorFormValues) {
    try {
      await disableMutation.mutateAsync(values);
      toast.success("Two-factor authentication disabled");
      setView("idle");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function startRegenerate() {
    regenerateForm.reset({ password: "", code: "" });
    setView("regenerate");
  }

  function cancelRegenerate() {
    setView("idle");
  }

  async function submitRegenerate(values: RegenerateRecoveryCodesFormValues) {
    try {
      const result = await regenerateMutation.mutateAsync(values);
      setRecoveryCodes(result.recoveryCodes);
      setView("recovery-codes");
      toast.success("Recovery codes regenerated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return {
    view,
    isEnabled: user.twoFactorEnabled,
    setupData,
    setupCode,
    setSetupCode,
    isSettingUp: setupMutation.isPending,
    isConfirmingSetup: verifySetupMutation.isPending,
    startSetup,
    cancelSetup,
    confirmSetup,
    copiedSecret,
    copySecret,
    recoveryCodes,
    finishRecoveryCodes,
    copiedRecoveryCodes,
    copyRecoveryCodes,
    disableForm,
    startDisable,
    cancelDisable,
    submitDisable,
    isDisabling: disableMutation.isPending,
    regenerateForm,
    startRegenerate,
    cancelRegenerate,
    submitRegenerate,
    isRegenerating: regenerateMutation.isPending,
  };
}
