import { AIUsage } from "../models/aiUsage.models.js";
import mongoose from "mongoose";

interface SaveAIUsageParams {
    threadId: string;
    userId: string;
    messageId?: string;
    model: string;
    inputToken?: number;
    outputToken?: number;
    totalToken?: number
}

export const saveAIUsage = async({
    threadId,
    userId,
    messageId,
    model,
    inputToken = 0,
    outputToken = 0,
    totalToken = 0
}: SaveAIUsageParams) => {
    return AIUsage.create({
        threadId: new mongoose.Types.ObjectId(threadId),
        userId: new mongoose.Types.ObjectId(userId),
        ...(messageId && {
            messageId: new mongoose.Types.ObjectId(messageId),
        }),
        model,
        inputToken,
        outputToken,
        totalToken,
    })
}