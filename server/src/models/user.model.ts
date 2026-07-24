import { Schema, model } from "mongoose";
import type { Model, Types } from "mongoose";
import { z } from "zod";
import * as CredentialHasher from "@/common/lib/credential-hasher.util.js";
import { RoleSchema, Role } from "@/common/constants/roles.constant.js";
import type { Role as RoleType } from "@/common/constants/roles.constant.js";
import AppConfig from "@/config/app.config.js";

export const AccountStatusSchema = z.enum(["active", "deleted"]);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export interface AuthProviderLink {
  provider: string;
  providerId: string;
}

export interface RecoveryCode {
  codeHash: string;
  usedAt?: Date;
}

interface UserVirtuals {
  fullName: string;
}

type UserModel = Model<User, object, object, UserVirtuals>;

export interface User {
  username: string;
  name: { firstName: string; middleName?: string; lastName: string };
  email: string;
  role: RoleType;
  status: AccountStatus;
  profile?: { avatar?: { url?: string; variant?: string } };
  storage: { rootDirId: Types.ObjectId; maxStorageInBytes: number };
  auth: {
    password?: string;
    providers: AuthProviderLink[];
    failedLoginAttempts: number;
    lockedUntil?: Date;
    lastLoginAt?: Date;
    twoFactor: {
      enabled: boolean;
      secret?: string;
      pendingSecret?: string;
      recoveryCodes?: RecoveryCode[];
    };
  };
}

const userSchema = new Schema<User, UserModel, object, object, UserVirtuals>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9_-]{3,30}$/,
        "Username must be 3-30 characters and can only contain lowercase letters, numbers, underscores, and hyphens.",
      ],
    },
    name: {
      firstName: {
        type: String,
        minLength: [1, "First name cannot be empty."],
        required: true,
        trim: true,
      },
      middleName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        minLength: [1, "Last name cannot be empty."],
        required: true,
        trim: true,
      },
      _id: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9. _%+-]+@[a-zA-Z0-9. -]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address.",
      ],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: RoleSchema.options,
      default: Role.User,
    },
    status: {
      type: String,
      enum: AccountStatusSchema.options,
      default: "active",
    },
    profile: {
      avatar: {
        url: { type: String },
        variant: { type: String },
        _id: false,
      },
      _id: false,
    },
    storage: {
      rootDirId: {
        type: Schema.Types.ObjectId,
        ref: "Directory",
        required: true,
      },
      maxStorageInBytes: {
        type: Number,
        default: AppConfig.storage.defaultMaxStorageInBytes,
      },
      _id: false,
    },
    auth: {
      password: {
        type: String,
        minLength: [
          AppConfig.password.minLength,
          `Please enter a password of at least ${AppConfig.password.minLength} characters.`,
        ],
        select: false,
      },
      providers: {
        type: [
          {
            provider: { type: String, required: true },
            providerId: { type: String, required: true },
            _id: false,
          },
        ],
        default: [],
      },
      failedLoginAttempts: {
        type: Number,
        default: 0,
      },
      lockedUntil: { type: Date },
      lastLoginAt: { type: Date },
      twoFactor: {
        enabled: { type: Boolean, default: false },
        secret: { type: String, select: false },
        pendingSecret: { type: String, select: false },
        recoveryCodes: {
          type: [
            {
              codeHash: { type: String, required: true },
              usedAt: { type: Date },
              _id: false,
            },
          ],
          default: [],
          select: false,
        },
        _id: false,
      },
      _id: false,
    },
  },
  {
    strict: "throw",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    virtuals: {
      fullName: {
        get(this: User) {
          return [this.name.firstName, this.name.middleName, this.name.lastName]
            .filter(Boolean)
            .join(" ");
        },
      },
    },
  }
);

userSchema.index(
  {
    "auth.providers.provider": 1,
    "auth.providers.providerId": 1,
  },
  {
    unique: true,
    partialFilterExpression: { "auth.providers.0": { $exists: true } },
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("auth.password") || !this.auth.password) return;
  this.auth.password = await CredentialHasher.hash(this.auth.password);
});

const User = model<User, UserModel>("User", userSchema);
export default User;
