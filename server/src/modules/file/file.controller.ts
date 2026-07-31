import type { Response } from "express";
import mongoose from "mongoose";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as FileService from "./file.service.js";
import type {
  RequestUploadUrlBody,
  ConfirmUploadBody,
  RenameFileBody,
  MoveFileBody,
  CopyFileBody,
} from "./file.validator.js";

export async function requestUploadUrl(
  req: TypedRequest<{ body: RequestUploadUrlBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const result = await FileService.requestUploadUrl(userId, req.body);
  ApiResponse.success(res, result);
}

export async function confirmUpload(
  req: TypedRequest<{ body: ConfirmUploadBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const file = await FileService.confirmUpload(userId, req.body);
  ApiResponse.success(res, file, { message: "File uploaded successfully" });
}

export async function getDownloadUrl(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  const downloadUrl = await FileService.getDownloadUrl(userId, fileId);
  ApiResponse.success(res, { downloadUrl });
}

export async function getPreviewUrl(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  const previewUrl = await FileService.getPreviewUrl(userId, fileId);
  ApiResponse.success(res, { previewUrl });
}

export async function renameFile(
  req: TypedRequest<{ params: { id: string }; body: RenameFileBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  const file = await FileService.renameFile(userId, fileId, req.body.name);
  ApiResponse.success(res, file, { message: "File renamed successfully" });
}

export async function moveFile(
  req: TypedRequest<{ params: { id: string }; body: MoveFileBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  const newParentDirId = new mongoose.Types.ObjectId(req.body.parentDirId);
  const file = await FileService.moveFile(userId, fileId, newParentDirId);
  ApiResponse.success(res, file, { message: "File moved successfully" });
}

export async function copyFile(
  req: TypedRequest<{ params: { id: string }; body: CopyFileBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  const file = await FileService.copyFile(userId, fileId, req.body);
  ApiResponse.success(res, file, { message: "File copied successfully" });
}

export async function trashFile(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  await FileService.trashFile(userId, fileId);
  ApiResponse.success(res, null, { message: "File moved to trash" });
}

export async function restoreFile(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  const file = await FileService.restoreFile(userId, fileId);
  ApiResponse.success(res, file, { message: "File restored successfully" });
}

export async function hardDeleteFile(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  await FileService.hardDeleteFile(userId, fileId);
  ApiResponse.success(res, null, { message: "File permanently deleted" });
}
