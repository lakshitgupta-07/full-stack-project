import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";
import { getAllBanner, getAllUserStats, getDashboardStats, getUser, getUserAnalytics } from '../controllers/admin.controller.js'

const adminRouter = Router()
adminRouter.use(verifyJwt)
adminRouter.use(verifyAdmin)

adminRouter.get("/dashboard", getDashboardStats)
adminRouter.get("/all-user", getAllUserStats)
adminRouter.get("/get-user", getUser)
adminRouter.get("/analytics", getUserAnalytics)
adminRouter.get("/get-banner", getAllBanner)

export default adminRouter