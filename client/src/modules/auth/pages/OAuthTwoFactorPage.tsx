import { Navigate } from "react-router";
import { AuthLayout } from "../layout/AuthLayout";
import { TotpLoginScreen } from "../components/TotpLoginScreen";
import { useOAuthTwoFactorPage } from "../hooks/useOAuthTwoFactorPage";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import loginIllustration from "@/assets/illustrations/login-animate.svg";
import ROUTES from "@/constants/routes";

export default function OAuthTwoFactorPage() {
  const { isValid, handleVerified, isProcessing, goBack } =
    useOAuthTwoFactorPage();

  if (!isValid) {
    return <Navigate to={ROUTES.auth.login} replace />;
  }

  return (
    <AuthLayout
      title="Two-factor authentication"
      description="Enter the code from your authenticator app to finish signing in."
      illustration={loginIllustration}
    >
      <TotpLoginScreen onVerified={handleVerified} onBack={goBack} />
      <ProcessingOverlay show={isProcessing} message="Verifying…" />
    </AuthLayout>
  );
}
