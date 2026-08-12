import {redis} from "../config/redis.js";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

export const aiRateLimitter = async(
    userId: string
): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter: number;
}> => {
    const key =`ai:rate-limit:${userId}`
    const count = await redis.incr(key)
    if(count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
    }

    const ttl = await redis.ttl(key)

    if(count > MAX_REQUESTS) {
        return {
            allowed: false,
            remaining: 0,
            retryAfter: ttl > 0 ? ttl : WINDOW_SECONDS,
        }
    }

    return {
        allowed: true,
        remaining: MAX_REQUESTS - count,
        retryAfter: 0,
    }
}