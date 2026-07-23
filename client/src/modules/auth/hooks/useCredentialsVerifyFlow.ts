import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export function useCredentialsVerifyFlow<
  TFormValues extends FieldValues,
  TVerifyState extends { step: "verify" },
>(
  form: UseFormReturn<TFormValues>,
  getDefaults: (state: Partial<TVerifyState> | undefined) => TFormValues
) {
  const location = useLocation();
  const navigate = useNavigate();
  const state =
    (location.state as TVerifyState | Partial<TVerifyState> | null) ??
    undefined;
  const verifyState =
    state?.step === "verify" ? (state as TVerifyState) : undefined;

  useEffect(() => {
    if (!verifyState) {
      form.reset(getDefaults(state));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  function proceedToVerify(carried: Omit<TVerifyState, "step">) {
    navigate(location.pathname, { state: carried, replace: true });
    navigate(location.pathname, {
      state: { step: "verify", ...carried } as TVerifyState,
    });
  }

  function goBack() {
    navigate(-1);
  }

  return {
    isVerifyStep: verifyState !== undefined,
    verifyState,
    proceedToVerify,
    goBack,
  };
}
