import mongoose, { Schema, Document, Types, ObjectId } from "mongoose";
export interface IThread extends Document {
    participants: any[],
    createdBy: Types.ObjectId,
    status: "pending" | "active" | "rejected",
    lastMessage: Types.ObjectId,
    lastMessageAt: Date,
    isGroup: boolean,
    groupName: string,
    groupAvatar: {
        url: string,
        publicID: string
    },
    admins: any[],
    isAI: boolean,
    assistantType: string,
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
        isGroup: {
            type: Boolean,
            default: false
        },
        groupName: {
            type: String,
            default: ""
        },
        groupAvatar: {
            url: {
                type: String,
                default: ""
            },
            publicId: {
                type: String,
                default: ""
            },
        },
        admins: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        isAI: {
            type: Boolean,
            default: false
        },
        assistantType: {
            type: String,
            enum: ["travel"],
            default: undefined
        }
        // lastMessageType: {},
    },
    {
        timestamps: true,
    }
);

export const Thread = mongoose.model<IThread>("Thread", threadSchema)