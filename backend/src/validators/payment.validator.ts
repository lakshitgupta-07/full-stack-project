import { z } from "zod";

export const createOrderSchema = z.object({
    amount: z.number().positive(),

    currency: z.string().default('INR')
});

export const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string()
});

export type verifyPaymentInput = z.infer<typeof verifyPaymentSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>