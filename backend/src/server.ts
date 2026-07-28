import dotenv from 'dotenv'
dotenv.config()

import logger from './config/logger.js'
import './config/redis.js'
import "./cron/index.js"
import app from './app.js'
import connectDB from './db/index.js'
import { swaggerDocs } from './config/swagger.js'
import { initializeSubscriber } from './redis/subscriber.redis.js'
import http from "http"
import {initializeSocket} from './socket/socket.js'

const server = http.createServer(app)
initializeSocket(server)
initializeSubscriber();
const PORT = process.env.PORT 
swaggerDocs(app)

const startServer = async() => {
    await connectDB()

    server.listen(PORT, () => {
        logger.info(`Server running at: ${PORT}`)
    })
}
startServer()