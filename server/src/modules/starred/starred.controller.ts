import type { Response } from "express";
import mongoose from "mongoose";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as StarredService from "./starred.service.js";
import type { ListStarredQuery } from "./starred.validator.js";

export async function listStarred(
  req: TypedRequest,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const query = req.query as unknown as ListStarredQuery;
  const { meta, ...contents } = await StarredService.listStarred(userId, query);
  ApiResponse.success(res, contents, { meta });
}
