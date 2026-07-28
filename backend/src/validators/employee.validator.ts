import { z } from 'zod'

export const createEmployeeSchema = z.object({
    fullName: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    department: z.string().trim().min(2).max(100),
    designation: z.string().trim().min(2).max(100),
    salary: z.number().nonnegative("Salary cannot be negative"),
    joiningDate: z.coerce.date().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    createdBy: z.any()
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>