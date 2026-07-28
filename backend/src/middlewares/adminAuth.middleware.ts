import { ApiError } from "../utils/ApiError.js";
import { Request, Response, NextFunction } from "express";


import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) =>{
    if(!req.user) {
        throw new ApiError(401, "Unauthorized access")
    }
    if(req.user.role !== "admin") {
        throw new ApiError(403, "Unauthorized access")
    }
    next()
})