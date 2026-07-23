import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { changePasswordSchema } from "../validation";
import type { ChangePasswordFormValues } from "../validation";
import { useChangePasswordMutation } from "../queries";
import { getApiErrorMessage } from "@/error/api.error";

export function useChangePasswordForm() {
  const changePasswordMutation = useChangePasswordMutation();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function submitChangePassword(values: ChangePasswordFormValues) {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed — signed out of your other devices");
      form.reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return { form, submitChangePassword };
}
