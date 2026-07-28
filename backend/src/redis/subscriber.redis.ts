import { Redis } from "ioredis";
import logger from "../config/logger.js";
import { channels } from "./channels.redis.js";
import { getIO } from "../socket/socket.js";

const subscriber = new Redis({
    host: process.env.REDIS_HOST,
    port: 6379,
    maxRetriesPerRequest: null,
})

export const initializeSubscriber = async () => {
    await subscriber.subscribe(channels.USER_REGISTERED, channels.BANNER_UPDATED);
    logger.info("Redis Subscriber initialized");
    subscriber.on("message", (channel, message) => {
        logger.info("Received Channel:", channel);
        
        const data = JSON.parse(message);
        
        switch(channel) {
            case channels.USER_REGISTERED:
                console.log("About to emit socket");
                getIO().emit(
                    "userRegistered",
                    data
                );
                console.log("Socket emitted");
                logger.info(`User Registered: ${data.email}`);
                break;
            
            case channels.BANNER_UPDATED:
                logger.info(`Banner Updated`)
                getIO().emit(
                    "bannerUpdated",
                    data
                );
                break;
            
            default:
                logger.warn(`Unknown channel: ${channel}`)
        }
    });
}