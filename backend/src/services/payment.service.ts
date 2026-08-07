import { razorpay } from "../config/razorpay.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import type { CreateOrderInput, verifyPaymentInput } from "../validators/payment.validator.js";
import crypto from "crypto"

export const createOrder = async(
    data: CreateOrderInput
) => {
    const order = await razorpay.orders.create({
        amount: data.amount * 100,
        currency: data.currency,
        receipt: `receipt_${Date.now()}`
    })
    return order
}

export const verifyPayment = async (
    user: string,
    data: verifyPaymentInput
) => {
    const signature = crypto.createHmac("sha256", "tlkytDrLpVKD85LlKSILSZE3").update(data.razorpay_order_id + "|" + data.razorpay_payment_id).digest("hex")
    if(signature !== data.razorpay_signature) {
        throw new Error("Payment Verification Failed")
    }

    await Payment.create({
        userId: user,
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
        amount: 499,
        signature: data.razorpay_signature,
        currency: "INR"
    });
    const updatedUser = await User.findByIdAndUpdate(user, {isPremium: true}, {new: true})
    return {
        premium: true, updatedUser
    };
}