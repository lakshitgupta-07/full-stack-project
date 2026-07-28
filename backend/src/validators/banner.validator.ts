import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().trim().min(3).max(100),

  description: z.string().trim().min(5).max(300),

  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  isActive: z.boolean().optional(),
  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});

export type CreateBannerInput =
  z.infer<typeof createBannerSchema>;