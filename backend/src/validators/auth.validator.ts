import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  phoneNumber: z.string().min(10).max(10).regex(/[0-9]/),
  password: z.string().min(8).regex(/[A-Z]/, "One uppercase required").regex(/[a-z]/, "One lowercase required").regex(/[0-9]/, "One number required").regex(/[^A-Za-z0-9]/, "One special character required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1)
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(8),
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type verifyEmailInput = z.infer<typeof verifyEmailSchema>
export type resendVerificationInput = z.infer<typeof resendVerificationSchema>