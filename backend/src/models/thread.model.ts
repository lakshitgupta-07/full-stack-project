import mongoose, { Schema, Document, Types } from "mongoose";

export interface IThread extends Document {
    participants: any[],
    createdBy: Types.ObjectId,
    status: "pending" | "active" | "rejected",
    lastMessage: Types.ObjectId,
    lastMessageAt: Date,
}

const threadSchema = new Schema<IThread>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,            
            }
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "active", "rejected"],
            default: "pending"
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: null
        },
    },
    {
        timestamps: true,
    }
);

export const Thread = mongoose.model<IThread>("Thread", threadSchema)