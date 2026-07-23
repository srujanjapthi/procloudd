import type { Types } from "mongoose";
import Otp, { type OtpPurpose } from "@/models/otp.model.js";
import type { UpsertOtpInput } from "@/modules/otp/otp.interface.js";

export async function upsertOtp({
  email,
  code,
  purpose,
}: UpsertOtpInput): Promise<void> {
  await Otp.findOneAndUpdate(
    { email, purpose },
    { $set: { email, code, purpose, attempts: 0, createdAt: new Date() } },
    { upsert: true, runValidators: true }
  );
}

export async function findOtpByEmailAndPurpose(
  email: string,
  purpose: OtpPurpose
) {
  return Otp.findOne({ email, purpose }).lean();
}

export async function incrementOtpAttempts(id: Types.ObjectId): Promise<void> {
  await Otp.updateOne({ _id: id }, { $inc: { attempts: 1 } });
}

export async function deleteOtpById(id: Types.ObjectId): Promise<boolean> {
  const result = await Otp.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
