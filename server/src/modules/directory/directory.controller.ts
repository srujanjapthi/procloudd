import type { Response } from "express";
import mongoose from "mongoose";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as DirectoryService from "./directory.service.js";
import type {
  CreateDirectoryBody,
  RenameDirectoryBody,
  MoveDirectoryBody,
  DuplicateDirectoryBody,
  ListDirectoryContentsQuery,
} from "./directory.validator.js";

export async function createDirectory(
  req: TypedRequest<{ body: CreateDirectoryBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dir = await DirectoryService.createDirectory(userId, req.body);
  ApiResponse.success(res, dir, { message: "Folder created successfully" });
}

export async function listContents(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dirId = new mongoose.Types.ObjectId(req.params.id);
  const query = req.query as unknown as ListDirectoryContentsQuery;
  const { meta, ...contents } = await DirectoryService.listContents(
    userId,
    dirId,
    query
  );
  ApiResponse.success(res, contents, { meta });
}

export async function renameDirectory(
  req: TypedRequest<{ params: { id: string }; body: RenameDirectoryBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dirId = new mongoose.Types.ObjectId(req.params.id);
  const dir = await DirectoryService.renameDirectory(
    userId,
    dirId,
    req.body.name
  );
  ApiResponse.success(res, dir, { message: "Folder renamed successfully" });
}

export async function moveDirectory(
  req: TypedRequest<{ params: { id: string }; body: MoveDirectoryBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dirId = new mongoose.Types.ObjectId(req.params.id);
  const newParentDirId = new mongoose.Types.ObjectId(req.body.parentDirId);
  const dir = await DirectoryService.moveDirectory(
    userId,
    dirId,
    newParentDirId
  );
  ApiResponse.success(res, dir, { message: "Folder moved successfully" });
}

export async function duplicateDirectory(
  req: TypedRequest<{ params: { id: string }; body: DuplicateDirectoryBody }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dirId = new mongoose.Types.ObjectId(req.params.id);
  const dir = await DirectoryService.duplicateDirectory(
    userId,
    dirId,
    req.body
  );
  ApiResponse.success(res, dir, {
    message: "Folder duplicated successfully",
  });
}

export async function trashDirectory(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dirId = new mongoose.Types.ObjectId(req.params.id);
  await DirectoryService.trashDirectory(userId, dirId);
  ApiResponse.success(res, null, { message: "Folder moved to trash" });
}

export async function hardDeleteDirectory(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const dirId = new mongoose.Types.ObjectId(req.params.id);
  await DirectoryService.hardDeleteDirectory(userId, dirId);
  ApiResponse.success(res, null, { message: "Folder permanently deleted" });
}
