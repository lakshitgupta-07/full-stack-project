import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{
  secure_url: string;
  public_id: string;
}> => {
  return new Promise((resolve, reject) => {
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {

        if (error || !result) {
          return reject(error);
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });

      }
    );

    streamifier.createReadStream(buffer).pipe(stream);

  });
};