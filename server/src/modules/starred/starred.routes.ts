import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { validateQuery } from "@/middlewares/validate-query.middleware.js";
import { directoryOperationsLimiter } from "@/middlewares/rate-limiter.middleware.js";
import { directoryOperationsThrottle } from "@/middlewares/throttler.middleware.js";
import * as StarredController from "./starred.controller.js";
import { listStarredQuerySchema } from "./starred.validator.js";

const router = Router();

router.get(
  ROUTES.starred.list,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateQuery(listStarredQuerySchema),
  StarredController.listStarred
);

export default router;
