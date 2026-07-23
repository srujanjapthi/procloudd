import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { authorize } from "@/middlewares/authorize.middleware.js";
import { validateId } from "@/middlewares/validate-id.middleware.js";
import { validateQuery } from "@/middlewares/validate-query.middleware.js";
import { validateBody } from "@/middlewares/validate-body.middleware.js";
import {
  readOperationsLimiter,
  userManagementLimiter,
  availabilityLimiter,
} from "@/middlewares/rate-limiter.middleware.js";
import {
  readOperationsThrottle,
  userManagementThrottle,
  availabilityThrottle,
} from "@/middlewares/throttler.middleware.js";
import * as UserController from "./user.controller.js";
import {
  listUsersQuerySchema,
  availabilityQuerySchema,
  updateProfileSchema,
} from "./user.validator.js";

const router = Router();

router.param("id", validateId);

router.get(
  ROUTES.users.availability,
  availabilityLimiter,
  availabilityThrottle,
  validateQuery(availabilityQuerySchema),
  UserController.checkAvailability
);

router.get(
  ROUTES.users.me,
  authenticate,
  readOperationsLimiter,
  readOperationsThrottle,
  UserController.getCurrentUser
);

router.patch(
  ROUTES.users.me,
  authenticate,
  userManagementLimiter,
  userManagementThrottle,
  validateBody(updateProfileSchema),
  UserController.updateProfile
);

router.get(
  ROUTES.users.list,
  authenticate,
  authorize("user:list"),
  userManagementLimiter,
  userManagementThrottle,
  validateQuery(listUsersQuerySchema),
  UserController.listUsers
);

router.delete(
  ROUTES.users.byId,
  authenticate,
  authorize("user:delete"),
  userManagementLimiter,
  userManagementThrottle,
  UserController.deleteUser
);

router.delete(
  ROUTES.users.permanent,
  authenticate,
  authorize("user:hard-delete"),
  userManagementLimiter,
  userManagementThrottle,
  UserController.hardDeleteUser
);

router.post(
  ROUTES.users.forceLogout,
  authenticate,
  authorize("user:force-logout"),
  userManagementLimiter,
  userManagementThrottle,
  UserController.forceLogout
);

export default router;
