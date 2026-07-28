import { SignOptions } from "jsonwebtoken";
export const env = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],

  MONGODB_URI: process.env.MONGODB_URI!,
  DB_NAME: process.env.DB_NAME!,
  
};