import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    textMessage: string;
    seen: boolean;
    image: {
        url: string,
        publicId: string
    };
    status: "sent" | "delivered" | "read";
    threadId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage> (
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        textMessage: {
            type: String,
            trim: true,
            default: ""
        },
        image: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: "",
            },
        },
        seen: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
        },
        threadId: {
            type: Schema.Types.ObjectId,
            ref: "Thread",
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);