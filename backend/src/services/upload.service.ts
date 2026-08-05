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
                resource_type: "video"
            },
            (err, result) => {
                if(err || !result) {
                    reject(err)
                    return
                }
                resolve(
                    {url: result.secure_url,
                    publicId: result.public_id}
                )
            }
        ).end(file.buffer)
    })
}

export const uploadChatAudioService = async(
    file: Express.Multer.File
) => {
    return new Promise<{
        url: string,
        publicId: string
    }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: "chat-audio",
                resource_type: "video"
            },
            (err, result) => {
                if(err || !result) {
                    reject(err)
                    return
                }
                resolve(
                    {url: result.secure_url,
                        publicId: result.public_id
                    }
                )
            }
        ).end(file.buffer)
    })
}