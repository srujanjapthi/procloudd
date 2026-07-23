import type { Types } from "mongoose";
import User from "@/models/user.model.js";
import type { RecoveryCode } from "@/models/user.model.js";

export function getState(id: Types.ObjectId | string) {
  return User.findById(id)
    .select(
      "+auth.twoFactor.secret +auth.twoFactor.pendingSecret +auth.twoFactor.recoveryCodes"
    )
    .lean();
}

export async function setPendingSecret(
  id: Types.ObjectId | string,
  encryptedSecret: string
): Promise<void> {
  await User.updateOne(
    { _id: id },
    { $set: { "auth.twoFactor.pendingSecret": encryptedSecret } }
  );
}

export async function activate(
  id: Types.ObjectId | string,
  encryptedSecret: string,
  recoveryCodes: RecoveryCode[]
): Promise<void> {
  await User.updateOne(
    { _id: id },
    {
      $set: {
        "auth.twoFactor.enabled": true,
        "auth.twoFactor.secret": encryptedSecret,
        "auth.twoFactor.recoveryCodes": recoveryCodes,
      },
      $unset: { "auth.twoFactor.pendingSecret": "" },
    }
  );
}

export async function disable(id: Types.ObjectId | string): Promise<void> {
  await User.updateOne(
    { _id: id },
    {
      $set: {
        "auth.twoFactor.enabled": false,
        "auth.twoFactor.recoveryCodes": [],
      },
      $unset: {
        "auth.twoFactor.secret": "",
        "auth.twoFactor.pendingSecret": "",
      },
    }
  );
}

export async function replaceRecoveryCodes(
  id: Types.ObjectId | string,
  recoveryCodes: RecoveryCode[]
): Promise<void> {
  await User.updateOne(
    { _id: id },
    { $set: { "auth.twoFactor.recoveryCodes": recoveryCodes } }
  );
}

export async function markRecoveryCodeUsed(
  id: Types.ObjectId | string,
  codeHash: string
): Promise<void> {
  await User.updateOne(
    { _id: id, "auth.twoFactor.recoveryCodes.codeHash": codeHash },
    { $set: { "auth.twoFactor.recoveryCodes.$.usedAt": new Date() } }
  );
}
