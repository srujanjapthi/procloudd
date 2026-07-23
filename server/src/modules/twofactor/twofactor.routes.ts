import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { validateBody } from "@/middlewares/validate-body.middleware.js";
import { authLimiter } from "@/middlewares/rate-limiter.middleware.js";
import { authThrottle } from "@/middlewares/throttler.middleware.js";
import * as TwoFactorController from "./twofactor.controller.js";
import {
  verifyTwoFactorSetupSchema,
  disableTwoFactorSchema,
  regenerateRecoveryCodesSchema,
} from "./twofactor.validator.js";

const router = Router();

router.post(
  ROUTES.auth.twoFactor.setup,
  authenticate,
  authLimiter,
  authThrottle,
  TwoFactorController.setup
);

router.post(
  ROUTES.auth.twoFactor.verifySetup,
  authenticate,
  authLimiter,
  authThrottle,
  validateBody(verifyTwoFactorSetupSchema),
  TwoFactorController.verifySetup
);

router.post(
  ROUTES.auth.twoFactor.disable,
  authenticate,
  authLimiter,
  authThrottle,
  validateBody(disableTwoFactorSchema),
  TwoFactorController.disable
);

router.post(
  ROUTES.auth.twoFactor.regenerateRecoveryCodes,
  authenticate,
  authLimiter,
  authThrottle,
  validateBody(regenerateRecoveryCodesSchema),
  TwoFactorController.regenerateRecoveryCodes
);

export default router;
