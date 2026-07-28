import {rateLimit} from 'express-rate-limit'

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        success: false,
        message: "Too many request. Try again later"
    }
});