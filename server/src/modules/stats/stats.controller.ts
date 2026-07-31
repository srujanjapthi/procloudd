import type { Response } from "express";
import mongoose from "mongoose";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as StatsService from "./stats.service.js";

export async function getStorageOverview(
  req: TypedRequest,
  res: Response
): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const overview = await StatsService.getStorageOverview(userId);
  ApiResponse.success(res, overview);
}
