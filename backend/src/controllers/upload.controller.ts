import { Request, Response } from "express";
import { uploadChatImageService, uploadChatVideoService } from "../services/upload.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadChatImage = asyncHandler(async (req: Request, res: Response) => {
    if(!req.file) {
        throw new Error("Image not found")
    }
    const image = await uploadChatImageService(req.file)
    res.status(200).json(
        new ApiResponse(200, image, "Image Uploaded")
    )
})

export const uploadChatVideo = asyncHandler(async(req: Request, res: Response) => {
    if(!req.file) {
        throw new Error("Video not found")
    }
    const video = await uploadChatVideoService(req.file)
    res.status(200).json(
        new ApiResponse(200, video, "Video Uploaded")
    )
})