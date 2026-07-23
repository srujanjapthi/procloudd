import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { registerSchema } from "../validation";
import type { RegisterFormValues } from "../validation";
import {
  useRegisterMutation,
  useSendOtpMutation,
  useCheckAvailabilityMutation,
} from "../queries";
import { useCredentialsVerifyFlow } from "./useCredentialsVerifyFlow";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

type RegisterName = RegisterFormValues["name"];

interface RegisterVerifyState {
  step: "verify";
  username: string;
  name: RegisterName;
  email: string;
  password: string;
}

const emptyName: RegisterName = { firstName: "", middleName: "", lastName: "" };

export function useRegisterPage() {
  const navigate = useNavigate();
  const sendOtpMutation = useSendOtpMutation();
  const registerMutation = useRegisterMutation();
  const checkAvailabilityMutation = useCheckAvailabilityMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: emptyName,
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { isVerifyStep, verifyState, proceedToVerify, goBack } =
    useCredentialsVerifyFlow<RegisterFormValues, RegisterVerifyState>(
      form,
      (state) => ({
        username: state?.username ?? "",
        name: state?.name ?? emptyName,
        email: state?.email ?? "",
        password: state?.password ?? "",
        confirmPassword: "",
      })
    );

  async function submitCredentials(values: RegisterFormValues) {
    try {
      const availability = await checkAvailabilityMutation.mutateAsync({
        username: values.username,
        email: values.email,
      });
      let hasConflict = false;
      if (availability.username === false) {
        form.setError("username", { message: "Username already taken" });
        hasConflict = true;
      }
      if (availability.email === false) {
        form.setError("email", { message: "Email already in use" });
        hasConflict = true;
      }
      if (hasConflict) return;

      await sendOtpMutation.mutateAsync({
        email: values.email,
        purpose: "register",
      });
      proceedToVerify({
        username: values.username,
        name: values.name,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleVerified(code: string) {
    if (!verifyState) return;
    await registerMutation.mutateAsync({
      username: verifyState.username,
      name: {
        ...verifyState.name,
        middleName: verifyState.name.middleName || undefined,
      },
      email: verifyState.email,
      password: verifyState.password,
      code,
    });
    toast.success("Account created — please sign in");
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
