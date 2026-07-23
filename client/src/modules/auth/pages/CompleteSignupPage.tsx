import { Navigate, useLocation } from "react-router";
import completedStepsIllustration from "@/assets/illustrations/completed-steps.svg";
import { AuthLayout } from "../layout/AuthLayout";
import { CompleteSignupForm } from "../components/CompleteSignupForm";
import type { OAuthSignup } from "../types";
import ROUTES from "@/constants/routes";

export default function CompleteSignupPage() {
  const location = useLocation();
  const signup = location.state as OAuthSignup | null;

  if (!signup?.token) {
    return <Navigate to={ROUTES.auth.login} replace />;
  }

  return (
    <AuthLayout
      title="Finish setting up your account"
      description="Choose a username and password to continue"
      illustration={completedStepsIllustration}
    >
      {signup.avatarUrl && (
        <img
          src={signup.avatarUrl}
          alt=""
          className="border-border mb-4 size-14 rounded-full border"
        />
      )}
      <CompleteSignupForm signup={signup} />
    </AuthLayout>
  );
}
