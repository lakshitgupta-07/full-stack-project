import { Router } from "express";
import {
    registerUser, loginUser, logoutUser, refreshAccessToken, forgotPassword, resetPassword, verifyEmail, resendVerification, googleLogin,
    googleCallback, githubLogin, githubCallback
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rateLimitter.middleware.js";

const authRouter = Router()

authRouter.post("/register", registerUser)
authRouter.get("/verify-email/:token", verifyEmail)
authRouter.post("resend-verification", resendVerification)
authRouter.post("/login", limiter, loginUser)
authRouter.post("/logout", verifyJwt, logoutUser)
authRouter.get("/google", googleLogin)
authRouter.get("/google/callback", googleCallback)
authRouter.get("/github", githubLogin)
authRouter.get("/github/callback", githubCallback)
authRouter.post("/refresh-token", refreshAccessToken)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/reset-password/:token", resetPassword)
export default authRouter
