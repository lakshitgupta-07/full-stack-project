import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const paymentRouter = Router()
paymentRouter.use(verifyJwt)

paymentRouter.post("/create-order", paymentController.createOrder);
paymentRouter.post("/verify", paymentController.verifyPayment)


export default paymentRouter;