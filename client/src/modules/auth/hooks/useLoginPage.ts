import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { loginSchema } from "../validation";
import type { LoginFormValues } from "../validation";
import { useAuth } from "../context/AuthContext";
import { useSendOtpMutation, usePrecheckLoginMutation } from "../queries";
import { useCredentialsVerifyFlow } from "./useCredentialsVerifyFlow";
import { cancelGoogleOneTap } from "@/lib/google-one-tap.util";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

interface LoginVerifyState {
  step: "verify";
  identifier: string;
  email: string;
  password: string;
  twoFactorEnabled: boolean;
}

export function useLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const sendOtpMutation = useSendOtpMutation();
  const precheckLoginMutation = usePrecheckLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const { isVerifyStep, verifyState, proceedToVerify, goBack } =
    useCredentialsVerifyFlow<LoginFormValues, LoginVerifyState>(
      form,
      (state) => ({
        identifier: state?.identifier ?? "",
        password: state?.password ?? "",
      })
    );

  async function submitCredentials(values: LoginFormValues) {
    try {
      const { email, twoFactorEnabled } =
        await precheckLoginMutation.mutateAsync({
          identifier: values.identifier,
          password: values.password,
        });

      if (!twoFactorEnabled) {
        await sendOtpMutation.mutateAsync({ email, purpose: "login" });
      }

      proceedToVerify({
        identifier: values.identifier,
        email,
        password: values.password,
        twoFactorEnabled,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleVerified(code: string) {
    if (!verifyState) return;
    const outcome = await login({
      identifier: verifyState.identifier,
      password: verifyState.password,
      code,
    });
    if (outcome.requiresSessionSelection) {
      navigate(ROUTES.auth.sessionLimit, {
        state: { token: outcome.token, sessions: outcome.sessions },
      });
    } else {
      cancelGoogleOneTap();
      navigate(ROUTES.dashboard);
    }
  }

  return {
    isVerifyStep,
    twoFactorEnabled: verifyState?.twoFactorEnabled ?? false,
    form,
    submitCredentials,
    email: verifyState?.email,
    handleVerified,
    goBack,
  };
}
