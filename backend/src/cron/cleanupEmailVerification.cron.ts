import cron from 'node-cron'
import { User } from '../models/user.model.js'
import logger from '../config/logger.js'

cron.schedule("0 0 * * *", async () => {
    logger.info("Running DB cleanup");
    try {
        const user = await User.updateMany({
            $or: [
                {emailVerificationExpiry: {
                    $lt: new Date()
                }},
                {emailVerificationToken: null}
            ]
        },
            {
                $unset: {
                    emailVerificationExpiry: "",
                    emailVerificationToken: ""
                }
        });
    } catch (error: any) {
        logger.error(error.message)
    }
})