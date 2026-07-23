import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { forgotPasswordSchema } from "../validation";
import type { ForgotPasswordFormValues } from "../validation";
import {
  useForgotPasswordMutation,
  useSendOtpMutation,
  useCheckAvailabilityMutation,
} from "../queries";
import { useCredentialsVerifyFlow } from "./useCredentialsVerifyFlow";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

interface ForgotPasswordVerifyState {
  step: "verify";
  email: string;
  newPassword: string;
}

export function useForgotPasswordPage() {
  const navigate = useNavigate();
  const sendOtpMutation = useSendOtpMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const checkAvailabilityMutation = useCheckAvailabilityMutation();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "", newPassword: "", confirmNewPassword: "" },
  });

  const { isVerifyStep, verifyState, proceedToVerify, goBack } =
    useCredentialsVerifyFlow<
      ForgotPasswordFormValues,
      ForgotPasswordVerifyState
    >(form, (state) => ({
      email: state?.email ?? "",
      newPassword: state?.newPassword ?? "",
      confirmNewPassword: "",
    }));

  async function submitCredentials(values: ForgotPasswordFormValues) {
    try {
      const availability = await checkAvailabilityMutation.mutateAsync({
        email: values.email,
      });
      if (availability.email === true) {
        form.setError("email", {
          message: "No account found with this email",
        });
        return;
      }

      await sendOtpMutation.mutateAsync({
        email: values.email,
        purpose: "reset-password",
      });
      proceedToVerify({ email: values.email, newPassword: values.newPassword });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleVerified(code: string) {
    if (!verifyState) return;
    await forgotPasswordMutation.mutateAsync({
      email: verifyState.email,
      code,
      newPassword: verifyState.newPassword,
    });
    toast.success("Password reset — please sign in");
    navigate(ROUTES.auth.login);
  }

  return {
    isVerifyStep,
    form,
    submitCredentials,
    email: verifyState?.email,
    handleVerified,
    goBack,
  };
}
