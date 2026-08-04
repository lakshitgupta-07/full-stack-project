import cloudinary from "../config/cloudinary.js";

export const uploadChatImageService = async(
    file: Express.Multer.File
) => {
    return new Promise<{
        url: string,
        publicId: string
    }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: "chat-image",
            },
            (err, result) => {
                if(err || !result) {
                    reject(err);
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        ).end(file.buffer)
    })
}

export const uploadChatVideoService = async(
    file: Express.Multer.File
) => {
    return new Promise<{
        url: string,
        publicId: string
    }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: "chat-video",
            },
            (err, result) => {
                if(err || !result) {
                    reject(err)
                    return
                }
                resolve(
                    {url: result.url,
                    publicId: result.publicId}
                )
            }
        ).end(file.buffer)
    })
}