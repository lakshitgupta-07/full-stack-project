import mongoose, { Schema, model,   } from "mongoose";


export interface IAIUsage {
    threadId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;

    model: string;
    inputToken: number;
    outputToken: number;
    totalToken: number,

    createdAt: Date;
    updatedAt: Date;
}

const aiUsageSchema = new Schema<IAIUsage> (
    {
        threadId: {
            type: Schema.Types.ObjectId,
            ref: "Thread",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        messageId: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            index: true
        },
        model: {
            type: String,
            required: true,
        },
        inputToken: {
            type: Number,
            required: true,
            default: 0,
        },
        outputToken: {
            type: Number,
            required: true,
            default: 0,
        },
        totalToken: {
            type: Number,
            required: true,
            default: 0
        },
    },
    {
        timestamps: true,
    }
)

export const AIUsage = model<IAIUsage>("AIUsage", aiUsageSchema)