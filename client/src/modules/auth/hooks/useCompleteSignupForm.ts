import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { completeOAuthSignupSchema } from "../validation";
import type { CompleteOAuthSignupFormValues } from "../validation";
import { useAuth } from "../context/AuthContext";
import type { OAuthSignup } from "../types";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

export function useCompleteSignupForm(signup: OAuthSignup) {
  const { completeOAuthSignup } = useAuth();
  const navigate = useNavigate();
  const form = useForm<CompleteOAuthSignupFormValues>({
    resolver: zodResolver(completeOAuthSignupSchema),
    defaultValues: {
      username: "",
      name: {
        firstName: signup.firstName ?? "",
        middleName: "",
        lastName: signup.lastName ?? "",
      },
      password: "",
      confirmPassword: "",
    },
  });

  async function submitCompleteSignup(values: CompleteOAuthSignupFormValues) {
    try {
      await completeOAuthSignup({
        token: signup.token,
        username: values.username,
        password: values.password,
        name: {
          ...values.name,
          middleName: values.name.middleName || undefined,
        },
        ...(signup.avatarUrl && { avatar: { url: signup.avatarUrl } }),
      });
      navigate(ROUTES.dashboard);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return { form, submitCompleteSignup };
}
