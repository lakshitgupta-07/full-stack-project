import { Router } from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import * as aiController from "../controllers/ai.controller.js"

const aiRouter = Router()
aiRouter.use(verifyJwt)
aiRouter.post("/thread", aiController.createAIThread)
export default aiRouter