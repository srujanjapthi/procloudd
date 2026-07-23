import { Link } from "react-router";
import forgotPasswordIllustration from "@/assets/illustrations/forgot-password-animate.svg";
import { AuthLayout } from "../layout/AuthLayout";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import { OtpVerifyScreen } from "../components/OtpVerifyScreen";
import { useForgotPasswordPage } from "../hooks/useForgotPasswordPage";
import ROUTES from "@/constants/routes";

export default function ForgotPasswordPage() {
  const {
    isVerifyStep,
    form,
    submitCredentials,
    email,
    handleVerified,
    goBack,
  } = useForgotPasswordPage();

  if (isVerifyStep && email) {
    return (
      <AuthLayout
        title="Verify your email"
        description="Enter the code to continue"
        illustration={forgotPasswordIllustration}
      >
        <OtpVerifyScreen
          email={email}
          purpose="reset-password"
          onVerified={handleVerified}
          onBack={goBack}
          submitLabel="Reset password"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a verification code"
      illustration={forgotPasswordIllustration}
      footer={
        <Link
          to={ROUTES.auth.login}
          className="text-foreground font-medium underline underline-offset-4"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm form={form} onSubmit={submitCredentials} />
    </AuthLayout>
  );
}
