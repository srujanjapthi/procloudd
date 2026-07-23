import type { Response } from "express";
import type { TypedRequest } from "@/common/http/typed-request.types.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import * as OtpService from "./otp.service.js";
import type { SendOtpInput, VerifyOtpInput } from "./otp.validator.js";

export async function sendOtp(
  req: TypedRequest<{ body: SendOtpInput }>,
  res: Response
): Promise<void> {
  const { email, purpose } = req.body;
  await OtpService.sendOtp(email, purpose);
  ApiResponse.success(res, null, { message: "OTP sent successfully" });
}

export async function checkOtp(
  req: TypedRequest<{ body: VerifyOtpInput }>,
  res: Response
): Promise<void> {
  const { email, code, purpose } = req.body;
  await OtpService.checkOtp(email, code, purpose);
  ApiResponse.success(res, null, { message: "Code verified" });
}
