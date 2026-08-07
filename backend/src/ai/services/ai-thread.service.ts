import mongoose from "mongoose";
import { Thread } from "../../models/thread.model.js";
import { User } from "../../models/user.model.js";

export const createOrGetThread = async (
    userId: mongoose.Types.ObjectId
) => {
    const aiUser = await User.findOne({
        isAI: true
    })
    if(!aiUser) {
        throw new Error("Travel Ai not found")
    }
    const existing = await Thread.findOne({
        isAI: true,
        participants: {
            $all: [userId, aiUser._id],
            $size: 2
        }
    })
    if(existing) return existing;
    const thread = await Thread.create({
        participants: [
            userId,
            aiUser._id
        ],
        isAI: true,
        assistantType: "travel",
        status: "active",
        createdBy: userId
    });
    return thread;
}