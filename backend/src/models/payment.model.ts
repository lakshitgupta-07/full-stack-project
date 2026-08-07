import { ObjectId, Schema, model } from "mongoose";
import crypto from "node:crypto"

export interface IPayment {
    userId: any;
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    signature: string;
    createdAt: Date
}

const paymentSchema = new Schema<IPayment> (
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        orderId: {
            type: String,
            default: () => crypto.randomUUID(),
            required: true
        },
        paymentId: {
            type: String,
            default: () => crypto.randomUUID(),
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: "INR"
        },
        status: {
            type: String,
            enum: ["created", "paid"],
            default: "created" 
        },
        signature: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    {
        timestamps: true
    }
)

export const Payment = model<IPayment>("Payment", paymentSchema)