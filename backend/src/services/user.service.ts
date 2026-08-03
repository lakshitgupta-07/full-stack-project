import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { changePasswordInput, UpdateProfileInput } from "../validators/user.validator.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { getCache, setCache, deleteCache } from "../utils/cache.js";

export const updateCurrentUserService = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password -refreshToken");
  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  await deleteCache(`user:${userId}`);

  return updatedUser;
};

export const changePasswordService = async (
  userId: string,
  data: changePasswordInput,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const hasPassword = Boolean(user.password) && !(await user.comparePassword(""));

  if (!hasPassword) {
    user.password = data.newPassword;
    user.provider = user.googleId ? "local-google" : "local";
    await user.save({
      validateBeforeSave: false,
    });
    await deleteCache(`user:${userId}`);

    return user;
  }

  if (!data.oldPassword) {
    throw new ApiError(400, "Old password is required");
  }

  const isPasswordCorrect = await user.comparePassword(data.oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect Old Password");
  }
  if (data.oldPassword === data.newPassword) {
    throw new ApiError(401, "Old and New password cannot be same");
  }

  user.password = data.newPassword;
  user.provider = user.googleId ? "local-google" : "local";
  await user.save({
    validateBeforeSave: false,
  });
  await deleteCache(`user:${userId}`);

  return user;
};

export const updateAvatarService = async (
  userId: String,
  fileBuffer: Buffer,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User does'nt exist");
  }

  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  const uploadedAvatar = await uploadToCloudinary(
    fileBuffer,
    "user-management-avatar",
  );
  user.avatar = {
    url: uploadedAvatar.secure_url,
    publicId: uploadedAvatar.public_id,
  };

  await user.save({ validateBeforeSave: false });

  await deleteCache(`user:${userId}`);

  return user;
};

export const getCurrentUserService = async (userId: string) => {

    const cacheKey = `user:${userId}`;

    const cachedUser = await getCache(cacheKey);

    if (cachedUser) {
        if (Object.prototype.hasOwnProperty.call(cachedUser, "hasPassword")) {
            return cachedUser;
        }
        await deleteCache(cacheKey);
    }

    console.log("❌ Cache Miss");

    const user = await User.findById(userId)
        .select("-refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const currentUser = user.toObject();
    const hasPassword = Boolean(user.password) && !(await user.comparePassword(""));
    delete (currentUser as { password?: string }).password;

    const userResponse = {
        ...currentUser,
        hasPassword,
    };

    await setCache(cacheKey, userResponse);

    return userResponse;
};

export const searchUserService = async(
  query: string,
  currentUserId: string
) => {
  const users = await User.find({
    _id: {
      $ne: currentUserId
    },
    username: {
      $regex: query,
      $options: "i"
    }
  })
  .select("_id username avatar")
  .limit(10)
  return users
}