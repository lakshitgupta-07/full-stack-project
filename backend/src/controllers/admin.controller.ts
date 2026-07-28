import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllBannerService, getAllUserService, getDashboardStatsService, getUserAnalyticsService, getUserService } from "../services/admin.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardStats = asyncHandler(async (req, res) => {

    const stats = await getDashboardStatsService();

    res.status(200).json(
        new ApiResponse(
            200,
            stats,
            "Dashboard statistics fetched successfully."
        )
    );
});
export const getAllUserStats = asyncHandler(async (req, res) => {

    const stats = await getAllUserService();

    res.status(200).json(
        new ApiResponse(
            200,
            stats,
            "Dashboard statistics fetched successfully."
        )
    );
});

export const getUser = asyncHandler(async (req, res) => {
    const users = await getUserService(req.query)

    res.status(200).json(new ApiResponse(200, users, "Users fetched"))
})

export const getUserAnalytics = asyncHandler(async (req, res) => {
    const analytics = await getUserAnalyticsService()
    res.status(200).json(
        new ApiResponse(200, analytics, "Analytics feteched")
    )
})

export const getAllBanner = asyncHandler(async (req, res) => {
    const banner = await getAllBannerService()
    res.status(200).json(new ApiResponse(200, banner, "Banners fetched"))
})