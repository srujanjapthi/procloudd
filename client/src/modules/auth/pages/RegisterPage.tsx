import { Link } from "react-router";
import signUpIllustration from "@/assets/illustrations/sign-up-animate.svg";
import { AuthLayout } from "../layout/AuthLayout";
import { RegisterForm } from "../components/RegisterForm";
import { OtpVerifyScreen } from "../components/OtpVerifyScreen";
import { useRegisterPage } from "../hooks/useRegisterPage";
import ROUTES from "@/constants/routes";

export default function RegisterPage() {
  const {
    isVerifyStep,
    form,
    submitCredentials,
    email,
    handleVerified,
    goBack,
  } = useRegisterPage();

  if (isVerifyStep && email) {
    return (
      <AuthLayout
        title="Verify your email"
        description="Enter the code to continue"
        illustration={signUpIllustration}
      >
        <OtpVerifyScreen
          email={email}
          purpose="register"
          onVerified={handleVerified}
          onBack={goBack}
          submitLabel="Create account"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Start storing your files securely"
      illustration={signUpIllustration}
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={ROUTES.auth.login}
            className="text-foreground font-medium underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm form={form} onSubmit={submitCredentials} />
    </AuthLayout>
  );
}
