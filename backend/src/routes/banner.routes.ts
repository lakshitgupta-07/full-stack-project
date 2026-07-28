import { Router } from "express";
import { createBanner, deleteBanner, getBanner, updateBanner } from "../controllers/banner.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";
const bannerRouter = Router()

bannerRouter.post("/", verifyJwt, verifyAdmin, createBanner)
bannerRouter.get("/", getBanner)
bannerRouter.patch("/:id", updateBanner)
bannerRouter.delete("/:id", deleteBanner)

export default bannerRouter