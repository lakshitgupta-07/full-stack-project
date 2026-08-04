import cloudinary from "../config/cloudinary.js";

export const deleteFromCloudinary = async (publicId: string) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "auto",
  });
};