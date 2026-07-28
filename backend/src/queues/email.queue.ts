import {Queue} from 'bullmq';
import {redis} from '../config/redis.js'

export const EMAIL_QUEUE_NAME = "email_queue";

export const email_queue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redis
})
