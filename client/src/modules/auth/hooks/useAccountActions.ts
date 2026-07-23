import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import type { CurrentUser } from "../types";
import { getApiErrorMessage } from "@/error/api.error";
import ROUTES from "@/constants/routes";

export function useAccountActions(user: CurrentUser) {
  const { logout, logoutAll, isLoggingOut, isLoggingOutAll } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(allDevices: boolean) {
    try {
      await (allDevices ? logoutAll() : logout());
      navigate(ROUTES.auth.login);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const initials =
    `${user.name.firstName[0]}${user.name.lastName[0]}`.toUpperCase();
  const fullName = `${user.name.firstName} ${user.name.lastName}`;
  const avatarUrl = user.profile?.avatar?.url;

  const fields = [{ label: "Email", value: user.email }];

  return {
    initials,
    fullName,
    avatarUrl,
    fields,
    handleLogout,
    isLoggingOut,
    isLoggingOutAll,
  };
}
