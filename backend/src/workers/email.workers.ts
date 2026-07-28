import {Worker} from 'bullmq'
import {redis} from '../config/redis.js'

import { sendEmail } from '../services/email.service.js'
import { verifyEmailTemplate } from '../templates/verifyEmail.js'
import { forgotPasswordTemplate } from '../templates/forgot-password.js'
import { EMAIL_QUEUE_NAME } from '../queues/email.queue.js';

const email_worker = new Worker(
    EMAIL_QUEUE_NAME,
    async(job) => {
        switch(job.name) {
            case "verification-email": {
                const {email, username, verifyUrl} = job.data
                const html = verifyEmailTemplate(username, verifyUrl);
                await sendEmail(
                    email, "Verify your Email", html
                );
            }
            break;
            case "forgotPassword-email": {
                const {email, username, resetUrl} = job.data
                const html = forgotPasswordTemplate(username, resetUrl);
                await sendEmail(
                    email, "Password Reset", html
                );
            }
            break;
            case "resendVerification": {
                const {email, username, verifyUrl} = job.data
                const html = verifyEmailTemplate(username, verifyUrl);
                await sendEmail(
                    email, "Verify Email", html
                );
                break;
            }
        }
    },
    {
        connection: redis
    }
)

email_worker.on("completed", (job) => {
    console.log(`Email job completed: ${job.id}`);
});

email_worker.on("failed", (job, err) => {
    console.error(`Email job failed: ${job?.id}`, err);
});
