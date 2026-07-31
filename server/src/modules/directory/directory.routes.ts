import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { validateId } from "@/middlewares/validate-id.middleware.js";
import { validateQuery } from "@/middlewares/validate-query.middleware.js";
import { validateBody } from "@/middlewares/validate-body.middleware.js";
import { directoryOperationsLimiter } from "@/middlewares/rate-limiter.middleware.js";
import { directoryOperationsThrottle } from "@/middlewares/throttler.middleware.js";
import * as DirectoryController from "./directory.controller.js";
import {
  createDirectorySchema,
  renameDirectorySchema,
  moveDirectorySchema,
  duplicateDirectorySchema,
  listDirectoryContentsQuerySchema,
} from "./directory.validator.js";

const router = Router();

router.param("id", validateId);

router.post(
  ROUTES.directories.create,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateBody(createDirectorySchema),
  DirectoryController.createDirectory
);

router.get(
  ROUTES.directories.contents,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateQuery(listDirectoryContentsQuerySchema),
  DirectoryController.listContents
);

router.patch(
  ROUTES.directories.byId,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateBody(renameDirectorySchema),
  DirectoryController.renameDirectory
);

router.patch(
  ROUTES.directories.move,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateBody(moveDirectorySchema),
  DirectoryController.moveDirectory
);

router.post(
  ROUTES.directories.duplicate,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  validateBody(duplicateDirectorySchema),
  DirectoryController.duplicateDirectory
);

router.patch(
  ROUTES.directories.restore,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  DirectoryController.restoreDirectory
);

router.delete(
  ROUTES.directories.byId,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  DirectoryController.trashDirectory
);

router.delete(
  ROUTES.directories.permanent,
  authenticate,
  directoryOperationsLimiter,
  directoryOperationsThrottle,
  DirectoryController.hardDeleteDirectory
);

export default router;
