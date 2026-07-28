import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ForgotPasswordInput, LoginInput, ResetPasswordInput, RegisterInput, resendVerificationInput, } from "../validators/auth.validator.js";
import logger from "../config/logger.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import { getGoogleClient } from "../config/google.js";
import { email_queue } from "../queues/email.queue.js";
import { generateUsername } from "../utils/generateUsername.js";
import { publish } from '../redis/publisher.redis.js'
import { channels } from "../redis/channels.redis.js";
import axios from "axios";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

export const registerUserService = async ({
  phoneNumber,
  email,
  password,
}: RegisterInput) => {
  const existingUser = await User.findOne({
    email,
  });
  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }
  const username = await generateUsername(email)

  const user = await User.create({
    username,
    email,
    phoneNumber,
    password,
    provider: "local",
  });
  const verifyToken = user.generateEmailVerificationToken();
  logger.info("Verify token generated");

  await user.save({
    validateBeforeSave: false,
  });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  logger.info("Preparing to send email");

  await email_queue.add(
    "verification-email",
    {
      email: user.email, username: user.username, verifyUrl
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: true
    }
  )
  logger.info("Email sent");

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  await publish(channels.USER_REGISTERED, {
    userId: user.userId,
    email: user.email,
    username: user.username
  });
  return createdUser;
};

export const verifyEmailService = async (token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: {
      $gt: new Date(),
    },
  });
  if (!user) {
    throw new ApiError(400, "Verification token invalid");
  }
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;
  await user.save({
    validateBeforeSave: false,
  });
  return user;
};

export const loginUserService = async (data: LoginInput) => {
  const user = await User.findOne({
    email: data.email.toLowerCase(),
  });
  if (!user) {
    throw new ApiError(401, "User does'nt exists");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(403, "Email not verified, Link already sent on registered email");
  }
  if (!user.password) {
    throw new ApiError(400, "Please set a password before using email login");
  }
  const isPasswordCorrect = await user.comparePassword(data.password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }
  const accessToken = user.generateAccessToken();

  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });
  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const logoutUserService = async (userId: string) => {
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );
};

export const refreshAccessTokenService = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET!,
  ) as JwtPayload & {
    id: string;
  };
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "Invalid Token! login again");
  }
  if (user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Token mismatch! login again");
  }

  const accessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const forgotPasswordService = async (data: ForgotPasswordInput) => {
  const user = await User.findOne({ email: data.email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No user exist");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({
    validateBeforeSave: false,
  });
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await email_queue.add(
    "forgotPassword-email",
    {
      email: user.email, username: user.username, resetUrl
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: true
    }
  )
  console.log("Email sent");
  return;
};

export const resetPasswordService = async (
  token: string,
  data: ResetPasswordInput,
) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: new Date(),
    },
  });
  if (!user) {
    throw new ApiError(404, "Reset token invalid or expired");
  }
  user.password = data.password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshToken = "";
  await user.save({
    validateBeforeSave: false,
  });
  return user;
};

export const resendVerificationService = async (
  data: resendVerificationInput,
) => {
  const user = await User.findOne({
    email: data.email,
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email already verified please login");
  }
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({
    validateBeforeSave: false,
  });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  await email_queue.add(
    "resendVerification-email",
    {
      email: user.email, username: user.username, verifyUrl
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: true
    }
  )
  return;
};

export const googleLoginService = async () => {
  const googleClient = getGoogleClient()
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
  return url;
};

export const googleCallbackService = async (code: string) => {
  const googleClient = getGoogleClient()
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) {
    throw new ApiError(401, "Google authentication failed");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new ApiError(400, "Google account has no email");
  }

  let user = await User.findOne({
    email: payload.email,
  });

  if (!user) {
    const username = await generateUsername(payload.email, payload.name)
    user = await User.create({
      username,
      email: payload.email,
      phoneNumber: "",
      address: "",
      isEmailVerified: true,
      avatar: {
        url: payload.picture ?? "",
        publicId: "",
      },
      password: "",
      provider: "google",
      googleId: payload.sub,
    });
    await publish(
      channels.USER_REGISTERED,
      {
        userId: user.userId,
        username: user.username,
        email: user.email,
        provider: "google"
      }
    )
  } else {
    if (!user.googleId) {
      user.googleId = payload.sub;
      user.provider = user.password ? "local-google" : "google";
      user.isEmailVerified = true;

      await user.save({
        validateBeforeSave: false,
      });
    } else if (!user.provider) {
      user.provider = user.password ? "local-google" : "google";
      await user.save({
        validateBeforeSave: false,
      });
    }
  }

  return user;
};

export const githubLoginService = async() => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_url: process.env.GITHUB_CALLBACK_URL!,
    scope: "read:user user:email"
  });
  return `${GITHUB_AUTH_URL}?${params.toString()}`
};

export const githubCallbackService = async (code: string) => {
  const token = await axios.post(
    GITHUB_TOKEN_URL,
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URI,
    },
    {
      headers: {
        Accept: "application/json"
      },
    }
  );
  console.log(token.data);
  
  const accessToken = token.data.access_token;
  if(!accessToken) {
    throw new ApiError(401, "Github Authentication failed");
  }

  const {data: githubUser} = await axios.get(
    `${GITHUB_API_URL}/user`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  console.log(githubUser);
  const {data: emails} = await axios.get(
    `${GITHUB_API_URL}/user/emails`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const primaryEmail = emails.find(
    (email: any) => email.primary && email.verified
  )
  if(!primaryEmail) {
    throw new ApiError(401, "Github account has no verified email")
  };
  let user = await User.findOne({
    email: primaryEmail.email
  })
  if(!user) {
    const username = await generateUsername(primaryEmail.email)
    user = await User.create({
      username,
      email: primaryEmail.email,
      phoneNumber: '',
      address: '',
      avatar: {
        url: githubUser.avatar_url,
        publicId: "",
      },
      password: '',
      githubId: githubUser.id.toString(),
      provider: 'github',
      isEmailVerified: true,
    })
  } else {
    if(!user.githubId) {
      user.githubId = githubUser.id.toString();
      user.provider = user.password ? "local-github" : "github"
      user.isEmailVerified = true;
      await user.save({
        validateBeforeSave: false
      });
    } else if(!user.provider) {
      user.provider = user.password ? "local-github" : "github";
      await user.save({
        validateBeforeSave: false
      })
    }
  }
  return user
};

export const generateAccessAndRefreshTokensService = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found")
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, "Something went wrong")
  }
};

