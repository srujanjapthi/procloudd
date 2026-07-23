import { Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/modules/auth/pages/LoginPage";
import RegisterPage from "@/modules/auth/pages/RegisterPage";
import CompleteSignupPage from "@/modules/auth/pages/CompleteSignupPage";
import ForgotPasswordPage from "@/modules/auth/pages/ForgotPasswordPage";
import SessionLimitPage from "@/modules/auth/pages/SessionLimitPage";
import OAuthTwoFactorPage from "@/modules/auth/pages/OAuthTwoFactorPage";
import GithubCallbackPage from "@/modules/auth/pages/GithubCallbackPage";
import ProtectedRoute from "@/modules/auth/components/ProtectedRoute";
import GuestRoute from "@/modules/auth/components/GuestRoute";
import AppLayout from "@/layout/AppLayout";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>
        <Route path="/auth" element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="complete" element={<CompleteSignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="session-limit" element={<SessionLimitPage />} />
          <Route path="oauth-two-factor" element={<OAuthTwoFactorPage />} />
          <Route path="github/callback" element={<GithubCallbackPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  );
}

export default App;
