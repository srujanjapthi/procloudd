import type { Response } from "express";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import AppError from "@/common/error/app.error.js";
import * as UserService from "./user.service.js";
import type {
  ListUsersQuery,
  AvailabilityQuery,
  UpdateProfileInput,
} from "./user.validator.js";

export async function getCurrentUser(
  req: TypedRequest,
  res: Response
): Promise<void> {
  const user = await UserService.findById(req.user!.id);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  ApiResponse.success(res, user);
}

export async function updateProfile(
  req: TypedRequest<{ body: UpdateProfileInput }>,
  res: Response
): Promise<void> {
  const profile = await UserService.updateProfile(req.user!.id, req.body);
  ApiResponse.success(res, profile, {
    message: "Profile updated successfully",
  });
}

export async function checkAvailability(
  req: TypedRequest<{ query: AvailabilityQuery }>,
  res: Response
): Promise<void> {
  const available = await UserService.checkAvailability(req.query);
  ApiResponse.success(res, { available });
}

export async function listUsers(
  req: TypedRequest,
  res: Response
): Promise<void> {
  const query = req.query as unknown as ListUsersQuery;
  const { users, meta } = await UserService.listUsers(req.user!.role, query);
  ApiResponse.success(res, users, { meta });
}

export async function deleteUser(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  await UserService.deleteUser(req.user!.role, req.params.id);
  ApiResponse.success(res, null, { message: "User deleted successfully" });
}

export async function hardDeleteUser(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  await UserService.hardDeleteUser(req.user!.role, req.params.id);
  ApiResponse.success(res, null, { message: "User permanently deleted" });
}

export async function forceLogout(
  req: TypedRequest<{ params: { id: string } }>,
  res: Response
): Promise<void> {
  await UserService.forceLogout(req.user!.role, req.params.id);
  ApiResponse.success(res, null, {
    message: "User logged out from all devices",
  });
}
