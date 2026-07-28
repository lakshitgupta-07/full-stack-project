import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { changePasswordSchema, updateProfileSchema } from "../validators/user.validator.js";
import { updateCurrentUserService, changePasswordService, updateAvatarService, getCurrentUserService } from "../services/user.service.js";

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUserService(req.user._id.toString())
    res.status(200).json(new ApiResponse(200, user, "Current user"));
  },
);

export const updateCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = updateProfileSchema.parse(req.body);

    const user = await updateCurrentUserService(
      req.user?._id.toString(),
      validatedData,
    );
    res
      .status(200)
      .json(new ApiResponse(200, user, "Profile updated successfully"));
  },
);

export const changePassword = asyncHandler(async (req, res) => {
  const data = changePasswordSchema.parse(req.body);
  await changePasswordService(req.user?._id, data);
  res.status(200).json(new ApiResponse(200, null, "Password Updated"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(404, "Avatar image required");
  }
  const buffer = req.file.buffer;


  const user = await updateAvatarService(req.user!._id.toString(), buffer);

  res.status(200).json(new ApiResponse(200, user, "Avatar Updated"));
});
