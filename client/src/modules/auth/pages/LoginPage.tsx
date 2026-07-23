import { Link } from "react-router";
import loginIllustration from "@/assets/illustrations/login-animate.svg";
import { AuthLayout } from "../layout/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { OtpVerifyScreen } from "../components/OtpVerifyScreen";
import { TotpLoginScreen } from "../components/TotpLoginScreen";
import { useLoginPage } from "../hooks/useLoginPage";
import ROUTES from "@/constants/routes";

export default function LoginPage() {
  const {
    isVerifyStep,
    twoFactorEnabled,
    form,
    submitCredentials,
    email,
    handleVerified,
    goBack,
  } = useLoginPage();

  if (isVerifyStep && twoFactorEnabled) {
    return (
      <AuthLayout
        title="Two-factor authentication"
        description="Confirm it's you to continue"
        illustration={loginIllustration}
      >
        <TotpLoginScreen onVerified={handleVerified} onBack={goBack} />
      </AuthLayout>
    );
  }

  if (isVerifyStep && email) {
    return (
      <AuthLayout
        title="Verify your email"
        description="Enter the code to continue"
        illustration={loginIllustration}
      >
        <OtpVerifyScreen
          email={email}
          purpose="login"
          onVerified={handleVerified}
          onBack={goBack}
          submitLabel="Sign in"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account"
      illustration={loginIllustration}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to={ROUTES.auth.register}
            className="text-foreground font-medium underline underline-offset-4"
          >
            Create one
          </Link>
        </>
      }
    >
      <LoginForm form={form} onSubmit={submitCredentials} />
    </AuthLayout>
  );
}
