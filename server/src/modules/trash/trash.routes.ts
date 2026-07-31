import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { validateQuery } from "@/middlewares/validate-query.middleware.js";
import { directoryOperationsLimiter } from "@/middlewares/rate-limiter.middleware.js";
import { directoryOperationsThrottle } from "@/middlewares/throttler.middleware.js";
import * as TrashController from "./trash.controller.js";
import { listTrashQuerySchema } from "./trash.validator.js";

const router = Router();

router.get(
  ROUTES.trash.list,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateQuery(listTrashQuerySchema),
  TrashController.listTrash
);

router.delete(
  ROUTES.trash.list,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  TrashController.emptyTrash
);

export default router;
