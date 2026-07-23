import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { validateBody } from "@/middlewares/validate-body.middleware.js";
import { validateSessionId } from "@/middlewares/validate-id.middleware.js";
import {
  authLimiter,
  logoutLimiter,
  oauthLimiter,
  readOperationsLimiter,
} from "@/middlewares/rate-limiter.middleware.js";
import {
  authThrottle,
  logoutThrottle,
  oauthThrottle,
  readOperationsThrottle,
} from "@/middlewares/throttler.middleware.js";
import * as AuthController from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  loginPrecheckSchema,
  googleLoginSchema,
  githubLoginSchema,
  completeOAuthSignupSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  resolveLoginSessionLimitSchema,
  resolveOAuthTwoFactorSchema,
} from "./auth.validator.js";

const router = Router();

router.param("sessionId", validateSessionId);

router.post(
  ROUTES.auth.register,
  authLimiter,
  authThrottle,
  validateBody(registerSchema),
  AuthController.register
);

router.post(
  ROUTES.auth.login.credentials,
  authLimiter,
  authThrottle,
  validateBody(loginSchema),
  AuthController.login
);

router.post(
  ROUTES.auth.login.precheck,
  authLimiter,
  authThrottle,
  validateBody(loginPrecheckSchema),
  AuthController.precheckLogin
);

router.post(
  ROUTES.auth.login.resolveSessionLimit,
  authLimiter,
  authThrottle,
  validateBody(resolveLoginSessionLimitSchema),
  AuthController.resolveLoginSessionLimit
);

router.post(
  ROUTES.auth.google.login,
  oauthLimiter,
  oauthThrottle,
  validateBody(googleLoginSchema),
  AuthController.loginWithGoogle
);

router.post(
  ROUTES.auth.completeOAuthSignup,
  oauthLimiter,
  oauthThrottle,
  validateBody(completeOAuthSignupSchema),
  AuthController.completeOAuthSignup
);

router.get(
  ROUTES.auth.github.authorizeUrl,
  oauthLimiter,
  oauthThrottle,
  AuthController.getGithubAuthorizeUrl
);

router.post(
  ROUTES.auth.github.login,
  oauthLimiter,
  oauthThrottle,
  validateBody(githubLoginSchema),
  AuthController.loginWithGithub
);

router.post(
  ROUTES.auth.resolveOAuthTwoFactor,
  oauthLimiter,
  oauthThrottle,
  validateBody(resolveOAuthTwoFactorSchema),
  AuthController.resolveOAuthTwoFactor
);

router.post(
  ROUTES.auth.forgotPassword,
  authLimiter,
  authThrottle,
  validateBody(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  ROUTES.auth.changePassword,
  authenticate,
  authLimiter,
  authThrottle,
  validateBody(changePasswordSchema),
  AuthController.changePassword
);

router.get(
  ROUTES.auth.sessions.list,
  authenticate,
  readOperationsLimiter,
  readOperationsThrottle,
  AuthController.listSessions
);

router.delete(
  ROUTES.auth.sessions.byId,
  authenticate,
  authLimiter,
  authThrottle,
  AuthController.revokeSession
);

router.post(
  ROUTES.auth.logout,
  logoutLimiter,
  logoutThrottle,
  AuthController.logout
);

router.post(
  ROUTES.auth.logoutAll,
  authenticate,
  logoutLimiter,
  logoutThrottle,
  AuthController.logoutAll
);

export default router;
