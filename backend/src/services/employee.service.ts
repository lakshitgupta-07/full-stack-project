import { isValidObjectId } from "mongoose";
import { Employee } from "../models/employee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { CreateEmployeeInput, createEmployeeSchema, UpdateEmployeeInput, updateEmployeeSchema, } from "../validators/employee.validator.js";
import { faker } from "@faker-js/faker";
interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: Number;
};

export const createEmployeeService = async (data: CreateEmployeeInput) => {
  const validatedData = createEmployeeSchema.parse(data);

  const existing = await Employee.findOne({
    email: validatedData.email,
  });
  if (existing) {
    throw new ApiError(404, "Employee already");
  }
  return await Employee.create(validatedData);
};

export const getEmployeeService = async (query: EmployeeQuery = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = 20;
  const search = query.search || "";
  const department = query.department;
  const status = query.status;
  const sortBy = query.sortBy || "joiningDate";
  const sortOrder = 1;

  const match: any = {};
  if (search) {
    match.$or = [
      {
        fullName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (department) {
    match.department = department;
  }

  if (status) {
    match.status = status;
  }

  const sort: any = {
    [sortBy]: sortOrder,
  };

  const result = await Employee.aggregate([
    {
      $match: match,
    },
    {
      $sort: sort,
    },
    {
      $facet: {
        employees: [
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              _id: 1,
              fullName: 1,
              fullname: 1,
              email: 1,
              department: 1,
              designation: 1,
              salary: 1,
              employeeId: 1,
              joiningDate: 1,
              status: 1,
            },
          },
        ],
        totalCount: [
          {
            $count: "count"
          },
        ],
      },
    },
  ]);
  return {
    employees: result[0].employees,
    total: result[0].totalCount[0]?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((result[0].totalCount[0]?.count ?? 0) / limit)
  }
};

export const getEmployeeByIdService = async (id: string) => {
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { employeeId: id }] }
    : { employeeId: id };

  const employee = await Employee.findOne(query);
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }
  return employee;
};

export const updateEmployeeService = async (id: string, data: UpdateEmployeeInput) => {
  const validatedData = updateEmployeeSchema.parse(data);
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { employeeId: id }] }
    : { employeeId: id };

  const employee = await Employee.findOneAndUpdate(
    query,
    validatedData,
    { new: true, runValidators: true }
  );

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  return employee;
};

export const deleteEmployeeService = async (id: string) => {
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { employeeId: id }] }
    : { employeeId: id };

  const employee = await Employee.findOneAndDelete(query);
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  return employee;
};


export const bulkCreateEmployeesService = async (
  createdBy: string
) => {
  const departments = [
    "Engineering",
    "Human Resources",
    "Finance",
    "Marketing",
    "Sales",
    "Operations",
    "Support",
    "IT",
    "Legal",
    "Research",
  ];

  const employees = [];

  for (let i = 0; i < 100; i++) {
    employees.push({
      fullName: faker.person.fullName(),

      email: faker.internet.email().toLowerCase(),

      department: faker.helpers.arrayElement(departments),

      designation: faker.person.jobTitle(),

      salary: faker.number.int({
        min: 30000,
        max: 180000,
      }),

      joiningDate: faker.date.between({
        from: "2020-01-01",
        to: new Date(),
      }),

      status: faker.helpers.arrayElement([
        "active",
        "inactive",
      ]),

      createdBy,
    });
  }

  return await Employee.insertMany(employees);
};