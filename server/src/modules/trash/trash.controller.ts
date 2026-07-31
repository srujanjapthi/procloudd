import type { Response } from "express";
import mongoose from "mongoose";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as TrashService from "./trash.service.js";
import type { ListTrashQuery } from "./trash.validator.js";

export async function listTrash(
  req: TypedRequest,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const query = req.query as unknown as ListTrashQuery;
  const { meta, ...contents } = await TrashService.listTrash(userId, query);
  ApiResponse.success(res, contents, { meta });
}
