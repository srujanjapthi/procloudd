import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import {
  otpIpLimiter,
  otpEmailLimiter,
} from "@/middlewares/rate-limiter.middleware.js";
import { otpThrottle } from "@/middlewares/throttler.middleware.js";
import { validateBody } from "@/middlewares/validate-body.middleware.js";
import { sendOtpSchema, verifyOtpSchema } from "./otp.validator.js";
import * as OtpController from "./otp.controller.js";

const router = Router();

router.post(
  ROUTES.auth.otp.send,
  otpIpLimiter,
  otpEmailLimiter,
  otpThrottle,
  validateBody(sendOtpSchema),
  OtpController.sendOtp
);

router.post(
  ROUTES.auth.otp.verify,
  otpIpLimiter,
  otpEmailLimiter,
  otpThrottle,
  validateBody(verifyOtpSchema),
  OtpController.checkOtp
);

export default router;
