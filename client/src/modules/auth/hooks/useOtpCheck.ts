import { useState } from "react";
import { toast } from "react-hot-toast";
import { useCheckOtpMutation } from "../queries";
import type { OtpPurpose } from "../types";
import ApiError from "@/error/api.error";

export type OtpCheckStatus = "idle" | "checking" | "valid" | "invalid";

export function useOtpCheck(
  email: string,
  purpose: OtpPurpose,
  onValid?: (code: string) => void
) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpCheckStatus>("idle");
  const [checkedResults, setCheckedResults] = useState<
    Record<string, "valid" | "invalid">
  >({});
  const checkOtpMutation = useCheckOtpMutation();

  function handleChange(value: string) {
    setCode(value);
    setStatus(checkedResults[value] ?? "idle");
  }

  function handleComplete(value: string) {
    const cached = checkedResults[value];
    if (cached) {
      setStatus(cached);
      if (cached === "valid") {
        onValid?.(value);
      }
      return;
    }

    setStatus("checking");
    checkOtpMutation.mutate(
      { email, code: value, purpose },
      {
        onSuccess: () => {
          setCheckedResults((results) => ({ ...results, [value]: "valid" }));
          setStatus("valid");
          onValid?.(value);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "RATE_LIMITED") {
            toast.error(
              error.message || "Too many attempts. Please wait a moment."
            );
            setStatus("idle");
            return;
          }
          setCheckedResults((results) => ({ ...results, [value]: "invalid" }));
          setStatus("invalid");
        },
      }
    );
  }

  function reset() {
    setCode("");
    setStatus("idle");
    setCheckedResults({});
  }

  return { code, status, handleChange, handleComplete, reset };
}
