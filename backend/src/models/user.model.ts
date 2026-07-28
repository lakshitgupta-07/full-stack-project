import { Schema, model, HydratedDocument, Model } from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";

import crypto, { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";

export interface IUser {
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  address: String;
  refreshToken?: string;
  skills: String[];
  avatar: {
    url: string;
    publicId: string;
  };
  role: string,
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  isEmailVerified: Boolean;
  emailVerificationToken: string | null;
  emailVerificationExpiry: Date | null;
  provider: string | null;
  googleId: string | null;
  githubId: string | null;
}
export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;

}
interface IUserModel extends Model<IUser, {}, IUserMethods> { }
export type UserDocument = HydratedDocument<IUser, IUserMethods>;
const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    userId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      default: ""
    },

    password: {
      type: String,
      default: "",
    },
    address: {
      type: String,
    },

    refreshToken: {
      type: String,
    },
    skills: {
      type: [String],
      default: [],
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  if (!this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password: string) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
    },

    process.env.ACCESS_TOKEN_SECRET!,

    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
    },
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },

    process.env.REFRESH_TOKEN_SECRET!,

    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
    },
  );
};
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
  return verificationToken;
};
export const User = model<IUser, IUserModel>("User", userSchema);
