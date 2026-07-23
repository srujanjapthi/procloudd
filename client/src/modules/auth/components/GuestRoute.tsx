import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import ROUTES from "@/constants/routes";

export default function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
