import {Redis} from "ioredis";
import logger from "./logger.js";

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: 6379,
    maxRetriesPerRequest: null,
})

redis.on("connect", () => {
    logger.info("Redis connected");    
})
redis.on("ready", () => {
    logger.info("Redis ready");    
})
redis.on("error", (err) => {
    logger.error("Redis error", err.message);    
})
redis.on("close", () => {
    logger.info("Redis closed");    
})
