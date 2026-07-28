import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { loginUserService, logoutUserService, refreshAccessTokenService, registerUserService, resetPasswordService, forgotPasswordService, verifyEmailService, 
resendVerificationService, googleLoginService, googleCallbackService, generateAccessAndRefreshTokensService, githubLoginService, githubCallbackService } from "../services/auth.service.js";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema } from "../validators/auth.validator.js";
import { ApiError } from "../utils/ApiError.js";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body)
    const user = await registerUserService(validatedData)

    res.status(200).json(
        new ApiResponse(201, user, "User registered successfully")
    );
})

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const token = req.params.token as string;
    await verifyEmailService(token)
    res.status(200).json(
        new ApiResponse(200, null, "Email verified")
    )
})

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const data = resendVerificationSchema.parse(req.body)
    await resendVerificationService(data)
    res.status(200).json(
        new ApiResponse(200, null, "Verification token resent")
    )
})

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body)
    const { user, accessToken, refreshToken } = await loginUserService(validatedData)
    const options = {
        httpOnly: true,
        secure: false
    }

    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, {
            user, accessToken
        }, "Login complete")
    )
})

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    await logoutUserService(req.user?._id.toString());
    const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax" as const
    }

    res.clearCookie("accessToken", options).clearCookie("refreshToken", options).status(200).json(
        new ApiResponse(200, null, "Logged out")
    );
})

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, "Refresh Token missing! Login again")
    }
    const { accessToken, refreshToken: newRefreshToken } = await refreshAccessTokenService(refreshToken)
    const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax" as const
    }

    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(
        new ApiResponse(200, null, "Access token refreshed")
    )
})

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const data = forgotPasswordSchema.parse(req.body)
    await forgotPasswordService(data)
    res.status(200).json(
        new ApiResponse(200, null, "Password reset mail sent to registered email")
    )
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const data = resetPasswordSchema.parse(req.body)
    const token = req.params.token

    if (typeof token !== "string") {
        throw new ApiError(400, "Reset token is required")
    }

    await resetPasswordService(token, data)

    res.status(200).json(
        new ApiResponse(200, null, "Password reset successfully")
    )
})

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const url = await googleLoginService()
    res.redirect(url)
})

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string
    const user = await googleCallbackService(code)
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokensService(user._id.toString())
    const options = {
        httpOnly: true,
        secure: false
    }
    res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .redirect(`${process.env.CLIENT_URL}/homePage`);
})

export const githubLogin = asyncHandler(async (req: Request, res: Response) => {
    const url = await githubLoginService()
    return res.redirect(url)
})

export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string
    const user = await githubCallbackService(code)
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokensService(user._id.toString())
    const options = {
        httpOnly: true,
        secure: false
    }
    res.cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).redirect(`${process.env.CLIENT_URL}/homePage`)
})