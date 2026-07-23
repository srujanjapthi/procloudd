const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    complete: "/auth/complete",
    forgotPassword: "/auth/forgot-password",
    sessionLimit: "/auth/session-limit",
    oauthTwoFactor: "/auth/oauth-two-factor",
    githubCallback: "/auth/github/callback",
  },
} as const;

export default ROUTES;
