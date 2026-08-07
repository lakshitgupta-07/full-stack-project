import { Request, Response } from "express";
import { createOrderSchema, verifyPaymentSchema } from "../validators/payment.validator.js";
import * as paymentService from "../services/payment.service.js"
import { ApiResponse } from "../utils/ApiResponse.js";

export const createOrder = async(
    req: Request,
    res: Response
) => {
    const data = createOrderSchema.parse(req.body);
    const order = await paymentService.createOrder(data)
    return res.status(200).json(
        new ApiResponse(200, order, "Order Created Successfully")
    )
}

export const verifyPayment = async(
    req: Request,
    res: Response
) => {
    console.log("BODY RECEIVED");
console.log(req.body);
console.log(Object.keys(req.body));
    const data = verifyPaymentSchema.parse(req.body)

    const payment = await paymentService.verifyPayment(
        req.user!._id,
        data
    );

    return res.json(
        new ApiResponse(200, payment, "Payment verified")
    )
}