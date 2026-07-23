import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import ROUTES from "@/constants/routes";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate to={ROUTES.auth.login} replace state={{ from: location }} />
    );
  }

  return <Outlet />;
}
