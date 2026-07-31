import { Router } from "express";
import ROUTES from "@/common/constants/routes.constant.js";
import { authenticate } from "@/middlewares/authenticate.middleware.js";
import { validateId } from "@/middlewares/validate-id.middleware.js";
import { validateBody } from "@/middlewares/validate-body.middleware.js";
import {
  uploadLimiter,
  fileOperationsLimiter,
  downloadLimiter,
} from "@/middlewares/rate-limiter.middleware.js";
import {
  uploadThrottle,
  fileOperationsThrottle,
  downloadThrottle,
} from "@/middlewares/throttler.middleware.js";
import * as FileController from "./file.controller.js";
import {
  requestUploadUrlSchema,
  confirmUploadSchema,
  renameFileSchema,
  moveFileSchema,
  copyFileSchema,
} from "./file.validator.js";

const router = Router();

router.param("id", validateId);

router.post(
  ROUTES.files.uploadUrl,
  authenticate,
  uploadLimiter,
  uploadThrottle,
  validateBody(requestUploadUrlSchema),
  FileController.requestUploadUrl
);

router.post(
  ROUTES.files.confirm,
  authenticate,
  uploadLimiter,
  uploadThrottle,
  validateBody(confirmUploadSchema),
  FileController.confirmUpload
);

router.get(
  ROUTES.files.downloadUrl,
  authenticate,
  downloadLimiter,
  downloadThrottle,
  FileController.getDownloadUrl
);

router.patch(
  ROUTES.files.byId,
  authenticate,
  fileOperationsLimiter,
  fileOperationsThrottle,
  validateBody(renameFileSchema),
  FileController.renameFile
);

router.patch(
  ROUTES.files.move,
  authenticate,
  fileOperationsLimiter,
  fileOperationsThrottle,
  validateBody(moveFileSchema),
  FileController.moveFile
);

router.post(
  ROUTES.files.copy,
  authenticate,
  fileOperationsLimiter,
  fileOperationsThrottle,
  validateBody(copyFileSchema),
  FileController.copyFile
);

router.delete(
  ROUTES.files.byId,
  authenticate,
  fileOperationsLimiter,
  fileOperationsThrottle,
  FileController.trashFile
);

router.delete(
  ROUTES.files.permanent,
  authenticate,
  fileOperationsLimiter,
  fileOperationsThrottle,
  FileController.hardDeleteFile
);

export default router;
