import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import bannerRouter from './routes/banner.routes.js'
import adminRouter from './routes/admin.routes.js'
import employeeRouter from './routes/employee.routes.js'
import paymentRouter from './routes/payment.routes.js'
import aiRouter from './ai/routes/ai.routes.js'
import { api_prefix } from './constants/index.js'
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from './middlewares/requestLogger.middleware.js'
import { morganMiddleware } from './config/morganStream.js'
const app = express()

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())
app.use(requestLogger)
app.use(morganMiddleware)

app.get(`${api_prefix}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend Healthy",
    timestamp: new Date(),
  });
});
app.use(`${api_prefix}/auth`, authRouter)
app.use(`${api_prefix}/user`, userRouter)
app.use(`${api_prefix}/banner`, bannerRouter)
app.use(`${api_prefix}/admin`, adminRouter)
app.use(`${api_prefix}/employee`, employeeRouter)
app.use(`${api_prefix}/payment`, paymentRouter)
app.use(`${api_prefix}/ai`, aiRouter)

app.use(errorHandler);
export default app;