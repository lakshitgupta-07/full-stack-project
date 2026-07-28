import cron from "node-cron"
import { User } from "../models/user.model.js"
import logger from "../config/logger.js";

cron.schedule("0 0 * * *", async () => {
    logger.info("Running DB cleanup");
    try{
        
        const user = await User.updateMany({
            passwordResetExpiry: {
                $lt: new Date(),
            },
        }, {
            $unset: {
                passwordResetToken: "",
                passwordResetExpiry: ""
            }
        });
        logger.info(`Cleanup job: ${user.modifiedCount} expired reset token removed`);
        
    } catch(err: any) {
        logger.error("Cleanup failed: ", err.message)
    }
    
})