import * as RouteBuilder from "@/common/utils/route-builder.util.js";

const api = RouteBuilder.createRouter("/api/v1");

const ROUTES = {
  health: api.route("/health"),
  auth: api.group("/auth", {
    otp: RouteBuilder.subgroup("/otp", {
      send: "/send",
      verify: "/verify",
    }),
    register: "/register",
    login: RouteBuilder.subgroup("/login", {
      credentials: "",
      precheck: "/precheck",
      resolveSessionLimit: "/resolve-session-limit",
    }),
    logout: "/logout",
    logoutAll: "/logout-all",
    google: RouteBuilder.subgroup("/google", {
      login: "",
    }),
    github: RouteBuilder.subgroup("/github", {
      authorizeUrl: "/authorize-url",
      login: "",
    }),
    completeOAuthSignup: "/complete-oauth-signup",
    resolveOAuthTwoFactor: "/resolve-oauth-two-factor",
    forgotPassword: "/forgot-password",
    changePassword: "/change-password",
    sessions: RouteBuilder.subgroup("/sessions", {
      list: "",
      byId: "/:sessionId",
    }),
    twoFactor: RouteBuilder.subgroup("/2fa", {
      setup: "/setup",
      verifySetup: "/verify-setup",
      disable: "/disable",
      regenerateRecoveryCodes: "/recovery-codes/regenerate",
    }),
  }),
  users: api.group("/users", {
    me: "/me",
    availability: "/availability",
    list: "",
    byId: "/:id",
    permanent: "/:id/permanent",
    forceLogout: "/:id/logout-all",
  }),
  directories: api.group("/directories", {
    create: "",
    byId: "/:id",
    contents: "/:id/contents",
    move: "/:id/move",
    duplicate: "/:id/duplicate",
    restore: "/:id/restore",
    permanent: "/:id/permanent",
  }),
  files: api.group("/files", {
    uploadUrl: "/upload-url",
    confirm: "",
    byId: "/:id",
    downloadUrl: "/:id/download-url",
    move: "/:id/move",
    copy: "/:id/copy",
    restore: "/:id/restore",
    permanent: "/:id/permanent",
  }),
  trash: api.group("/trash", {
    list: "",
  }),
};

export default ROUTES;
