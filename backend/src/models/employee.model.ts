import { Schema, model } from "mongoose";
export interface IEmployee {
    employeeId: string;
    fullName: string;
    email: string;
    department: string;
    designation: string;
    salary: number;
    joiningDate: Date;
    status: string;
    createdBy: any;
}

const employeeSchema = new Schema<IEmployee>(
    {
        employeeId: {
            type: String,
            default: () => crypto.randomUUID().split("-")[0],
            unique: true,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        department: {
            type: String,
            required: true,
        },
        designation: {
            type: String,
            required: true,
        },
        salary: {
            type: Number,
            required: true,
            min: 0,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true
    }
)

export const Employee = model<IEmployee>("Employee", employeeSchema)