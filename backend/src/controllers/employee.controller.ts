import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    createEmployeeService,
    getEmployeeService,
    getEmployeeByIdService,
    updateEmployeeService,
    deleteEmployeeService,
    bulkCreateEmployeesService
} from "../services/employee.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createEmployeeController = asyncHandler(async (req: Request, res: Response) => {
    const employee = await createEmployeeService({ ...req.body, createdBy: req.user._id });
    res
        .status(201)
        .json(new ApiResponse(201, employee, "Employee created successfully"))
})

export const getEmployeeController = asyncHandler(async (req: Request, res: Response) => {
    const employees = await getEmployeeService(req.query as any);
    res
        .status(200)
        .json(new ApiResponse(200, employees, "Employees fetched successfully"))
})

export const getEmployeeByIdController = asyncHandler(async (req: Request, res: Response) => {
    const employee = await getEmployeeByIdService(req.params.employeeId as string);
    res
        .status(200)
        .json(new ApiResponse(200, employee, "Employee fetched successfully"))
})

export const updateEmployeeController = asyncHandler(async (req: Request, res: Response) => {
    const employee = await updateEmployeeService(req.params.employeeId as string, req.body);
    res
        .status(200)
        .json(new ApiResponse(200, employee, "Employee updated successfully"))
})

export const deleteEmployeeController = asyncHandler(async (req: Request, res: Response) => {
    const employee = await deleteEmployeeService(req.params.employeeId as string);
    res
        .status(200)
        .json(new ApiResponse(200, employee, "Employee deleted successfully"))
})

export const bulkCreateEmployees = asyncHandler(
    async (req, res) => {

        const employees =
            await bulkCreateEmployeesService(
                req.user._id
            );

        res.status(201).json(
            new ApiResponse(
                201,
                employees,
                "100 employees created"
            )
        );

    }
);