import { z } from 'zod'

export const updateProfileSchema = z.object({
    username: z.string().min(3).max(30).optional(),
    phoneNumber: z.string().regex(/^\d{10}$/).optional(),
    address: z.string().optional(),
    skills: z.array(z.string()).optional(),
})
export const changePasswordSchema = z.object({
    oldPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be 8 charachters")
})


export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type changePasswordInput = z.infer<typeof changePasswordSchema>
