import { Router } from "express";
import { createEmployeeController, bulkCreateEmployees, getEmployeeByIdController, getEmployeeController, 
updateEmployeeController, deleteEmployeeController } from "../controllers/employee.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";

const employeeRouter = Router();

employeeRouter.use(verifyJwt);
employeeRouter.use(verifyAdmin);

employeeRouter.post("/", createEmployeeController);
employeeRouter.get("/", getEmployeeController);
employeeRouter.get("/:employeeId", getEmployeeByIdController);
employeeRouter.put("/:employeeId", updateEmployeeController);
employeeRouter.delete("/:employeeId", deleteEmployeeController);
employeeRouter.post("/seed", bulkCreateEmployees);
export default employeeRouter;

