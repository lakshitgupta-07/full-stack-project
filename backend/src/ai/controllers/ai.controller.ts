import type { Request, Response } from "express";
import * as aiService from "../services/ai-thread.service.js"
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createAIThread = asyncHandler(async (
    req: Request,
    res: Response
) => {
    const thread = await aiService.createOrGetThread(req.user._id)

    res.status(200).json(
        new ApiResponse(200, thread, "Thread created")
    )
})