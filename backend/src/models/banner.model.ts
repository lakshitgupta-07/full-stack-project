import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IBanner {
    bannerId: string,
    title: string;
    description: string;
    backgroundColor: string;
    textColor: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    createdBy: any
}

const bannerSchema = new Schema<IBanner> (
    {
        bannerId: {
            type: String,
            default: () => uuidv4(),
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        backgroundColor: {
            type: String,
            default: "#2563eb",
        },
        textColor: {
            type: String,
            default: "#ffffff"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startDate: {
            type: String,
            default: undefined
        },
        endDate: {
            type: String,
            default: undefined
        }
    },
    {
        timestamps: true
    }
)
export const Banner = model<IBanner>("Banner", bannerSchema)