import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { readOperationsLimiter } from "@/middlewares/rate-limiter.middleware.js";
import { readOperationsThrottle } from "@/middlewares/throttler.middleware.js";
import * as StatsController from "./stats.controller.js";

const router = Router();

router.get(
  ROUTES.stats.storage,
  authenticate,
  readOperationsLimiter,
  readOperationsThrottle,
  StatsController.getStorageOverview
);

export default router;
