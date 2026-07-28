import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // logger.error("===== ERROR =====");
  // logger.error(err);
  // logger.error("=================");

  res.status(err.status || err.statusCode|| 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};