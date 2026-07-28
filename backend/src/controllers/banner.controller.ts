import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createBannerService, deleteBannerService, getBannerService, updateBannerService } from "../services/banner.service.js";

export const createBanner = asyncHandler(async(req: Request, res: Response) => {
    const banner = await createBannerService(req.body, req.user._id)
    res.status(201).json(
        new ApiResponse(201, banner, "Banner created")
    )
})

export const getBanner = asyncHandler(async(req:Request, res:Response) => {
    const banner = await getBannerService()
    res.setHeader(
        "Cache-Control",
        "public, max-age=300"
    )
    res.status(201).json(
        new ApiResponse(201, banner, "Banner fetched")
    )
})

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await updateBannerService(req.params.id.toString(), req.body)
    res.status(200).json(
        new ApiResponse(200, banner, "Banner updated")
    )
})

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const isBannerAvailable = await deleteBannerService(req.params.id.toString());
    if(isBannerAvailable){
        res.status(200).json(
        new ApiResponse(200, {}, "Banner deleted")
    )}else {
    res.status(404).json(
        new ApiResponse(404, {}, "No banner in DB to Delete")
    )}
})