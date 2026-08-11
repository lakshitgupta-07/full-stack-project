import mongoose, { Schema, Document, Types } from "mongoose";
import type { TravelIntent } from "../ai/types/intent.js";

export interface IMessage extends Document {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    textMessage: string;
    seen: boolean;
    image: {
        url: string,
        publicId: string
    };
    video: {
        url: string,
        publicId: string
    };
    audio: {
        url: string,
        publicId: string
    };
    status: "sent" | "delivered" | "read";
    intent?: string;
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
        video: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: "",
            },
        },
        audio: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: ""
            }
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
        },
        intent: {
            type: String,
            enum: [
                "travel_question",
                "itinerary_generation",
                "destination_recommendation",
                "plan_trip",
                "create_itinerary",
                "hotel_recommendation",
                "destination_comparison",
                "budget_planning",
                "packing_list",
                "food_recommendation",
                "visa_question",
                "general_travel",
                "unknown",
            ],
            required: false
        }
    },
    {
        timestamps: true,
    }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);