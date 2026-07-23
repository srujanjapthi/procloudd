import { Schema, model } from "mongoose";
import { z } from "zod";
import AppConfig from "@/config/app.config.js";

export const OtpPurposeSchema = z.enum(["register", "login", "reset-password"]);
export type OtpPurpose = z.infer<typeof OtpPurposeSchema>;

export interface Otp {
  email: string;
  code: string;
  purpose: OtpPurpose;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<Otp>(
  {
    email: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: OtpPurposeSchema.options,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: AppConfig.otp.expiryMinutes * 60,
    },
  },
  { strict: "throw" }
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

const Otp = model<Otp>("OTP", otpSchema);
export default Otp;
