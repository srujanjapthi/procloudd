import * as OtpGenerator from "@/common/lib/otp-generator.util.js";
import * as OtpHasher from "@/common/lib/otp-hasher.util.js";
import Email from "@/services/email.service.js";
import { otpEmail } from "@/common/email/templates/otp.template.js";
import AppError from "@/common/error/app.error.js";
import AppConfig from "@/config/app.config.js";
import * as OtpRepository from "./otp.repository.js";
import type { OtpPurpose } from "@/models/otp.model.js";

export async function sendOtp(
  email: string,
  purpose: OtpPurpose
): Promise<void> {
  const code = OtpGenerator.generateOtp(AppConfig.otp.digits);
  const hashedCode = OtpHasher.hash(code);

  await OtpRepository.upsertOtp({ email, code: hashedCode, purpose });

  const { subject, html } = otpEmail({
    otp: code,
    expiryMinutes: AppConfig.otp.expiryMinutes,
  });
  await Email.send({ to: email, subject, html });
}

async function validateOtp(email: string, code: string, purpose: OtpPurpose) {
  const record = await OtpRepository.findOtpByEmailAndPurpose(email, purpose);

  if (!record) {
    throw AppError.badRequest("Invalid or expired OTP");
  }

  if (record.attempts >= AppConfig.otp.maxAttempts) {
    await OtpRepository.deleteOtpById(record._id);
    throw AppError.badRequest(
      "Too many incorrect attempts. Please request a new code."
    );
  }

  const isValid = OtpHasher.verify(code, record.code);
  if (!isValid) {
    await OtpRepository.incrementOtpAttempts(record._id);
    throw AppError.badRequest("Invalid or expired OTP");
  }

  return record;
}

export async function checkOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<void> {
  await validateOtp(email, code, purpose);
}

export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<void> {
  const record = await validateOtp(email, code, purpose);
  const consumed = await OtpRepository.deleteOtpById(record._id);
  if (!consumed) {
    throw AppError.badRequest("Invalid or expired OTP");
  }
}
