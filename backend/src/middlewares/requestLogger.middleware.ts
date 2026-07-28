import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next()
}